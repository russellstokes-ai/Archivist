package app.archivist.reader

import java.io.ByteArrayOutputStream
import java.util.Random
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import kotlin.math.min
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class BoundedZipProbeTest {
  private class RecordingReader(private val bytes: ByteArray) : BoundedZipProbe.SeekableReader {
    override val size: Long get() = bytes.size.toLong()
    var totalBytesRead = 0L
    val windows = mutableListOf<Pair<Long, Int>>()

    override fun read(offset: Long, length: Int): ByteArray {
      require(offset >= 0 && length >= 0 && offset + length <= bytes.size) { "read outside archive" }
      totalBytesRead += length
      windows += offset to length
      return bytes.copyOfRange(offset.toInt(), offset.toInt() + length)
    }
  }

  private fun zip(entries: List<Pair<String, ByteArray>>): ByteArray {
    val out = ByteArrayOutputStream()
    ZipOutputStream(out).use { zip ->
      for ((name, data) in entries) {
        zip.putNextEntry(ZipEntry(name))
        zip.write(data)
        zip.closeEntry()
      }
    }
    return out.toByteArray()
  }

  private fun signature(bytes: ByteArray, value: Int): Int {
    for (i in 0..bytes.size - 4) {
      val candidate = (bytes[i].toInt() and 0xff) or
        ((bytes[i + 1].toInt() and 0xff) shl 8) or
        ((bytes[i + 2].toInt() and 0xff) shl 16) or
        ((bytes[i + 3].toInt() and 0xff) shl 24)
      if (candidate == value) return i
    }
    return -1
  }

  private fun put16(bytes: ByteArray, offset: Int, value: Int) {
    bytes[offset] = (value and 0xff).toByte()
    bytes[offset + 1] = ((value ushr 8) and 0xff).toByte()
  }

  private fun put32(bytes: ByteArray, offset: Int, value: Long) {
    for (i in 0 until 4) bytes[offset + i] = ((value ushr (8 * i)) and 0xff).toByte()
  }

  private inline fun expectFailure(message: String, block: () -> Unit) {
    try {
      block()
      fail("Expected failure: $message")
    } catch (error: IllegalArgumentException) {
      assertTrue("$message: ${error.message}", !error.message.isNullOrBlank())
    }
  }

  @Test
  fun seeksToCentralDirectoryAndSelectedMetadataWithoutReadingWholeArchive() {
    val xml = "<ComicInfo><Title>Dune</Title><Series>Dune</Series><Number>1</Number></ComicInfo>".toByteArray()
    val bigPage = ByteArray(2 * 1024 * 1024).also { Random(7).nextBytes(it) }
    val archive = zip(listOf("ComicInfo.xml" to xml, "001.jpg" to bigPage))
    val reader = RecordingReader(archive)
    val probe = BoundedZipProbe(reader)

    val entries = probe.index()
    val metadata = entries.first { it.name == "ComicInfo.xml" }
    assertArrayEquals(xml, probe.readEntry(metadata, 512 * 1024))

    assertEquals(2, entries.size)
    assertTrue("bounded probe read ${reader.totalBytesRead} of ${archive.size} bytes", reader.totalBytesRead < archive.size / 4)
    assertTrue(reader.windows.size <= 4)
  }

  @Test
  fun rejectsTraversalEncryptedEntriesAndBadOffsets() {
    val traversal = zip(listOf("../ComicInfo.xml" to "<ComicInfo/>".toByteArray()))
    expectFailure("path traversal") { BoundedZipProbe(RecordingReader(traversal)).index() }

    val encrypted = zip(listOf("ComicInfo.xml" to "<ComicInfo/>".toByteArray())).copyOf()
    val central = signature(encrypted, 0x02014b50)
    require(central >= 0)
    put16(encrypted, central + 8, 1)
    expectFailure("encrypted entry") { BoundedZipProbe(RecordingReader(encrypted)).index() }

    val badOffset = zip(listOf("ComicInfo.xml" to "<ComicInfo/>".toByteArray())).copyOf()
    val badCentral = signature(badOffset, 0x02014b50)
    require(badCentral >= 0)
    put32(badOffset, badCentral + 42, 0x7fffffff)
    val probe = BoundedZipProbe(RecordingReader(badOffset))
    val entry = probe.index().single()
    expectFailure("bad local offset") { probe.readEntry(entry, 512 * 1024) }
  }

  @Test
  fun enforcesCentralDirectoryEntryAndExpansionBudgets() {
    val three = zip(listOf(
      "a.txt" to byteArrayOf(1),
      "b.txt" to byteArrayOf(2),
      "c.txt" to byteArrayOf(3),
    ))
    expectFailure("entry budget") {
      BoundedZipProbe(RecordingReader(three), BoundedZipProbe.Limits(maxEntries = 2)).index()
    }
    expectFailure("central directory budget") {
      BoundedZipProbe(RecordingReader(three), BoundedZipProbe.Limits(maxCentralDirectoryBytes = 64)).index()
    }

    val bomb = zip(listOf("ComicInfo.xml" to ByteArray(700 * 1024)))
    val probe = BoundedZipProbe(RecordingReader(bomb))
    val entry = probe.index().single()
    expectFailure("expanded metadata budget") { probe.readEntry(entry, 512 * 1024) }
  }
  @Test
  fun extractsOnlySelectedEpubEvidenceWithinBudgets() {
    val container = """<?xml version="1.0"?><container><rootfiles><rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>""".toByteArray()
    val opf = """<package><metadata><dc:title xmlns:dc="dc">Dune</dc:title><dc:creator xmlns:dc="dc">Frank Herbert</dc:creator></metadata><manifest><item id="cover" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest></package>""".toByteArray()
    val cover = ByteArray(96 * 1024) { (it % 251).toByte() }
    val chapter = ByteArray(2 * 1024 * 1024).also { Random(9).nextBytes(it) }
    val archive = zip(listOf(
      "META-INF/container.xml" to container,
      "OPS/package.opf" to opf,
      "OPS/images/cover.jpg" to cover,
      "OPS/chapter.xhtml" to chapter,
    ))
    val reader = RecordingReader(archive)

    val evidence = BoundedArchiveEvidence.probeZip("epub", reader)

    assertEquals("opf", evidence.metadataKind)
    assertEquals(String(opf), evidence.metadataText)
    assertEquals("OPS/images/cover.jpg", evidence.coverName)
    assertArrayEquals(cover, evidence.coverBytes)
    assertTrue("fast EPUB evidence must not read the whole archive", reader.totalBytesRead < archive.size / 2)
  }

  @Test
  fun extractsComicInfoAndFirstPageWithoutInflatingOtherComicPages() {
    val comicInfo = """<ComicInfo><Title>Dune</Title><Series>Dune</Series><Number>1</Number></ComicInfo>""".toByteArray()
    val first = ByteArray(80 * 1024) { 7 }
    val hugeSecond = ByteArray(2 * 1024 * 1024).also { Random(11).nextBytes(it) }
    val archive = zip(listOf(
      "ComicInfo.xml" to comicInfo,
      "001.jpg" to first,
      "002.jpg" to hugeSecond,
    ))
    val reader = RecordingReader(archive)

    val evidence = BoundedArchiveEvidence.probeZip("cbz", reader)

    assertEquals("xml", evidence.metadataKind)
    assertEquals(String(comicInfo), evidence.metadataText)
    assertEquals("001.jpg", evidence.coverName)
    assertArrayEquals(first, evidence.coverBytes)
    assertTrue("fast CBZ evidence must not read unrelated pages", reader.totalBytesRead < archive.size / 2)
  }

  @Test
  fun archiveEvidenceUsesTypedFailuresForMissingOrOversizedMetadata() {
    val missing = zip(listOf("chapter.xhtml" to "<html/>".toByteArray()))
    try {
      BoundedArchiveEvidence.probeZip("epub", RecordingReader(missing))
      fail("Expected missing EPUB package metadata to fail")
    } catch (error: BoundedArchiveEvidence.ProbeFailure) {
      assertEquals("metadata-missing", error.code)
    }

    val oversized = zip(listOf("ComicInfo.xml" to ByteArray(600 * 1024), "001.jpg" to byteArrayOf(1,2,3)))
    try {
      BoundedArchiveEvidence.probeZip("cbz", RecordingReader(oversized))
      fail("Expected oversized ComicInfo metadata to fail")
    } catch (error: BoundedArchiveEvidence.ProbeFailure) {
      assertEquals("metadata-too-large", error.code)
    }
  }

}
