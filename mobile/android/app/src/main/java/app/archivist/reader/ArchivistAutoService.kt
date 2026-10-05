package app.archivist.reader

import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.CommandButton
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionError
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import org.json.JSONObject
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

@OptIn(UnstableApi::class)
class ArchivistAutoService : MediaLibraryService() {
  private lateinit var player: ExoPlayer
  private lateinit var librarySession: MediaLibrarySession
  private val ioExecutor = Executors.newSingleThreadExecutor()
  private val progressHandler = Handler(Looper.getMainLooper())
  private val artworkCache = ConcurrentHashMap<String, ByteArray>()

  private val progressTicker = object : Runnable {
    override fun run() {
      persistProgress(false)
      if (::player.isInitialized && player.isPlaying) progressHandler.postDelayed(this, PROGRESS_INTERVAL_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    player = ExoPlayer.Builder(this)
      .setSeekBackIncrementMs(15_000)
      .setSeekForwardIncrementMs(15_000)
      .build()
    player.addListener(object : Player.Listener {
      override fun onIsPlayingChanged(isPlaying: Boolean) {
        progressHandler.removeCallbacks(progressTicker)
        if (isPlaying) progressHandler.postDelayed(progressTicker, PROGRESS_INTERVAL_MS)
        else persistProgress(false)
      }
      override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        persistProgress(false)
      }
      override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_ENDED) persistProgress(true)
      }
    })
    val back15 = CommandButton.Builder(CommandButton.ICON_SKIP_BACK_15)
      .setPlayerCommand(Player.COMMAND_SEEK_BACK)
      .setSlots(CommandButton.SLOT_BACK)
      .build()
    val forward15 = CommandButton.Builder(CommandButton.ICON_SKIP_FORWARD_15)
      .setPlayerCommand(Player.COMMAND_SEEK_FORWARD)
      .setSlots(CommandButton.SLOT_FORWARD)
      .build()
    librarySession = MediaLibrarySession.Builder(this, player, AutoLibraryCallback())
      .setId("ArchivistAutoLibrary")
      .setMediaButtonPreferences(ImmutableList.of(back15, forward15))
      .build()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession = librarySession

  override fun onDestroy() {
    progressHandler.removeCallbacks(progressTicker)
    if (::player.isInitialized) persistProgress(player.playbackState == Player.STATE_ENDED)
    librarySession.release()
    player.release()
    ioExecutor.shutdown()
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
        parentId == ROOT_ID -> rootChildren(snapshot)
        parentId == CONTINUE_ID -> snapshot.works.filter { it.readingState == "in-progress" }.map(::workItem)
        parentId == AUDIOBOOKS_ID -> snapshot.works.map(::workItem)
        parentId == FAVOURITES_ID -> snapshot.works.filter { it.favourite }.map(::workItem)
        parentId == SERIES_ID -> snapshot.works.map { it.series }.filter { it.isNotBlank() }.distinct()
          .sortedBy { it.lowercase() }.map(::seriesItem)
        parentId.startsWith(SERIES_PREFIX) -> snapshot.works.filter { seriesId(it.series) == parentId }.map(::workItem)
        parentId.startsWith(WORK_PREFIX) -> {
          val work = snapshot.works.firstOrNull { it.id == parentId }
          work?.tracks?.map { trackItem(work, it) } ?: emptyList()
        }
        else -> emptyList()
      }
      return Futures.immediateFuture(LibraryResult.ofItemList(items.take(MAX_BROWSE_ITEMS), params))
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

    override fun onSearch(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      query: String,
      params: LibraryParams?
    ): ListenableFuture<LibraryResult<Void>> {
      val matches = searchWorks(loadSnapshot(), query)
      session.notifySearchResultChanged(browser, query, matches.size.coerceAtMost(MAX_SEARCH_ITEMS), params)
      return Futures.immediateFuture(LibraryResult.ofVoid())
    }

