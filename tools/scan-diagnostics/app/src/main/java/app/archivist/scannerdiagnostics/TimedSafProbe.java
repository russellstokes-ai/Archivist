package app.archivist.scannerdiagnostics;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.CancellationSignal;
import android.os.SystemClock;
import android.provider.DocumentsContract;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Bounded read-only DocumentsProvider operations. A wedged provider is not
 * allowed to strand the coordinator or the UI: timeout marks this probe blocked
 * and further requests are refused until a fresh scan creates a fresh probe.
 */
final class TimedSafProbe {
  static final int FOLDER_DEADLINE_MS=7000;
  static final int HEADER_DEADLINE_MS=2500;
  private final Context context;
  private final ExecutorService worker=Executors.newSingleThreadExecutor(task->{
    Thread t=new Thread(task,"archivist-diag-saf");
    t.setDaemon(true);
    return t;
  });
  private volatile CancellationSignal signal;
  private volatile boolean blocked=false;

  static final class Result {
    JSONArray entries=new JSONArray();
    long elapsedMs=0;
    boolean fallback=false;
    boolean timeout=false;
    String error="";
  }
  static final class HeaderResult {
    long elapsedMs=0;
    int bytesRead=0;
    boolean timeout=false;
    String error="";
  }
  TimedSafProbe(Context context){this.context=context.getApplicationContext();}

  void cancel(){
    CancellationSignal current=signal;
    if(current!=null){
      Thread t=new Thread(()->{
        try{current.cancel();}catch(Exception ignored){}
      },"archivist-diag-saf-cancel");
      t.setDaemon(true);
      t.start();
    }
  }
  void close(){cancel();worker.shutdownNow();}
  boolean isBlocked(){return blocked;}

  Result list(Uri tree,String folderId){
    Result result=new Result();
    long began=SystemClock.elapsedRealtime();
    if(blocked){result.error="Provider probe stopped after an earlier timeout";return result;}
    for(int attempt=0;attempt<2;attempt++){
      CancellationSignal operation=new CancellationSignal();
      signal=operation;
      final int variant=attempt;
      Future<JSONArray> future=worker.submit(()->{
        JSONArray resultEntries=new JSONArray();
        Uri uri=DocumentsContract.buildChildDocumentsUriUsingTree(tree,folderId);
        String[] projection=variant==0?MainActivity.PROJECTION:MainActivity.BASIC;
        try(Cursor cursor=context.getContentResolver().query(uri,projection,null,null,null,operation)){
          if(cursor==null)throw new IllegalStateException("Provider returned no cursor");
          int idIndex=cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
          int nameIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME);
          int mimeIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE);
          int sizeIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_SIZE);
          int dateIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED);
          while(cursor.moveToNext()){
            if(Thread.currentThread().isInterrupted()||operation.isCanceled())
              throw new InterruptedException("Read cancelled");
            if(resultEntries.length()>=10000)throw new IllegalStateException("Folder exceeds 10,000 items");
            String id=cursor.getString(idIndex);
            if(id==null)continue;
            JSONObject entry=new JSONObject();
            entry.put("documentId",id);
            entry.put("uri",DocumentsContract.buildDocumentUriUsingTree(tree,id).toString());
            entry.put("name",nameIndex<0?"":cursor.getString(nameIndex));
            String mime=mimeIndex<0?"":cursor.getString(mimeIndex);
            entry.put("mime",mime==null?"":mime);
            entry.put("directory",DocumentsContract.Document.MIME_TYPE_DIR.equals(mime));
            entry.put("parentId",folderId);
            if(sizeIndex>=0&&!cursor.isNull(sizeIndex))entry.put("size",cursor.getLong(sizeIndex));
            if(dateIndex>=0&&!cursor.isNull(dateIndex))entry.put("modified",cursor.getLong(dateIndex)/1000.0);
            resultEntries.put(entry);
          }
        }
        return resultEntries;
      });
      try{
        result.entries=future.get(FOLDER_DEADLINE_MS,TimeUnit.MILLISECONDS);
        result.fallback=attempt>0;
        result.error="";
        break;
      }catch(TimeoutException ex){
        blocked=true;
        result.timeout=true;
        result.error="TIMEOUT: SAF directory listing exceeded "+FOLDER_DEADLINE_MS+"ms";
        future.cancel(true);
        cancel();
        break; // Never enqueue another query behind a potentially stuck provider
      }catch(Exception ex){
        result.error=ex.getClass().getSimpleName()+": "+rootMessage(ex);
        if(attempt==1)break;
        result.fallback=true;
      }finally{
        signal=null;
      }
    }
    result.elapsedMs=SystemClock.elapsedRealtime()-began;
    return result;
  }

  HeaderResult sampleHeader(Uri uri){
    HeaderResult result=new HeaderResult();
    long began=SystemClock.elapsedRealtime();
    if(blocked){result.error="Skipped after blocked SAF call";return result;}
    CancellationSignal operation=new CancellationSignal();
    signal=operation;
    Future<Integer> future=worker.submit(()->{
      try(InputStream input=context.getContentResolver().openInputStream(uri)){
        if(input==null)throw new IllegalStateException("No readable stream");
        byte[] buffer=new byte[16384];
        int readTotal=0;
        while(readTotal<65536){
          if(Thread.currentThread().isInterrupted())throw new InterruptedException("Cancelled");
          int count=input.read(buffer,0,Math.min(buffer.length,65536-readTotal));
          if(count<0)break;
          if(count==0)break;
          readTotal+=count;
        }
        return readTotal;
      }
    });
    try{
      result.bytesRead=future.get(HEADER_DEADLINE_MS,TimeUnit.MILLISECONDS);
    }catch(TimeoutException ex){
      blocked=true;result.timeout=true;
      result.error="TIMEOUT: 64KB header access exceeded "+HEADER_DEADLINE_MS+"ms";
      future.cancel(true);
    }catch(Exception ex){
      result.error=ex.getClass().getSimpleName()+": "+rootMessage(ex);
    }finally{
      signal=null;
      result.elapsedMs=SystemClock.elapsedRealtime()-began;
    }
    return result;
  }
  private static String rootMessage(Exception ex){
    Throwable root=ex;
    for(int i=0;i<3&&root.getCause()!=null;i++)root=root.getCause();
    return String.valueOf(root.getMessage());
  }
}
