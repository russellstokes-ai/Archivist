package app.archivist.reader

import java.io.FilterInputStream
import java.io.InputStream

/** Bounded/cancellable compressed input used by the fast CBR probe. */
internal class GuardedArchiveInputStream(
  input:InputStream,
  private val maxBytes:Long,
  private val shouldContinue:()->Boolean,
  private val now:()->Long,
  private val deadlineAt:Long,
):FilterInputStream(input){
  private var consumed=0L

  override fun read():Int{
    guard(1)
    val value=super.read()
    if(value>=0){consumed+=1;guard(0)}
    return value
  }

  override fun read(buffer:ByteArray,offset:Int,length:Int):Int{
    if(length<=0)return super.read(buffer,offset,length)
    guard(1)
    val remaining=(maxBytes-consumed).coerceAtLeast(0)
    val allowed=minOf(length.toLong(),remaining+1).toInt()
    val count=super.read(buffer,offset,allowed)
    if(count>0){consumed+=count;guard(0)}
    return count
  }

  override fun skip(count:Long):Long{
    if(count<=0)return 0
    guard(1)
    val remaining=(maxBytes-consumed).coerceAtLeast(0)
    val skipped=super.skip(minOf(count,remaining+1))
    if(skipped>0){consumed+=skipped;guard(0)}
    return skipped
  }

  private fun guard(extra:Long){
    if(!shouldContinue())throw BoundedArchiveEvidence.ProbeFailure("operation-cancelled","Archive evidence read was cancelled.")
    if(now()>deadlineAt)throw BoundedArchiveEvidence.ProbeFailure("operation-timeout","Archive evidence read exceeded the 2 second deadline.")
    if(consumed+extra>maxBytes)throw BoundedArchiveEvidence.ProbeFailure("archive-read-budget","CBR fast probe exceeded its compressed-byte budget.")
  }
}
