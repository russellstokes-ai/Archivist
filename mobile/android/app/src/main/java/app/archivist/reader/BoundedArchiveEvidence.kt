package app.archivist.reader

import java.nio.charset.StandardCharsets

/**
 * Selects only the small identity/artwork entries needed by the fast EPUB/CBZ
 * preparation path. The underlying [BoundedZipProbe] performs seekable range
 * reads and enforces ZIP structural limits; this layer enforces media-specific
 * XML and cover budgets.
 */
internal object BoundedArchiveEvidence {
  const val MAX_XML_BYTES = 512 * 1024
  const val MAX_COVER_BYTES = 8 * 1024 * 1024

  class ProbeFailure(val code: String, message: String, cause: Throwable? = null) :
    IllegalArgumentException(message, cause)

  data class Evidence(
    val metadataKind: String? = null,
    val metadataText: String? = null,
    val coverName: String? = null,
    val coverBytes: ByteArray? = null,
  )

  fun probeZip(extension: String, reader: BoundedZipProbe.SeekableReader): Evidence {
    val probe = BoundedZipProbe(reader)
    val entries = try {
      probe.index()
    } catch (error: ProbeFailure) {
      throw error
    } catch (error: IllegalArgumentException) {
      throw ProbeFailure("archive-invalid", error.message ?: "Archive index is invalid.", error)
    }
    return when (extension.trim().lowercase()) {
      "epub" -> probeEpub(probe, entries)
      "cbz", "zip" -> probeComicZip(probe, entries)
      else -> throw ProbeFailure("unsupported-format", "Fast ZIP evidence is unavailable for this format.")
    }
  }

  private fun probeEpub(probe: BoundedZipProbe, entries: List<BoundedZipProbe.Entry>): Evidence {
    var remainingXml = MAX_XML_BYTES
    val containerEntry = find(entries, "META-INF/container.xml")
    var packagePath: String? = null
    if (containerEntry != null) {
      val containerBytes = readXml(probe, containerEntry, remainingXml)
      remainingXml -= containerBytes.size
      val container = containerBytes.toString(StandardCharsets.UTF_8)
      packagePath = Regex("""(?is)full-path\s*=\s*["']([^"']+\.opf)["']""")
        .find(container)?.groupValues?.getOrNull(1)?.let(::xmlValue)
    }

    val packageEntry = packagePath?.let { find(entries, it) }
      ?: entries.firstOrNull { normalize(it.name).lowercase().endsWith(".opf") }
      ?: throw ProbeFailure("metadata-missing", "EPUB package metadata was not found.")

    val opfBytes = readXml(probe, packageEntry, remainingXml)
    val opf = opfBytes.toString(StandardCharsets.UTF_8)
    val coverEntry = epubCoverEntry(entries, packageEntry.name, opf) ?: fallbackCoverEntry(entries)
    val coverBytes = coverEntry?.let { readCover(probe, it) }
    return Evidence(
      metadataKind = "opf",
      metadataText = opf,
      coverName = coverEntry?.name,
      coverBytes = coverBytes,
    )
  }

  private fun probeComicZip(probe: BoundedZipProbe, entries: List<BoundedZipProbe.Entry>): Evidence {
    val comicInfo = entries.firstOrNull {
      normalize(it.name).substringAfterLast('/').equals("ComicInfo.xml", ignoreCase = true)
    }
    val metadataBytes = comicInfo?.let { readXml(probe, it, MAX_XML_BYTES) }
    val coverEntry = fallbackCoverEntry(entries)
    val coverBytes = coverEntry?.let { readCover(probe, it) }
    return Evidence(
      metadataKind = if (metadataBytes != null) "xml" else null,
      metadataText = metadataBytes?.toString(StandardCharsets.UTF_8),
      coverName = coverEntry?.name,
      coverBytes = coverBytes,
    )
  }

  private fun readXml(
    probe: BoundedZipProbe,
    entry: BoundedZipProbe.Entry,
    remainingBudget: Int,
  ): ByteArray {
    if (remainingBudget <= 0 || entry.uncompressedSize > remainingBudget.toLong()) {
      throw ProbeFailure("metadata-too-large", "Archive metadata exceeds the 512 KiB fast-probe budget.")
    }
    return try {
      probe.readEntry(entry, remainingBudget)
    } catch (error: IllegalArgumentException) {
      throw ProbeFailure("metadata-invalid", error.message ?: "Archive metadata could not be read safely.", error)
    }
  }

