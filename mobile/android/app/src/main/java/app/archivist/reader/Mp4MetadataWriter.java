package app.archivist.reader;
import java.io.*;import java.nio.charset.StandardCharsets;import java.util.*;
/** Appends an updated moov, leaving all media offsets and chapter tracks unchanged. */
public final class Mp4MetadataWriter {
 private static long u32(byte[] b,int p){return ((long)(b[p]&255)<<24)|((long)(b[p+1]&255)<<16)|((long)(b[p+2]&255)<<8)|(b[p+3]&255);}
 private static void u32(byte[] b,int p,long n){for(int i=3;i>=0;i--){b[p+i]=(byte)n;n>>>=8;}}
 private static String type(byte[] b,int p){return new String(b,p+4,4,StandardCharsets.ISO_8859_1);}
 private static byte[] box(String type,byte[] data)throws IOException{byte[] out=new byte[Math.addExact(8,data.length)];u32(out,0,out.length);System.arraycopy(type.getBytes(StandardCharsets.ISO_8859_1),0,out,4,4);System.arraycopy(data,0,out,8,data.length);return out;}
 private static List<byte[]> children(byte[] data,int offset)throws IOException{List<byte[]> list=new ArrayList<>();while(offset<data.length){if(data.length-offset<8)throw new IOException("Truncated MP4 atom");long size=u32(data,offset);if(size<8||size>data.length-offset)throw new IOException("Unsupported MP4 atom size");list.add(Arrays.copyOfRange(data,offset,offset+(int)size));offset+=(int)size;}return list;}
 private static byte[] join(List<byte[]> items)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();for(byte[] item:items)out.write(item);return out.toByteArray();}
 private static byte[] data(int kind,byte[] value)throws IOException{byte[] payload=new byte[value.length+8];u32(payload,0,kind);System.arraycopy(value,0,payload,8,value.length);return box("data",payload);}
 private static byte[] update(byte[] parent,String child,byte[] replacement,int prefix)throws IOException{List<byte[]> result=new ArrayList<>();boolean found=false;for(byte[] item:children(parent,8+prefix)){if(type(item,0).equals(child)){if(found)throw new IOException("Duplicate MP4 metadata atom");result.add(replacement);found=true;}else result.add(item);}if(!found)result.add(replacement);byte[] body=join(result);if(prefix>0){byte[] withPrefix=new byte[body.length+prefix];System.arraycopy(parent,8,withPrefix,0,prefix);System.arraycopy(body,0,withPrefix,prefix,body.length);body=withPrefix;}return box(type(parent,0),body);}
 private static byte[] find(byte[] parent,String name,int prefix)throws IOException{byte[] result=null;for(byte[] b:children(parent,8+prefix))if(type(b,0).equals(name)){if(result!=null)throw new IOException("Duplicate MP4 atom");result=b;}return result;}
 public static void write(File file,Map<String,String> fields,boolean multipart,byte[] cover,String mime)throws Exception{
  try(RandomAccessFile io=new RandomAccessFile(file,"rw")){
   long pos=0,moovAt=-1;byte[] moov=null;
   while(pos<io.length()){if(io.length()-pos<8)throw new IOException("Truncated MP4");io.seek(pos);long size=Integer.toUnsignedLong(io.readInt());byte[] name=new byte[4];io.readFully(name);String t=new String(name,StandardCharsets.ISO_8859_1);int header=8;if(size==1){size=io.readLong();header=16;}if(size<header||size>io.length()-pos)throw new IOException("Unsupported MP4 extent");if(t.equals("moof"))throw new IOException("Fragmented MP4 needs separate metadata writer");if(t.equals("moov")){if(moov!=null||header!=8||size>64*1024*1024)throw new IOException("Unsupported movie metadata");moovAt=pos;moov=new byte[(int)size];io.seek(pos);io.readFully(moov);}pos+=size;}
   if(moov==null)throw new IOException("Missing movie metadata");
   byte[] udta=find(moov,"udta",0);if(udta==null)udta=box("udta",new byte[0]);byte[] meta=find(udta,"meta",0);
   if(meta==null){byte[] handler=new byte[25];System.arraycopy("mdir".getBytes(StandardCharsets.ISO_8859_1),0,handler,8,4);meta=box("meta",join(Arrays.asList(new byte[4],box("hdlr",handler))));}
   if(meta.length<12)throw new IOException("Invalid metadata");byte[] handler=find(meta,"hdlr",4);if(handler!=null&&(handler.length<24||!new String(handler,16,4,StandardCharsets.ISO_8859_1).equals("mdir")))throw new IOException("Non-Apple MP4 metadata needs separate writer");
   byte[] ilst=find(meta,"ilst",4);if(ilst==null)ilst=box("ilst",new byte[0]);Map<String,byte[]> updates=new LinkedHashMap<>();
   put(updates,"\u00a9alb",fields.get("title"));if(!multipart)put(updates,"\u00a9nam",fields.get("title"));put(updates,"\u00a9ART",fields.get("author"));put(updates,"aART",fields.get("author"));put(updates,"\u00a9gen",fields.get("genre"));put(updates,"\u00a9day",fields.get("publishedYear"));put(updates,"desc",fields.get("description"));
   if(cover!=null){if(cover.length>4194304||!("image/jpeg".equals(mime)||"image/png".equals(mime)))throw new IOException("Invalid artwork");updates.put("covr",box("covr",data("image/png".equals(mime)?14:13,cover)));}
   List<byte[]> items=new ArrayList<>();for(byte[] item:children(ilst,8))if(!updates.containsKey(type(item,0)))items.add(item);items.addAll(updates.values());byte[] updated=update(moov,"udta",update(udta,"meta",update(meta,"ilst",box("ilst",join(items)),4),0),0);
   // The original moov remains the exact same size as a free atom. stco/co64 and chapter references retain their offsets.
   long end=io.length();io.seek(end);io.write(updated);io.getFD().sync();io.seek(moovAt+4);io.write("free".getBytes(StandardCharsets.US_ASCII));io.getFD().sync();
  }
 }
 private static void put(Map<String,byte[]> fields,String key,String value)throws IOException{if(value!=null&&!value.trim().isEmpty()){if(value.length()>4096||value.indexOf(0)>=0)throw new IOException("Invalid metadata");fields.put(key,box(key,data(1,value.trim().getBytes(StandardCharsets.UTF_8))));}}
}
