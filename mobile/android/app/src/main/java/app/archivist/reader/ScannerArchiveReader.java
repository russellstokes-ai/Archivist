package app.archivist.reader;
import java.io.*;import java.nio.charset.StandardCharsets;import java.util.*;import java.util.zip.*;
import javax.xml.parsers.SAXParserFactory;import org.xml.sax.*;import org.xml.sax.helpers.DefaultHandler;

/** Selected metadata only; bounded RAR staging stays private and never extracts member paths. */
public final class ScannerArchiveReader {
 public static final class Clues {
  public String status="unresolved",reason="archive-metadata-missing",container="zip";public long bytesRead;public byte[] cover;public final Map<String,String> fields=new LinkedHashMap<>();
 }
 public static final class PageEvidence {public String status="unresolved",reason="archive-page-evidence-missing",container="zip",text="";public final List<byte[]> images=new ArrayList<>();}
 private static final class ZipEntryInfo {final String name;final int flags,method;final long crc,compressed,plain,local;ZipEntryInfo(String n,int f,int m,long c,long z,long p,long l){name=n;flags=f;method=m;crc=c;compressed=z;plain=p;local=l;}}
 private static final class ArchiveReadException extends IOException {final String reason;ArchiveReadException(String reason){super(reason);this.reason=reason;}}
 private final FileInputStream input;private final ScannerTaskPool.Token token;private final Clues result=new Clues();private final long size;
 private boolean coverOnly,zipIndexValid;private long zipDirectoryOffset;private final List<ZipEntryInfo> zipEntries=new ArrayList<>();
 private ScannerArchiveReader(FileInputStream input,ScannerTaskPool.Token token)throws Exception{this.input=input;this.token=token;size=input.getChannel().size();}
 public static PageEvidence readEvidencePages(ScannerBoundedIO.SeekableOpener opener,ScannerTaskPool.Token token)throws Exception{
  token.check();try(FileInputStream input=opener.open(token)){token.check();if(input==null)throw new IOException("Archive descriptor unavailable");ScannerArchiveReader reader=new ScannerArchiveReader(input,token);reader.index();return reader.readEvidencePages();}
 }
 public static Clues read(ScannerBoundedIO.SeekableOpener opener,ScannerTaskPool.Token token)throws Exception{
  token.check();try(FileInputStream input=opener.open(token)){token.check();if(input==null)throw new IOException("Archive descriptor unavailable");return new ScannerArchiveReader(input,token).index();}
 }
 private Clues unresolved(String reason){result.reason=reason;result.status="unresolved";result.fields.clear();return result;}
 private File stageSevenZip()throws Exception{
  final long limit=64L*1024*1024;if(size<8||size>limit||result.bytesRead+size>limit)throw new ArchiveReadException("7z-archive-budget");File staged=File.createTempFile("scanner-7z-",".tmp");boolean complete=false;
  try{input.getChannel().position(0);try(OutputStream output=new BufferedOutputStream(new FileOutputStream(staged))){byte[] buffer=new byte[32768];long copied=0;int n;while((n=input.read(buffer))!=-1){token.check();if(n==0||copied+n>limit)throw new ArchiveReadException("7z-archive-budget");output.write(buffer,0,n);copied+=n;result.bytesRead+=n;}if(copied!=size)throw new ArchiveReadException("7z-archive-invalid");}token.check();complete=true;return staged;}finally{if(!complete)deleteStaged(staged);}
 }
 private Clues readSevenZip()throws Exception{
  File staged=null;try{staged=stageSevenZip();byte[] bytes=coverOnly?ScannerSevenZipReader.readCover(staged,token):ScannerSevenZipReader.readComicInfo(staged,token);if(coverOnly){result.cover=bytes;return result;}return parseXml(bytes,"bounded-7z-metadata");}
  catch(ArchiveReadException error){return unresolved(error.reason);}catch(ScannerSevenZipReader.Failure error){if(token.isCancelled())throw new java.util.concurrent.CancellationException("Archive read cancelled");return unresolved(error.reason);}
  finally{if(staged!=null)deleteStaged(staged);}
 }
 private static void deleteStaged(File staged){if(staged.exists()&&!staged.delete())staged.deleteOnExit();}
 public static byte[] readCover(ScannerBoundedIO.SeekableOpener opener,ScannerTaskPool.Token token)throws Exception{
  token.check();try(FileInputStream input=opener.open(token)){if(input==null)throw new IOException("Archive descriptor unavailable");ScannerArchiveReader reader=new ScannerArchiveReader(input,token);reader.coverOnly=true;byte[] bytes=reader.index().cover;if(bytes==null)throw new IOException("Embedded cover unavailable");return bytes;}
 }
 private byte[] at(long offset,int length)throws Exception{
  if(offset<0||length<0||offset>size-length||result.bytesRead+length>8388608)throw new IOException("Archive source-read budget or bounds exceeded");
  token.check();input.getChannel().position(offset);byte[] bytes=new byte[length];int count=0;
  while(count<length){token.check();int n=input.read(bytes,count,Math.min(8192,length-count));token.check();if(n<=0)throw new IOException("Archive truncated or no read progress");count+=n;result.bytesRead+=n;}
  return bytes;
 }
 private static int u16(byte[] b,int o){return (b[o]&255)|((b[o+1]&255)<<8);}
 private static long u32(byte[] b,int o){return (b[o]&255L)|((b[o+1]&255L)<<8)|((b[o+2]&255L)<<16)|((b[o+3]&255L)<<24);}
 private Clues readRar()throws Exception{
  final long archiveLimit=64L*1024*1024;final int metadataLimit=262144;
  if(size<8||size>archiveLimit||result.bytesRead+size>archiveLimit)return unresolved("rar-archive-budget");
  File staged=File.createTempFile("scanner-rar-",".tmp");
  try{
   input.getChannel().position(0);try(OutputStream output=new BufferedOutputStream(new FileOutputStream(staged))){byte[] buffer=new byte[32768];long copied=0;int n;while((n=input.read(buffer))!=-1){token.check();if(n==0||copied+n>archiveLimit)return unresolved("rar-archive-budget");output.write(buffer,0,n);copied+=n;result.bytesRead+=n;}if(copied!=size)return unresolved("rar-archive-invalid");}
   token.check();Class<?> archiveType=Class.forName("com.github.junrar.Archive");Object archive=archiveType.getConstructor(File.class).newInstance(staged);
   try{
    @SuppressWarnings("unchecked") List<Object> headers=(List<Object>)archiveType.getMethod("getFileHeaders").invoke(archive);
    if(headers==null||headers.size()>10000)return unresolved("rar-entry-budget");Object selected=null;
    if(coverOnly){ArrayList<Object> images=new ArrayList<>();for(Object header:headers){token.check();Class<?> type=header.getClass();boolean directory=(Boolean)type.getMethod("isDirectory").invoke(header);String name=String.valueOf(type.getMethod("getFileName").invoke(header)).replace('\\','/');String lower=name.toLowerCase(Locale.ROOT);if(!directory&&isSafeEntryName(name)&&!lower.startsWith("__macosx/")&&lower.matches(".*\\.(jpg|jpeg|png)$"))images.add(header);}images.sort(Comparator.comparing((Object header)->{try{return String.valueOf(header.getClass().getMethod("getFileName").invoke(header)).replace('\\','/').toLowerCase(Locale.ROOT);}catch(Exception error){return "";}}).thenComparing(header->{try{return String.valueOf(header.getClass().getMethod("getFileName").invoke(header));}catch(Exception error){return "";}}));if(!images.isEmpty())selected=images.get(0);}
    else for(Object header:headers){token.check();Class<?> type=header.getClass();boolean directory=(Boolean)type.getMethod("isDirectory").invoke(header);String name=String.valueOf(type.getMethod("getFileName").invoke(header)).replace('\\','/');if(!directory&&name.toLowerCase(Locale.ROOT).matches("(?:.*/)?comicinfo\\.xml")){if(selected!=null)return unresolved("rar-metadata-ambiguous");selected=header;}}
    if(selected==null)return unresolved(coverOnly?"rar-cover-missing":"archive-metadata-missing");Class<?> headerType=selected.getClass();if((Boolean)headerType.getMethod("isEncrypted").invoke(selected))return unresolved("archive-compression-unsupported");long declared=((Number)headerType.getMethod("getFullUnpackSize").invoke(selected)).longValue();int decodedLimit=coverOnly?4194304:metadataLimit;if(declared<1||declared>decodedLimit)return unresolved(coverOnly?"rar-cover-budget":"archive-metadata-budget");    InputStream member=(InputStream)archiveType.getMethod("getInputStream",headerType).invoke(archive,selected);byte[] decoded;
    try(InputStream source=member;ByteArrayOutputStream output=new ByteArrayOutputStream((int)declared)){byte[] buffer=new byte[8192];int n;while((n=source.read(buffer))!=-1){token.check();if(n==0||output.size()+n>decodedLimit)return unresolved(coverOnly?"rar-cover-budget":"archive-metadata-budget");output.write(buffer,0,n);}decoded=output.toByteArray();}
    if(decoded.length!=declared)return unresolved(coverOnly?"rar-cover-invalid":"archive-metadata-invalid");token.check();if(coverOnly){result.cover=decoded;return result;}return parseXml(decoded,"bounded-rar-metadata");
   }finally{try{archiveType.getMethod("close").invoke(archive);}catch(Exception ignored){}}
  }catch(ClassNotFoundException error){return unresolved("rar-metadata-engine-unavailable");}
  catch(java.lang.reflect.InvocationTargetException error){if(token.isCancelled())throw new java.util.concurrent.CancellationException("Archive read cancelled");return unresolved("rar-metadata-invalid");}
  catch(ReflectiveOperationException error){return unresolved("rar-metadata-engine-unavailable");}
  finally{if(staged.exists()&&!staged.delete())staged.deleteOnExit();}
 } private PageEvidence readEvidencePages()throws Exception{
  PageEvidence evidence=new PageEvidence();evidence.container=result.container;
  if("cb7".equals(result.container)){try{File staged=stageSevenZip();try{evidence.images.addAll(ScannerSevenZipReader.readFirstImages(staged,token,2,4194304));}finally{deleteStaged(staged);}boolean found=!evidence.images.isEmpty();evidence.status=found?"parsed":"unresolved";evidence.reason=found?"bounded-7z-comic-images":"archive-page-evidence-missing";return evidence;}catch(ArchiveReadException error){evidence.reason=error.reason;return evidence;}catch(ScannerSevenZipReader.Failure error){evidence.reason=error.reason;return evidence;}}
  if(!zipIndexValid){evidence.reason=result.reason;return evidence;}
  try{
   if("epub".equals(result.container))evidence.text=readEpubText();
   else if("cbz".equals(result.container))evidence.images.addAll(readComicPages());
   else{evidence.reason="archive-page-evidence-unsupported";return evidence;}
   boolean found=!evidence.text.isEmpty()||!evidence.images.isEmpty();evidence.status=found?"parsed":"unresolved";evidence.reason=found?("epub".equals(result.container)?"bounded-epub-spine-text":"bounded-comic-page-images"):"archive-page-evidence-missing";return evidence;
  }catch(ArchiveReadException error){evidence.reason=error.reason;return evidence;}
  catch(SAXException error){evidence.reason="archive-metadata-invalid";return evidence;}
 }
 private List<byte[]> readComicPages()throws Exception{
  ArrayList<ZipEntryInfo> candidates=new ArrayList<>();for(ZipEntryInfo entry:zipEntries){String lower=entry.name.toLowerCase(Locale.ROOT);if(isSafeEntryName(entry.name)&&!lower.startsWith("__macosx/")&&!lower.startsWith("meta-inf/")&&lower.matches(".*\\.(jpg|jpeg|png)$")&&!entry.name.endsWith("/"))candidates.add(entry);}
  candidates.sort(Comparator.comparing(entry->entry.name.toLowerCase(Locale.ROOT)));ArrayList<byte[]> pages=new ArrayList<>(2);int used=0;
  for(ZipEntryInfo entry:candidates){token.check();if(pages.size()==2)break;if(entry.plain<1||entry.plain>4194304-used||entry.compressed>4194304-used)continue;try{byte[] page=readZipEntry(entry,zipDirectoryOffset,4194304-used,4194304-used);if(used+page.length<=4194304){pages.add(page);used+=page.length;}}catch(ArchiveReadException ignored){token.check();}}
  return pages;
 }
 private String readEpubText()throws Exception{
  ZipEntryInfo container=findZipEntry("META-INF/container.xml");if(container==null)throw new ArchiveReadException("epub-container-missing");byte[] containerBytes=readZipEntry(container,zipDirectoryOffset,262144,262144);String opfPath=parseContainer(containerBytes);
  ZipEntryInfo opf=findZipEntry(opfPath);if(opf==null)throw new ArchiveReadException("epub-package-missing");byte[] opfBytes=readZipEntry(opf,zipDirectoryOffset,262144,262144);EpubPackage epub=parsePackage(opfBytes,opfPath);
  StringBuilder text=new StringBuilder();int documents=0;
  for(String id:epub.spine){token.check();EpubItem item=epub.items.get(id);if(item==null)throw new ArchiveReadException("epub-spine-invalid");if(!"application/xhtml+xml".equalsIgnoreCase(item.mediaType)&&!"text/html".equalsIgnoreCase(item.mediaType))continue;
   if(documents>=3)break;String path=resolveArchivePath(opfPath,item.href);if(path==null)throw new ArchiveReadException("epub-path-invalid");ZipEntryInfo page=findZipEntry(path);if(page==null)throw new ArchiveReadException("epub-spine-entry-missing");byte[] bytes=readZipEntry(page,zipDirectoryOffset,1048576,1048576);String pageText=parseXhtml(bytes);documents++;if(!pageText.isEmpty())appendUtf8(text,(documents==1?"":"\n")+pageText,16384);
  }
  return text.toString().trim();
 }
 private static final class EpubItem {final String href,mediaType;EpubItem(String href,String mediaType){this.href=href;this.mediaType=mediaType;}}
 private static final class EpubPackage {final Map<String,EpubItem> items=new HashMap<>();final List<String> spine=new ArrayList<>();}
 private String parseContainer(byte[] bytes)throws Exception{
  final String[] path={null};parseSafeXml(bytes,new DefaultHandler(){int roots;public void startElement(String uri,String local,String q,Attributes attrs)throws SAXException{if("rootfile".equals(local.isEmpty()?q:local)){String value=attrs.getValue("full-path");if(value==null||value.length()>2048||++roots>1)throw new SAXException("Ambiguous EPUB rootfile");path[0]=resolveArchivePath("",value);if(path[0]==null)throw new SAXException("Invalid EPUB package path");}}});
  if(path[0]==null)throw new ArchiveReadException("epub-container-invalid");return path[0];
 }
 private EpubPackage parsePackage(byte[] bytes,String opfPath)throws Exception{
  EpubPackage value=new EpubPackage();parseSafeXml(bytes,new DefaultHandler(){int rootCount;public void startElement(String uri,String local,String q,Attributes attrs)throws SAXException{String name=local.isEmpty()?q:local;if(rootCount==0){rootCount++;if(!"package".equalsIgnoreCase(name))throw new SAXException("Invalid EPUB package root");}
   if("item".equalsIgnoreCase(name)){String id=attrs.getValue("id"),href=attrs.getValue("href"),media=attrs.getValue("media-type");if(id==null||id.isEmpty()||id.length()>256||href==null||href.length()>2048||media==null||media.length()>128||value.items.size()>=10000||value.items.put(id,new EpubItem(href,media))!=null)throw new SAXException("Invalid EPUB manifest");}
   else if("itemref".equalsIgnoreCase(name)){String id=attrs.getValue("idref");if(id==null||id.isEmpty()||id.length()>256||value.spine.size()>=10000)throw new SAXException("Invalid EPUB spine");value.spine.add(id);}
  }});
  return value;
 }
 private String parseXhtml(byte[] bytes)throws Exception{
  StringBuilder out=new StringBuilder();int[] outBytes={0};parseSafeXml(bytes,new DefaultHandler(){int suppressed;boolean head;void boundary(){if(suppressed==0&&out.length()>0&&(out.charAt(out.length()-1)!='\n'))outBytes[0]=appendUtf8(out,"\n",16384,outBytes[0]);}public void startElement(String uri,String local,String q,Attributes attrs){String name=(local.isEmpty()?q:local).toLowerCase(Locale.ROOT);if(name.equals("head"))head=true;if(name.equals("script")||name.equals("style")||name.equals("head")||name.equals("nav"))suppressed++;else if(name.equals("br"))boundary();else if(isBlockElement(name))boundary();}
   public void endElement(String uri,String local,String q){String name=(local.isEmpty()?q:local).toLowerCase(Locale.ROOT);if(name.equals("script")||name.equals("style")||name.equals("head")||name.equals("nav"))suppressed=Math.max(0,suppressed-1);if(name.equals("head"))head=false;else if(isBlockElement(name))boundary();}
   public void characters(char[] chars,int start,int length){if(suppressed==0&&!head&&outBytes[0]<16384)outBytes[0]=appendUtf8(out,new String(chars,start,length),16384,outBytes[0]);}
  });return out.toString().trim();
 }
 private static boolean isBlockElement(String name){return name.equals("p")||name.equals("div")||name.equals("li")||name.equals("section")||name.equals("article")||name.equals("h1")||name.equals("h2")||name.equals("h3")||name.equals("h4")||name.equals("h5")||name.equals("h6")||name.equals("blockquote")||name.equals("tr")||name.equals("td")||name.equals("th")||name.equals("title");} private void parseSafeXml(byte[] bytes,DefaultHandler handler)throws Exception{
  String xml=utf8(bytes);String upper=xml.toUpperCase(Locale.ROOT);if(upper.contains("<!DOCTYPE")||upper.contains("<!ENTITY"))throw new SAXException("DTD and entities forbidden");
  SAXParserFactory factory=SAXParserFactory.newInstance();factory.setNamespaceAware(true);factory.setXIncludeAware(false);XMLReader reader=factory.newSAXParser().getXMLReader();reader.setFeature("http://xml.org/sax/features/external-general-entities",false);reader.setFeature("http://xml.org/sax/features/external-parameter-entities",false);reader.setEntityResolver((publicId,systemId)->{throw new SAXException("External entity forbidden");});reader.setContentHandler(new DefaultHandler(){int depth,nodes;public void startElement(String uri,String local,String q,Attributes attrs)throws SAXException{token.check();if(++depth>32||++nodes>10000)throw new SAXException("XML structure budget");handler.startElement(uri,local,q,attrs);}public void characters(char[] chars,int start,int length)throws SAXException{token.check();handler.characters(chars,start,length);}public void endElement(String uri,String local,String q)throws SAXException{handler.endElement(uri,local,q);depth--;}});reader.parse(new InputSource(new StringReader(xml)));token.check();
 }
 private static String utf8(byte[] bytes)throws Exception{
  String value=StandardCharsets.UTF_8.newDecoder().onMalformedInput(java.nio.charset.CodingErrorAction.REPORT).onUnmappableCharacter(java.nio.charset.CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(bytes)).toString();if(value.indexOf('\0')>=0||value.indexOf('\ufffd')>=0)throw new SAXException("Invalid UTF-8 XML");return value;
 }
 private static void appendUtf8(StringBuilder output,String value,int byteLimit){appendUtf8(output,value,byteLimit,output.toString().getBytes(StandardCharsets.UTF_8).length);}
 private static int appendUtf8(StringBuilder output,String value,int byteLimit,int used){for(int i=0;i<value.length()&&used<byteLimit;){int cp=value.codePointAt(i),chars=Character.charCount(cp),bytes=cp<=0x7f?1:cp<=0x7ff?2:cp<=0xffff?3:4;if(used+bytes>byteLimit)break;output.appendCodePoint(cp);used+=bytes;i+=chars;}return used;}
 private static String resolveArchivePath(String baseFile,String reference){try{if(reference==null||reference.isEmpty()||reference.indexOf('\\')>=0)return null;java.net.URI ref=new java.net.URI(reference);if(ref.isAbsolute()||ref.getRawAuthority()!=null||ref.getRawQuery()!=null||hasTraversal(ref.getPath()))return null;java.net.URI base=new java.net.URI(null,null,baseFile,null);java.net.URI resolved=base.resolve(ref).normalize();String path=resolved.getPath();if(path==null||path.startsWith("/"))return null;return isSafeEntryName(path)?path:null;}catch(Exception error){return null;}}
 private static boolean hasTraversal(String path){if(path==null)return true;for(String part:path.split("/"))if(part.equals(".."))return true;return false;}
 private static boolean isSafeEntryName(String name){if(name==null||name.isEmpty()||name.startsWith("/")||name.indexOf('\\')>=0)return false;for(String part:name.split("/"))if(part.equals(".."))return false;return true;}
 private ZipEntryInfo findZipEntry(String name){ZipEntryInfo selected=null;for(ZipEntryInfo entry:zipEntries)if(entry.name.equals(name)){if(selected!=null)return null;selected=entry;}return selected;}
 private byte[] readZipEntry(ZipEntryInfo entry,long directoryOffset,int plainLimit,int compressedLimit)throws Exception{
  if(entry==null||(entry.flags&1)!=0||entry.method!=0&&entry.method!=8)throw new ArchiveReadException("archive-compression-unsupported");
  if(entry.plain>plainLimit||entry.compressed>compressedLimit||entry.plain>Integer.MAX_VALUE||entry.compressed>Integer.MAX_VALUE)throw new ArchiveReadException("archive-metadata-budget");
  if(entry.local>size-30)throw new ArchiveReadException("archive-entry-invalid");byte[] header=at(entry.local,30);if(u32(header,0)!=0x04034b50L||u16(header,8)!=entry.method||(u16(header,6)&1)!=0)throw new ArchiveReadException("archive-entry-invalid");
  long start=entry.local+30+u16(header,26)+u16(header,28);if(start>directoryOffset-entry.compressed)throw new ArchiveReadException("archive-entry-invalid");byte[] encoded=at(start,(int)entry.compressed),decoded;
  if(entry.method==0)decoded=encoded;else{Inflater inflater=new Inflater(true);try(InputStream stream=new InflaterInputStream(new ByteArrayInputStream(encoded),inflater);ByteArrayOutputStream output=new ByteArrayOutputStream((int)entry.plain)){byte[] buffer=new byte[8192];int n;while((n=stream.read(buffer))!=-1){token.check();if(n==0||output.size()+n>entry.plain||output.size()+n>plainLimit)throw new ArchiveReadException("archive-metadata-budget");output.write(buffer,0,n);}decoded=output.toByteArray();}catch(IOException error){if(error instanceof ArchiveReadException)throw error;throw new ArchiveReadException("archive-metadata-invalid");}finally{inflater.end();}}
  CRC32 check=new CRC32();check.update(decoded);if(decoded.length!=entry.plain||check.getValue()!=entry.crc)throw new ArchiveReadException("archive-metadata-invalid");return decoded;
 } private Clues index()throws Exception{
  if(size<4)return unresolved("archive-index-missing");
  byte[] magic=at(0,(int)Math.min(size,8));
  if(magic.length>=7&&(magic[0]&255)==0x37&&(magic[1]&255)==0x7a&&(magic[2]&255)==0xbc&&(magic[3]&255)==0xaf&&(magic[4]&255)==0x27&&(magic[5]&255)==0x1c){result.container="cb7";return readSevenZip();}
  if(magic[0]=='R'&&magic[1]=='a'&&magic[2]=='r'&&magic[3]=='!'){result.container="cbr";return readRar();}
  if(size<22)return unresolved("archive-index-missing");
  byte[] tail=at(Math.max(0,size-65557),(int)Math.min(size,65557));int end=-1;
  for(int i=tail.length-22;i>=0;i--){token.check();if(u32(tail,i)==0x06054b50L&&i+22+u16(tail,i+20)==tail.length){end=i;break;}}
  if(end<0)return unresolved("archive-index-missing");
  int count=u16(tail,end+10);long directorySize=u32(tail,end+12),directoryOffset=u32(tail,end+16);
  if(u16(tail,end+4)!=0||u16(tail,end+6)!=0||u16(tail,end+8)!=count||count==65535||directorySize==0xffffffffL||directoryOffset==0xffffffffL)return unresolved("archive-layout-unsupported");
  if(count>1024)return unresolved("archive-entry-budget");
  if(directorySize>262144)return unresolved("archive-index-budget");
  if(directoryOffset>size-directorySize||directoryOffset+directorySize>size-tail.length+end)return unresolved("archive-index-invalid");
  byte[] directory=at(directoryOffset,(int)directorySize);int offset=0,selected=-1,matches=0,cover=-1,firstImage=-1;String firstName=null;zipEntries.clear();
  for(int i=0;i<count;i++){
   token.check();if(offset+46>directory.length||u32(directory,offset)!=0x02014b50L)return unresolved("archive-index-invalid");
   int nameLength=u16(directory,offset+28),next=offset+46+nameLength+u16(directory,offset+30)+u16(directory,offset+32);
   if(nameLength>2048||next>directory.length)return unresolved("archive-index-invalid");
   String rawName=new String(directory,offset+46,nameLength,StandardCharsets.UTF_8).replace('\\','/');String name=rawName.toLowerCase(Locale.ROOT);int entryIndex=zipEntries.size();zipEntries.add(new ZipEntryInfo(rawName,u16(directory,offset+8),u16(directory,offset+10),u32(directory,offset+16),u32(directory,offset+20),u32(directory,offset+24),u32(directory,offset+42)));
   if(!name.startsWith("/")&&!Arrays.asList(name.split("/")).contains("..")&&!name.startsWith("__macosx/")&&name.matches(".*\\.(jpg|jpeg|png)$")){
    if(firstName==null||name.compareTo(firstName)<0){firstImage=entryIndex;firstName=name;}
    if(name.matches("(?:.*/)?(?:cover|front|frontcover|coverimage)\\.(jpg|jpeg|png)$"))cover=entryIndex;
   }
   if(name.equals("meta-inf/container.xml"))result.container="epub";
   else if(!result.container.equals("epub")&&(name.matches(".*\\.(jpg|jpeg|png|webp|gif)$")||name.endsWith("comicinfo.xml")))result.container="cbz";
   if(!name.startsWith("/")&&!Arrays.asList(name.split("/")).contains("..")&&(name.equals("comicinfo.xml")||name.endsWith("/comicinfo.xml")||name.endsWith(".opf"))){selected=entryIndex;matches++;}
   offset=next;
  }
  if(offset!=directory.length)return unresolved("archive-index-invalid");zipIndexValid=true;zipDirectoryOffset=directoryOffset;
  if(coverOnly){selected=cover>=0?cover:result.container.equals("cbz")?firstImage:-1;matches=selected>=0?1:0;}
  if(matches==0)return result;if(matches!=1)return unresolved("archive-metadata-ambiguous");
  byte[] decoded;try{decoded=readZipEntry(zipEntries.get(selected),directoryOffset,coverOnly?4194304:262144,coverOnly?4194304:1048576);}catch(ArchiveReadException error){return unresolved(error.reason);}
  if(coverOnly){result.cover=decoded;return result;}
  return parseXml(decoded,"bounded-zip-metadata");
 }
 private Clues parseXml(byte[] decoded,String successReason)throws Exception{
  String xml=new String(decoded,StandardCharsets.UTF_8),upper=xml.toUpperCase(Locale.ROOT);
  if(xml.indexOf('\0')>=0||xml.indexOf('\ufffd')>=0||upper.contains("<!DOCTYPE")||upper.contains("<!ENTITY"))return unresolved("archive-metadata-invalid");
  try{
   SAXParserFactory factory=SAXParserFactory.newInstance();factory.setNamespaceAware(true);XMLReader reader=factory.newSAXParser().getXMLReader();
   reader.setFeature("http://xml.org/sax/features/external-general-entities",false);reader.setFeature("http://xml.org/sax/features/external-parameter-entities",false);
   reader.setEntityResolver((publicId,systemId)->{throw new SAXException("External entity forbidden");});
   reader.setContentHandler(new DefaultHandler(){int depth,nodes;String field;StringBuilder text;
    public void startElement(String uri,String local,String q,Attributes attrs)throws SAXException{
     token.check();if(++depth>32||++nodes>2048)throw new SAXException("XML budget");String name=local.isEmpty()?q:local;
     if(depth==1&&!name.equalsIgnoreCase("ComicInfo")&&!name.equals("package"))throw new SAXException("Unexpected metadata root");
     String key=name.toLowerCase(Locale.ROOT);field=key.equals("title")?"title":key.equals("writer")||key.equals("creator")?"author":key.equals("genre")||key.equals("subject")?"genre":key.equals("series")?"series":key.equals("number")?"seriesNumber":key.equals("year")||key.equals("date")?"publishedYear":key.equals("publisher")?"publisher":key.equals("summary")||key.equals("description")?"description":key.equals("languageiso")||key.equals("language")?"language":key.equals("isbn")?"isbn":null;
     if(key.equals("identifier")){String scheme=attrs.getValue("http://www.idpf.org/2007/opf","scheme");if(scheme==null)scheme=attrs.getValue("opf:scheme");if("ISBN".equalsIgnoreCase(scheme))field="isbn";else field="identifier";}
     if(key.equals("meta")){String property=attrs.getValue("property"),metaName=attrs.getValue("name"),content=attrs.getValue("content");if("belongs-to-collection".equals(property))field="series";if("group-position".equals(property))field="seriesNumber";if(content!=null&&"calibre:series".equals(metaName))result.fields.put("series",content);if(content!=null&&"calibre:series_index".equals(metaName))result.fields.put("seriesNumber",content);}
     text=field==null?null:new StringBuilder();
    }
    public void characters(char[] chars,int start,int length)throws SAXException{token.check();if(text!=null){if(text.length()+length>4096)throw new SAXException("Field budget");text.append(chars,start,length);}}
    public void endElement(String uri,String local,String q){if(field!=null&&text!=null){String value=text.toString().trim();if(field.equals("publishedYear")&&value.matches("\\d{4}.*"))value=value.substring(0,4);if(field.equals("identifier")){if(value.toLowerCase(Locale.ROOT).startsWith("urn:isbn:")){field="isbn";value=value.substring(9);}else value="";}
     if(field.equals("isbn")){value=value.replaceAll("[-\\s]","");if(!value.matches("(?:[0-9]{13}|[0-9]{9}[0-9Xx])"))value="";}
     if(!value.isEmpty()){String prior=result.fields.get(field);if((field.equals("genre")||field.equals("author"))&&prior!=null&&!Arrays.asList(prior.split("; ")).contains(value)){String joined=prior+"; "+value;if(joined.length()<=512)result.fields.put(field,joined);}else result.fields.putIfAbsent(field,value);}
    }field=null;text=null;depth--;}
   });
   reader.parse(new InputSource(new StringReader(xml)));token.check();
  }catch(SAXException error){return unresolved("archive-metadata-invalid");}
  result.status=result.fields.isEmpty()?"unresolved":"parsed";result.reason=result.fields.isEmpty()?"archive-metadata-missing":successReason;return result;
 }
 }
