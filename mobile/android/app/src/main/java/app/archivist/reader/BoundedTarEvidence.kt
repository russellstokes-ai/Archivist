package app.archivist.reader

import java.nio.charset.StandardCharsets

/** Bounded seekable TAR/CBT evidence reader. It reads headers plus selected entries only. */
internal object BoundedTarEvidence {
  private const val BLOCK = 512
  private const val MAX_ENTRIES = 10_000

  fun probe(reader: BoundedZipProbe.SeekableReader): BoundedArchiveEvidence.Evidence {
    var offset=0L
    var entries=0
    var metadataText:String?=null
    var coverName:String?=null
    var coverBytes:ByteArray?=null
    while(offset+BLOCK<=reader.size){
      val header=reader.read(offset,BLOCK)
      if(header.all{it.toInt()==0})break
      entries+=1
      if(entries>MAX_ENTRIES)throw BoundedArchiveEvidence.ProbeFailure("entry-limit","CBT archive contains too many entries for the fast probe.")
      val name=tarName(header)
      requireSafeName(name)
      val size=parseOctal(header,124,12)
      if(size<0)throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","CBT entry size is invalid.")
      val type=header[156].toInt().toChar()
      val dataOffset=offset+BLOCK
      val padded=((size+BLOCK-1)/BLOCK)*BLOCK
      val next=dataOffset+padded
      if(next<dataOffset||next>reader.size)throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","CBT entry exceeds archive bounds.")
      if(type!='5'){
        val base=name.replace('\\','/').substringAfterLast('/')
        if(metadataText==null&&base.equals("ComicInfo.xml",ignoreCase=true)){
          if(size>BoundedArchiveEvidence.MAX_XML_BYTES)throw BoundedArchiveEvidence.ProbeFailure("metadata-too-large","ComicInfo exceeds the 512 KiB fast-probe budget.")
          metadataText=String(readExact(reader,dataOffset,size.toInt()),StandardCharsets.UTF_8)
        }
        if(coverBytes==null&&isImage(name)){
          if(size<=BoundedArchiveEvidence.MAX_COVER_BYTES){
            coverName=name
            coverBytes=readExact(reader,dataOffset,size.toInt())
          }
        }
      }
      if(metadataText!=null&&coverBytes!=null)break
      offset=next
    }
    if(metadataText==null&&coverBytes==null)throw BoundedArchiveEvidence.ProbeFailure("metadata-missing","CBT contains no bounded metadata or cover evidence.")
    return BoundedArchiveEvidence.Evidence(
      metadataKind=if(metadataText!=null)"xml" else null,
      metadataText=metadataText,
      coverName=coverName,
      coverBytes=coverBytes,
    )
  }

  private fun readExact(reader:BoundedZipProbe.SeekableReader,offset:Long,length:Int):ByteArray{
    val value=reader.read(offset,length)
    if(value.size!=length)throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","CBT range read ended early.")
    return value
  }
  private fun tarName(header:ByteArray):String{
    val name=text(header,0,100)
    val prefix=text(header,345,155)
    return if(prefix.isBlank())name else "$prefix/$name"
  }
  private fun text(bytes:ByteArray,start:Int,length:Int):String{
    var end=start
    val limit=minOf(bytes.size,start+length)
    while(end<limit&&bytes[end].toInt()!=0)end++
    return String(bytes,start,end-start,StandardCharsets.UTF_8).trim()
  }
  private fun parseOctal(bytes:ByteArray,start:Int,length:Int):Long{
    val raw=text(bytes,start,length).trim().trim('\u0000',' ')
    if(raw.isEmpty())return 0
    return raw.toLongOrNull(8)?:throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","CBT entry size is not valid octal.")
  }
  private fun requireSafeName(value:String){
    if(value.isBlank()||value.contains('\u0000'))throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","CBT entry name is invalid.")
    val normalized=value.replace('\\','/')
    if(normalized.startsWith("/")||Regex("^[A-Za-z]:/").containsMatchIn(normalized)||normalized.split('/').any{it==".."})
      throw BoundedArchiveEvidence.ProbeFailure("archive-invalid","Unsafe CBT entry path.")
  }
  private fun isImage(value:String)=Regex("""(?i).+\.(jpe?g|png|gif|webp)$""").matches(value.replace('\\','/'))
}
