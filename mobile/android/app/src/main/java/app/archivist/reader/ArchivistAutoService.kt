package app.archivist.reader

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaController
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaLibraryService.LibraryParams
import androidx.media3.session.MediaLibraryService.MediaLibrarySession
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionError
import androidx.media3.session.SessionToken
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import expo.modules.audio.service.AudioControlsService
import org.json.JSONArray

/**
 * Driver-safe Android Auto browse surface.
 *
 * The library catalogue is metadata-only: playback continues to be owned by expo-audio.
 * When expo-audio has an active lock-screen session we proxy its MediaController into this
 * MediaLibrarySession, which gives Android Auto the same play/pause/seek state as the phone.
 * Selecting a different audiobook from a cold car session is deliberately not advertised as
 * playable until a native cold-start playback bridge is implemented.
 */
class ArchivistAutoService : MediaLibraryService() {
  private lateinit var idlePlayer: ExoPlayer
  private var librarySession: MediaLibrarySession? = null
  private var playbackController: MediaController? = null
  private var controllerFuture: ListenableFuture<MediaController>? = null
  private val mainExecutor = java.util.concurrent.Executor { command ->
    Handler(Looper.getMainLooper()).post(command)
  }

  private data class CatalogueItem(
    val id: String,
    val title: String,
    val author: String,
    val series: String,
    val genre: String,
    val readingState: String,
    val favourite: Boolean,
    val source: String,
  )

  private val callback = object : MediaLibrarySession.Callback {
    override fun onGetLibraryRoot(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      params: LibraryParams?,
    ): ListenableFuture<LibraryResult<MediaItem>> =
      Futures.immediateFuture(LibraryResult.ofItem(folder(ROOT_ID, "Archivist"), params))

    override fun onGetChildren(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      parentId: String,
      page: Int,
      pageSize: Int,
      params: LibraryParams?,
    ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
      connectToPlaybackSession()
      val all = readCatalogue()
      val items = when {
        parentId == ROOT_ID -> listOf(
          folder(CONTINUE_ID, "Continue listening"),
          folder(AUDIOBOOKS_ID, "Audiobooks"),
          folder(SERIES_ID, "Series"),
          folder(FAVOURITES_ID, "Favourites"),
        )
        parentId == CONTINUE_ID -> all.filter { it.readingState == "in-progress" }.map(::bookItem)
        parentId == AUDIOBOOKS_ID -> all.map(::bookItem)
        parentId == FAVOURITES_ID -> all.filter { it.favourite }.map(::bookItem)
        parentId == SERIES_ID -> all.map { it.series }.filter { it.isNotBlank() }.distinct()
          .sortedBy { it.lowercase() }.map { series -> folder(seriesId(series), series) }
        parentId.startsWith(SERIES_PREFIX) -> {
          all.filter { seriesId(it.series) == parentId && it.series.isNotBlank() }.map(::bookItem)
        }
        else -> emptyList()
      }
      return Futures.immediateFuture(LibraryResult.ofItemList(page(items, page, pageSize), params))
    }

    override fun onGetItem(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      mediaId: String,
    ): ListenableFuture<LibraryResult<MediaItem>> {
      val all = readCatalogue()
      val item = when {
        mediaId == ROOT_ID -> folder(ROOT_ID, "Archivist")
        mediaId == CONTINUE_ID -> folder(CONTINUE_ID, "Continue listening")
        mediaId == AUDIOBOOKS_ID -> folder(AUDIOBOOKS_ID, "Audiobooks")
        mediaId == SERIES_ID -> folder(SERIES_ID, "Series")
        mediaId == FAVOURITES_ID -> folder(FAVOURITES_ID, "Favourites")
        mediaId.startsWith(SERIES_PREFIX) -> {
          val title = all.firstOrNull { seriesId(it.series) == mediaId }?.series ?: "Series"
          folder(mediaId, title)
        }
        mediaId.startsWith(BOOK_PREFIX) -> all.firstOrNull { bookId(it) == mediaId }?.let(::bookItem)
        else -> null
      }
      return if (item != null) {
        Futures.immediateFuture(LibraryResult.ofItem(item, null))
      } else {
        Futures.immediateFuture(LibraryResult.ofError<MediaItem>(SessionError.ERROR_BAD_VALUE))
      }
    }

    override fun onGetSearchResult(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      query: String,
      page: Int,
      pageSize: Int,
      params: LibraryParams?,
    ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
      val needle = query.trim().lowercase()
      val matches = if (needle.isBlank()) emptyList() else readCatalogue().filter {
        it.title.lowercase().contains(needle) ||
          it.author.lowercase().contains(needle) ||
          it.series.lowercase().contains(needle) ||
          it.genre.lowercase().contains(needle)
      }.map(::bookItem)
      return Futures.immediateFuture(LibraryResult.ofItemList(page(matches, page, pageSize), params))
    }
  }