    override fun onGetSearchResult(
      session: MediaLibrarySession,
      browser: MediaSession.ControllerInfo,
      query: String,
      page: Int,
      pageSize: Int,
      params: LibraryParams?
    ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> =
      Futures.immediateFuture(
        LibraryResult.ofItemList(searchWorks(loadSnapshot(), query).take(MAX_SEARCH_ITEMS).map(::workItem), params)
      )

    override fun onAddMediaItems(
      mediaSession: MediaSession,
      controller: MediaSession.ControllerInfo,
      mediaItems: List<MediaItem>
    ): ListenableFuture<List<MediaItem>> {
      val snapshot = loadSnapshot()
      val resolved = mediaItems.flatMap { requested ->
        val query = requested.requestMetadata.searchQuery?.toString()?.trim().orEmpty()
        when {
          query.isNotBlank() -> bestSearchWork(snapshot, query)?.let { playableWorkItems(it).mediaItems } ?: emptyList()
          requested.mediaId.startsWith(WORK_PREFIX) -> snapshot.works.firstOrNull { it.id == requested.mediaId }?.let { playableWorkItems(it).mediaItems } ?: emptyList()
          requested.mediaId.startsWith(TRACK_PREFIX) -> resolveTrack(snapshot, requested.mediaId)?.let { listOf(trackItem(it.first, it.second)) } ?: emptyList()
          requested.localConfiguration != null -> listOf(requested)
          else -> emptyList()
        }
      }
      return Futures.immediateFuture(resolved)
    }

    override fun onSetMediaItems(
      mediaSession: MediaSession,
      controller: MediaSession.ControllerInfo,
      mediaItems: List<MediaItem>,
      startIndex: Int,
      startPositionMs: Long
    ): ListenableFuture<MediaSession.MediaItemsWithStartPosition> {
      val snapshot = loadSnapshot()
      val first = mediaItems.firstOrNull()
      val query = first?.requestMetadata?.searchQuery?.toString()?.trim().orEmpty()
      val work = when {
        query.isNotBlank() -> bestSearchWork(snapshot, query)
        first?.mediaId?.startsWith(WORK_PREFIX) == true -> snapshot.works.firstOrNull { it.id == first.mediaId }
        first?.mediaId?.startsWith(TRACK_PREFIX) == true -> resolveTrack(snapshot, first.mediaId)?.first
        else -> null
      }
      if (work != null) {
        val playlist = work.tracks.map { trackItem(work, it) }
        val requestedTrackIndex = first?.mediaId?.takeIf { it.startsWith(TRACK_PREFIX) }?.let { id -> work.tracks.indexOfFirst { it.id == id } } ?: -1
        val resumeIndex = work.tracks.indexOfFirst { it.id == work.resumeTrackId }.coerceAtLeast(0)
        val index = when {
          requestedTrackIndex >= 0 -> requestedTrackIndex
          startIndex in playlist.indices -> startIndex
          else -> resumeIndex
        }
        val position = when {
          startPositionMs != C.TIME_UNSET && startPositionMs >= 0 -> startPositionMs
          index == resumeIndex -> (work.resumeSeconds * 1000.0).toLong().coerceAtLeast(0)
          else -> 0L
        }
        return Futures.immediateFuture(MediaSession.MediaItemsWithStartPosition(playlist, index, position))
      }
      val resolved = mediaItems.mapNotNull { requested ->
        if (requested.localConfiguration != null) requested else resolveItem(requested.mediaId)?.takeIf { it.localConfiguration != null }
      }
      val safeIndex = if (resolved.isEmpty()) C.INDEX_UNSET else startIndex.coerceIn(0, resolved.lastIndex)
      return Futures.immediateFuture(MediaSession.MediaItemsWithStartPosition(resolved, safeIndex, startPositionMs))
    }
  }

  private data class PlayableWork(val mediaItems: List<MediaItem>, val startIndex: Int, val startPositionMs: Long)

  private fun playableWorkItems(work: AutoWork): PlayableWork {
    val items = work.tracks.map { trackItem(work, it) }
    val index = work.tracks.indexOfFirst { it.id == work.resumeTrackId }.coerceAtLeast(0)
    return PlayableWork(items, index, (work.resumeSeconds * 1000.0).toLong().coerceAtLeast(0))
  }

  private fun rootChildren(snapshot: AutoSnapshot): List<MediaItem> = buildList {
    if (snapshot.works.any { it.readingState == "in-progress" }) add(folder(CONTINUE_ID, "Continue listening", "Resume on this device"))
    add(folder(AUDIOBOOKS_ID, "Audiobooks", snapshot.works.size.toString() + " available"))
    if (snapshot.works.any { it.series.isNotBlank() }) add(folder(SERIES_ID, "Series", "Browse by series"))
    if (snapshot.works.any { it.favourite }) add(folder(FAVOURITES_ID, "Favourites", "Your saved audiobooks"))
  }

  private fun resolveItem(mediaId: String): MediaItem? {
    if (mediaId == ROOT_ID) return rootItem()
    if (mediaId == CONTINUE_ID) return folder(CONTINUE_ID, "Continue listening", "Resume on this device")
    if (mediaId == AUDIOBOOKS_ID) return folder(AUDIOBOOKS_ID, "Audiobooks", "On this device")
    if (mediaId == SERIES_ID) return folder(SERIES_ID, "Series", "Browse by series")
    if (mediaId == FAVOURITES_ID) return folder(FAVOURITES_ID, "Favourites", "Your saved audiobooks")
    val snapshot = loadSnapshot()
    if (mediaId.startsWith(SERIES_PREFIX)) {
      val title = snapshot.works.firstOrNull { seriesId(it.series) == mediaId }?.series ?: return null
      return seriesItem(title)
    }
    snapshot.works.firstOrNull { it.id == mediaId }?.let { return workItem(it) }
    return resolveTrack(snapshot, mediaId)?.let { trackItem(it.first, it.second) }
  }

