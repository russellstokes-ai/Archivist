package app.archivist.reader

import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.CancellationSignal
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.github.junrar.Archive
import java.io.ByteArrayOutputStream
import java.io.FileInputStream
import java.io.InputStream
import java.util.zip.ZipInputStream
import java.io.File
import java.security.MessageDigest
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
    val documentId: String,
    val name: String,
    val parentId: String,
    val mime: String,
    val size: Long,
    val modified: Long,
    val role: String,
    val format: String,
    val quickTitle: String = "",
    val quickAlbum: String = "",
    val quickArtist: String = "",
    val quickTrack: String = "",
    val quickYear: String = "",
    val quickDuration: String = ""
  )

  private data class QuickAudioDetails(
    val title: String = "",
    val album: String = "",
    val artist: String = "",
    val track: String = "",
    val year: String = "",
    val duration: String = ""
  )

  private class ScanSession {
    val queue = ArrayBlockingQueue<ScanEntry>(768)
    val cancelled = AtomicBoolean(false)
    val cancellationSignal = CancellationSignal()
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
    if (ext == "opf" || ext == "nfo" || ext == "json" || ext == "xml") return "sidecar" to ""
    if (ext == "jpg" || ext == "jpeg" || ext == "png" || ext == "webp") {
      return "artwork" to ""
    }
    return null
  }

  private fun mediaRelativePath(parentDocumentId: String): String? {
    if (Build.VERSION.SDK_INT < 29) return null
    val colon = parentDocumentId.indexOf(':')
    if (colon < 0) return null
    // The system MediaStore index is directly addressable for primary shared
    // storage. Other document providers simply fall back to filename/folder
    // evidence; the normal scan never opens their large media just for tags.
    if (!parentDocumentId.substring(0, colon).equals("primary", ignoreCase = true)) return null
    val path = parentDocumentId.substring(colon + 1).trim('/')
    return if (path.isBlank()) "" else "$path/"
  }

  private fun quickAudioDetails(parentDocumentId: String, signal: CancellationSignal): Map<String, QuickAudioDetails> {
    val relativePath = mediaRelativePath(parentDocumentId) ?: return emptyMap()
    if (signal.isCanceled) return emptyMap()
    val projection = arrayOf(
      MediaStore.MediaColumns.DISPLAY_NAME,
      MediaStore.MediaColumns.TITLE,
      MediaStore.Audio.AudioColumns.ALBUM,
      MediaStore.Audio.AudioColumns.ARTIST,
      MediaStore.Audio.AudioColumns.TRACK,
      MediaStore.Audio.AudioColumns.YEAR,
      MediaStore.Audio.AudioColumns.DURATION
    )
    val result = HashMap<String, QuickAudioDetails>()
    try {
      context.contentResolver.query(
        MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
        projection,
        MediaStore.MediaColumns.RELATIVE_PATH + " = ?",
        arrayOf(relativePath),
        null,
        signal
      )?.use { cursor ->
        val nameCol = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
        val titleCol = cursor.getColumnIndex(MediaStore.MediaColumns.TITLE)
        val albumCol = cursor.getColumnIndex(MediaStore.Audio.AudioColumns.ALBUM)
        val artistCol = cursor.getColumnIndex(MediaStore.Audio.AudioColumns.ARTIST)
        val trackCol = cursor.getColumnIndex(MediaStore.Audio.AudioColumns.TRACK)
        val yearCol = cursor.getColumnIndex(MediaStore.Audio.AudioColumns.YEAR)
        val durationCol = cursor.getColumnIndex(MediaStore.Audio.AudioColumns.DURATION)
        fun value(column: Int): String = if (column >= 0 && !cursor.isNull(column)) cursor.getString(column)?.trim().orEmpty() else ""
        while (cursor.moveToNext() && !signal.isCanceled) {
          val name = value(nameCol)
          if (name.isBlank()) continue
          result[name.lowercase()] = QuickAudioDetails(
            title = value(titleCol),
            album = value(albumCol),
            artist = value(artistCol),
            track = value(trackCol),
            year = value(yearCol),
            duration = value(durationCol)
          )
        }
      }
    } catch (_: Throwable) {
      // MediaStore is an optimisation only. A provider that cannot be mapped
      // here must never slow or fail the normal library discovery.
    }
    return result
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

      val projection = arrayOf(
        DocumentsContract.Document.COLUMN_DOCUMENT_ID,
        DocumentsContract.Document.COLUMN_DISPLAY_NAME,
        DocumentsContract.Document.COLUMN_MIME_TYPE,
        DocumentsContract.Document.COLUMN_SIZE,
        DocumentsContract.Document.COLUMN_LAST_MODIFIED
      )

      while (pending.isNotEmpty() && !session.cancelled.get()) {
        val parentId = pending.removeFirst()
        if (!seenDirectories.add(parentId)) continue
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentId)
        var contextReady = false
        var directoryMediaCount = 0L
        var directoryAudioOnly = true

        try {
          // Pass one discovers directory structure and lightweight context first.
          // Media is deliberately not queued here so JS never has to retain a
          // complete directory just to wait for cover/sidecar files that may
          // appear at the end of a provider cursor.
          context.contentResolver.query(childrenUri, projection, null, null, null, session.cancellationSignal)?.use { cursor ->
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
              if (role.first == "media") {
                directoryMediaCount += 1
                if (role.second != "Audio") directoryAudioOnly = false
                continue
              }
              val documentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId)
              val size = if (sizeCol >= 0 && !cursor.isNull(sizeCol)) cursor.getLong(sizeCol) else 0L
              val modified = if (modifiedCol >= 0 && !cursor.isNull(modifiedCol)) cursor.getLong(modifiedCol) else 0L
              offer(session, ScanEntry(documentUri.toString(), documentId, name, parentId, mime, size, modified, role.first, role.second))
            }
            contextReady = true
          } ?: run {
            session.errors.incrementAndGet()
            session.lastError = "A folder could not be queried by Android."
          }

          if (contextReady && !session.cancelled.get()) {
            val indexedAudio = if (directoryMediaCount > 0L) quickAudioDetails(parentId, session.cancellationSignal) else emptyMap()
            offer(
              session,
              ScanEntry(
                "",
                "",
                "",
                parentId,
                "",
                directoryMediaCount,
                0L,
                "directory-context",
                if (directoryAudioOnly) "audio-only" else "mixed"
              )
            )
            // Pass two streams media only. Context for this parent is already
            // ahead of it in the bounded queue.
            context.contentResolver.query(childrenUri, projection, null, null, null, session.cancellationSignal)?.use { cursor ->
              val idCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
              val nameCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
              val mimeCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE)
              val sizeCol = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_SIZE)
              val modifiedCol = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED)

              while (cursor.moveToNext() && !session.cancelled.get()) {
                val documentId = cursor.getString(idCol) ?: continue
                val name = cursor.getString(nameCol) ?: ""
                val mime = cursor.getString(mimeCol) ?: ""
                if (mime == DocumentsContract.Document.MIME_TYPE_DIR) continue
                val role = roleFor(name) ?: continue
                if (role.first != "media") continue
                val documentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId)
                val size = if (sizeCol >= 0 && !cursor.isNull(sizeCol)) cursor.getLong(sizeCol) else 0L
                val modified = if (modifiedCol >= 0 && !cursor.isNull(modifiedCol)) cursor.getLong(modifiedCol) else 0L
                session.found.incrementAndGet()
                val quick = if (role.second == "Audio") indexedAudio[name.lowercase()] else null
                offer(session, ScanEntry(
                  documentUri.toString(), documentId, name, parentId, mime, size, modified, role.first, role.second,
                  quickTitle = quick?.title.orEmpty(),
                  quickAlbum = quick?.album.orEmpty(),
                  quickArtist = quick?.artist.orEmpty(),
                  quickTrack = quick?.track.orEmpty(),
                  quickYear = quick?.year.orEmpty(),
                  quickDuration = quick?.duration.orEmpty()
                ))
              }
            } ?: run {
              session.errors.incrementAndGet()
              session.lastError = "A folder's media files could not be queried by Android."
            }
          }
        } catch (error: Throwable) {
          session.errors.incrementAndGet()
          session.lastError = error.message ?: "A folder could not be read."
        } finally {
          if (!session.cancelled.get()) {
            offer(session, ScanEntry("", "", "", parentId, "", 0L, 0L, "directory-end", ""))
          }
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
      map.putString("documentId", entry.documentId)
      map.putString("name", entry.name)
      map.putString("parentId", entry.parentId)
      map.putString("mimeType", entry.mime)
      map.putDouble("size", entry.size.toDouble())
      map.putDouble("modified", entry.modified.toDouble())
      map.putString("role", entry.role)
      map.putString("format", entry.format)
      if (entry.quickTitle.isNotEmpty()) map.putString("quickTitle", entry.quickTitle)
      if (entry.quickAlbum.isNotEmpty()) map.putString("quickAlbum", entry.quickAlbum)
      if (entry.quickArtist.isNotEmpty()) map.putString("quickArtist", entry.quickArtist)
      if (entry.quickTrack.isNotEmpty()) map.putString("quickTrack", entry.quickTrack)
      if (entry.quickYear.isNotEmpty()) map.putString("quickYear", entry.quickYear)
      if (entry.quickDuration.isNotEmpty()) map.putString("quickDuration", entry.quickDuration)
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


  private val metadataTextLimit = 2 * 1024 * 1024
  private val metadataArchiveEntryLimit = 20000

  private fun openInput(uri: String): InputStream {
    val parsed = Uri.parse(uri)
    return when (parsed.scheme) {
      "content" -> context.contentResolver.openInputStream(parsed) ?: throw IllegalArgumentException("Unable to open media")
      "file" -> FileInputStream(File(parsed.path ?: throw IllegalArgumentException("Invalid file URI")))
      else -> FileInputStream(File(uri))
    }
  }

  private fun readBounded(input: InputStream, limit: Int = metadataTextLimit): ByteArray {
    val output = ByteArrayOutputStream()
    val buffer = ByteArray(16 * 1024)
    var total = 0
    while (true) {
      val read = input.read(buffer)
      if (read <= 0) break
      total += read
      if (total > limit) throw IllegalArgumentException("Embedded metadata exceeds the 2 MB safety limit.")
      output.write(buffer, 0, read)
    }
    return output.toByteArray()
  }

  private fun readZipText(uri: String, wanted: (String) -> Boolean): Pair<String, String>? {
    openInput(uri).use { raw ->
      ZipInputStream(raw).use { zip ->
        var seen = 0
        while (true) {
          val entry = zip.nextEntry ?: break
          seen++
          if (seen > metadataArchiveEntryLimit) throw IllegalArgumentException("Archive contains too many entries for metadata inspection.")
          val name = entry.name ?: ""
          if (!entry.isDirectory && wanted(name)) {
            if (entry.size > metadataTextLimit.toLong()) throw IllegalArgumentException("Embedded metadata exceeds the 2 MB safety limit.")
            return name to readBounded(zip).toString(Charsets.UTF_8)
          }
          zip.closeEntry()
        }
      }
    }
    return null
  }

  private fun decodeXml(value: String): String =
    value
      .replace("&amp;", "&", ignoreCase = true)
      .replace("&lt;", "<", ignoreCase = true)
      .replace("&gt;", ">", ignoreCase = true)
      .replace("&quot;", "\"", ignoreCase = true)
      .replace("&apos;", "'", ignoreCase = true)
      .replace("&#39;", "'", ignoreCase = true)

  private fun stripXml(value: String): String =
    decodeXml(value.replace(Regex("<[^>]+>"), " ").replace(Regex("\\s+"), " ").trim())

  private fun xmlValues(xml: String, tags: List<String>): List<String> {
    val values = ArrayList<String>()
    for (tag in tags) {
      val regex = Regex("<${Regex.escape(tag)}\\b[^>]*>([\\s\\S]*?)</${Regex.escape(tag)}>", RegexOption.IGNORE_CASE)
      for (match in regex.findAll(xml)) {
        val value = stripXml(match.groupValues[1])
        if (value.isNotBlank()) values.add(value)
      }
    }
    return values
  }

  private fun xmlValue(xml: String, tags: List<String>): String =
    xmlValues(xml, tags).firstOrNull().orEmpty()

  private fun xmlAttribute(xml: String, element: String, attribute: String): String {
    val direct = Regex(
      "<${Regex.escape(element)}\\b[^>]*${Regex.escape(attribute)}\\s*=\\s*[\"']([^\"']+)[\"'][^>]*>",
      RegexOption.IGNORE_CASE
    ).find(xml)
    return direct?.groupValues?.getOrNull(1)?.let(::decodeXml).orEmpty()
  }

  private fun metaContent(xml: String, key: String): String {
    val first = Regex(
      "<meta\\b[^>]*(?:name|property)\\s*=\\s*[\"']${Regex.escape(key)}[\"'][^>]*content\\s*=\\s*[\"']([^\"']+)[\"'][^>]*>",
      RegexOption.IGNORE_CASE
    ).find(xml)
    if (first != null) return decodeXml(first.groupValues[1]).trim()
    val reversed = Regex(
      "<meta\\b[^>]*content\\s*=\\s*[\"']([^\"']+)[\"'][^>]*(?:name|property)\\s*=\\s*[\"']${Regex.escape(key)}[\"'][^>]*>",
      RegexOption.IGNORE_CASE
    ).find(xml)
    if (reversed != null) return decodeXml(reversed.groupValues[1]).trim()
    val body = Regex(
      "<meta\\b[^>]*property\\s*=\\s*[\"']${Regex.escape(key)}[\"'][^>]*>([\\s\\S]*?)</meta>",
      RegexOption.IGNORE_CASE
    ).find(xml)
    return body?.groupValues?.getOrNull(1)?.let(::stripXml).orEmpty()
  }

  private fun cleanIdentifier(value: String): String =
    value.trim()
      .replace(Regex("^urn:isbn:", RegexOption.IGNORE_CASE), "")
      .replace(Regex("^isbn(?:-1[03])?:?\\s*", RegexOption.IGNORE_CASE), "")
      .trim()

  private fun isbnValue(values: List<String>): String? =
    values.map(::cleanIdentifier).firstOrNull {
      val normalized = it.uppercase().replace(Regex("[^0-9X]"), "")
      normalized.length == 10 || normalized.length == 13
    }

  private fun yearValue(value: String): Int? {
    val match = Regex("(?:^|\\D)(\\d{4})(?:\\D|$)").find(value) ?: return null
    val year = match.groupValues[1].toIntOrNull() ?: return null
    return if (year in 1000..2200) year else null
  }

  private fun numberValue(value: String): Double? =
    Regex("\\d+(?:\\.\\d+)?").find(value)?.value?.toDoubleOrNull()

  private fun metadataMap(uri: String, fields: Map<String, Any?>): com.facebook.react.bridge.WritableMap {
    val map = Arguments.createMap()
    map.putString("uri", uri)
    for ((key, value) in fields) {
      when (value) {
        is String -> if (value.isNotBlank()) map.putString(key, value)
        is Int -> map.putInt(key, value)
        is Double -> map.putDouble(key, value)
        is List<*> -> {
          val array = Arguments.createArray()
          value.filterIsInstance<String>().filter { it.isNotBlank() }.forEach(array::pushString)
          map.putArray(key, array)
        }
      }
    }
    return map
  }

  private fun epubMetadata(uri: String): Map<String, Any?> {
    val container = readZipText(uri) { it.equals("META-INF/container.xml", ignoreCase = true) }?.second.orEmpty()
    val opfPath = if (container.isNotBlank()) xmlAttribute(container, "rootfile", "full-path") else ""
    val opfPair = if (opfPath.isNotBlank()) {
      readZipText(uri) { it.equals(opfPath, ignoreCase = true) }
    } else {
      readZipText(uri) { it.lowercase().endsWith(".opf") }
    } ?: return emptyMap()
    val opf = opfPair.second
    val identifiers = xmlValues(opf, listOf("dc:identifier", "identifier")).map(::cleanIdentifier).distinct()
    val series = metaContent(opf, "calibre:series").ifBlank { metaContent(opf, "belongs-to-collection") }
    val seriesIndex = metaContent(opf, "calibre:series_index").ifBlank { metaContent(opf, "group-position") }
    return mapOf(
      "title" to xmlValue(opf, listOf("dc:title", "title")),
      "author" to xmlValue(opf, listOf("dc:creator", "creator")),
      "series" to series,
      "seriesIndex" to numberValue(seriesIndex),
      "genre" to xmlValue(opf, listOf("dc:subject", "subject")),
      "publisher" to xmlValue(opf, listOf("dc:publisher", "publisher")),
      "year" to yearValue(xmlValue(opf, listOf("dc:date", "date"))),
      "isbn" to isbnValue(identifiers),
      "identifiers" to identifiers
    )
  }

  private fun comicInfoFields(xml: String): Map<String, Any?> {
    val identifiers = xmlValues(xml, listOf("ISBN", "isbn", "Identifier", "identifier")).map(::cleanIdentifier).distinct()
    return mapOf(
      "title" to xmlValue(xml, listOf("Title")),
      "author" to xmlValue(xml, listOf("Writer")),
      "series" to xmlValue(xml, listOf("Series")),
      "seriesIndex" to numberValue(xmlValue(xml, listOf("Number"))),
      "genre" to xmlValue(xml, listOf("Genre")),
      "publisher" to xmlValue(xml, listOf("Publisher")),
      "year" to yearValue(xmlValue(xml, listOf("Year"))),
      "isbn" to isbnValue(identifiers),
      "identifiers" to identifiers
    )
  }

  private fun cbzMetadata(uri: String): Map<String, Any?> =
    readZipText(uri) { it.substringAfterLast('/').equals("ComicInfo.xml", ignoreCase = true) }
      ?.second
      ?.let(::comicInfoFields)
      ?: emptyMap()

  private fun cbrMetadata(uri: String): Map<String, Any?> {
    openInput(uri).use { input ->
      Archive(input).use { archive ->
        var seen = 0
        while (true) {
          val header = archive.nextFileHeader() ?: break
          seen++
          if (seen > metadataArchiveEntryLimit) throw IllegalArgumentException("Archive contains too many entries for metadata inspection.")
          if (header.isDirectory) continue
          val name = (header.fileName ?: continue).replace('\\', '/')
          if (!name.substringAfterLast('/').equals("ComicInfo.xml", ignoreCase = true)) continue
          if (header.fullUnpackSize > metadataTextLimit.toLong()) throw IllegalArgumentException("Embedded metadata exceeds the 2 MB safety limit.")
          val xml = archive.getInputStream(header).use { source -> readBounded(source).toString(Charsets.UTF_8) }
          return comicInfoFields(xml)
        }
      }
    }
    return emptyMap()
  }

  private fun tarName(header: ByteArray): String {
    val zero = header.indexOfFirst { it.toInt() == 0 }
    val end = if (zero < 0) 100 else minOf(zero, 100)
    return String(header, 0, end, Charsets.UTF_8).trim()
  }

  private fun tarSize(header: ByteArray): Long {
    val raw = String(header, 124, 12, Charsets.US_ASCII).trim('\u0000', ' ')
    return raw.toLongOrNull(8) ?: 0L
  }

  private fun skipFully(input: InputStream, bytes: Long) {
    var remaining = bytes
    val buffer = ByteArray(16 * 1024)
    while (remaining > 0) {
      val read = input.read(buffer, 0, minOf(buffer.size.toLong(), remaining).toInt())
      if (read <= 0) break
      remaining -= read
    }
  }

  private fun cbtMetadata(uri: String): Map<String, Any?> {
    openInput(uri).use { input ->
      val header = ByteArray(512)
      var seen = 0
      while (true) {
        var filled = 0
        while (filled < header.size) {
          val read = input.read(header, filled, header.size - filled)
          if (read <= 0) return emptyMap()
          filled += read
        }
        if (header.all { it.toInt() == 0 }) return emptyMap()
        seen++
        if (seen > metadataArchiveEntryLimit) throw IllegalArgumentException("Archive contains too many entries for metadata inspection.")
        val name = tarName(header)
        val size = tarSize(header)
        if (name.substringAfterLast('/').equals("ComicInfo.xml", ignoreCase = true)) {
          if (size > metadataTextLimit) throw IllegalArgumentException("Embedded metadata exceeds the 2 MB safety limit.")
          val data = ByteArray(size.toInt())
          var offset = 0
          while (offset < data.size) {
            val read = input.read(data, offset, data.size - offset)
            if (read <= 0) break
            offset += read
          }
          return comicInfoFields(String(data, 0, offset, Charsets.UTF_8))
        }
        skipFully(input, size)
        val padding = (512 - (size % 512)) % 512
        if (padding > 0) skipFully(input, padding)
      }
    }
  }

  private fun documentMetadata(uri: String, format: String, name: String): Map<String, Any?> {
    val ext = extension(name)
    return when {
      format == "EPUB" || ext == "epub" -> epubMetadata(uri)
      format == "Comic" && (ext == "cbz" || ext == "zip") -> cbzMetadata(uri)
      format == "Comic" && ext == "cbr" -> cbrMetadata(uri)
      format == "Comic" && ext == "cbt" -> cbtMetadata(uri)
      else -> emptyMap()
    }
  }

  @ReactMethod
  fun readDocumentMetadataBatch(items: ReadableArray, promise: Promise) {
    thread(name = "archivist-document-metadata") {
      try {
        val result = Arguments.createArray()
        val limit = items.size().coerceAtMost(32)
        for (index in 0 until limit) {
          val item: ReadableMap = items.getMap(index) ?: continue
          val uri = item.getString("uri") ?: continue
          val format = item.getString("format") ?: ""
          val name = item.getString("name") ?: (Uri.parse(uri).lastPathSegment ?: uri)
          try {
            result.pushMap(metadataMap(uri, documentMetadata(uri, format, name)))
          } catch (error: Throwable) {
            val map = Arguments.createMap()
            map.putString("uri", uri)
            map.putString("error", error.message ?: "Embedded metadata unavailable")
            result.pushMap(map)
          }
        }
        promise.resolve(result)
      } catch (error: Throwable) {
        promise.reject("DOCUMENT_METADATA_FAILED", error.message ?: "Unable to inspect embedded book metadata", error)
      }
    }
  }

  private fun putMetadata(map: com.facebook.react.bridge.WritableMap, key: String, retriever: MediaMetadataRetriever, metadataKey: Int) {
    val value = retriever.extractMetadata(metadataKey)?.trim()
    if (!value.isNullOrEmpty()) map.putString(key, value)
  }

  @ReactMethod
  fun readAudioMetadataBatch(uris: ReadableArray, promise: Promise) {
    thread(name = "archivist-audio-metadata") {
      try {
        val result = Arguments.createArray()
        val limit = uris.size().coerceAtMost(64)
        for (index in 0 until limit) {
          val uri = uris.getString(index) ?: continue
          val map = Arguments.createMap()
          map.putString("uri", uri)
          val retriever = MediaMetadataRetriever()
          try {
            retriever.setDataSource(context, Uri.parse(uri))
            putMetadata(map, "title", retriever, MediaMetadataRetriever.METADATA_KEY_TITLE)
            putMetadata(map, "album", retriever, MediaMetadataRetriever.METADATA_KEY_ALBUM)
            putMetadata(map, "artist", retriever, MediaMetadataRetriever.METADATA_KEY_ARTIST)
            putMetadata(map, "albumArtist", retriever, MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST)
            putMetadata(map, "author", retriever, MediaMetadataRetriever.METADATA_KEY_AUTHOR)
            putMetadata(map, "genre", retriever, MediaMetadataRetriever.METADATA_KEY_GENRE)
            putMetadata(map, "track", retriever, MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER)
            putMetadata(map, "disc", retriever, MediaMetadataRetriever.METADATA_KEY_DISC_NUMBER)
            putMetadata(map, "year", retriever, MediaMetadataRetriever.METADATA_KEY_YEAR)
            putMetadata(map, "duration", retriever, MediaMetadataRetriever.METADATA_KEY_DURATION)
          } catch (error: Throwable) {
            map.putString("error", error.message ?: "Metadata unavailable")
          } finally {
            try { retriever.release() } catch (_: Throwable) {}
          }
          result.pushMap(map)
        }
        promise.resolve(result)
      } catch (error: Throwable) {
        promise.reject("AUDIO_METADATA_FAILED", error.message ?: "Unable to inspect audiobook metadata", error)
      }
    }
  }
  private fun bytesHex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }

  private fun artworkType(data: ByteArray): Pair<String, String>? {
    if (data.size >= 3 && data[0] == 0xff.toByte() && data[1] == 0xd8.toByte() && data[2] == 0xff.toByte()) return "jpg" to "image/jpeg"
    if (data.size >= 8 && data[0] == 0x89.toByte() && data[1] == 0x50.toByte() && data[2] == 0x4e.toByte() && data[3] == 0x47.toByte()) return "png" to "image/png"
    if (data.size >= 12 && String(data, 0, 4, Charsets.US_ASCII) == "RIFF" && String(data, 8, 4, Charsets.US_ASCII) == "WEBP") return "webp" to "image/webp"
    return null
  }

  @ReactMethod
  fun extractAudioArtwork(uri: String, promise: Promise) {
    thread(name = "archivist-audio-artwork") {
      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(context, Uri.parse(uri))
        val data = retriever.embeddedPicture
        if (data == null || data.isEmpty() || data.size > 24 * 1024 * 1024) {
          promise.resolve(null)
          return@thread
        }
        val type = artworkType(data)
        if (type == null) {
          promise.resolve(null)
          return@thread
        }
        val digest = bytesHex(MessageDigest.getInstance("SHA-256").digest(data)).take(32)
        val dir = File(context.filesDir, "archivist-covers")
        if (!dir.exists() && !dir.mkdirs()) throw IllegalStateException("Unable to create cover cache")
        val target = File(dir, "audio-$digest.${type.first}")
        if (!target.exists()) {
          val temp = File(dir, ".audio-$digest.tmp")
          temp.writeBytes(data)
          if (!temp.renameTo(target)) {
            target.writeBytes(data)
            temp.delete()
          }
        }
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(data, 0, data.size, options)
        val result = Arguments.createMap()
        result.putString("uri", Uri.fromFile(target).toString())
        result.putString("mimeType", type.second)
        result.putInt("width", options.outWidth.coerceAtLeast(0))
        result.putInt("height", options.outHeight.coerceAtLeast(0))
        promise.resolve(result)
      } catch (error: Throwable) {
        promise.reject("AUDIO_ARTWORK_FAILED", error.message ?: "Unable to extract audiobook artwork", error)
      } finally {
        try { retriever.release() } catch (_: Throwable) {}
      }
    }
  }
  @ReactMethod
  fun cancelTreeScan(scanId: String, promise: Promise) {
    val session = sessions.remove(scanId)
    session?.cancelled?.set(true)
    try { session?.cancellationSignal?.cancel() } catch (_: Throwable) {}
    promise.resolve(session != null)
  }
}
