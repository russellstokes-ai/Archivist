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

class ArchivistArchiveModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ArchivistArchive"

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