  private fun resolveTrack(snapshot: AutoSnapshot, mediaId: String): Pair<AutoWork, AutoTrack>? {
    snapshot.works.forEach { work ->
      work.tracks.firstOrNull { it.id == mediaId }?.let { return work to it }
    }
    return null
  }

  private fun rootItem() = folder(ROOT_ID, "Archivist", "Your audiobook library")

  private fun folder(id: String, title: String, subtitle: String): MediaItem =
    MediaItem.Builder()
      .setMediaId(id)
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(title)
          .setSubtitle(subtitle)
          .setMediaType(if (id == AUDIOBOOKS_ID) MediaMetadata.MEDIA_TYPE_FOLDER_AUDIO_BOOKS else MediaMetadata.MEDIA_TYPE_FOLDER_MIXED)
          .setIsBrowsable(true)
          .setIsPlayable(false)
          .build()
      )
      .build()

  private fun seriesItem(series: String): MediaItem =
    MediaItem.Builder()
      .setMediaId(seriesId(series))
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(series)
          .setMediaType(MediaMetadata.MEDIA_TYPE_FOLDER_AUDIO_BOOKS)
          .setIsBrowsable(true)
          .setIsPlayable(false)
          .build()
      )
      .build()

  private fun workItem(work: AutoWork): MediaItem {
    val metadata = MediaMetadata.Builder()
      .setTitle(work.title)
      .setArtist(work.author.ifBlank { null })
      .setAlbumTitle(work.series.ifBlank { null })
      .setSubtitle(listOf(work.author, work.series).filter { it.isNotBlank() }.joinToString(" · ").ifBlank { null })
      .setMediaType(MediaMetadata.MEDIA_TYPE_AUDIO_BOOK)
      .setIsBrowsable(true)
      .setIsPlayable(true)
    attachArtwork(metadata, work.coverUri)
    return MediaItem.Builder().setMediaId(work.id).setMediaMetadata(metadata.build()).build()
  }

  private fun trackItem(work: AutoWork, track: AutoTrack): MediaItem {
    val metadata = MediaMetadata.Builder()
      .setTitle(work.title)
      .setSubtitle(track.title.ifBlank { null })
      .setArtist(work.author.ifBlank { null })
      .setAlbumTitle(work.series.ifBlank { work.title })
      .setMediaType(MediaMetadata.MEDIA_TYPE_AUDIO_BOOK_CHAPTER)
      .setIsBrowsable(false)
      .setIsPlayable(true)
    attachArtwork(metadata, work.coverUri)
    return MediaItem.Builder()
      .setMediaId(track.id)
      .setUri(Uri.parse(track.uri))
      .setMediaMetadata(metadata.build())
      .build()
  }

  private fun attachArtwork(builder: MediaMetadata.Builder, coverUri: String?) {
    val raw = coverUri?.takeIf { it.isNotBlank() } ?: return
    val cached = artworkCache[raw]
    if (cached != null) {
      builder.setArtworkData(cached, MediaMetadata.PICTURE_TYPE_FRONT_COVER)
      return
    }
    val uri = Uri.parse(raw)
    try {
      val bytes = contentResolver.openInputStream(uri)?.use { input ->
        val data = input.readNBytes(MAX_ARTWORK_BYTES + 1)
        if (data.size <= MAX_ARTWORK_BYTES) data else null
      }
      if (bytes != null && bytes.isNotEmpty()) {
        artworkCache[raw] = bytes
        builder.setArtworkData(bytes, MediaMetadata.PICTURE_TYPE_FRONT_COVER)
      } else {
        builder.setArtworkUri(uri)
      }
    } catch (_: Throwable) {
      builder.setArtworkUri(uri)
    }
  }

  private fun searchWorks(snapshot: AutoSnapshot, query: String): List<AutoWork> {
    val q = query.trim().lowercase()
    if (q.isBlank()) {
      return snapshot.works.sortedWith(compareBy<AutoWork> { it.readingState != "in-progress" }.thenBy { it.title.lowercase() })
    }
    return snapshot.works.map { it to searchScore(it, q) }
      .filter { it.second > 0 }
      .sortedWith(compareByDescending<Pair<AutoWork, Int>> { it.second }.thenBy { it.first.title.lowercase() })
      .map { it.first }
  }

  private fun bestSearchWork(snapshot: AutoSnapshot, query: String): AutoWork? = searchWorks(snapshot, query).firstOrNull()

  private fun searchScore(work: AutoWork, q: String): Int {
    fun score(value: String, exact: Int, contains: Int): Int {
      val text = value.lowercase()
      return when {
        text == q -> exact
        text.startsWith(q) -> exact - 10
        text.contains(q) -> contains
        else -> 0
      }
    }
    return score(work.title, 120, 90) + score(work.author, 70, 50) + score(work.series, 65, 45) + score(work.genre, 35, 25)
  }

  private fun seriesId(series: String) = SERIES_PREFIX + Uri.encode(series.trim().lowercase())

  private fun persistProgress(complete: Boolean) {
    if (!::player.isInitialized) return
    val item = player.currentMediaItem ?: return
    val snapshot = loadSnapshot()
    val pair = resolveTrack(snapshot, item.mediaId) ?: return
    val work = pair.first
    val track = pair.second
    val seconds = player.currentPosition.coerceAtLeast(0) / 1000.0
    val finalTrack = work.tracks.lastOrNull()?.id == track.id
    val payload = JSONObject()
      .put("version", 1)
      .put("workKey", work.key)
      .put("trackUri", track.uri)
      .put("seconds", if (complete && finalTrack) 0 else seconds)
      .put("complete", complete && finalTrack)
      .put("updatedAt", System.currentTimeMillis())
      .toString()
    ioExecutor.execute {
      try {
        val dir = File(filesDir, "android-auto")
        if (!dir.exists()) dir.mkdirs()
        val tmp = File(dir, "progress.json.tmp")
        tmp.writeText(payload)
        val target = File(dir, "progress.json")
        if (target.exists()) target.delete()
        if (!tmp.renameTo(target)) {
          target.writeText(payload)
          tmp.delete()
        }
      } catch (_: Throwable) {
      }
    }
  }

  private fun loadSnapshot(): AutoSnapshot {
    val file = File(filesDir, "android-auto/library.json")
    if (!file.isFile) return AutoSnapshot(emptyList())
    return try {
      val root = JSONObject(file.readText())
      val version = root.optInt("version", 0)
      if (version != 1 && version != 2) return AutoSnapshot(emptyList())
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
              val id = track.optString("id").trim()
              val uri = track.optString("uri").trim()
              if (id.isBlank() || uri.isBlank()) continue
              tracks += AutoTrack(id, track.optString("title").trim(), uri)
            }
          }
          val id = value.optString("id").trim()
          val title = value.optString("title").trim()
          if (id.isBlank() || title.isBlank() || tracks.isEmpty()) continue
          parsed += AutoWork(
            id = id,
            key = value.optString("key", id.removePrefix(WORK_PREFIX)).trim(),
            title = title,
            author = value.optString("author").trim(),
            series = value.optString("series").trim(),
            genre = value.optString("genre").trim(),
            coverUri = value.optString("coverUri").trim().takeIf { it.isNotBlank() },
            readingState = value.optString("readingState", "not-started"),
            favourite = value.optBoolean("favourite", false),
            resumeTrackId = value.optString("resumeTrackId").trim().takeIf { it.isNotBlank() },
            resumeSeconds = value.optDouble("resumeSeconds", 0.0).coerceAtLeast(0.0),
            tracks = tracks
          )
        }
      }
      AutoSnapshot(parsed)
    } catch (_: Throwable) {
      AutoSnapshot(emptyList())
    }
  }

  private data class AutoSnapshot(val works: List<AutoWork>)
  private data class AutoWork(
    val id: String,
    val key: String,
    val title: String,
    val author: String,
    val series: String,
    val genre: String,
    val coverUri: String?,
    val readingState: String,
    val favourite: Boolean,
    val resumeTrackId: String?,
    val resumeSeconds: Double,
    val tracks: List<AutoTrack>
  )
  private data class AutoTrack(val id: String, val title: String, val uri: String)

  companion object {
    private const val ROOT_ID = "archivist:auto:root"
    private const val CONTINUE_ID = "archivist:auto:continue"
    private const val AUDIOBOOKS_ID = "archivist:auto:audiobooks"
    private const val SERIES_ID = "archivist:auto:series"
    private const val FAVOURITES_ID = "archivist:auto:favourites"
    private const val WORK_PREFIX = "work:"
    private const val TRACK_PREFIX = "track:"
    private const val SERIES_PREFIX = "archivist:auto:series:"
    private const val MAX_BROWSE_ITEMS = 200
    private const val MAX_SEARCH_ITEMS = 50
    private const val MAX_ARTWORK_BYTES = 1_500_000
    private const val PROGRESS_INTERVAL_MS = 5_000L
  }
}
