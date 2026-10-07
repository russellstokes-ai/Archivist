package app.archivist.reader

import android.content.Context
import android.net.Uri
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.system.Os
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

// One process-wide reader. A provider which ignores cancellation cannot cause
// replacement reads/threads to accumulate. No archive copies or stream-to-tail.
internal object BoundedAudioReader {
  private val worker = Executors.newSingleThreadExecutor()
  private val timer = Executors.newSingleThreadScheduledExecutor()
  private val busy = AtomicBoolean(false)
  private val tripped = AtomicBoolean(false)
  private val cancelActive = AtomicReference<(() -> Unit)?>(null)

  fun cancel() { cancelActive.get()?.invoke() }

  fun read(context: Context, value: String, extension: String, promise: Promise) {
    if (tripped.get() || !busy.compareAndSet(false, true)) {
      promise.reject("operation-timeout", "Audio property reader is unavailable for this session.")
      return
    }
    val settled = AtomicBoolean(false)
    val signal = CancellationSignal()
    val descriptor = AtomicReference<ParcelFileDescriptor?>(null)
    val deadline = SystemClock.elapsedRealtime() + 1000
    val abort: () -> Unit = {
      if (settled.compareAndSet(false, true)) {
        tripped.set(true)
        promise.reject("operation-timeout", "Audio property read stopped at its deadline.")
        // Reject first. A faulty provider may itself block cancellation/close.
        timer.execute {
          try { signal.cancel() } catch (_: Exception) {}
          try { descriptor.getAndSet(null)?.close() } catch (_: Exception) {}
        }
      }
    }
    cancelActive.set(abort)
    val watchdog = timer.schedule({ abort() }, 1000, TimeUnit.MILLISECONDS)
    worker.execute {
      try {
        val uri = Uri.parse(value)
        val pfd = if (uri.scheme == "content")
          context.contentResolver.openFileDescriptor(uri, "r", signal)
        else ParcelFileDescriptor.open(File(uri.path ?: value), ParcelFileDescriptor.MODE_READ_ONLY)
        requireNotNull(pfd) { "Cannot open audio properties." }
        descriptor.set(pfd)
        pfd.use {
          check(!settled.get()) { "Read cancelled." }
          val size = pfd.statSize
          val limit = if (extension == "mp3") 256 * 1024 else 512 * 1024
          fun window(offset: Long, requested: Int): String {
            val bytes = ByteArray(requested)
            var count = 0
            while (count < requested) {
              check(!settled.get() && SystemClock.elapsedRealtime() < deadline) { "Read deadline exceeded." }
              val read = Os.pread(pfd.fileDescriptor, bytes, count, minOf(32768, requested - count), offset + count)
              if (read <= 0) break
              count += read
            }
            return Base64.encodeToString(bytes, 0, count, Base64.NO_WRAP)
          }
          val headLength = if (size >= 0) minOf(size, limit.toLong()).toInt() else limit
          val result = Arguments.createMap()
          result.putString("head", window(0, headLength))
          val tailLength = if (extension == "mp3") 128 else limit
          if (size > headLength && size >= tailLength)
            result.putString("tail", window(size - tailLength, tailLength))
          if (settled.compareAndSet(false, true)) promise.resolve(result)
        }
      } catch (error: Exception) {
        if (SystemClock.elapsedRealtime() >= deadline) abort()
        else if (settled.compareAndSet(false, true)) promise.reject("AUDIO_PROPERTIES_FAILED", error.message, error)
      } finally {
        try { descriptor.getAndSet(null)?.close() } catch (_: Exception) {}
        watchdog.cancel(false)
        cancelActive.compareAndSet(abort, null)
        busy.set(false)
      }
    }
  }
}
