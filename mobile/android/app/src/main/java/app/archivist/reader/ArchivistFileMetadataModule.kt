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
 private val history get()=File(context.filesDir,"metadata-write-history").apply{mkdirs()}
 private val receiptIndex get()=File(context.filesDir,"metadata-write-index").apply{mkdirs()}
 private fun receiptFile(uri:String)=File(receiptIndex,MessageDigest.getInstance("SHA-256").digest(uri.toByteArray()).joinToString(""){"%02x".format(it)}+".json")
 private fun hash(file:File)=file.inputStream().use{input->val digest=MessageDigest.getInstance("SHA-256");val b=ByteArray(65536);var n=input.read(b);while(n>=0){if(n>0)digest.update(b,0,n);n=input.read(b)};digest.digest().joinToString(""){"%02x".format(it)}}
 private fun privateFile(value:String):File{
  val uri=Uri.parse(value);require(uri.scheme=="file");val file=File(uri.path!!).canonicalFile
  require(file.path.startsWith(context.cacheDir.canonicalPath+File.separator));require(file.isFile&&file.length() in 1..8589934592L);return file
 }
 private fun checkGrant(tree:Uri,uri:Uri){
  require(tree.scheme=="content"&&uri.scheme=="content"&&tree.authority==uri.authority&&DocumentsContract.isTreeUri(tree))
  require(resolver.persistedUriPermissions.any{it.uri==tree&&it.isReadPermission&&it.isWritePermission})
  if(android.os.Build.VERSION.SDK_INT<29)error("Embedded writing requires Android 10 or newer; metadata remains in the library")
  require(DocumentsContract.isChildDocument(resolver,DocumentsContract.buildDocumentUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree)),uri))
 }
 private fun sourceSize(uri:Uri):Long=resolver.query(uri,arrayOf(android.provider.OpenableColumns.SIZE),null,null,null)?.use{cursor->if(cursor.moveToFirst()&&!cursor.isNull(0))cursor.getLong(0)else -1L}?:-1L
 private fun sourceModified(uri:Uri):Long=resolver.query(uri,arrayOf(DocumentsContract.Document.COLUMN_LAST_MODIFIED),null,null,null)?.use{cursor->if(cursor.moveToFirst()&&!cursor.isNull(0))cursor.getLong(0)else -1L}?:-1L
 private fun copyFrom(uri:Uri,file:File,maxBytes:Long=8589934592L,reserveCopies:Int=0){resolver.openInputStream(uri)?.use{input->file.outputStream().use{out->val b=ByteArray(65536);var total=0L;var n=input.read(b);while(n>=0){if(n>0){total+=n;require(total<=maxBytes){"File exceeds verified writer size limit"};if(reserveCopies>0)require(context.filesDir.usableSpace>total*reserveCopies+16777216){"Insufficient space for verified update and undo"};out.write(b,0,n)};n=input.read(b)};out.fd.sync()}}?:error("Cannot read source")}
 private fun copyTo(file:File,uri:Uri){resolver.openFileDescriptor(uri,"rwt")?.use{pfd->java.io.FileOutputStream(pfd.fileDescriptor).use{out->file.inputStream().use{it.copyTo(out)};out.flush();out.fd.sync()}}?:error("Cannot write source")}
 private fun retain(journal:File,backup:File){
  val record=JSONObject(journal.readText())
  val target=File(history,backup.name)
  if(!target.exists())require(backup.renameTo(target)){"Cannot retain metadata undo"}
  require(journal.renameTo(File(history,journal.name))){"Cannot retain write receipt"}
  // The journal remains authoritative if this expendable lookup index cannot
  // be updated. A missing index causes another comparison, never a false skip.
  try{val targetReceipt=receiptFile(record.getString("uri"));val temp=File(receiptIndex,targetReceipt.name+".pending")
   temp.outputStream().use{it.write(record.toString().toByteArray());it.fd.sync()};require(temp.renameTo(targetReceipt))
  }catch(_:Throwable){}
 }
 private fun recover(onlyUri:String?=null){
  for(journal in directory.listFiles()?.filter{it.extension=="json"}?:emptyList()){
   val data=JSONObject(journal.readText());if(onlyUri!=null&&data.getString("uri")!=onlyUri)continue
   val backup=File(directory,data.getString("backup")).canonicalFile
   val retained=File(history,data.getString("backup")).canonicalFile
   val original=if(backup.isFile)backup else retained
   require(backup.parentFile==directory.canonicalFile&&retained.parentFile==history.canonicalFile&&original.isFile&&hash(original)==data.getString("original"))
   val tree=Uri.parse(data.getString("tree"));val uri=Uri.parse(data.getString("uri"));checkGrant(tree,uri)
   val check=File(directory,"check-${UUID.randomUUID()}")
   try{
    copyFrom(uri,check)
    when(MetadataRecoveryPolicy.decide(hash(check),data.getString("original"),data.getString("updated"))){
     MetadataRecoveryPolicy.Action.KEEP_UPDATED->retain(journal,backup)
     MetadataRecoveryPolicy.Action.KEEP_ORIGINAL->{require(journal.delete());backup.delete();retained.delete()}
     MetadataRecoveryPolicy.Action.REQUIRE_REVIEW->throw WriteFailure("FILE_RECOVERY_REQUIRED","File changed or replacement was interrupted; original backup retained for explicit recovery")
    }
   }finally{check.delete()}
  }
 }
 @ReactMethod fun prepareSource(treeValue:String,uriValue:String,extension:String,promise:Promise){executor.execute{
  val copy=File(context.cacheDir,"metadata-source-${UUID.randomUUID()}.${extension.filter{it.isLetterOrDigit()}.take(8)}")
  try{
   require(extension in listOf("mp3","m4a","m4b","aac","flac","ogg","opus","wav","wma","epub","cbz","zip","cbr","cbt","pdf"))
   val tree=Uri.parse(treeValue);val uri=Uri.parse(uriValue);checkGrant(tree,uri)
   val limit=if(extension in listOf("epub","cbz","zip","cbr","cbt","pdf"))67108864L else 8589934592L
   val size=sourceSize(uri);require(size<=limit){"File exceeds verified writer size limit"}
   if(size>0)require(context.filesDir.usableSpace>size*4+16777216){"Insufficient space for verified update and undo"}
   copyFrom(uri,copy,limit,3);val fingerprint=hash(copy)
   val known=try{val receipt=JSONObject(receiptFile(uriValue).readText());if(receipt.getString("uri")==uriValue&&receipt.getString("updated")==fingerprint)receipt.optJSONObject("fields")else null}catch(_:Throwable){null}
   promise.resolve(Arguments.createMap().apply{putString("original",Uri.fromFile(copy).toString());putString("fingerprint",fingerprint);putString("fieldsJson",(known?:JSONObject()).toString())})
  }
  catch(e:Throwable){copy.delete();if(e is WriteFailure)promise.reject(e.code,e.message,e)else promise.reject("FILE_SNAPSHOT_FAILED","The file could not be prepared safely; library details are saved.",e)}
 }}
 @ReactMethod fun verifiedFileReceipt(treeValue:String,uriValue:String,promise:Promise){executor.execute{
  try{
   val tree=Uri.parse(treeValue);val uri=Uri.parse(uriValue);checkGrant(tree,uri)
   val file=receiptFile(uriValue);if(!file.isFile){promise.resolve(null);return@execute}
   val record=JSONObject(file.readText())
   if(record.optString("tree")!=treeValue||record.optString("uri")!=uriValue){promise.resolve(null);return@execute}
   val hash=record.optString("updated");val size=record.optLong("verifiedSize",-1);val modified=record.optLong("verifiedModified",-1)
   if(!hash.matches(Regex("[a-f0-9]{64}"))||size<0||modified<=0||sourceSize(uri)!=size||sourceModified(uri)!=modified){promise.resolve(null);return@execute}
   promise.resolve(Arguments.createMap().apply{putString("sha256",hash);putDouble("size",size.toDouble());putDouble("modified",modified.toDouble())})
  }catch(e:Throwable){promise.reject("VERIFIED_RECEIPT_UNAVAILABLE","The verified file receipt is unavailable for this source.",e)}
 }}
 @ReactMethod fun writeHistory(uriValue:String,promise:Promise){executor.execute{
  try{val rows=Arguments.createArray();for(file in history.listFiles()?.filter{it.extension=="json"}?:emptyList()){val record=JSONObject(file.readText());if(record.getString("uri")==uriValue)rows.pushMap(Arguments.createMap().apply{putString("id",file.nameWithoutExtension);putString("original",record.getString("original"));putString("updated",record.getString("updated"))})};promise.resolve(rows)}catch(e:Throwable){promise.reject("HISTORY_UNAVAILABLE",e)}
 }}
 @ReactMethod fun pendingRecovery(uriValue:String,promise:Promise){executor.execute{
  try{val rows=Arguments.createArray()
   for(file in directory.listFiles()?.filter{it.extension=="json"}?:emptyList()){
    val record=JSONObject(file.readText());if(record.getString("uri")!=uriValue)continue
    val uri=Uri.parse(uriValue);checkGrant(Uri.parse(record.getString("tree")),uri)
    val current=File(context.cacheDir,"recovery-review-${UUID.randomUUID()}")
    try{copyFrom(uri,current);rows.pushMap(Arguments.createMap().apply{putString("id",file.nameWithoutExtension);putString("current",hash(current))})}finally{current.delete()}
   };promise.resolve(rows)
  }catch(e:Throwable){promise.reject("RECOVERY_UNAVAILABLE","Reconnect the writable library folder to review recovery.",e)}
 }}
 /** Explicit owner action only; preserves the reviewed current bytes for undo. */
 @ReactMethod fun restorePending(id:String,expectedCurrent:String,promise:Promise){executor.execute{
  try{
   require(id.matches(Regex("[a-f0-9-]{36}"))&&expectedCurrent.matches(Regex("[a-f0-9]{64}")))
   val journal=File(directory,"$id.json");val record=JSONObject(journal.readText())
   val source=File(directory,record.getString("backup")).canonicalFile
   val retained=File(history,record.getString("backup")).canonicalFile
   require(source.parentFile==directory.canonicalFile&&retained.parentFile==history.canonicalFile)
   val original=if(source.isFile)source else retained
   require(original.isFile&&hash(original)==record.getString("original"))
   val uri=Uri.parse(record.getString("uri"));checkGrant(Uri.parse(record.getString("tree")),uri)
   require(context.filesDir.usableSpace>original.length()*2+16777216){"Insufficient recovery space"}
   val recoveryId=UUID.randomUUID().toString();val preserved=File(history,"$recoveryId.backup")
   copyFrom(uri,preserved,reserveCopies=1)
   if(hash(preserved)!=expectedCurrent){preserved.delete();error("File changed since recovery review")}
   val receipt=JSONObject().put("tree",record.getString("tree")).put("uri",record.getString("uri")).put("backup",preserved.name).put("original",expectedCurrent).put("updated",record.getString("original")).put("fields",JSONObject())
   File(history,"$recoveryId.json").outputStream().use{it.write(receipt.toString().toByteArray());it.fd.sync()}
   // The existing pending journal retains the intact original if restoration
   // itself is interrupted. Never discard it until a full read-back succeeds.
   copyTo(original,uri);val check=File(context.cacheDir,"recovery-check-${UUID.randomUUID()}")
   try{copyFrom(uri,check);require(hash(check)==record.getString("original"))}finally{check.delete()}
   require(journal.delete());source.delete();retained.delete();receiptFile(record.getString("uri")).delete()
   promise.resolve(true)
  }catch(e:Throwable){promise.reject("FILE_RECOVERY_REQUIRED","Restoration did not finish. The original backup is retained; reconnect the folder and retry.",e)}
 }}
 @ReactMethod fun undoWrite(id:String,promise:Promise){executor.execute{
  try{require(id.matches(Regex("[a-f0-9-]{36}")));recover();val journal=File(history,"$id.json");val record=JSONObject(journal.readText());val backup=File(history,record.getString("backup")).canonicalFile;require(backup.parentFile==history.canonicalFile&&hash(backup)==record.getString("original"));val tree=Uri.parse(record.getString("tree"));val uri=Uri.parse(record.getString("uri"));checkGrant(tree,uri)
   val current=File(context.cacheDir,"undo-current-${UUID.randomUUID()}");val restore=File(context.cacheDir,"undo-restore-${UUID.randomUUID()}")
   try{copyFrom(uri,current);require(hash(current)==record.getString("updated")){"File changed since this update"};backup.copyTo(restore);promise.resolve(replaceNow(record.getString("tree"),record.getString("uri"),Uri.fromFile(current).toString(),Uri.fromFile(restore).toString()))}finally{current.delete();restore.delete()}
  }catch(e:Throwable){promise.reject("UNDO_NOT_SAFE","Undo cannot overwrite a changed or unavailable file.",e)}
 }}
 private fun mediaFingerprint(file:File):List<String>{
  val extractor=android.media.MediaExtractor()
  try{
   extractor.setDataSource(file.path);require(extractor.trackCount>0)
   val result=ArrayList<String>();val buffer=java.nio.ByteBuffer.allocate(16*1024*1024)
   for(track in 0 until extractor.trackCount){
    val format=extractor.getTrackFormat(track);val digest=MessageDigest.getInstance("SHA-256")
    extractor.selectTrack(track);extractor.seekTo(0,android.media.MediaExtractor.SEEK_TO_PREVIOUS_SYNC)
    while(true){buffer.clear();val size=extractor.readSampleData(buffer,0);if(size<0)break;require(size<=buffer.capacity());buffer.position(0);buffer.limit(size);digest.update(buffer);digest.update((extractor.sampleTime.toString()+":"+extractor.sampleFlags+";").toByteArray());if(!extractor.advance())break}
    result.add((format.getString(android.media.MediaFormat.KEY_MIME)?:"")+":"+digest.digest().joinToString(""){"%02x".format(it)});extractor.unselectTrack(track)
   };return result
  }finally{extractor.release()}
 }
 @ReactMethod fun readRarMetadata(snapshotValue:String,name:String,promise:Promise){executor.execute{
  try{val copy=privateFile(snapshotValue);require(copy.length()<=64*1024*1024);promise.resolve(android.util.Base64.encodeToString(RarMetadataVerifier.readMetadata(copy,name),android.util.Base64.NO_WRAP))}
  catch(e:Exception){promise.reject("RAR_METADATA_READ_FAILED",e)}
 }}
 @ReactMethod fun verifyRarCopies(originalValue:String,updatedValue:String,promise:Promise){executor.execute{
  try{val original=privateFile(originalValue);val updated=privateFile(updatedValue);require(original.length()<=64*1024*1024&&updated.length()<=64*1024*1024);RarMetadataVerifier.verify(original,updated);promise.resolve(true)}
  catch(e:Exception){promise.reject("RAR_METADATA_VERIFY_FAILED",e)}
 }}
 @ReactMethod fun prepareAudio(snapshotValue:String,fingerprint:String,extension:String,fieldsJson:String,multipart:Boolean,promise:Promise){executor.execute{
  var updated:File?=null
  try{
   require(extension in listOf("mp3","m4a","m4b","aac","flac","ogg","opus","wav","wma"));require(fieldsJson.length<65536)
   val original=privateFile(snapshotValue);require(original.extension==extension&&hash(original)==fingerprint){"Prepared source changed"}
   val fields=JSONObject(fieldsJson);val id=UUID.randomUUID().toString()
   require(context.filesDir.usableSpace>original.length()*3+16777216){"Insufficient space for verified update and undo"}
   updated=File(context.cacheDir,"metadata-updated-$id.$extension");original.copyTo(updated!!)
   val before=mediaFingerprint(original);val values=HashMap<String,String>();fields.keys().forEach{key->if(key!="coverUri")values[key]=fields.getString(key)}
   // New artwork is app-side only; the byte writers retain existing artwork.
   AudioMetadataWriter.write(updated!!,values,multipart,null,null)
   require(before==mediaFingerprint(updated!!)){"Media samples or timing changed"}
   promise.resolve(Arguments.createMap().apply{putString("updated",Uri.fromFile(updated).toString())})
  }catch(error:Throwable){updated?.delete();promise.reject("AUDIO_METADATA_PREPARATION_FAILED","Audio metadata could not be verified; original unchanged.",error)}
 }}
 @ReactMethod fun recoverPending(promise:Promise){executor.execute{try{recover();promise.resolve(true)}catch(_:Throwable){promise.reject("FILE_RECOVERY_REQUIRED","A previous file update needs recovery. Reconnect its writable folder.")}}}
 private class WriteFailure(val code:String,override val message:String):Exception(message)
 private fun replaceNow(treeValue:String,uriValue:String,expectedValue:String,updatedValue:String,fieldsJson:String="{}"):String{
  var journal:File?=null;var backup:File?=null
  try{
   require(fieldsJson.length<=65536);val fields=JSONObject(fieldsJson);fields.keys().forEach{key->require(key!="coverUri"&&fields.get(key) is String)}
   recover(uriValue);val tree=Uri.parse(treeValue);val uri=Uri.parse(uriValue);checkGrant(tree,uri)
   val expected=privateFile(expectedValue);val updated=privateFile(updatedValue);val id=UUID.randomUUID().toString()
   backup=File(directory,"$id.backup");copyFrom(uri,backup!!);require(hash(backup!!)==hash(expected)){"Source changed during metadata preparation"}
   journal=File(directory,"$id.json");val record=JSONObject().put("tree",treeValue).put("uri",uriValue).put("backup",backup!!.name).put("original",hash(backup!!)).put("updated",hash(updated)).put("fields",fields)
   val pendingJournal=File(directory,"$id.pending")
   pendingJournal.outputStream().use{it.write(record.toString().toByteArray());it.fd.sync()}
   require(pendingJournal.renameTo(journal!!)){"Cannot commit recovery journal"}
   copyTo(updated,uri)
   val check=File(directory,"$id.check");var verifiedSize=-1L;var verifiedModified=-1L;try{val beforeSize=sourceSize(uri);val beforeModified=sourceModified(uri);copyFrom(uri,check);require(hash(check)==hash(updated));val afterSize=sourceSize(uri);val afterModified=sourceModified(uri);if(beforeSize==afterSize&&afterSize==check.length()&&beforeModified>0&&beforeModified==afterModified){verifiedSize=check.length();verifiedModified=afterModified}}finally{check.delete()}
   record.put("verifiedSize",verifiedSize).put("verifiedModified",verifiedModified)
   journal!!.outputStream().use{it.write(record.toString().toByteArray());it.fd.sync()}
   retain(journal!!,backup!!);return "written"
  }catch(_:Throwable){
   if(journal?.exists()==true){
    try{recover(uriValue)}catch(_:Throwable){throw WriteFailure("FILE_RECOVERY_REQUIRED","The current file needs recovery review. Its original backup is retained in the app.")}
    if(File(history,journal!!.name).isFile)return "written"
    throw WriteFailure("FILE_WRITE_ROLLED_BACK","Metadata was not written; the original file is intact.")
   }
   // Retaining the receipt may have succeeded immediately before an error.
   if(journal!=null&&File(history,journal!!.name).isFile)return "written"
   backup?.delete();throw WriteFailure("FILE_WRITE_FAILED","Metadata could not be written; the source was not changed.")
  }
 }
 @ReactMethod fun replaceVerified(treeValue:String,uriValue:String,expectedValue:String,updatedValue:String,fieldsJson:String,promise:Promise){executor.execute{
  try{promise.resolve(replaceNow(treeValue,uriValue,expectedValue,updatedValue,fieldsJson))}
  catch(e:WriteFailure){promise.reject(e.code,e.message,e)}
  catch(e:Throwable){promise.reject("FILE_WRITE_FAILED","Metadata could not be written safely.",e)}
 }}
 override fun invalidate(){executor.shutdown();super.invalidate()}
}
class ArchivistFileMetadataPackage:ReactPackage{
 override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(ArchivistFileMetadataModule(context))
 override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