  private fun readCover(probe: BoundedZipProbe, entry: BoundedZipProbe.Entry): ByteArray {
    if (entry.uncompressedSize > MAX_COVER_BYTES.toLong()) {
      throw ProbeFailure("cover-too-large", "Archive cover exceeds the 8 MiB fast-probe budget.")
    }
    return try {
      probe.readEntry(entry, MAX_COVER_BYTES)
    } catch (error: IllegalArgumentException) {
      throw ProbeFailure("cover-invalid", error.message ?: "Archive cover could not be read safely.", error)
    }
  }

  private fun epubCoverEntry(
    entries: List<BoundedZipProbe.Entry>,
    packageName: String,
    opf: String,
  ): BoundedZipProbe.Entry? {
    val itemTags = Regex("""(?is)<item\b[^>]*>""").findAll(opf).map { it.value }.toList()
    val metaTags = Regex("""(?is)<meta\b[^>]*>""").findAll(opf).map { it.value }.toList()
    val coverId = metaTags.firstNotNullOfOrNull { tag ->
      val attrs = attributes(tag)
      if (attrs["name"]?.equals("cover", ignoreCase = true) == true) attrs["content"] else null
    }

    val selected = itemTags.firstNotNullOfOrNull { tag ->
      val attrs = attributes(tag)
      val href = attrs["href"] ?: return@firstNotNullOfOrNull null
      val properties = attrs["properties"].orEmpty().split(Regex("\\s+"))
      val id = attrs["id"].orEmpty()
      val mime = attrs["media-type"].orEmpty()
      val isCover = properties.any { it.equals("cover-image", ignoreCase = true) } ||
        (coverId != null && id == coverId) ||
        (id.contains("cover", ignoreCase = true) && mime.startsWith("image/", ignoreCase = true))
      if (isCover) resolveRelative(packageName, xmlValue(href)) else null
    }
    return selected?.let { find(entries, it) }
  }

  private fun fallbackCoverEntry(entries: List<BoundedZipProbe.Entry>): BoundedZipProbe.Entry? {
    val images = entries.filter { isImage(it.name) && !normalize(it.name).contains("/__MACOSX/", ignoreCase = true) }
    if (images.isEmpty()) return null
    fun rank(entry: BoundedZipProbe.Entry): Int {
      val stem = normalize(entry.name).substringAfterLast('/').substringBeforeLast('.').lowercase()
      return when (stem) {
        "cover" -> 0
        "front", "frontcover", "front-cover" -> 1
        "bookcover", "book-cover" -> 2
        "folder" -> 3
        "coverart", "artwork" -> 4
        else -> 10
      }
    }
    return images.sortedWith(compareBy<BoundedZipProbe.Entry>({ rank(it) }, { normalize(it.name).lowercase() })).first()
  }

  private fun find(entries: List<BoundedZipProbe.Entry>, name: String): BoundedZipProbe.Entry? {
    val wanted = normalize(name).trimStart('/')
    return entries.firstOrNull { normalize(it.name).trimStart('/').equals(wanted, ignoreCase = true) }
  }

  private fun resolveRelative(baseFile: String, href: String): String {
    val base = normalize(baseFile)
    val prefix = base.substringBeforeLast('/', "")
    val raw = if (prefix.isEmpty()) href else "$prefix/$href"
    val stack = ArrayDeque<String>()
    for (part in normalize(raw).split('/')) {
      when (part) {
        "", "." -> Unit
        ".." -> if (stack.isEmpty()) throw ProbeFailure("metadata-invalid", "EPUB cover path escapes its package directory.") else stack.removeLast()
        else -> stack.addLast(part)
      }
    }
    return stack.joinToString("/")
  }

  private fun attributes(tag: String): Map<String, String> {
    val result = LinkedHashMap<String, String>()
    val pattern = Regex("""(?is)([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(["'])(.*?)\2""")
    for (match in pattern.findAll(tag)) result[match.groupValues[1].lowercase()] = xmlValue(match.groupValues[3])
    return result
  }

  private fun xmlValue(value: String) = value
    .replace("&amp;", "&")
    .replace("&quot;", "\"")
    .replace("&apos;", "'")
    .replace("&#39;", "'")

  private fun normalize(value: String) = value.replace('\\', '/')
  private fun isImage(value: String) = Regex("""(?i).+\.(jpe?g|png|gif|webp)$""").matches(normalize(value))
}
