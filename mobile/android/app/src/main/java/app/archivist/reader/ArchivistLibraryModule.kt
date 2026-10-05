package app.archivist.reader

import android.net.Uri
import android.provider.DocumentsContract
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.UUID
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import kotlin.concurrent.thread

class ArchivistLibraryModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ArchivistLibrary"

  private data class ScanEntry(
    val uri: String,
    val name: String,
    val parentId: String,
    val mime: String,
    val size: Long,
    val modified: Long,
    val role: String,
    val format: String
  )

  private class ScanSession {
    val queue = ArrayBlockingQueue<ScanEntry>(768)
    val cancelled = AtomicBoolean(false)
    val done = AtomicBoolean(false)
    val visited = AtomicInteger(0)
    val found = AtomicInteger(0)
    val errors = AtomicInteger(0)
    @Volatile var lastError: String? = null
  }

  private val sessions = ConcurrentHashMap<String, ScanSession>()

  private fun extension(name: String): String {
    val dot = name.lastIndexOf('.')
    if (dot <= 0 || dot == name.length - 1) return ""
    return name.substring(dot + 1).lowercase()
  }

  private fun mediaFormat(ext: String): String = when (ext) {
    "epub" -> "EPUB"
    "pdf" -> "PDF"
    "cbz", "zip", "cbr", "cbt" -> "Comic"
    "mp3", "m4a", "m4b", "aac", "ogg", "opus", "flac", "wav" -> "Audio"
    else -> ""
  }

  private fun roleFor(name: String): Pair<String, String>? {
    val ext = extension(name)
    val format = mediaFormat(ext)
    if (format.isNotEmpty()) return "media" to format
    if (ext == "opf" || ext == "nfo") return "sidecar" to ""
    if (ext == "jpg" || ext == "jpeg" || ext == "png" || ext == "webp") {
      val stem = name.substringBeforeLast('.').lowercase()
      if (stem == "cover" || stem == "folder") return "artwork" to ""
    }
    return null
  }

  private fun offer(session: ScanSession, entry: ScanEntry) {
    while (!session.cancelled.get()) {
      if (session.queue.offer(entry, 250, TimeUnit.MILLISECONDS)) return
    }
  }

  private fun scanTree(treeUri: Uri, session: ScanSession) {
    try {
      val rootId = DocumentsContract.getTreeDocumentId(treeUri)
      val pending = ArrayDeque<String>()
      val seenDirectories = HashSet<String>()
      pending.add(rootId)
      while (pending.isNotEmpty() && !session.cancelled.get()) {
        val parentId = pending.removeFirst()
        if (!seenDirectories.add(parentId)) continue
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentId)
        val projection = arrayOf(
          DocumentsContract.Document.COLUMN_DOCUMENT_ID,
          DocumentsContract.Document.COLUMN_DISPLAY_NAME,
          DocumentsContract.Document.COLUMN_MIME_TYPE,
          DocumentsContract.Document.COLUMN_SIZE,
          DocumentsContract.Document.COLUMN_LAST_MODIFIED
        )
        try {
          context.contentResolver.query(childrenUri, projection, null, null, null)?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
            val nameCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
            val mimeCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE)
            val sizeCol = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_SIZE)
            val modifiedCol = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED)
            while (cursor.moveToNext() && !session.cancelled.get()) {
              session.visited.incrementAndGet()
              val documentId = cursor.getString(idCol) ?: continue
              val name = cursor.getString(nameCol) ?: ""
              val mime = cursor.getString(mimeCol) ?: ""
              if (mime == DocumentsContract.Document.MIME_TYPE_DIR) {
                pending.add(documentId)
                continue
              }
              val role = roleFor(name) ?: continue
              val documentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId)
              val size = if (sizeCol >= 0 && !cursor.isNull(sizeCol)) cursor.getLong(sizeCol) else 0L
              val modified = if (modifiedCol >= 0 && !cursor.isNull(modifiedCol)) cursor.getLong(modifiedCol) else 0L
              if (role.first == "media") session.found.incrementAndGet()
              offer(session, ScanEntry(documentUri.toString(), name, parentId, mime, size, modified, role.first, role.second))
            }
          } ?: run {
            session.errors.incrementAndGet()
            session.lastError = "A folder could not be queried by Android."
          }
        } catch (error: Throwable) {
          session.errors.incrementAndGet()
          session.lastError = error.message ?: "A folder could not be read."
        }
      }
    } catch (error: Throwable) {
      session.errors.incrementAndGet()
      session.lastError = error.message ?: "Unable to scan this folder."
    } finally {
      session.done.set(true)
    }
  }

  @ReactMethod
  fun startTreeScan(uri: String, promise: Promise) {
    try {
      val treeUri = Uri.parse(uri)
      DocumentsContract.getTreeDocumentId(treeUri)
      val id = UUID.randomUUID().toString()
      val session = ScanSession()
      sessions[id] = session
      thread(name = "archivist-library-scan") { scanTree(treeUri, session) }
      promise.resolve(id)
    } catch (error: Throwable) {
      promise.reject("LIBRARY_SCAN_START_FAILED", error.message ?: "Unable to start library scan", error)
    }
  }

  @ReactMethod
  fun readTreeScanBatch(scanId: String, requestedLimit: Int, promise: Promise) {
    val session = sessions[scanId]
    if (session == null) {
      promise.reject("LIBRARY_SCAN_NOT_FOUND", "Library scan session is no longer available")
      return
    }
    val limit = requestedLimit.coerceIn(1, 500)
    val items = Arguments.createArray()
    repeat(limit) {
      val entry = session.queue.poll() ?: return@repeat
      val map = Arguments.createMap()
      map.putString("uri", entry.uri)
      map.putString("name", entry.name)
      map.putString("parentId", entry.parentId)
      map.putString("mimeType", entry.mime)
      map.putDouble("size", entry.size.toDouble())
      map.putDouble("modified", entry.modified.toDouble())
      map.putString("role", entry.role)
      map.putString("format", entry.format)
      items.pushMap(map)
    }
    val finished = session.done.get() && session.queue.isEmpty()
    val result = Arguments.createMap()
    result.putArray("items", items)
    result.putBoolean("done", finished)
    result.putInt("visited", session.visited.get())
    result.putInt("found", session.found.get())
    result.putInt("errors", session.errors.get())
    session.lastError?.let { result.putString("lastError", it) }
    promise.resolve(result)
    if (finished) sessions.remove(scanId)
  }

  @ReactMethod
  fun cancelTreeScan(scanId: String, promise: Promise) {
    val session = sessions.remove(scanId)
    session?.cancelled?.set(true)
    promise.resolve(session != null)
  }
}
