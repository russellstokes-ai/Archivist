package app.archivist.reader

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.github.junrar.Archive
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import kotlin.concurrent.thread
import kotlin.math.max
import kotlin.math.min
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.zip.ZipFile
import com.facebook.react.bridge.UiThreadUtil
import android.os.Build
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.View

class ArchivistArchiveModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ArchivistArchive"
  private val zipFiles = ConcurrentHashMap<String, File>()

  @ReactMethod
  fun readAudioMetadataWindows(uri: String, extension: String, promise: Promise) {
    BoundedAudioReader.read(context, uri, extension, promise)
  }

  @ReactMethod
  fun cancelAudioMetadataRead() { BoundedAudioReader.cancel() }

  @ReactMethod
  fun readBoundedArchiveEvidence(uri: String, extension: String, promise: Promise) {
    BoundedArchiveReader.read(context, uri, extension, promise)
  }

  @ReactMethod
  fun cancelBoundedArchiveEvidence() { BoundedArchiveReader.cancel() }


  @ReactMethod
  fun setReaderFullscreen(enabled: Boolean) {
    UiThreadUtil.runOnUiThread {
      val window = context.currentActivity?.window ?: return@runOnUiThread
      if (Build.VERSION.SDK_INT >= 30) {
        window.insetsController?.let { controller ->
          if (enabled) {
            controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(WindowInsets.Type.systemBars())
          } else controller.show(WindowInsets.Type.systemBars())
        }
      } else {
        @Suppress("DEPRECATION")
        val flags = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = if (enabled) window.decorView.systemUiVisibility or flags else window.decorView.systemUiVisibility and flags.inv()
      }
    }
  }

  // SAF-to-SAF copies must stream through ContentResolver; Expo's file copy path
  // cannot reliably write document-provider destinations. Keep all I/O off UI/JS.
  @ReactMethod
  fun copyDocument(from: String, to: String, promise: Promise) {
    thread(name = "archivist-organise-copy") {
      try {
        val target = Uri.parse(to)
        var written = 0L
        openInput(from).use { input ->
          val output = if (target.scheme == "content") context.contentResolver.openOutputStream(target, "wt")
            else File(target.path ?: to).outputStream()
          requireNotNull(output) { "Destination cannot be opened for writing." }.use { sink ->
            val buffer = ByteArray(65536)
            while (true) {
              val count = input.read(buffer)
              if (count < 0) break
              sink.write(buffer, 0, count)
              written += count
            }
            sink.flush()
          }
        }
        var verified = 0L
        openInput(to).use { input ->
          val buffer = ByteArray(65536)
          while (true) { val count = input.read(buffer); if (count < 0) break; verified += count }
        }
        check(verified == written) { "Destination verification failed. Original retained." }
        promise.resolve(written.toDouble())
      } catch (error: Throwable) { promise.reject("COPY_FAILED", error.message, error) }
    }
  }

  @ReactMethod
  fun openZip(uri: String, promise: Promise) {
    thread(name = "archivist-zip-index") {
      val token = UUID.randomUUID().toString()
      val file = File(context.cacheDir, "archivist-zip-$token.zip")
      try {
        if (zipFiles.size >= 8) throw IllegalArgumentException("Too many archives are open. Please retry shortly.")
        openInput(uri).use { input -> file.outputStream().use { output ->
          val buffer = ByteArray(65536)
          var total = 0L
          while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            total += count
            if (total > 2L * 1024 * 1024 * 1024) throw IllegalArgumentException("Archive exceeds the 2 GB limit.")
            output.write(buffer, 0, count)
          }
        } }
        val entries = Arguments.createArray()
        ZipFile(file).use { zip ->
          val iterator = zip.entries()
          var count = 0
          while (iterator.hasMoreElements()) {
            val entry = iterator.nextElement()
            if (entry.isDirectory) continue
            if (++count > 20000) throw IllegalArgumentException("Archive contains too many entries.")
            val item = Arguments.createMap()
            item.putString("name", entry.name)
            item.putDouble("size", entry.size.toDouble())
            entries.pushMap(item)
          }
        }
        zipFiles[token] = file
        val result = Arguments.createMap()
        result.putString("token", token)
        result.putArray("entries", entries)
        promise.resolve(result)
      } catch (error: Throwable) { file.delete(); promise.reject("ZIP_INDEX_FAILED", error.message, error) }
    }
  }

  @ReactMethod
  fun readZipEntry(token: String, name: String, text: Boolean, promise: Promise) {
    thread(name = "archivist-zip-entry") {
      try {
        val file = zipFiles[token] ?: throw IllegalArgumentException("Archive is closed.")
        val limit = if (text) 2 * 1024 * 1024 else 16 * 1024 * 1024
        ZipFile(file).use { zip ->
          val entry = zip.getEntry(name) ?: throw IllegalArgumentException("Archive entry is missing.")
          if (entry.size > limit) throw IllegalArgumentException("Archive entry is too large to load safely.")
          val output = ByteArrayOutputStream()
          zip.getInputStream(entry).use { input ->
            val buffer = ByteArray(32768)
            while (true) {
              val count = input.read(buffer)
              if (count < 0) break
              if (output.size().toLong() + count > limit) throw IllegalArgumentException("Archive entry is too large to load safely.")
              output.write(buffer, 0, count)
            }
          }
          promise.resolve(if (text) output.toString("UTF-8") else Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP))
        }
      } catch (error: Throwable) { promise.reject("ZIP_ENTRY_FAILED", error.message, error) }
    }
  }

  @ReactMethod
  fun closeZip(token: String, promise: Promise) {
    zipFiles.remove(token)?.delete()
    promise.resolve(null)
  }

  override fun invalidate() {
    zipFiles.values.forEach { it.delete() }
    zipFiles.clear()
    super.invalidate()
  }

  private fun openInput(uri: String): InputStream {
    val parsed = Uri.parse(uri)
    return when (parsed.scheme) {
      "content" -> context.contentResolver.openInputStream(parsed) ?: throw IllegalArgumentException("Unable to open archive")
      "file" -> FileInputStream(File(parsed.path ?: throw IllegalArgumentException("Invalid file URI")))
      else -> FileInputStream(File(uri))
    }
  }

  private fun openPfd(uri: String): ParcelFileDescriptor {
    val parsed = Uri.parse(uri)
    return when (parsed.scheme) {
      "content" -> context.contentResolver.openFileDescriptor(parsed, "r") ?: throw IllegalArgumentException("Unable to open PDF")
      "file" -> ParcelFileDescriptor.open(File(parsed.path ?: throw IllegalArgumentException("Invalid file URI")), ParcelFileDescriptor.MODE_READ_ONLY)
      else -> ParcelFileDescriptor.open(File(uri), ParcelFileDescriptor.MODE_READ_ONLY)
    }
  }

  private fun imageMime(name: String): String {
    val lower = name.lowercase()
    return when {
      lower.endsWith(".png") -> "image/png"
      lower.endsWith(".webp") -> "image/webp"
      lower.endsWith(".gif") -> "image/gif"
      else -> "image/jpeg"
    }
  }

  private fun imageName(name: String) = Regex("(?i).+\\.(jpe?g|png|gif|webp)$").matches(name)

  @ReactMethod
  fun listRarEntries(uri: String, promise: Promise) {
    thread(name = "archivist-rar-index") {
      try {
        val pages = Arguments.createArray()
        openInput(uri).use { input -> Archive(input).use { archive ->
          var count = 0
          while (true) {
            val header = archive.nextFileHeader() ?: break
            if (header.isDirectory) continue
            val name = header.fileName ?: continue
            if (!imageName(name) && !name.replace('\\', '/').endsWith("ComicInfo.xml", ignoreCase = true)) continue
            if (++count > 5000) throw IllegalArgumentException("Comic exceeds the 5000 page limit.")
            pages.pushString(name)
          }
        } }
        promise.resolve(pages)
      } catch (error: Throwable) { promise.reject("RAR_INDEX_FAILED", error.message, error) }
    }
  }

  // Extract one selected entry on a worker. Never send an entire comic over the bridge.
  @ReactMethod
  fun readRarEntry(uri: String, name: String, text: Boolean, promise: Promise) {
    thread(name = "archivist-rar-page") {
      try {
        val limit = if (text) 2 * 1024 * 1024 else 16 * 1024 * 1024
        var result: String? = null
        openInput(uri).use { input -> Archive(input).use { archive ->
          while (true) {
            val header = archive.nextFileHeader() ?: break
            if (header.isDirectory || header.fileName != name) continue
            if (header.fullUnpackSize < 0 || header.fullUnpackSize > limit) throw IllegalArgumentException("Comic entry is too large to load safely.")
            val output = ByteArrayOutputStream()
            archive.getInputStream(header).use { source ->
              val buffer = ByteArray(32768)
              while (true) {
                val count = source.read(buffer)
                if (count < 0) break
                if (output.size().toLong() + count > limit) throw IllegalArgumentException("Comic entry is too large to load safely.")
                output.write(buffer, 0, count)
              }
            }
            result = if (text) output.toString("UTF-8") else Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
            break
          }
        } }
        if (result == null) throw IllegalArgumentException("Comic entry was not found.")
        promise.resolve(result)
      } catch (error: Throwable) { promise.reject("RAR_PAGE_FAILED", error.message, error) }
    }
  }

  @ReactMethod
  fun readRarImages(uri: String, maxPages: Int, maxEntryBytes: Double, maxTotalBytes: Double, promise: Promise) {
    thread(name = "archivist-rar-reader") {
      try {
        val pages = Arguments.createArray()
        var count = 0
        var total = 0L
        openInput(uri).use { input ->
          Archive(input).use { archive ->
            while (count < maxPages) {
              val header = archive.nextFileHeader() ?: break
              if (header.isDirectory) continue
              val name = header.fileName ?: continue
              if (!imageName(name)) continue
              val size = header.fullUnpackSize
              if (size < 0 || size > maxEntryBytes.toLong()) throw IllegalArgumentException("Comic archive entry exceeds the 64 MB safety limit.")
              total += size
              if (total > maxTotalBytes.toLong()) throw IllegalArgumentException("Comic archive expands beyond the 256 MB reader safety limit.")
              val output = ByteArrayOutputStream(min(size, Int.MAX_VALUE.toLong()).toInt())
              archive.getInputStream(header).use { source ->
                val buffer = ByteArray(32 * 1024)
                var written = 0L
                while (true) {
                  val read = source.read(buffer)
                  if (read <= 0) break
                  written += read
                  if (written > maxEntryBytes.toLong()) throw IllegalArgumentException("Comic archive entry exceeds the 64 MB safety limit.")
                  output.write(buffer, 0, read)
                }
              }
              val map = Arguments.createMap()
              map.putString("name", name)
              map.putString("mime", imageMime(name))
              map.putString("base64", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP))
              pages.pushMap(map)
              count++
            }
          }
        }
        promise.resolve(pages)
      } catch (error: Throwable) {
        promise.reject("ARCHIVE_READ_FAILED", error.message ?: "Unable to read CBR archive", error)
      }
    }
  }

  @ReactMethod
  fun pdfPageCount(uri: String, promise: Promise) {
    thread(name = "archivist-pdf-count") {
      try {
        openPfd(uri).use { descriptor -> PdfRenderer(descriptor).use { renderer -> promise.resolve(renderer.pageCount) } }
      } catch (error: Throwable) {
        promise.reject("PDF_READ_FAILED", error.message ?: "Unable to open PDF", error)
      }
    }
  }

  @ReactMethod
  fun renderPdfPage(uri: String, pageIndex: Int, requestedWidth: Int, promise: Promise) {
    thread(name = "archivist-pdf-render") {
      try {
        openPfd(uri).use { descriptor ->
          PdfRenderer(descriptor).use { renderer ->
            if (pageIndex < 0 || pageIndex >= renderer.pageCount) throw IllegalArgumentException("PDF page is out of range")
            renderer.openPage(pageIndex).use { page ->
              val width = min(1800, max(480, requestedWidth))
              val height = min(4096, max(1, (page.height.toDouble() / max(1, page.width) * width).toInt()))
              val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
              bitmap.eraseColor(Color.WHITE)
              page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
              val output = ByteArrayOutputStream()
              bitmap.compress(Bitmap.CompressFormat.PNG, 92, output)
              bitmap.recycle()
              val result = Arguments.createMap()
              result.putString("base64", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP))
              result.putInt("width", width)
              result.putInt("height", height)
              result.putInt("page", pageIndex)
              result.putInt("count", renderer.pageCount)
              promise.resolve(result)
            }
          }
        }
      } catch (error: Throwable) {
        promise.reject("PDF_RENDER_FAILED", error.message ?: "Unable to render PDF page", error)
      }
    }
  }
}
