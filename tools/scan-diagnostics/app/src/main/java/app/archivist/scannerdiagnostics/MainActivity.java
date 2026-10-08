package app.archivist.scannerdiagnostics;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.DocumentsContract;
import android.graphics.Color;
import android.content.ContentResolver;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Independent scanner with a distinct app ID. SAF READ grants only, no media writes,
 * no Archivist database access, no shared prefs access, no INTERNET permission.
 * The user can only write a JSON document by explicitly choosing Export.
 */
public final class MainActivity extends Activity {
  static final int PICK_TREE=601, SAVE_JSON=602;
  static final int MAX_ENTRIES=100000, MAX_DEPTH=48;
  static final String[] PROJECTION={
    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
    DocumentsContract.Document.COLUMN_MIME_TYPE,
    DocumentsContract.Document.COLUMN_SIZE,
    DocumentsContract.Document.COLUMN_LAST_MODIFIED
  };
  static final String[] BASIC={
    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
    DocumentsContract.Document.COLUMN_MIME_TYPE
  };
  final Handler ui=new Handler(Looper.getMainLooper());
  final ExecutorService io=Executors.newSingleThreadExecutor();
  final AtomicBoolean cancelled=new AtomicBoolean(false);
  volatile String stage="Idle";
  volatile TimedSafProbe activeProbe;
  volatile long maxUiDelayMs=0;
  volatile long lastHeartbeat=0;
  final Runnable heartbeat=new Runnable(){
    @Override public void run(){
      if(!scanning)return;
      long now=SystemClock.uptimeMillis();
      if(lastHeartbeat!=0)maxUiDelayMs=Math.max(maxUiDelayMs,Math.max(0,now-lastHeartbeat-150));
      lastHeartbeat=now;
      heading.setText("Scanner Diagnostics · "+stage);
      ui.postDelayed(this,150);
    }
  };
  volatile JSONObject finishedReport;
  volatile String pickedUri="";
  volatile boolean scanning=false;
  long lastUpdate=0L;
  Button select,start,cancel,export;
  TextView heading,summary,log;
  int files=0, dirs=0, audio=0, ebooks=0, comics=0, rootAudio=0, queries=0, retries=0, failures=0, slowQueries=0;
  long scanStart=0L, queryTime=0L, longestQuery=0L, headerTime=0L, longestHeader=0L;
  int providerTimeouts=0,headerTimeouts=0,headerErrors=0,slowHeaders=0,headersAttempted=0;
  long inventoryElapsedMs=0,headerElapsedMs=0;
  JSONArray fileRecords,folderRecords,errors,headerRecords;
  ArrayList<JSONObject> samples;
  HashMap<String,Integer> sampledPerFolder;
  HashMap<String,Integer> audioByParent;
  HashSet<String> seenDirIds;

  @Override public void onCreate(Bundle state){
    super.onCreate(state);
    LinearLayout root=new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setPadding(24,24,24,16);
    root.setBackgroundColor(Color.rgb(249,248,245));
    heading=text("Archivist Scanner Diagnostics",23,true,Color.rgb(18,31,40));
    root.addView(heading);
    root.addView(text("SEPARATE READ-ONLY APP  •  Archivist data remains untouched",12,true,Color.rgb(35,107,101)));
    root.addView(text("1. Choose the same Android library folder.  2. Start Scan.  3. Export JSON and share it in ChatGPT. Only read-only file headers are opened; no media is moved or changed.",14,false,Color.rgb(65,67,69)));
    select=button(root,"1 — Choose library folder",()->choose());
    start=button(root,"2 — Start diagnostic scan",()->launchScan());
    cancel=button(root,"Cancel scan",()->stopScan());
    export=button(root,"3 — Export diagnostic JSON",()->export());
    summary=text("No folder selected",16,true,Color.rgb(20,31,42));
    root.addView(summary);
    log=text("READ-ONLY. Times folder queries and up to 64 small 64KB header reads, with watchdogs. Export includes names and paths, not book contents.",13,false,Color.rgb(65,70,72));
    ScrollView scroll=new ScrollView(this);
    scroll.addView(log);
    root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
    setContentView(root);
    updateButtons();
  }

