package app.archivist.reader;
import java.io.*;import java.nio.charset.StandardCharsets;import java.util.*;import java.util.zip.*;
import javax.xml.parsers.SAXParserFactory;import org.xml.sax.*;import org.xml.sax.helpers.DefaultHandler;

/** Selected metadata only; no extraction to disk and no sequential whole-archive fallback. */
public final class ScannerArchiveReader {
 public static final class Clues {
  public String status="unresolved",reason="archive-metadata-missing";public long bytesRead;public final Map<String,String> fields=new LinkedHashMap<>();
 }
 private final FileInputStream input;private final ScannerTaskPool.Token token;private final Clues result=new Clues();private final long size;
 private ScannerArchiveReader(FileInputStream input,ScannerTaskPool.Token token)throws Exception{this.input=input;this.token=token;size=input.getChannel().size();}
 public static Clues read(ScannerBoundedIO.SeekableOpener opener,ScannerTaskPool.Token token)throws Exception{
  token.check();try(FileInputStream input=opener.open(token)){token.check();if(input==null)throw new IOException("Archive descriptor unavailable");return new ScannerArchiveReader(input,token).index();}
 }
 private Clues unresolved(String reason){result.reason=reason;result.status="unresolved";result.fields.clear();return result;}
 private byte[] at(long offset,int length)throws Exception{
  if(offset<0||length<0||offset>size-length||result.bytesRead+length>8388608)throw new IOException("Archive source-read budget or bounds exceeded");
  token.check();input.getChannel().position(offset);byte[] bytes=new byte[length];int count=0;
  while(count<length){token.check();int n=input.read(bytes,count,Math.min(8192,length-count));token.check();if(n<=0)throw new IOException("Archive truncated or no read progress");count+=n;result.bytesRead+=n;}
  return bytes;
 }
 private static int u16(byte[] b,int o){return (b[o]&255)|((b[o+1]&255)<<8);}
 private static long u32(byte[] b,int o){return (b[o]&255L)|((b[o+1]&255L)<<8)|((b[o+2]&255L)<<16)|((b[o+3]&255L)<<24);}
 private Clues index()throws Exception{
  if(size<4)return unresolved("archive-index-missing");
  byte[] magic=at(0,(int)Math.min(size,8));
  if(magic[0]=='R'&&magic[1]=='a'&&magic[2]=='r'&&magic[3]=='!')return unresolved("rar-metadata-unsupported");
  if(size<22)return unresolved("archive-index-missing");
  byte[] tail=at(Math.max(0,size-65557),(int)Math.min(size,65557));int end=-1;
  for(int i=tail.length-22;i>=0;i--){token.check();if(u32(tail,i)==0x06054b50L&&i+22+u16(tail,i+20)==tail.length){end=i;break;}}
  if(end<0)return unresolved("archive-index-missing");
  int count=u16(tail,end+10);long directorySize=u32(tail,end+12),directoryOffset=u32(tail,end+16);
  if(u16(tail,end+4)!=0||u16(tail,end+6)!=0||u16(tail,end+8)!=count||count==65535||directorySize==0xffffffffL||directoryOffset==0xffffffffL)return unresolved("archive-layout-unsupported");
  if(count>1024)return unresolved("archive-entry-budget");
  if(directorySize>262144)return unresolved("archive-index-budget");
  if(directoryOffset>size-directorySize||directoryOffset+directorySize>size-tail.length+end)return unresolved("archive-index-invalid");
  byte[] directory=at(directoryOffset,(int)directorySize);int offset=0,selected=-1,matches=0;
  for(int i=0;i<count;i++){
   token.check();if(offset+46>directory.length||u32(directory,offset)!=0x02014b50L)return unresolved("archive-index-invalid");
   int nameLength=u16(directory,offset+28),next=offset+46+nameLength+u16(directory,offset+30)+u16(directory,offset+32);
   if(nameLength>2048||next>directory.length)return unresolved("archive-index-invalid");
   String name=new String(directory,offset+46,nameLength,StandardCharsets.UTF_8).replace('\\','/').toLowerCase(Locale.ROOT);
   if(!name.startsWith("/")&&!Arrays.asList(name.split("/")).contains("..")&&(name.equals("comicinfo.xml")||name.endsWith("/comicinfo.xml")||name.endsWith(".opf"))){selected=offset;matches++;}
   offset=next;
  }
  if(offset!=directory.length)return unresolved("archive-index-invalid");
  if(matches==0)return result;if(matches!=1)return unresolved("archive-metadata-ambiguous");
  int flags=u16(directory,selected+8),method=u16(directory,selected+10);long compressed=u32(directory,selected+20),plain=u32(directory,selected+24),local=u32(directory,selected+42),crc=u32(directory,selected+16);
  if((flags&1)!=0||method!=0&&method!=8)return unresolved("archive-compression-unsupported");
  if(plain>262144||compressed>1048576)return unresolved("archive-metadata-budget");
  if(local>size-30)return unresolved("archive-entry-invalid");
  byte[] header=at(local,30);if(u32(header,0)!=0x04034b50L||u16(header,8)!=method||(u16(header,6)&1)!=0)return unresolved("archive-entry-invalid");
  long start=local+30+u16(header,26)+u16(header,28);if(start>directoryOffset-compressed)return unresolved("archive-entry-invalid");
  byte[] encoded=at(start,(int)compressed),decoded;
  if(method==0)decoded=encoded;
  else{
   Inflater inflater=new Inflater(true);
   try(InputStream stream=new InflaterInputStream(new ByteArrayInputStream(encoded),inflater);ByteArrayOutputStream output=new ByteArrayOutputStream((int)plain)){
    byte[] buffer=new byte[8192];int n;while((n=stream.read(buffer))!=-1){token.check();if(n==0||output.size()+n>plain||output.size()+n>262144)return unresolved("archive-metadata-budget");output.write(buffer,0,n);}decoded=output.toByteArray();
   }catch(IOException error){return unresolved("archive-metadata-invalid");}finally{inflater.end();}
  }
  CRC32 check=new CRC32();check.update(decoded);if(decoded.length!=plain||check.getValue()!=crc)return unresolved("archive-metadata-invalid");
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
     String key=name.toLowerCase(Locale.ROOT);field=key.equals("title")?"title":key.equals("writer")||key.equals("creator")?"author":key.equals("genre")||key.equals("subject")?"genre":key.equals("series")?"series":null;text=field==null?null:new StringBuilder();
    }
    public void characters(char[] chars,int start,int length)throws SAXException{token.check();if(text!=null){if(text.length()+length>4096)throw new SAXException("Field budget");text.append(chars,start,length);}}
    public void endElement(String uri,String local,String q){if(field!=null&&text!=null){String value=text.toString().trim();if(!value.isEmpty())result.fields.putIfAbsent(field,value);}field=null;text=null;depth--;}
   });
   reader.parse(new InputSource(new StringReader(xml)));token.check();
  }catch(SAXException error){return unresolved("archive-metadata-invalid");}
  result.status=result.fields.isEmpty()?"unresolved":"parsed";result.reason=result.fields.isEmpty()?"archive-metadata-missing":"bounded-zip-metadata";return result;
 }
}
