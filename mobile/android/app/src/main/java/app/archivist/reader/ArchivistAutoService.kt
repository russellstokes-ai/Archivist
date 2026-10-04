package app.archivist.reader

import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionError
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import org.json.JSONObject
import java.io.File

@OptIn(UnstableApi::class)
class ArchivistAutoService : MediaLibraryService() {
  private lateinit var player: ExoPlayer
  private lateinit var librarySession: MediaLibrarySession

  override fun onCreate() {
    super.onCreate()
    player = ExoPlayer.Builder(this).build()
    librarySession = MediaLibrarySession.Builder(this, player, AutoLibraryCallback())
      .setId("ArchivistAutoLibrary")
      .build()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession =
    librarySession

  override fun onDestroy() {
    librarySession.release()
    player.release()
    super.onDestroy()
  }

  private inner class AutoLibraryCallback : MediaLibrarySession.Callback {
    override fun onGetLibraryRoot(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      params: LibraryParams?
    ): ListenableFuture<LibraryResult<MediaItem>> =
      Futures.immediateFuture(LibraryResult.ofItem(rootItem(), params))

    override fun onGetChildren(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      parentId: String,
      page: Int,
      pageSize: Int,
      params: LibraryParams?
    ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
      val snapshot = loadSnapshot()
      val items = when {
        parentId == ROOT_ID -> if (snapshot.works.isEmpty()) emptyList() else listOf(audiobooksItem())
        parentId == AUDIOBOOKS_ID -> snapshot.works.map { workItem(it) }
        parentId.startsWith(WORK_PREFIX) -> {
          val work = snapshot.works.firstOrNull { it.id == parentId }
          work?.tracks?.map { trackItem(work, it) } ?: emptyList()
        }
        else -> emptyList()
      }
      val start = (page * pageSize).coerceAtMost(items.size)
      val end = (start + pageSize).coerceAtMost(items.size)
      return Futures.immediateFuture(LibraryResult.ofItemList(items.subList(start, end), params))
    }

    override fun onGetItem(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      mediaId: String
    ): ListenableFuture<LibraryResult<MediaItem>> {
      val item = resolveItem(mediaId)
      return Futures.immediateFuture(
        if (item != null) LibraryResult.ofItem(item, null)
        else LibraryResult.ofError(SessionError.ERROR_BAD_VALUE)
      )
    }

    override fun onAddMediaItems(
      mediaSession: MediaSession,
      controller: MediaSession.ControllerInfo,
      mediaItems: List<MediaItem>
    ): ListenableFuture<List<MediaItem>> {
      val resolved = mediaItems.mapNotNull { requested ->
        if (requested.localConfiguration != null) requested
        else resolveItem(requested.mediaId)?.takeIf { it.localConfiguration != null }
      }
      return Futures.immediateFuture(resolved)
    }
  }

  private fun resolveItem(mediaId: String): MediaItem? {
    if (mediaId == ROOT_ID) return rootItem()
    if (mediaId == AUDIOBOOKS_ID) return audiobooksItem()
    val snapshot = loadSnapshot()
    snapshot.works.firstOrNull { it.id == mediaId }?.let { return workItem(it) }
    snapshot.works.forEach { work ->
      work.tracks.firstOrNull { it.id == mediaId }?.let { return trackItem(work, it) }
    }
    return null
  }

  private fun rootItem() = browsableItem(ROOT_ID, "Archivist", "Audiobooks on this device")

  private fun audiobooksItem() =
    browsableItem(AUDIOBOOKS_ID, "Audiobooks", "On this device")

  private fun workItem(work: AutoWork): MediaItem =
    MediaItem.Builder()
      .setMediaId(work.id)
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(work.title)
          .setArtist(work.author.ifBlank { null })
          .setAlbumTitle(work.series.ifBlank { null })
          .setArtworkUri(work.coverUri?.takeIf { it.isNotBlank() }?.let(Uri::parse))
          .setIsBrowsable(true)
          .setIsPlayable(false)
          .build()
      )
      .build()

  private fun trackItem(work: AutoWork, track: AutoTrack): MediaItem =
    MediaItem.Builder()
      .setMediaId(track.id)
      .setUri(Uri.parse(track.uri))
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(track.title.ifBlank { work.title })
          .setArtist(work.author.ifBlank { null })
          .setAlbumTitle(work.title)
          .setArtworkUri(work.coverUri?.takeIf { it.isNotBlank() }?.let(Uri::parse))
          .setIsBrowsable(false)
          .setIsPlayable(true)
          .build()
      )
      .build()

  private fun browsableItem(id: String, title: String, subtitle: String): MediaItem =
    MediaItem.Builder()
      .setMediaId(id)
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(title)
          .setSubtitle(subtitle)
          .setIsBrowsable(true)
          .setIsPlayable(false)
          .build()
      )
      .build()

  private fun loadSnapshot(): AutoSnapshot {
    val file = File(filesDir, "android-auto/library.json")
    if (!file.isFile) return AutoSnapshot(emptyList())
    return try {
      val root = JSONObject(file.readText())
      if (root.optInt("version", 0) != 1) return AutoSnapshot(emptyList())
      val works = root.optJSONArray("works")
      val parsed = mutableListOf<AutoWork>()
      if (works != null) {
        for (i in 0 until works.length()) {
          val value = works.optJSONObject(i) ?: continue
          val tracks = mutableListOf<AutoTrack>()
          val trackArray = value.optJSONArray("tracks")
          if (trackArray != null) {
            for (index in 0 until trackArray.length()) {
              val track = trackArray.optJSONObject(index) ?: continue
              val id = track.optString("id")
              val uri = track.optString("uri")
              if (id.isBlank() || uri.isBlank()) continue
              tracks += AutoTrack(id, track.optString("title"), uri)
            }
          }
          val id = value.optString("id")
          val title = value.optString("title")
          if (id.isBlank() || title.isBlank() || tracks.isEmpty()) continue
          parsed += AutoWork(
            id = id,
            title = title,
            author = value.optString("author"),
            series = value.optString("series"),
            coverUri = value.optString("coverUri").takeIf { it.isNotBlank() },
            tracks = tracks
          )
        }
      }
      AutoSnapshot(parsed)
    } catch (_: Exception) {
      AutoSnapshot(emptyList())
    }
  }

  private data class AutoSnapshot(val works: List<AutoWork>)
  private data class AutoWork(
    val id: String,
    val title: String,
    val author: String,
    val series: String,
    val coverUri: String?,
    val tracks: List<AutoTrack>
  )
  private data class AutoTrack(val id: String, val title: String, val uri: String)

  companion object {
    private const val ROOT_ID = "archivist:auto:root"
    private const val AUDIOBOOKS_ID = "archivist:auto:audiobooks"
    private const val WORK_PREFIX = "work:"
  }
}
