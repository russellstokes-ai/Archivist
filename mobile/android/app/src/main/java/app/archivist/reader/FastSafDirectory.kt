package app.archivist.reader

import android.content.Context
import android.net.Uri
import android.os.CancellationSignal
import android.os.SystemClock
import android.provider.DocumentsContract
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/** One bounded DocumentsProvider query per folder, returning only lightweight attributes.
 * Never read media bytes, decode covers or query every file individually here.
 * Providers that block/cannot be accessed fall back to the existing Expo SAF path.
 */
internal object FastSafDirectory {
  private val worker = Executors.newSingleThreadExecutor()
  private val timer = Executors.newSingleThreadScheduledExecutor()
  private val busy = AtomicBoolean(false)
  private val unavailable = AtomicBoolean(false)
  private val activeSignal = AtomicReference<CancellationSignal?>(null)
  private val maxEntries = 10000
  private val deadlineMs = 4000L

  fun cancel() { activeSignal.get()?.cancel() }

  fun list(context: Context, root: String, parent: String, promise: Promise) {
    if (unavailable.get() || !busy.compareAndSet(false,true)) {
      promise.reject("DIRECTORY_READER_BUSY", "Fast directory reader unavailable; use normal SAF.")
      return
    }
    val done=AtomicBoolean(false)
    val signal=CancellationSignal()
    activeSignal.set(signal)
    val start=SystemClock.elapsedRealtime()
    val watchdog=timer.schedule({
      if(done.compareAndSet(false,true)){
        unavailable.set(true) // never accumulate blocked provider workers
        promise.reject("DIRECTORY_READ_TIMEOUT", "Directory query exceeded four seconds.")
        // Cancellation itself can block for a faulty DocumentsProvider.
        worker.execute { try { signal.cancel() } catch (_:Throwable) {} }
      }
    },deadlineMs,TimeUnit.MILLISECONDS)
    worker.execute {
      try {
        val rootUri=Uri.parse(root)
        val parentUri=Uri.parse(parent)
        val parentId=if (DocumentsContract.isDocumentUri(context,parentUri))
          DocumentsContract.getDocumentId(parentUri)
          else DocumentsContract.getTreeDocumentId(rootUri)
        val childrenUri=DocumentsContract.buildChildDocumentsUriUsingTree(rootUri,parentId)
        val projection=arrayOf(
          DocumentsContract.Document.COLUMN_DOCUMENT_ID,
          DocumentsContract.Document.COLUMN_DISPLAY_NAME,
          DocumentsContract.Document.COLUMN_MIME_TYPE,
          DocumentsContract.Document.COLUMN_SIZE,
          DocumentsContract.Document.COLUMN_LAST_MODIFIED,
        )
        val entries=Arguments.createArray()
        context.contentResolver.query(childrenUri,projection,null,null,null,signal)?.use { cursor ->
          val idIndex=cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
          val mimeIndex=cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE)
          val nameIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
          val sizeIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_SIZE)
          val modifiedIndex=cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED)
          var visited=0
          while(cursor.moveToNext()){
            if(signal.isCanceled||SystemClock.elapsedRealtime()-start>deadlineMs)throw IllegalStateException("Directory read cancelled or timed out.")
            if(++visited>maxEntries)throw IllegalStateException("Directory exceeds safe per-folder listing limit.")
            val id=cursor.getString(idIndex)?:continue
            val mime=cursor.getString(mimeIndex)?:""
            val entry=Arguments.createMap()
            entry.putString("uri",DocumentsContract.buildDocumentUriUsingTree(rootUri,id).toString())
            entry.putString("name",if(nameIndex>=0)cursor.getString(nameIndex)?:"" else "")
            entry.putString("mimeType",mime)
            entry.putBoolean("isDirectory",mime==DocumentsContract.Document.MIME_TYPE_DIR)
            if(sizeIndex>=0&&!cursor.isNull(sizeIndex))entry.putDouble("size",cursor.getLong(sizeIndex).toDouble())
            if(modifiedIndex>=0&&!cursor.isNull(modifiedIndex))entry.putDouble("modified",cursor.getLong(modifiedIndex).toDouble()/1000.0)
            entries.pushMap(entry)
          }
        }?:throw IllegalStateException("The provider did not return a directory cursor.")
        if(done.compareAndSet(false,true))promise.resolve(entries)
      }catch(error:Throwable){
        if(done.compareAndSet(false,true))promise.reject("DIRECTORY_LIST_FAILED",error.message,error)
      }finally{
        activeSignal.compareAndSet(signal,null)
        watchdog.cancel(false)
        busy.set(false)
      }
    }
  }
}
