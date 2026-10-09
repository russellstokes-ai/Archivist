package app.archivist.reader;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Process;
import android.provider.DocumentsContract;
import android.util.Base64;
import com.facebook.react.bridge.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CancellationException;
import java.util.concurrent.atomic.AtomicBoolean;

public final class ArchivistScannerModule extends ReactContextBaseJavaModule {
  // Process-wide pools survive JS/module reloads: stuck workers cannot be replaced by a new module.
  private static final ScannerTaskPool discovery=new ScannerTaskPool(2,128,8000);
  private static final ScannerTaskPool clues=new ScannerTaskPool(2,128,8000);
  private static final class Scope {final Uri root;final AtomicBoolean cancelled=new AtomicBoolean();Scope(Uri root){this.root=root;}}
  private final Map<String,Scope> scopes=new ConcurrentHashMap<>();
  private final ScannerDocumentAccess documents;
  public ArchivistScannerModule(ReactApplicationContext context){super(context);documents=new ScannerDocumentAccess(context.getContentResolver());}
  @Override public String getName(){return "ArchivistScanner";}
  @ReactMethod public void allocateIdentityNamespace(Promise promise){promise.resolve(UUID.randomUUID().toString());}
  @ReactMethod public void beginScope(String rootUri,Promise promise){
    try{
      Uri root=Uri.parse(rootUri);
      if(!"content".equals(root.getScheme())||!DocumentsContract.isTreeUri(root))throw new IllegalArgumentException("Selected Android tree required");
      if(getReactApplicationContext().checkUriPermission(root,Process.myPid(),Process.myUid(),Intent.FLAG_GRANT_READ_URI_PERMISSION)!=PackageManager.PERMISSION_GRANTED)throw new SecurityException("Selected source read permission is missing");
      if(scopes.size()>=32)throw new IllegalStateException("Too many active scanner scopes");
      String id=UUID.randomUUID().toString();scopes.put(id,new Scope(root));WritableMap result=Arguments.createMap();result.putString("scope",id);result.putString("rootDocumentId",DocumentsContract.getTreeDocumentId(root));promise.resolve(result);
    }catch(Exception error){promise.reject("scanner-source-grant",error);}
  }
  @ReactMethod public void queryChildren(String scopeId,String parentId,double offset,double limit,Promise promise){
    Scope scope=scopes.get(scopeId);if(scope==null){promise.reject("scanner-scope-cancelled","Scanner scope is closed");return;}
    if(offset!=Math.floor(offset)||limit!=Math.floor(limit)||offset<0||offset>100000||limit<1||limit>128){promise.reject("scanner-budget","Invalid batch bounds");return;}
    discovery.submit(scopeId,token->{check(scope,token);return documents.queryChildren(scope.root,parentId,(int)offset,(int)limit,token);},result->resolve(scope,result,promise));
  }
  @ReactMethod public void readHeader(String scopeId,String documentId,double byteBudget,Promise promise){
    Scope scope=scopes.get(scopeId);if(scope==null){promise.reject("scanner-scope-cancelled","Scanner scope is closed");return;}
    if(byteBudget!=Math.floor(byteBudget)||byteBudget<1||byteBudget>65536){promise.reject("scanner-budget","Header budget must be 1..65536 bytes");return;}
    clues.submit(scopeId,token->{check(scope,token);return documents.readHeader(scope.root,documentId,(int)byteBudget,token);},result->resolve(scope,result,promise));
  }
  private static void check(Scope scope,ScannerTaskPool.Token token){token.check();if(scope.cancelled.get())throw new CancellationException("Scanner scope cancelled");}
  @ReactMethod public void readArchiveClues(String scopeId,String documentId,Promise promise){
    Scope scope=scopes.get(scopeId);if(scope==null){promise.reject("scanner-scope-cancelled","Scanner scope is closed");return;}
    clues.submit(scopeId,token->{check(scope,token);return documents.readArchiveClues(scope.root,documentId,token);},result->resolve(scope,result,promise));
  }
  @ReactMethod public void readArtwork(String scopeId,String documentId,Promise promise){
    Scope scope=scopes.get(scopeId);if(scope==null){promise.reject("scanner-scope-cancelled","Scanner scope is closed");return;}
    java.io.File cache=new java.io.File(getReactApplicationContext().getCacheDir(),"scanner-vnext-artwork");
    clues.submit(scopeId,token->{check(scope,token);return documents.readArtwork(scope.root,documentId,cache,token);},result->resolve(scope,result,promise));
  }
  @ReactMethod public void readPrivateArtwork(String scopeId,String fileUri,Promise promise){
    Scope scope=scopes.get(scopeId);if(scope==null){promise.reject("scanner-scope-cancelled","Scanner scope is closed");return;}
    java.io.File cache=new java.io.File(getReactApplicationContext().getCacheDir(),"scanner-vnext-artwork");
    clues.submit(scopeId,token->{
      check(scope,token);Uri uri=Uri.parse(fileUri);if(!"file".equals(uri.getScheme())||uri.getPath()==null)throw new SecurityException("Private artwork file required");
      java.io.File source=new java.io.File(uri.getPath()).getCanonicalFile();String path=source.getPath();
      String privateFiles=getReactApplicationContext().getFilesDir().getCanonicalPath()+java.io.File.separator,privateCache=getReactApplicationContext().getCacheDir().getCanonicalPath()+java.io.File.separator;
      if(!path.startsWith(privateFiles)&&!path.startsWith(privateCache))throw new SecurityException("Artwork is outside private app storage");
      return ScannerArtworkReader.read(t->new java.io.FileInputStream(source),cache,token);
    },result->resolve(scope,result,promise));
  }
  @ReactMethod public void readRange(String scopeId,String documentId,double offset,double byteBudget,Promise promise){
    Scope scope=scopes.get(scopeId);if(scope==null){promise.reject("scanner-scope-cancelled","Scanner scope is closed");return;}
    if(!Double.isFinite(offset)||offset!=Math.floor(offset)||offset<0||offset>8796093022208L||!Double.isFinite(byteBudget)||byteBudget!=Math.floor(byteBudget)||byteBudget<1||byteBudget>65536){promise.reject("scanner-budget","Invalid bounded range");return;}
    clues.submit(scopeId,token->{check(scope,token);return documents.readRange(scope.root,documentId,(long)offset,(int)byteBudget,token);},result->resolve(scope,result,promise));
  }
  private static void resolve(Scope scope,ScannerTaskPool.Result result,Promise promise){
    WritableMap output=Arguments.createMap();String state=scope.cancelled.get()?"cancelled":result.state;output.putString("state",state);
    if(result.reason!=null)output.putString("reason",result.reason);
    if("ok".equals(state)&&result.value instanceof ScannerDocumentAccess.Page){
      ScannerDocumentAccess.Page page=(ScannerDocumentAccess.Page)result.value;WritableArray entries=Arguments.createArray();
      for(ScannerDocumentAccess.Entry entry:page.entries){WritableMap item=Arguments.createMap();item.putString("documentId",entry.documentId);item.putString("name",entry.name);if(entry.mimeType!=null)item.putString("mimeType",entry.mimeType);if(entry.size!=null)item.putDouble("size",entry.size);if(entry.modified!=null)item.putDouble("modified",entry.modified);item.putBoolean("directory",entry.directory);entries.pushMap(item);}
      output.putArray("entries",entries);if(page.nextOffset==null)output.putNull("nextOffset");else output.putInt("nextOffset",page.nextOffset);
    }else if("ok".equals(state)&&result.value instanceof ScannerArtworkReader.Artwork){
      ScannerArtworkReader.Artwork value=(ScannerArtworkReader.Artwork)result.value;output.putString("uri",value.uri);output.putString("sha256",value.sha256);output.putInt("bytes",value.bytes);output.putInt("width",value.width);output.putInt("height",value.height);
    }else if("ok".equals(state)&&result.value instanceof ScannerArchiveReader.Clues){
      ScannerArchiveReader.Clues value=(ScannerArchiveReader.Clues)result.value;output.putString("status",value.status);output.putString("reason",value.reason);output.putInt("bytesRead",(int)value.bytesRead);WritableMap fields=Arguments.createMap();for(Map.Entry<String,String> field:value.fields.entrySet())fields.putString(field.getKey(),field.getValue());output.putMap("fields",fields);output.putString("provenance","embedded");
    }else if("ok".equals(state)&&result.value instanceof ScannerBoundedIO.Header){
      ScannerBoundedIO.Header header=(ScannerBoundedIO.Header)result.value;output.putString("base64",Base64.encodeToString(header.bytes,Base64.NO_WRAP));output.putInt("bytesRead",header.bytes.length);output.putBoolean("budgetReached",header.budgetReached);output.putString("metadataStatus",header.offset<0?"header-only":"bounded-range");if(header.offset>=0)output.putDouble("offset",header.offset);
    }
    promise.resolve(output);
  }
  @ReactMethod public void cancelScope(String scopeId,Promise promise){Scope scope=scopes.remove(scopeId);if(scope!=null){scope.cancelled.set(true);discovery.cancel(scopeId);clues.cancel(scopeId);}promise.resolve(null);}
  @ReactMethod public void diagnostics(Promise promise){WritableMap result=Arguments.createMap();result.putMap("discovery",stats(discovery.stats()));result.putMap("clues",stats(clues.stats()));result.putInt("scopes",scopes.size());promise.resolve(result);}
  private static WritableMap stats(ScannerTaskPool.Stats stats){WritableMap value=Arguments.createMap();value.putInt("active",stats.active);value.putInt("queued",stats.queued);value.putInt("quarantined",stats.quarantined);return value;}
  @Override public void invalidate(){for(String id:new ArrayList<>(scopes.keySet())){Scope scope=scopes.remove(id);if(scope!=null)scope.cancelled.set(true);discovery.cancel(id);clues.cancel(id);}super.invalidate();}
}
