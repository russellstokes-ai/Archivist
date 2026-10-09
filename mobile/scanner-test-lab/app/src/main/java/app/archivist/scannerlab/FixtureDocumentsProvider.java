package app.archivist.scannerlab;

import android.database.Cursor;
import android.database.MatrixCursor;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.provider.DocumentsProvider;
import java.io.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Controlled Android fixture boundary. All bytes/names are synthetic; no user source is opened. */
public final class FixtureDocumentsProvider extends DocumentsProvider {
  private static final String[] DOC={"document_id","_display_name","mime_type","_size","last_modified","flags"};
  private final AtomicInteger count=new AtomicInteger(342),opened=new AtomicInteger(),cancelled=new AtomicInteger();
  private File seed,archive,cover;
  @Override public boolean onCreate(){
    archive=new File(getContext().getFilesDir(),"synthetic.cbz");
    try(java.util.zip.ZipOutputStream output=new java.util.zip.ZipOutputStream(new FileOutputStream(archive))){
      output.putNextEntry(new java.util.zip.ZipEntry("ComicInfo.xml"));output.write("<ComicInfo><Title>Generated Comic</Title><Writer>Fixture Writer</Writer></ComicInfo>".getBytes("UTF-8"));output.closeEntry();
    }catch(IOException error){return false;}
    seed=new File(getContext().getFilesDir(),"synthetic.mp3");
    cover=new File(getContext().getFilesDir(),"synthetic-cover.png");
    android.graphics.Bitmap image=android.graphics.Bitmap.createBitmap(100,150,android.graphics.Bitmap.Config.ARGB_8888);
    try(OutputStream output=new FileOutputStream(cover)){image.compress(android.graphics.Bitmap.CompressFormat.PNG,100,output);}catch(IOException error){return false;}finally{image.recycle();}
    try(InputStream in=getContext().getAssets().open("synthetic-tagged.mp3");OutputStream out=new FileOutputStream(seed)){byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))>=0)out.write(buffer,0,n);}catch(IOException error){throw new IllegalStateException(error);}
    return true;
  }
  @Override public Cursor queryRoots(String[] projection){
    String[] columns=projection==null?new String[]{"root_id","document_id","title","flags"}:projection;
    MatrixCursor cursor=new MatrixCursor(columns);MatrixCursor.RowBuilder row=cursor.newRow();
    for(String column:columns)row.add(column,column.equals("root_id")?"fixture":column.equals("document_id")?"root":column.equals("title")?"Generated scanner lab":0);
    return cursor;
  }
  private MatrixCursor cursor(String[] projection){return new MatrixCursor(projection==null?DOC:projection);}
  private void add(MatrixCursor cursor,String id,boolean directory){
    MatrixCursor.RowBuilder row=cursor.newRow();
    for(String column:cursor.getColumnNames()){
      Object value=null;
      switch(column){case "document_id":value=id;break;case "_display_name":value=directory?id:id.equals("book/cover")?"cover.png":id.substring(id.lastIndexOf('/')+1)+".mp3";break;case "mime_type":value=directory?DocumentsContract.Document.MIME_TYPE_DIR:id.equals("book/cover")?"image/png":"audio/mpeg";break;case "_size":value=directory?0:id.equals("book/cover")?cover.length():seed.length();break;case "last_modified":value=1L;break;case "flags":value=0;break;}
      row.add(column,value);
    }
  }
  @Override public Cursor queryDocument(String id,String[] projection){MatrixCursor cursor=cursor(projection);add(cursor,id,id.equals("root")||id.equals("book")||id.startsWith("slow-query"));return cursor;}
  @Override public Cursor queryChildDocuments(String parent,String[] projection,String sort){
    if(parent.startsWith("slow-query"))delay();
    MatrixCursor cursor=cursor(projection);
    if(parent.equals("root"))add(cursor,"book",true);
    else if(parent.equals("book"))for(int i=1;i<=count.get();i++)add(cursor,String.format(java.util.Locale.ROOT,"book/%06d",i),false);
    return cursor;
  }
  @Override public boolean isChildDocument(String parent,String child){return parent.equals("root")&&(child.equals("book")||child.startsWith("book/")||child.startsWith("slow-"));}
  @Override public ParcelFileDescriptor openDocument(String id,String mode,CancellationSignal cancellation)throws FileNotFoundException{
    if(!mode.equals("r"))throw new FileNotFoundException("Read-only fixture");
    opened.incrementAndGet();
    if(cancellation!=null)cancellation.setOnCancelListener(cancelled::incrementAndGet);
    if(id.equals("slow-open"))delay();
    if(id.equals("book/pipe")){
      ParcelFileDescriptor[] pipe=null;
      try{
        pipe=ParcelFileDescriptor.createPipe();
        try(OutputStream output=new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1])){output.write(new byte[]{73,68,51,0});}
        return pipe[0];
      }catch(IOException error){
        if(pipe!=null)for(ParcelFileDescriptor end:pipe)try{end.close();}catch(IOException ignored){}
        FileNotFoundException failure=new FileNotFoundException("Fixture pipe unavailable");failure.initCause(error);throw failure;
      }
    }
    return ParcelFileDescriptor.open(id.equals("book/archive")?archive:id.equals("book/cover")?cover:seed,ParcelFileDescriptor.MODE_READ_ONLY);
  }
  private static void delay(){long end=android.os.SystemClock.elapsedRealtime()+1500;while(android.os.SystemClock.elapsedRealtime()<end)try{Thread.sleep(20);}catch(InterruptedException ignored){/* Deliberately uncooperative provider. */}}
  @Override public Bundle call(String method,String arg,Bundle extras){
    if(method.equals("fixture-count")){int value=Integer.parseInt(arg);if(value<1||value>100000)throw new IllegalArgumentException("Fixture count");count.set(value);return Bundle.EMPTY;}
    if(method.equals("fixture-stats")){Bundle result=new Bundle();result.putInt("opened",opened.get());result.putInt("cancelled",cancelled.get());return result;}
    return super.call(method,arg,extras);
  }
}
