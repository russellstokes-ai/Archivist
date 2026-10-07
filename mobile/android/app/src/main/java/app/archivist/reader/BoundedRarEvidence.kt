package app.archivist.reader

import com.github.junrar.Archive
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets

/** Bounded CBR evidence selection; unrelated entries are never decompressed. */
internal object BoundedRarEvidence {
  private const val MAX_COMPRESSED_SCAN=32L*1024*1024
  private const val MAX_ENTRIES=10_000

  fun probe(input:InputStream,shouldContinue:()->Boolean,now:()->Long,deadlineAt:Long):BoundedArchiveEvidence.Evidence{
    var metadata:String?=null
    var coverName:String?=null
    var cover:ByteArray?=null
    val guarded=GuardedArchiveInputStream(input,MAX_COMPRESSED_SCAN,shouldContinue,now,deadlineAt)
    try{
      Archive(guarded).use{archive->
        var entries=0
        while(true){
          if(!shouldContinue())throw BoundedArchiveEvidence.ProbeFailure("operation-cancelled","Archive evidence read was cancelled.")
          if(now()>deadlineAt)throw BoundedArchiveEvidence.ProbeFailure("operation-timeout","Archive evidence read exceeded the 2 second deadline.")
          val header=archive.nextFileHeader()?:break
          if(header.isDirectory)continue
          if(++entries>MAX_ENTRIES)throw BoundedArchiveEvidence.ProbeFailure("entry-limit","CBR archive contains too many entries for the fast probe.")
          val name=(header.fileName ?: "").replace('\\','/')
          if(name.isBlank()||name.startsWith("/")||name.split('/').any{it==".."})throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","Unsafe CBR entry path.")
          val base=name.substringAfterLast('/')
          val size=header.fullUnpackSize
          if(metadata==null&&base.equals("ComicInfo.xml",ignoreCase=true)){
            if(size<0||size>BoundedArchiveEvidence.MAX_XML_BYTES)throw BoundedArchiveEvidence.ProbeFailure("metadata-too-large","ComicInfo exceeds the 512 KiB fast-probe budget.")
            metadata=String(readSelected(archive.getInputStream(header),BoundedArchiveEvidence.MAX_XML_BYTES),StandardCharsets.UTF_8)
          }else if(cover==null&&isImage(name)){
            if(size>=0&&size<=BoundedArchiveEvidence.MAX_COVER_BYTES){
              coverName=name
              cover=readSelected(archive.getInputStream(header),BoundedArchiveEvidence.MAX_COVER_BYTES)
            }
          }
          if(metadata!=null&&cover!=null)break
        }
      }
    }catch(error:BoundedArchiveEvidence.ProbeFailure){throw error}
    catch(error:Throwable){throw BoundedArchiveEvidence.ProbeFailure("archive-invalid",error.message?:"CBR archive could not be read safely.",error)}
    if(metadata==null&&cover==null)throw BoundedArchiveEvidence.ProbeFailure("metadata-missing","CBR contains no bounded metadata or cover evidence.")
    return BoundedArchiveEvidence.Evidence(if(metadata!=null)"xml" else null,metadata,coverName,cover)
  }

  private fun readSelected(input:InputStream,limit:Int):ByteArray{
    input.use{source->
      val out=ByteArrayOutputStream(minOf(limit,64*1024))
      val buffer=ByteArray(32*1024)
      while(true){
        val count=source.read(buffer)
        if(count<0)break
        if(count==0)continue
        if(out.size().toLong()+count>limit)throw BoundedArchiveEvidence.ProbeFailure("entry-too-large","CBR selected entry exceeds its fast-probe budget.")
        out.write(buffer,0,count)
      }
      return out.toByteArray()
    }
  }
  private fun isImage(value:String)=Regex("""(?i).+\.(jpe?g|png|gif|webp)$""").matches(value)
}
