package app.archivist.reader

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import java.util.zip.CRC32
import java.util.zip.Inflater
import java.util.zip.InflaterInputStream
import kotlin.math.min

/**
 * Bounded ZIP central-directory reader used only for fast metadata/artwork probes.
 *
 * It never copies or streams the whole archive. Callers provide seekable range I/O
 * and enforce their own wall-clock/cancellation deadline around each read.
 */
internal class BoundedZipProbe(
  private val reader: SeekableReader,
  private val limits: Limits = Limits(),
) {
  interface SeekableReader {
    val size: Long
    fun read(offset: Long, length: Int): ByteArray
  }

  data class Limits(
    val maxCentralDirectoryBytes: Int = 1024 * 1024,
    val maxEntries: Int = 10_000,
    val maxCompressedSlackBytes: Int = 64 * 1024,
  )

  data class Entry(
    val name: String,
    val flags: Int,
    val compressionMethod: Int,
    val crc32: Long,
    val compressedSize: Long,
    val uncompressedSize: Long,
    val localHeaderOffset: Long,
  )

  fun index(): List<Entry> {
    require(reader.size >= EOCD_MIN_BYTES) { "ZIP archive is too small." }
    val tailLength = min(reader.size, MAX_EOCD_SEARCH.toLong()).toInt()
    val tailOffset = reader.size - tailLength
    val tail = exactRead(tailOffset, tailLength)
    val eocd = findSignatureBackwards(tail, EOCD_SIGNATURE)
    require(eocd >= 0 && eocd + EOCD_MIN_BYTES <= tail.size) { "ZIP end-of-directory record was not found." }

    val disk = u16(tail, eocd + 4)
    val centralDisk = u16(tail, eocd + 6)
    val entriesOnDisk = u16(tail, eocd + 8)
    val totalEntries = u16(tail, eocd + 10)
    val centralSize = u32(tail, eocd + 12)
    val centralOffset = u32(tail, eocd + 16)

    require(disk == 0 && centralDisk == 0 && entriesOnDisk == totalEntries) { "Multi-disk ZIP archives are unsupported." }
    require(totalEntries != ZIP16_SENTINEL && centralSize != ZIP32_SENTINEL && centralOffset != ZIP32_SENTINEL) { "ZIP64 archives are outside the fast probe budget." }
    require(totalEntries <= limits.maxEntries) { "ZIP archive contains too many entries for the fast probe." }
    require(centralSize <= limits.maxCentralDirectoryBytes.toLong()) { "ZIP central directory exceeds the fast probe budget." }
    require(centralSize <= Int.MAX_VALUE.toLong()) { "ZIP central directory is too large." }
    require(centralOffset >= 0 && centralOffset + centralSize <= reader.size) { "ZIP central directory offset is invalid." }

    val central = exactRead(centralOffset, centralSize.toInt())
    val entries = ArrayList<Entry>(totalEntries)
    var cursor = 0
    repeat(totalEntries) {
      require(cursor + CENTRAL_FIXED_BYTES <= central.size) { "ZIP central directory is truncated." }
      require(u32(central, cursor) == CENTRAL_SIGNATURE.toLong()) { "ZIP central directory entry is corrupt." }
      val flags = u16(central, cursor + 8)
      require(flags and ENCRYPTED_FLAG == 0) { "Encrypted ZIP entries are unsupported." }
      val method = u16(central, cursor + 10)
      val crc = u32(central, cursor + 16)
      val compressed = u32(central, cursor + 20)
      val uncompressed = u32(central, cursor + 24)
      val nameLength = u16(central, cursor + 28)
      val extraLength = u16(central, cursor + 30)
      val commentLength = u16(central, cursor + 32)
      val localOffset = u32(central, cursor + 42)
      require(compressed != ZIP32_SENTINEL && uncompressed != ZIP32_SENTINEL && localOffset != ZIP32_SENTINEL) { "ZIP64 entries are outside the fast probe budget." }

      val end = cursor.toLong() + CENTRAL_FIXED_BYTES + nameLength + extraLength + commentLength
      require(end <= central.size.toLong()) { "ZIP central directory entry exceeds its declared bounds." }
      val charset = if (flags and UTF8_FLAG != 0) StandardCharsets.UTF_8 else CP437
      val name = String(central, cursor + CENTRAL_FIXED_BYTES, nameLength, charset)
      requireSafeName(name)
      entries += Entry(
        name = name,
        flags = flags,
        compressionMethod = method,
        crc32 = crc,
        compressedSize = compressed,
        uncompressedSize = uncompressed,
        localHeaderOffset = localOffset,
      )
      cursor = end.toInt()
    }
    require(entries.size == totalEntries) { "ZIP central directory entry count changed while reading." }
    return entries
  }

  fun readEntry(entry: Entry, maxOutputBytes: Int): ByteArray {
    require(maxOutputBytes > 0) { "Entry output budget must be positive." }
    require(entry.flags and ENCRYPTED_FLAG == 0) { "Encrypted ZIP entries are unsupported." }
    require(entry.uncompressedSize <= maxOutputBytes.toLong()) { "ZIP entry expands beyond the permitted output budget." }
    require(entry.compressedSize <= maxOutputBytes.toLong() + limits.maxCompressedSlackBytes) { "ZIP entry compressed payload exceeds the permitted read budget." }
    require(entry.compressedSize <= Int.MAX_VALUE.toLong()) { "ZIP entry compressed payload is too large." }
    require(entry.localHeaderOffset >= 0 && entry.localHeaderOffset + LOCAL_FIXED_BYTES <= reader.size) { "ZIP local entry offset is invalid." }

    val local = exactRead(entry.localHeaderOffset, LOCAL_FIXED_BYTES)
    require(u32(local, 0) == LOCAL_SIGNATURE.toLong()) { "ZIP local entry header is corrupt." }
    val localFlags = u16(local, 6)
    val localMethod = u16(local, 8)
    require(localFlags and ENCRYPTED_FLAG == 0) { "Encrypted ZIP entries are unsupported." }
    require(localMethod == entry.compressionMethod) { "ZIP compression method changed between index and entry." }
    val nameLength = u16(local, 26)
    val extraLength = u16(local, 28)
    val dataOffset = entry.localHeaderOffset + LOCAL_FIXED_BYTES + nameLength + extraLength
    require(dataOffset >= 0 && dataOffset + entry.compressedSize <= reader.size) { "ZIP entry data offset is invalid." }

    val compressed = exactRead(dataOffset, entry.compressedSize.toInt())
    val output = when (entry.compressionMethod) {
      STORED -> {
        require(compressed.size <= maxOutputBytes) { "ZIP entry exceeds the permitted output budget." }
        compressed
      }
      DEFLATED -> inflateRaw(compressed, maxOutputBytes)
      else -> throw IllegalArgumentException("Unsupported ZIP compression method: ${entry.compressionMethod}.")
    }
    require(output.size.toLong() == entry.uncompressedSize) { "ZIP entry size does not match the central directory." }
    val crc = CRC32().also { it.update(output) }.value
    require(crc == entry.crc32) { "ZIP entry CRC check failed." }
    return output
  }

  private fun exactRead(offset: Long, length: Int): ByteArray {
    require(offset >= 0 && length >= 0 && offset + length <= reader.size) { "ZIP read is outside archive bounds." }
    val bytes = reader.read(offset, length)
    require(bytes.size == length) { "ZIP range read ended early." }
    return bytes
  }

  private fun inflateRaw(input: ByteArray, maxOutputBytes: Int): ByteArray {
    val inflater = Inflater(true)
    try {
      val output = ByteArrayOutputStream(min(maxOutputBytes, 64 * 1024))
      InflaterInputStream(ByteArrayInputStream(input), inflater, 32 * 1024).use { stream ->
        val buffer = ByteArray(32 * 1024)
        while (true) {
          val count = stream.read(buffer)
          if (count < 0) break
          if (count == 0) continue
          require(output.size().toLong() + count <= maxOutputBytes.toLong()) { "ZIP entry expands beyond the permitted output budget." }
          output.write(buffer, 0, count)
        }
      }
      require(inflater.finished()) { "ZIP deflate stream is incomplete." }
      return output.toByteArray()
    } catch (error: IllegalArgumentException) {
      throw error
    } catch (error: Throwable) {
      throw IllegalArgumentException("ZIP entry could not be decompressed safely.", error)
    } finally {
      inflater.end()
    }
  }

  private fun requireSafeName(value: String) {
    require(value.isNotEmpty() && !value.contains('\u0000')) { "ZIP entry name is invalid." }
    val normalized = value.replace('\\', '/')
    require(!normalized.startsWith("/") && !WINDOWS_ABSOLUTE.containsMatchIn(normalized)) { "Unsafe absolute ZIP entry path." }
    require(normalized.split('/').none { it == ".." }) { "Unsafe ZIP entry path traversal." }
  }

  private fun findSignatureBackwards(bytes: ByteArray, signature: Int): Int {
    for (offset in bytes.size - 4 downTo 0) if (u32(bytes, offset) == signature.toLong()) return offset
    return -1
  }

  private fun u16(bytes: ByteArray, offset: Int): Int {
    require(offset >= 0 && offset + 2 <= bytes.size) { "ZIP integer read is out of bounds." }
    return (bytes[offset].toInt() and 0xff) or ((bytes[offset + 1].toInt() and 0xff) shl 8)
  }

  private fun u32(bytes: ByteArray, offset: Int): Long {
    require(offset >= 0 && offset + 4 <= bytes.size) { "ZIP integer read is out of bounds." }
    return (bytes[offset].toLong() and 0xffL) or
      ((bytes[offset + 1].toLong() and 0xffL) shl 8) or
      ((bytes[offset + 2].toLong() and 0xffL) shl 16) or
      ((bytes[offset + 3].toLong() and 0xffL) shl 24)
  }

  companion object {
    private const val EOCD_SIGNATURE = 0x06054b50
    private const val CENTRAL_SIGNATURE = 0x02014b50
    private const val LOCAL_SIGNATURE = 0x04034b50
    private const val EOCD_MIN_BYTES = 22
    private const val CENTRAL_FIXED_BYTES = 46
    private const val LOCAL_FIXED_BYTES = 30
    private const val MAX_EOCD_SEARCH = 65_557
    private const val ENCRYPTED_FLAG = 0x0001
    private const val UTF8_FLAG = 0x0800
    private const val STORED = 0
    private const val DEFLATED = 8
    private const val ZIP16_SENTINEL = 0xffff
    private const val ZIP32_SENTINEL = 0xffffffffL
    private val CP437: Charset = Charset.forName("Cp437")
    private val WINDOWS_ABSOLUTE = Regex("^[A-Za-z]:[/\\\\]")
  }
}
