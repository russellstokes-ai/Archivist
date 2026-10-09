package app.archivist.reader;

import android.content.ContentResolver;
import android.content.ContentProviderClient;
import android.database.Cursor;
import android.net.Uri;
import android.os.CancellationSignal;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import java.util.*;

/** All methods are invoked inside ScannerTaskPool, never on the UI or JS thread. */
public final class ScannerDocumentAccess {
  public static final class Entry {
    public final String documentId,name,mimeType;public final Long size,modified;public final boolean directory;
    Entry(String id,String name,String mime,Long size,Long modified){this.documentId=id;this.name=name;this.mimeType=mime;this.size=size;this.modified=modified;this.directory=DocumentsContract.Document.MIME_TYPE_DIR.equals(mime);}
  }
  public static final class Page {
    public final List<Entry> entries;public final Integer nextOffset;
    Page(List<Entry> entries,Integer nextOffset){this.entries=entries;this.nextOffset=nextOffset;}
  }
  private final ContentResolver resolver;
  public ScannerDocumentAccess(ContentResolver resolver){this.resolver=resolver;}
  private Uri document(Uri root,String id,ScannerTaskPool.Token token)throws Exception{
    if(!DocumentsContract.isTreeUri(root))throw new IllegalArgumentException("Selected document tree required");
    if(id==null||id.isEmpty()||id.length()>16384)throw new IllegalArgumentException("Invalid document ID");
    Uri document=DocumentsContract.buildDocumentUriUsingTree(root,id);
    String rootId=DocumentsContract.getTreeDocumentId(root);token.check();
    if(!rootId.equals(id)){
      // The public isChildDocument wrapper requires API 29. Its provider protocol
      // is available with tree grants on API 21; require an explicit true result.
      Bundle input=new Bundle();input.putParcelable("uri",DocumentsContract.buildDocumentUriUsingTree(root,rootId));
      input.putParcelable("android.content.extra.TARGET_URI",document);
      Bundle result=resolver.call(root,"android:isChildDocument",null,input);
      token.check();
      if(result==null||!result.containsKey("result")||!result.getBoolean("result"))throw new SecurityException("Document is outside the selected tree or cannot be verified");
    }
    token.check();return document;
  }
  public Page queryChildren(Uri root,String parentId,int offset,int limit,ScannerTaskPool.Token token)throws Exception{
    if(offset<0||offset>100000||limit<1||limit>128)throw new IllegalArgumentException("Invalid discovery batch bounds");
    document(root,parentId,token);
    CancellationSignal cancellation=new CancellationSignal();token.onCancel(cancellation::cancel);token.check();
    Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(root,parentId);
    String[] projection={DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_MIME_TYPE,DocumentsContract.Document.COLUMN_SIZE,DocumentsContract.Document.COLUMN_LAST_MODIFIED};
    try(Cursor cursor=resolver.query(children,projection,null,null,DocumentsContract.Document.COLUMN_DOCUMENT_ID+" ASC",cancellation)){
      token.check();if(cursor==null)throw new IllegalStateException("Provider returned no cursor");
      List<Entry> entries=new ArrayList<>();boolean available=cursor.moveToPosition(offset);token.check();
      while(available&&entries.size()<limit){
        token.check();String id=text(cursor,projection[0]),name=text(cursor,projection[1]),mime=text(cursor,projection[2]);
        if(id==null||id.isEmpty()||id.length()>16384||name==null||name.isEmpty()||name.length()>2048||mime!=null&&mime.length()>256)throw new IllegalStateException("Invalid provider entry");
        entries.add(new Entry(id,name,mime,number(cursor,projection[3]),number(cursor,projection[4])));
        available=cursor.moveToNext();token.check();
      }
      return new Page(entries,available?offset+entries.size():null);
    }
  }
  public ScannerBoundedIO.Header readHeader(Uri root,String id,int byteBudget,ScannerTaskPool.Token token)throws Exception{
    return ScannerBoundedIO.readHeader(t->openFile(root,id,t),byteBudget,token);
  }
  public ScannerBoundedIO.Header readRange(Uri root,String id,long offset,int byteBudget,ScannerTaskPool.Token token)throws Exception{
    return ScannerBoundedIO.readRange(t->openFile(root,id,t),offset,byteBudget,token);
  }
  private ParcelFileDescriptor.AutoCloseInputStream openFile(Uri root,String id,ScannerTaskPool.Token token)throws Exception{
    Uri uri=document(root,id,token);CancellationSignal cancellation=new CancellationSignal();token.onCancel(cancellation::cancel);
      ParcelFileDescriptor descriptor=null;
      // Read-only ContentResolver opens use a typed-asset fallback which can drop
      // cancellation on Android 15. Open the document directly with its signal.
      try(ContentProviderClient provider=resolver.acquireUnstableContentProviderClient(uri)){
        if(provider==null)throw new IllegalStateException("Document provider unavailable");
        token.check();descriptor=provider.openFile(uri,"r",cancellation);
      }catch(Exception|LinkageError error){
        if(descriptor!=null)try{descriptor.close();}catch(Exception closeError){error.addSuppressed(closeError);}
        throw error;
      }
      if(descriptor==null)throw new IllegalStateException("Provider returned no file descriptor");
      try{return new ParcelFileDescriptor.AutoCloseInputStream(descriptor);}catch(RuntimeException error){descriptor.close();throw error;}
  }
  public ScannerArchiveReader.Clues readArchiveClues(Uri root,String id,ScannerTaskPool.Token token)throws Exception{
    return ScannerArchiveReader.read(t->openFile(root,id,t),token);
  }
  public ScannerArtworkReader.Artwork readArtwork(Uri root,String id,java.io.File cache,ScannerTaskPool.Token token)throws Exception{
    return ScannerArtworkReader.read(t->openFile(root,id,t),cache,token);
  }
  private static String text(Cursor cursor,String column){int index=cursor.getColumnIndex(column);return index<0||cursor.isNull(index)?null:cursor.getString(index);}
  private static Long number(Cursor cursor,String column){int index=cursor.getColumnIndex(column);return index<0||cursor.isNull(index)?null:cursor.getLong(index);}
}