  TextView text(String value,int size,boolean bold,int color){
    TextView v=new TextView(this);
    v.setText(value);
    v.setTextColor(color);
    v.setTextSize(size);
    v.setPadding(3,10,3,10);
    if(bold)v.setTypeface(null,1);
    return v;
  }
  Button button(LinearLayout root,String title,Runnable action){
    Button b=new Button(this);
    b.setText(title);
    b.setAllCaps(false);
    b.setOnClickListener(v->action.run());
    root.addView(b,new LinearLayout.LayoutParams(-1,-2));
    return b;
  }
  void updateButtons(){
    select.setEnabled(!scanning);
    start.setEnabled(!scanning&&!pickedUri.isEmpty());
    cancel.setEnabled(scanning);
    export.setEnabled(!scanning&&finishedReport!=null);
  }
  void choose(){
    Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    startActivityForResult(intent,PICK_TREE);
  }
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);
    if(result!=RESULT_OK||data==null||data.getData()==null)return;
    Uri selected=data.getData();
    if(request==PICK_TREE){
      try{getContentResolver().takePersistableUriPermission(selected,Intent.FLAG_GRANT_READ_URI_PERMISSION);}
      catch(Exception ignored){}
      pickedUri=selected.toString();
      finishedReport=null;
      summary.setText("Folder selected. Ready to scan.");
      log.setText("Selected SAF authority: "+selected.getAuthority()+"\nRead-only directory inventory and bounded 64KB header timing samples.\n");
      updateButtons();
    }else if(request==SAVE_JSON && finishedReport!=null){
      final JSONObject report=finishedReport;
      io.execute(()->{
        try(OutputStream out=getContentResolver().openOutputStream(selected,"w")){
          if(out==null)throw new IllegalStateException("Export destination unavailable");
          out.write(report.toString(2).getBytes(StandardCharsets.UTF_8));
          out.flush();
          ui.post(()->append("JSON report saved. Share that file in this chat."));
        }catch(Exception exception){
          ui.post(()->append("Export error: "+exception.getMessage()));
        }
      });
    }
  }
  void export(){
    if(scanning||finishedReport==null)return;
    Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("application/json");
    intent.putExtra(Intent.EXTRA_TITLE,"Archivist-Scanner-Diagnostics-"+System.currentTimeMillis()+".json");
    intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
    startActivityForResult(intent,SAVE_JSON);
  }
  void stopScan(){
    cancelled.set(true);
    stage="Cancelling";
    TimedSafProbe live=activeProbe;
    if(live!=null)live.cancel();
    append("Cancellation requested. Report will contain partial findings.");
  }
  void launchScan(){
    if(scanning||pickedUri.isEmpty())return;
    scanning=true;
    cancelled.set(false);
    finishedReport=null;
    files=dirs=audio=ebooks=comics=rootAudio=queries=retries=failures=slowQueries=0;
    queryTime=longestQuery=headerTime=longestHeader=0;
    providerTimeouts=headerTimeouts=headerErrors=slowHeaders=headersAttempted=0;
    inventoryElapsedMs=headerElapsedMs=maxUiDelayMs=lastHeartbeat=0;
    stage="Listing folders";
    scanStart=SystemClock.elapsedRealtime();
    fileRecords=new JSONArray();folderRecords=new JSONArray();errors=new JSONArray();headerRecords=new JSONArray();
    samples=new ArrayList<>();sampledPerFolder=new HashMap<>();
    audioByParent=new HashMap<>();seenDirIds=new HashSet<>();
    log.setText("Scanning selected folder…\n");
    updateButtons();
    ui.post(heartbeat);
    io.execute(this::scan);
  }
  void scan(){
    JSONObject finalResult=new JSONObject();
    TimedSafProbe probe=new TimedSafProbe(this);
    activeProbe=probe;
    try{
      Uri tree=Uri.parse(pickedUri);
      String rootId=DocumentsContract.getTreeDocumentId(tree);
      ArrayDeque<Folder> queue=new ArrayDeque<>();
      queue.add(new Folder(rootId,0));
      final String authority=tree.getAuthority()==null?"":tree.getAuthority();
      while(!queue.isEmpty()&&!cancelled.get()&&files+dirs<MAX_ENTRIES){
        Folder folder=queue.removeFirst();
        if(folder.depth>MAX_DEPTH||!seenDirIds.add(folder.id))continue;
        long started=SystemClock.elapsedRealtime();
        stage="Directory "+(queries+1);
        TimedSafProbe.Result listing=probe.list(tree,folder.id);
        JSONArray folderEntries=listing.entries;
        boolean fallback=listing.fallback;
        String error=listing.error;
        if(listing.timeout)providerTimeouts++;
        if(fallback)retries++;
        long elapsed=SystemClock.elapsedRealtime()-started;
        queryTime+=elapsed;
        longestQuery=Math.max(longestQuery,elapsed);
        if(elapsed>=1000)slowQueries++;
        queries++;
        JSONObject stats=new JSONObject();
        stats.put("documentId",folder.id);
        stats.put("depth",folder.depth);
        stats.put("queryMs",elapsed);
        stats.put("count",folderEntries.length());
        stats.put("basicProjectionFallback",fallback);
        stats.put("timedOut",listing.timeout);
        stats.put("runningTotalMs",SystemClock.elapsedRealtime()-scanStart);
        if(!error.isEmpty()&&folderEntries.length()==0)stats.put("error",error);
        folderRecords.put(stats);
        if(folderEntries.length()==0&&!error.isEmpty()){
          JSONObject issue=new JSONObject();
          issue.put("documentId",folder.id);
          issue.put("error",error);
          errors.put(issue);
        }
        for(int index=0;index<folderEntries.length()&&!cancelled.get()&&files+dirs<MAX_ENTRIES;index++){
          JSONObject entry=folderEntries.getJSONObject(index);
          String name=entry.optString("name","");
          if(entry.optBoolean("directory")){
            dirs++;
            queue.add(new Folder(entry.getString("documentId"),folder.depth+1));
          }else{
            files++;
            String ext=extension(name);
            if(isAudio(ext)){
              audio++;
              if(sampledPerFolder.getOrDefault(folder.id,0)<3 && samples.size()<64){
                samples.add(entry);
                sampledPerFolder.put(folder.id,sampledPerFolder.getOrDefault(folder.id,0)+1);
              }
              if(folder.depth==0)rootAudio++;
              audioByParent.put(folder.id,audioByParent.getOrDefault(folder.id,0)+1);
            }else if(isBook(ext)){
              ebooks++;
              if(sampledPerFolder.getOrDefault(folder.id,0)<3 && samples.size()<64){
                samples.add(entry);sampledPerFolder.put(folder.id,sampledPerFolder.getOrDefault(folder.id,0)+1);
              }
            }else if(isComic(ext)){
              comics++;
              if(sampledPerFolder.getOrDefault(folder.id,0)<3 && samples.size()<64){
                samples.add(entry);sampledPerFolder.put(folder.id,sampledPerFolder.getOrDefault(folder.id,0)+1);
              }
            }
          }
          // File and folder relationships are needed for a faithful replay of
          // Archivist's real, unchanged metadataSync.ts grouping algorithm.
          fileRecords.put(entry);
        }
        progress(false);
        if(listing.timeout||probe.isBlocked()){
          stage="Storage provider timeout";
          break;
        }
      }
      inventoryElapsedMs=SystemClock.elapsedRealtime()-scanStart;
      stage="Probing media header access";
      long headerStageStarted=SystemClock.elapsedRealtime();
      for(JSONObject entry:samples){
        if(cancelled.get()||probe.isBlocked())break;
        TimedSafProbe.HeaderResult sample=probe.sampleHeader(Uri.parse(entry.getString("uri")));
        headersAttempted++;
        headerTime+=sample.elapsedMs;
        longestHeader=Math.max(longestHeader,sample.elapsedMs);
        if(sample.elapsedMs>=1000)slowHeaders++;
        if(sample.timeout)headerTimeouts++;
        if(!sample.error.isEmpty())headerErrors++;
        JSONObject outcome=new JSONObject();
        outcome.put("uri",entry.optString("uri"));
        outcome.put("durationMs",sample.elapsedMs);
        outcome.put("bytesRead",sample.bytesRead);
        outcome.put("timedOut",sample.timeout);
        if(!sample.error.isEmpty())outcome.put("error",sample.error);
        headerRecords.put(outcome);
        progress(false);
      }
      headerElapsedMs=SystemClock.elapsedRealtime()-headerStageStarted;
      stage="Report ready";
      finalResult.put("schema","archivist-saf-scanner-diagnostic-v1");
      finalResult.put("capturedAt",new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'",Locale.UK){{setTimeZone(TimeZone.getTimeZone("UTC"));}}.format(new Date()));
      finalResult.put("appPackage","app.archivist.scannerdiagnostics");
      finalResult.put("dataPolicy","Read-only SAF listings and at most 64 bounded 64KB media header probes. No media contents exported; filenames and document IDs included.");
      finalResult.put("treeUri",pickedUri);
      finalResult.put("treeDocumentId",rootId);
      finalResult.put("authority",authority);
      finalResult.put("cancelled",cancelled.get());
      finalResult.put("truncated",files+dirs>=MAX_ENTRIES);
      JSONObject counts=new JSONObject();
      counts.put("files",files);
      counts.put("directories",dirs);
      counts.put("audioFiles",audio);
      counts.put("ebooks",ebooks);
      counts.put("comics",comics);
      counts.put("audioFilesAtSelectedRoot",rootAudio);
      counts.put("distinctAudioContainingFolders",audioByParent.size());
      counts.put("providerQueries",queries);
      counts.put("basicProjectionFallbacks",retries);
      counts.put("queryErrors",failures);
      counts.put("slowFolderQueries1s",slowQueries);
      counts.put("providerQueryTotalMs",queryTime);
      counts.put("slowestFolderQueryMs",longestQuery);
      counts.put("directoryTimeouts",providerTimeouts);
      counts.put("inventoryElapsedMs",inventoryElapsedMs);
      counts.put("headerSamplesAttempted",headersAttempted);
      counts.put("headerReadTotalMs",headerTime);
      counts.put("headerStageElapsedMs",headerElapsedMs);
      counts.put("slowestHeaderMs",longestHeader);
      counts.put("slowHeaderReads1s",slowHeaders);
      counts.put("headerTimeouts",headerTimeouts);
      counts.put("headerErrors",headerErrors);
      counts.put("uiThreadWorstLagMs",maxUiDelayMs);
      counts.put("blockedProvider",probe.isBlocked());
      counts.put("elapsedMs",SystemClock.elapsedRealtime()-scanStart);
      finalResult.put("counts",counts);
      finalResult.put("entries",fileRecords);
      finalResult.put("directoryTimings",folderRecords);
      finalResult.put("headerReadTimings",headerRecords);
      finalResult.put("errors",errors);
      JSONObject note=new JSONObject();
      note.put("grouping","No simulated work count is presented as authoritative. Export entries and run the exact Test 21 TypeScript grouping replay.");
      note.put("metadata","Timed representative 64KB header access, not full tags or archive parsing; no media payload is included in report.");
      note.put("performance","This measures SAF query latency, shallow stream opens and UI heartbeat, not Archivist's JS metadata/network pipeline.");
      finalResult.put("notes",note);
    }catch(Exception fatal){
      try{finalResult.put("fatal",fatal.getClass().getName()+": "+fatal.getMessage());}catch(Exception ignored){}
    }finally{
      probe.close();
      activeProbe=null;
      try{finalResult.put("schema","archivist-saf-scanner-diagnostic-v1");}catch(Exception ignored){}
      finishedReport=finalResult;
      scanning=false;
      ui.post(()->{
        progress(true);
        updateButtons();
        append("Diagnostic complete. Export the JSON report. Archivist was not accessed.");
      });
    }
  }
  void progress(boolean force){
    long now=SystemClock.elapsedRealtime();
    if(!force && now-lastUpdate<300)return;
    lastUpdate=now;
    String text="Files: "+files+"   Audio: "+audio+"   Folders: "+dirs+"\n"
      +"Folder queries: "+queries+"   Fallbacks: "+retries+"\n"
      +"Slow queries (1s+): "+slowQueries+"   Elapsed: "+((now-scanStart)/1000)+"s\n"
      +"Stage: "+stage+"   Header probes: "+headersAttempted+"   Timeouts: "+(providerTimeouts+headerTimeouts);
    ui.post(()->{
      summary.setText(text);
      if(force)log.setText(text+"\n\nNo media bytes are exported; header reads are bounded to 64KB each.\nThe exported JSON includes actual names and paths so that Archivist's exact grouping code can be replayed.");
    });
  }
  void append(String str){ui.post(()->log.append("\n"+str));}
  static String extension(String s){int dot=s.lastIndexOf('.');return dot<0?"":s.substring(dot+1).toLowerCase(Locale.ROOT);}
  static boolean isAudio(String e){return e.equals("mp3")||e.equals("m4b")||e.equals("m4a")||e.equals("aac")||e.equals("flac")||e.equals("ogg")||e.equals("opus")||e.equals("wav")||e.equals("wma");}
  static boolean isBook(String e){return e.equals("epub")||e.equals("pdf")||e.equals("mobi")||e.equals("azw3");}
  static boolean isComic(String e){return e.equals("cbz")||e.equals("cbr")||e.equals("cbt");}
  static final class Folder {
    final String id;
    final int depth;
    Folder(String id,int depth){this.id=id;this.depth=depth;}
  }
}
