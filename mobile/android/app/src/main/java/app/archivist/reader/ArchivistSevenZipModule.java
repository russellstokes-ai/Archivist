package app.archivist.reader;

import android.net.Uri;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.util.Base64;
import com.facebook.react.bridge.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/** Bounded CB7 reader. No extraction to public storage or whole-book JS payload. */
public final class ArchivistSevenZipModule extends ReactContextBaseJavaModule {
  private static final long MAX_BYTES=256L*1024*1024,RESERVE_BYTES=16L*1024*1024;
  private final ReactApplicationContext context;
  private final ScannerTaskPool pool=new ScannerTaskPool(1,8,30000);
  private final Map<String,Session> sessions=new ConcurrentHashMap<>();
  private volatile boolean invalidated;
  private static final class Session {
    final File file;final List<String> names;boolean closed;int readers;
    Session(File file,List<String> names){this.file=file;this.names=names;}
    synchronized void acquire()throws IOException{if(closed)throw new IOException("CB7 reader is closed");readers++;}
    synchronized void release(){readers--;cleanup();}
    synchronized void close(){closed=true;cleanup();}
    private void cleanup(){if(closed&&readers==0)file.delete();}
  }
  public ArchivistSevenZipModule(ReactApplicationContext context){super(context);this.context=context;}
  @Override public String getName(){return "ArchivistSevenZip";}
  @ReactMethod public void open(String uri,Promise promise){
    String id=UUID.randomUUID().toString();
    pool.submit(id,token->{
      if(invalidated||sessions.size()>=2)throw new IOException("Close the previous comic before opening another.");
      File staged=File.createTempFile("archivist-cb7-",".7z",context.getCacheDir());
      boolean retained=false;
      try{
        stage(uri,staged,token);
        List<String> names=ScannerSevenZipReader.listImages(staged,token);
        if(names.isEmpty())throw new IOException("No readable comic pages found.");
        token.check();
        Session session=new Session(staged,Collections.unmodifiableList(names));
        sessions.put(id,session);retained=true;
        token.check();
        if(invalidated)throw new IOException("CB7 reader is closed");
        WritableMap result=Arguments.createMap();result.putString("token",id);
        WritableArray array=Arguments.createArray();for(String name:names)array.pushString(name);result.putArray("names",array);
        return result;
      }finally{
        if(!retained)staged.delete();
        if(token.isCancelled()||invalidated)closeSession(id);
      }
    },result->{if("ok".equals(result.state))promise.resolve(result.value);else{closeSession(id);reject(promise,result);}});
  }
  @ReactMethod public void read(String id,String name,Promise promise){
    pool.submit(id,token->{
      Session session=sessions.get(id);
      if(session==null||!session.names.contains(name))throw new IOException("CB7 page is unavailable");
      session.acquire();
      try{byte[] bytes=ScannerSevenZipReader.readImage(session.file,name,token);token.check();return Base64.encodeToString(bytes,Base64.NO_WRAP);}
      finally{session.release();}
    },result->{if("ok".equals(result.state))promise.resolve(result.value);else reject(promise,result);});
  }
  @ReactMethod public void close(String id,Promise promise){closeSession(id);pool.cancel(id);promise.resolve(null);}
  private void closeSession(String id){Session session=sessions.remove(id);if(session!=null)session.close();}
  private static void reject(Promise promise,ScannerTaskPool.Result result){
    promise.reject("CB7_READ", "timeout".equals(result.state)?"This comic took too long to read. Try another file.":
      "circuit-open".equals(result.state)?"The comic reader is recovering from an unresponsive file. Reopen the app to retry.":
      result.reason==null?"The comic could not be read ("+result.state+").":result.reason);
  }
  private void stage(String source,File destination,ScannerTaskPool.Token token)throws Exception{
    Uri uri=Uri.parse(source);String scheme=uri.getScheme();
    CancellationSignal signal=new CancellationSignal();token.onCancel(signal::cancel);
    if("content".equals(scheme)){
      try(ParcelFileDescriptor descriptor=context.getContentResolver().openFileDescriptor(uri,"r",signal)){
        if(descriptor==null)throw new IOException("Comic file is unavailable");
        if(descriptor.getStatSize()>MAX_BYTES)throw new IOException("CB7 exceeds the 256 MiB reading limit.");
        try(InputStream input=new FileInputStream(descriptor.getFileDescriptor())){copy(input,destination,token);}
      }
    }else if("file".equals(scheme)){
      File sourceFile=new File(Objects.requireNonNull(uri.getPath()));
      if(!sourceFile.isFile()||sourceFile.length()>MAX_BYTES)throw new IOException("CB7 file is unavailable or exceeds 256 MiB.");
      try(InputStream input=new FileInputStream(sourceFile)){copy(input,destination,token);}
    }else throw new IOException("Unsupported comic location");
  }
  private void copy(InputStream input,File target,ScannerTaskPool.Token token)throws Exception{
    byte[] buffer=new byte[65536];long total=0;
    try(OutputStream output=new FileOutputStream(target)){
      for(int count;(count=input.read(buffer))!=-1;){
        token.check();if(count==0)continue;total+=count;
        if(total>MAX_BYTES)throw new IOException("CB7 exceeds the 256 MiB reading limit.");
        if(target.getUsableSpace()<RESERVE_BYTES+count)throw new IOException("Not enough free space to open this comic.");
        output.write(buffer,0,count);
      }
    }
    token.check();if(total<8)throw new IOException("Invalid CB7 archive");
  }
  @Override public void invalidate(){invalidated=true;pool.close();for(String id:new ArrayList<>(sessions.keySet()))closeSession(id);super.invalidate();}
}