  override fun onCreate() {
    super.onCreate()
    idlePlayer = ExoPlayer.Builder(this).build()
    val builder = MediaLibrarySession.Builder(this, idlePlayer, callback)
      .setId("ArchivistAndroidAuto")
    packageManager.getLaunchIntentForPackage(packageName)?.let { intent ->
      builder.setSessionActivity(
        PendingIntent.getActivity(
          this,
          0,
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
      )
    }
    librarySession = builder.build()
    connectToPlaybackSession()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession? {
    connectToPlaybackSession()
    return librarySession
  }

  override fun onDestroy() {
    controllerFuture?.cancel(true)
    controllerFuture = null
    librarySession?.release()
    librarySession = null
    playbackController?.release()
    playbackController = null
    idlePlayer.release()
    super.onDestroy()
  }

  private fun connectToPlaybackSession() {
    if (playbackController != null || controllerFuture != null) return
    try {
      val token = SessionToken(this, ComponentName(this, AudioControlsService::class.java))
      val future = MediaController.Builder(this, token).buildAsync()
      controllerFuture = future
      future.addListener({
        try {
          val controller = future.get()
          playbackController = controller
          librarySession?.setPlayer(controller)
        } catch (_: Throwable) {
          // It is valid for Archivist to be idle. We will retry next time a browser asks for data.
        } finally {
          controllerFuture = null
        }
      }, mainExecutor)
    } catch (_: Throwable) {
      controllerFuture = null
    }
  }

  private fun readCatalogue(): List<CatalogueItem> {
    val raw = getSharedPreferences(ArchivistAutoModule.PREFS, Context.MODE_PRIVATE)
      .getString(ArchivistAutoModule.KEY_CATALOGUE, "[]") ?: "[]"
    return try {
      val array = JSONArray(raw)
      buildList {
        for (index in 0 until array.length()) {
          val item = array.optJSONObject(index) ?: continue
          val id = item.optString("id").trim()
          val title = item.optString("title").trim()
          if (id.isBlank() || title.isBlank()) continue
          add(
            CatalogueItem(
              id = id,
              title = title,
              author = item.optString("author").trim(),
              series = item.optString("series").trim(),
              genre = item.optString("genre").trim(),
              readingState = item.optString("readingState", "not-started"),
              favourite = item.optBoolean("favourite", false),
              source = item.optString("source", "unknown"),
            )
          )
        }
      }
    } catch (_: Throwable) {
      emptyList()
    }
  }

  private fun folder(id: String, title: String): MediaItem =
    MediaItem.Builder()
      .setMediaId(id)
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(title)
          .setIsBrowsable(true)
          .setIsPlayable(false)
          .build()
      )
      .build()

  private fun bookItem(item: CatalogueItem): MediaItem {
    val subtitle = listOf(item.author, item.series).filter { it.isNotBlank() }.joinToString(" · ")
    val metadata = MediaMetadata.Builder()
      .setTitle(item.title)
      .setSubtitle(subtitle.ifBlank { "Open Archivist on your phone to start" })
      .setIsBrowsable(false)
      .setIsPlayable(false)
    if (item.author.isNotBlank()) metadata.setArtist(item.author)
    if (item.series.isNotBlank()) metadata.setAlbumTitle(item.series)
    return MediaItem.Builder()
      .setMediaId(bookId(item))
      .setMediaMetadata(metadata.build())
      .build()
  }

  private fun bookId(item: CatalogueItem) = BOOK_PREFIX + item.id

  private fun seriesId(series: String) =
    SERIES_PREFIX + series.trim().lowercase().replace(Regex("[^a-z0-9]+"), "-").trim('-')

  private fun page(items: List<MediaItem>, page: Int, pageSize: Int): List<MediaItem> {
    val safePage = page.coerceAtLeast(0)
    val safeSize = pageSize.coerceAtLeast(1)
    val start = safePage.toLong() * safeSize.toLong()
    if (start >= items.size) return emptyList()
    val from = start.toInt()
    val to = (from + safeSize).coerceAtMost(items.size)
    return items.subList(from, to)
  }

  companion object {
    private const val ROOT_ID = "archivist.root"
    private const val CONTINUE_ID = "archivist.continue"
    private const val AUDIOBOOKS_ID = "archivist.audiobooks"
    private const val SERIES_ID = "archivist.series"
    private const val FAVOURITES_ID = "archivist.favourites"
    private const val BOOK_PREFIX = "archivist.book."
    private const val SERIES_PREFIX = "archivist.series."
  }
}
