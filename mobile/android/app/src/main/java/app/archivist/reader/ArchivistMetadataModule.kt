package app.archivist.reader

import android.graphics.BitmapFactory
import android.net.Uri
import android.os.SystemClock
import android.provider.DocumentsContract
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

/** New snapshots in a selected library; never truncate, convert or overwrite media. */
class ArchivistMetadataModule(private val context:ReactApplicationContext):ReactContextBaseJavaModule(context) {
  override fun getName()="ArchivistMetadata"
  private val executor=ThreadPoolExecutor(1,1,0L,TimeUnit.MILLISECONDS,ArrayBlockingQueue<Runnable>(32))
  private val resolver get()=context.contentResolver
  private val directoryName="Archivist Metadata"
  private val recordLimit=8*1024*1024
  private data class Doc(val id:String,val name:String,val mime:String,val bytes:Long,val modified:Long)
  private fun job(promise:Promise,action:()->String?){
    try{executor.execute{try{promise.resolve(action())}catch(_:SecurityException){promise.reject("METADATA_PERMISSION","Reconnect a writable library folder.")}catch(_:Throwable){promise.reject("METADATA_PERSISTENCE","Metadata could not be safely saved or restored. Original media was not modified.")}}}
    catch(_:Throwable){promise.reject("METADATA_BUSY","Metadata persistence queue is full. Retry later.")}
  }
  private fun hash(bytes:ByteArray)=MessageDigest.getInstance("SHA-256").digest(bytes).joinToString(""){"%02x".format(it)}
  private fun children(tree:Uri,parent:String):List<Doc>{
    val result=ArrayList<Doc>();val uri=DocumentsContract.buildChildDocumentsUriUsingTree(tree,parent)
    val columns=arrayOf(DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_MIME_TYPE,DocumentsContract.Document.COLUMN_SIZE,DocumentsContract.Document.COLUMN_LAST_MODIFIED)
    resolver.query(uri,columns,null,null,null)?.use{c->while(c.moveToNext()){
      require(result.size<10000){"Directory budget"}
      result.add(Doc(c.getString(0),c.getString(1)?:"",c.getString(2)?:"",if(c.isNull(3))-1 else c.getLong(3),if(c.isNull(4))0 else c.getLong(4)))
    }}?:throw IllegalStateException("Folder inaccessible")
    return result
  }
  private fun root(value:String,write:Boolean):Uri{
    val uri=Uri.parse(value);require(uri.scheme=="content"&&DocumentsContract.isTreeUri(uri))
    require(resolver.persistedUriPermissions.any{it.uri==uri&&it.isReadPermission&&(!write||it.isWritePermission)}){"No persistent selected-folder grant"}
    return uri
  }
  private fun metadataDirectory(tree:Uri,create:Boolean):String?{
    val root=DocumentsContract.getTreeDocumentId(tree)
    val matches=children(tree,root).filter{it.name==directoryName&&it.mime==DocumentsContract.Document.MIME_TYPE_DIR}
    require(matches.size<=1){"Ambiguous metadata directory"}
    if(matches.isNotEmpty())return matches[0].id
    if(!create)return null
    val made=DocumentsContract.createDocument(resolver,DocumentsContract.buildDocumentUriUsingTree(tree,root),DocumentsContract.Document.MIME_TYPE_DIR,directoryName)?:throw IllegalStateException("Cannot create metadata directory")
    return DocumentsContract.getDocumentId(made)
  }
  private fun relative(value:String):Boolean=value.isNotEmpty()&&value.length<=4096&&!value.startsWith('/')&&!value.contains('\\')&&!value.contains(':')&&!value.contains('\u0000')&&value.split('/').none{it.isEmpty()||it=="."||it==".."}
  private fun readBounded(uri:Uri,max:Int):ByteArray{
    resolver.openInputStream(uri)?.use{input->val out=ByteArrayOutputStream();val buffer=ByteArray(65536)
      while(true){val n=input.read(buffer);if(n<0)break;require(n>0&&out.size()+n<=max);out.write(buffer,0,n)}
      return out.toByteArray()
    }?:throw IllegalStateException("Unavailable document")
  }
  private fun members(tree:Uri,input:JSONArray,deadline:Long):JSONArray{
    require(input.length() in 1..1000);val result=JSONArray();val paths=HashSet<String>()
    for(index in 0 until input.length()){
      require(SystemClock.elapsedRealtime()<deadline){"Metadata deadline"}
      val m=input.getJSONObject(index);val name=m.getString("path");require(relative(name)&&paths.add(name))
      val uri=Uri.parse(m.getString("uri"));require(uri.scheme=="content"&&uri.authority==tree.authority)
      // Resolve each component through the granted tree. Document IDs are opaque;
      // string prefixes cannot prove ancestry, and isChildDocument needs API 29.
      var documentId=DocumentsContract.getTreeDocumentId(tree)
      val components=name.split('/')
      for((partIndex,part) in components.withIndex()){
        require(SystemClock.elapsedRealtime()<deadline){"Metadata deadline"}
        val matches=children(tree,documentId).filter{it.name==part}
        require(matches.size==1){"Missing or ambiguous source document"}
        val child=matches.single()
        if(partIndex<components.lastIndex)require(child.mime==DocumentsContract.Document.MIME_TYPE_DIR){"Source parent is not a folder"}
        documentId=child.id
      }
      require(documentId==DocumentsContract.getDocumentId(uri)){"Document outside selected source"}
      val digest=MessageDigest.getInstance("SHA-256");var count=0L
      resolver.openInputStream(uri)?.use{stream->val b=ByteArray(65536);while(true){
        require(SystemClock.elapsedRealtime()<deadline){"Metadata deadline"}
        val n=stream.read(b);if(n<0)break;require(n>0);count+=n;require(count<=8L*1024*1024*1024);digest.update(b,0,n)
      }}?:throw IllegalStateException("Document unavailable")
      val expected=m.optLong("bytes",-1);require(expected<0||expected==count){"Source changed during metadata save"}
      result.put(JSONObject().put("path",name).put("bytes",count).put("sha256",digest.digest().joinToString(""){"%02x".format(it)}))
    };return result
  }
  private fun membershipKey(input:JSONArray):String{
    val names=(0 until input.length()).map{input.getJSONObject(it).getString("path")}.sorted()
    return hash(JSONArray(names).toString().toByteArray(Charsets.UTF_8)).take(32)
  }
  private fun sameMembers(a:JSONArray,b:JSONArray):Boolean{
    fun keys(items:JSONArray)=(0 until items.length()).map{val m=items.getJSONObject(it);m.getString("path")+"\u0001"+m.getLong("bytes")+"\u0001"+m.getString("sha256")}.sorted()
    return keys(a)==keys(b)
  }
  private fun artwork(value:String):JSONObject?{
    if(value.isBlank())return null
    val uri=Uri.parse(value)
    val bytes=if(uri.scheme=="file"){
      val file=File(uri.path?:"").canonicalFile
      require(listOf(context.filesDir,context.cacheDir).any{file.path.startsWith(it.canonicalPath+File.separator)})
      require(file.length() in 1..4194304);file.readBytes()
    }else if(uri.scheme=="content")readBounded(uri,4194304)else return null
    val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true};BitmapFactory.decodeByteArray(bytes,0,bytes.size,bounds)
    require(bounds.outWidth>=64&&bounds.outHeight>=64&&bounds.outWidth.toLong()*bounds.outHeight<=16777216)
    require(bounds.outMimeType in listOf("image/jpeg","image/png","image/webp"))
    return JSONObject().put("mime",bounds.outMimeType).put("base64",Base64.encodeToString(bytes,Base64.NO_WRAP)).put("sha256",hash(bytes))
  }
  @ReactMethod fun inspectArtwork(uri:String,promise:Promise)=job(promise){if(artwork(uri)!=null)"valid" else null}
  @ReactMethod fun createPortableId(promise:Promise){promise.resolve(UUID.randomUUID().toString())}
  @ReactMethod fun exportRecord(rootUri:String,inputJson:String,promise:Promise)=job(promise){
    require(inputJson.length<=1024*1024);val tree=root(rootUri,true);val input=JSONObject(inputJson)
    val fields=input.getJSONObject("fields");require(fields.optString("title").isNotBlank()&&fields.optString("author").isNotBlank()&&!fields.has("coverUri"))
    val portableId=input.optString("portableId").takeIf{it.matches(Regex("[a-f0-9-]{36}"))}?:UUID.randomUUID().toString()
    val list=members(tree,input.getJSONArray("members"),SystemClock.elapsedRealtime()+60000)
    val record=JSONObject().put("schema",1).put("kind","archivist-work").put("portableId",portableId).put("savedAt",System.currentTimeMillis()).put("revision",input.getLong("revision")).put("fields",fields).put("manual",input.getJSONObject("manual")).put("members",list)
    val cover=try{artwork(input.optString("coverUri"))}catch(_:Exception){null};if(cover!=null)record.put("artwork",cover)
    val payload=record.toString();val envelope=JSONObject().put("sha256",hash(payload.toByteArray(Charsets.UTF_8))).put("payload",payload).toString().toByteArray(Charsets.UTF_8)
    require(envelope.size<=recordLimit)
    val dir=metadataDirectory(tree,true)!!;val name="work-"+membershipKey(list)+"-"+System.currentTimeMillis()+"-"+UUID.randomUUID().toString().take(8)+".json"
    val destination=DocumentsContract.createDocument(resolver,DocumentsContract.buildDocumentUriUsingTree(tree,dir),"application/json",name)?:throw IllegalStateException("Cannot create snapshot")
    resolver.openOutputStream(destination,"w")?.use{it.write(envelope);it.flush()}?:throw IllegalStateException("Cannot write snapshot")
    require(hash(readBounded(destination,recordLimit))==hash(envelope)){"Snapshot verification failed"}
    JSONObject().put("state",if(cover!=null)"saved" else "metadata-saved-cover-missing").put("portableId",portableId).put("revision",input.getLong("revision")).toString()
  }
  @ReactMethod fun restoreRecord(rootUri:String,membersJson:String,promise:Promise)=job(promise){
    require(membersJson.length<=1024*1024);val tree=root(rootUri,false);val dir=metadataDirectory(tree,false)?:return@job null
    val supplied=JSONArray(membersJson);val prefix="work-"+membershipKey(supplied)+"-"
    val snapshots=children(tree,dir).filter{it.name.startsWith(prefix)&&it.name.endsWith(".json")}.sortedByDescending{it.name}.take(64)
    if(snapshots.isEmpty())return@job null
    val actual=members(tree,supplied,SystemClock.elapsedRealtime()+60000)
    var chosen:JSONObject?=null;var chosenAt=-1L;val ids=HashSet<String>()
    for(snapshot in snapshots){
      try{
        if(snapshot.bytes>recordLimit)continue
        val doc=DocumentsContract.buildDocumentUriUsingTree(tree,snapshot.id)
        val envelope=JSONObject(String(readBounded(doc,recordLimit),Charsets.UTF_8));val payload=envelope.getString("payload")
        if(hash(payload.toByteArray(Charsets.UTF_8))!=envelope.getString("sha256"))continue
        val r=JSONObject(payload)
        if(r.optInt("schema")!=1||r.optString("kind")!="archivist-work"||!sameMembers(actual,r.getJSONArray("members")))continue
        ids.add(r.getString("portableId"));val time=r.getLong("savedAt")
        if(time>chosenAt){chosen=r;chosenAt=time}
      }catch(_:Throwable){/* Partial or invalid records never replace a verified snapshot. */}
    }
    require(ids.size<=1){"Conflicting portable identities require review"}
    val record=chosen?:return@job null;val result=JSONObject().put("record",record)
    val art=record.optJSONObject("artwork")
    if(art!=null){
      val data=Base64.decode(art.getString("base64"),Base64.DEFAULT);require(data.size<=4194304&&hash(data)==art.getString("sha256"))
      val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true};BitmapFactory.decodeByteArray(data,0,data.size,bounds)
      require(bounds.outWidth>=64&&bounds.outHeight>=64&&bounds.outWidth.toLong()*bounds.outHeight<=16777216)
      val folder=File(context.filesDir,"archivist-restored-art");require(folder.exists()||folder.mkdirs())
      val destination=File(folder,hash(data)+".image");if(!destination.exists())destination.writeBytes(data)
      require(hash(destination.readBytes())==hash(data));result.put("coverUri",Uri.fromFile(destination).toString())
    }
    result.toString()
  }
  override fun invalidate(){executor.shutdownNow();super.invalidate()}
}
class ArchivistMetadataPackage:ReactPackage{
  override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(ArchivistMetadataModule(context))
  override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
