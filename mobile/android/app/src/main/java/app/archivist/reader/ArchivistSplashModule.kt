package app.archivist.reader

import android.graphics.Color
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

/** Sample only the bundled splash surface, never the screen or library artwork. */
class ArchivistSplashModule(private val context: ReactApplicationContext): ReactContextBaseJavaModule(context) {
  override fun getName() = "ArchivistSplash"
  private fun find(view: View, predicate: (View) -> Boolean): View? {
    if (predicate(view)) return view
    if (view is ViewGroup) for (i in 0 until view.childCount) {
      find(view.getChildAt(i), predicate)?.let { return it }
    }
    return null
  }
  @ReactMethod
  fun sampleMatte(promise: Promise) {
    context.runOnUiQueueThread {
      try {
        val root = context.currentActivity?.window?.decorView
        val splash = root?.let { find(it) { v -> v.getTag(com.facebook.react.R.id.react_test_id) == "archivist-premium-video" } }
        val texture = splash?.let { find(it) { v -> v is TextureView && v.isAvailable } } as? TextureView
        // Tiny readback of the actual displayed surface includes device decoder colour conversion.
        val bitmap = texture?.getBitmap(16, 16)
        if (bitmap == null) { promise.resolve(null); return@runOnUiQueueThread }
        val pixels = try { intArrayOf(bitmap.getPixel(1,1), bitmap.getPixel(14,1), bitmap.getPixel(1,14), bitmap.getPixel(14,14)) }
          finally { bitmap.recycle() }
        val reds = pixels.map { Color.red(it) }; val greens = pixels.map { Color.green(it) }; val blues = pixels.map { Color.blue(it) }
        // Reject an unrendered black frame or any corner containing artwork.
        val flat = listOf(reds, greens, blues).all { it.maxOrNull()!! - it.minOrNull()!! <= 8 }
        val r=reds.sorted()[1]; val g=greens.sorted()[1]; val b=blues.sorted()[1]
        if (!flat || pixels.any { Color.alpha(it) < 250 } || g < 70 || b < 70 || g-r < 25 || b-r < 25) {
          promise.resolve(null); return@runOnUiQueueThread
        }
        promise.resolve(String.format(java.util.Locale.ROOT, "#%02X%02X%02X", r,g,b))
      } catch (_: Exception) { promise.resolve(null) }
    }
  }
}
class ArchivistSplashPackage: ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ArchivistSplashModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
