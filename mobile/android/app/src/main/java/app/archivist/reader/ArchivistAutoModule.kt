package app.archivist.reader

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONArray

class ArchivistAutoModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ArchivistAuto"

  @ReactMethod
  fun syncCatalogue(catalogueJson: String, promise: Promise) {
    try {
      // Validate before persisting so the car service never has to recover from malformed app data.
      JSONArray(catalogueJson)
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(KEY_CATALOGUE, catalogueJson)
        .apply()
      promise.resolve(true)
    } catch (error: Throwable) {
      promise.reject("AUTO_CATALOGUE_INVALID", error.message ?: "Invalid Android Auto catalogue", error)
    }
  }

  @ReactMethod
  fun clearCatalogue(promise: Promise) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_CATALOGUE)
      .apply()
    promise.resolve(true)
  }

  companion object {
    const val PREFS = "archivist_android_auto"
    const val KEY_CATALOGUE = "catalogue"
  }
}
