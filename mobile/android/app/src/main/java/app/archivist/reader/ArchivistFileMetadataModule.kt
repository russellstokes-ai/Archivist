package app.archivist.reader

import android.net.Uri
import android.provider.DocumentsContract
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.Executors

/** Same-document replacement with durable rollback; never renames a media file. */
class ArchivistFileMetadataModule(private val context:ReactApplicationContext):ReactContextBaseJavaModule(context){
 override fun getName()="ArchivistFileMetadata"
 private val executor=Executors.newSingleThreadExecutor()
 private val resolver get()=context.contentResolver
 private val directory get()=File(context.filesDir,"metadata-write-journal").apply{mkdirs()}
 private fun hash(file:File)=file.inputStream().use{input->val digest=MessageDigest.getInstance("SHA-256");val b=ByteArray(65536);var n=input.read(b);while(n>=0){if(n>0)digest.update(b,0,n);n=input.read(b)};digest.digest().joinToString(""){"%02x".format(it)}}
 private fun privateFile(value:String):File{
  val uri=Uri.parse(value);require(uri.scheme=="file");val file=File(uri.path!!).canonicalFile
  require(file.path.startsWith(context.cacheDir.canonicalPath+File.separator));require(file.isFile&&file.length() in 1..67108864);return file
 }
 private fun checkGrant(tree:Uri,uri:Uri){
  require(tree.scheme=="content"&&uri.scheme=="content"&&tree.authority==uri.authority&&DocumentsContract.isTreeUri(tree))
  require(resolver.persistedUriPermissions.any{it.uri==tree&&it.isReadPermission&&it.isWritePermission})
  if(android.os.Build.VERSION.SDK_INT<29)error("Embedded writing requires Android 10 or newer; use library metadata snapshot")
  require(DocumentsContract.isChildDocument(resolver,DocumentsContract.buildDocumentUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree)),uri))
 }
 private fun copyFrom(uri:Uri,file:File){resolver.openInputStream(uri)?.use{input->file.outputStream().use{out->val b=ByteArray(65536);var total=0L;var n=input.read(b);while(n>=0){if(n>0){total+=n;require(total<=67108864);out.write(b,0,n)};n=input.read(b)};out.fd.sync()}}?:error("Cannot read source")}
 private fun copyTo(file:File,uri:Uri){resolver.openFileDescriptor(uri,"rwt")?.use{pfd->java.io.FileOutputStream(pfd.fileDescriptor).use{out->file.inputStream().use{it.copyTo(out)};out.flush();out.fd.sync()}}?:error("Cannot write source")}
 private fun recover(){
  for(journal in directory.listFiles()?.filter{it.extension=="json"}?:emptyList()){
   val data=JSONObject(journal.readText());val backup=File(directory,data.getString("backup")).canonicalFile
   require(backup.parentFile==directory.canonicalFile&&backup.isFile&&hash(backup)==data.getString("original"))
   val tree=Uri.parse(data.getString("tree"));val uri=Uri.parse(data.getString("uri"));checkGrant(tree,uri)
   val check=File(directory,"check-${UUID.randomUUID()}")
   try{copyFrom(uri,check);val current=hash(check);if(current!=data.getString("updated")&&current!=data.getString("original")){copyTo(backup,uri);copyFrom(uri,check);require(hash(check)==data.getString("original"))};require(journal.delete());backup.delete()}finally{check.delete()}
  }
 }
 @ReactMethod fun recoverPending(promise:Promise){executor.execute{try{recover();promise.resolve(true)}catch(_:Throwable){promise.reject("FILE_RECOVERY_REQUIRED","A previous file update needs recovery. Reconnect its writable folder.")}}}
 @ReactMethod fun replaceVerified(treeValue:String,uriValue:String,expectedValue:String,updatedValue:String,promise:Promise){executor.execute{
  var journal:File?=null;var backup:File?=null
  try{
   recover();val tree=Uri.parse(treeValue);val uri=Uri.parse(uriValue);checkGrant(tree,uri)
   val expected=privateFile(expectedValue);val updated=privateFile(updatedValue);val id=UUID.randomUUID().toString()
   backup=File(directory,"$id.backup");copyFrom(uri,backup!!);require(hash(backup!!)==hash(expected)){"Source changed during metadata preparation"}
   journal=File(directory,"$id.json");val record=JSONObject().put("tree",treeValue).put("uri",uriValue).put("backup",backup!!.name).put("original",hash(backup!!)).put("updated",hash(updated))
   val pendingJournal=File(directory,"$id.pending")
   pendingJournal.outputStream().use{it.write(record.toString().toByteArray());it.fd.sync()}
   require(pendingJournal.renameTo(journal!!)){"Cannot commit recovery journal"}
   copyTo(updated,uri)
   val check=File(directory,"$id.check");try{copyFrom(uri,check);require(hash(check)==hash(updated))}finally{check.delete()}
   require(journal!!.delete());backup!!.delete();promise.resolve("written")
  }catch(_:Throwable){
   if(journal?.exists()==true){try{recover();promise.reject("FILE_WRITE_ROLLED_BACK","Metadata was not written; the original was restored.")}catch(_:Throwable){promise.reject("FILE_RECOVERY_REQUIRED","File recovery is pending. Keep this app installed and reconnect the folder.")}}
   else{backup?.delete();promise.reject("FILE_WRITE_FAILED","Metadata could not be written; the source was not changed.")}
  }
 }}
 override fun invalidate(){executor.shutdown();super.invalidate()}
}
class ArchivistFileMetadataPackage:ReactPackage{
 override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(ArchivistFileMetadataModule(context))
 override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
