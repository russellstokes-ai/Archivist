package app.archivist.reader

/**
 * Adds cancellation and elapsed-time enforcement around every seekable archive
 * range read. The caller owns the watchdog which flips shouldContinue or closes
 * the underlying descriptor; this class makes the probe stop cooperatively.
 */
internal class GuardedArchiveReader(
  private val reader: BoundedZipProbe.SeekableReader,
  private val now: () -> Long,
  private val shouldContinue: () -> Boolean,
  deadlineMs: Long = 2000,
) : BoundedZipProbe.SeekableReader {
  private val deadline = now() + deadlineMs.coerceAtLeast(1)

  override val size: Long
    get() = reader.size

  override fun read(offset: Long, length: Int): ByteArray {
    guard()
    val bytes = reader.read(offset, length)
    guard()
    return bytes
  }

  private fun guard() {
    if (!shouldContinue()) {
      throw BoundedArchiveEvidence.ProbeFailure("operation-cancelled", "Archive evidence read was cancelled.")
    }
    if (now() > deadline) {
      throw BoundedArchiveEvidence.ProbeFailure("operation-timeout", "Archive evidence read exceeded the 2 second deadline.")
    }
  }
}
