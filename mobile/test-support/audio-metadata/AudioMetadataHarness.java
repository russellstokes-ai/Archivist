import java.io.File;
import java.util.*;
import app.archivist.reader.AudioMetadataWriter;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.tag.FieldKey;
public class AudioMetadataHarness {
 public static void main(String[] args)throws Exception{
  File f=new File(args[0]);Map<String,String> fields=new HashMap<>();
  fields.put("title","Identified book");fields.put("author","Writer");fields.put("genre","Science Fiction");fields.put("publishedYear","1977");
  AudioMetadataWriter.write(f,fields,false,null,null);
  org.jaudiotagger.tag.Tag tag;
  if(f.getName().endsWith(".aac")){try(var input=new java.io.RandomAccessFile(f,"r")){byte[] head=new byte[10];input.readFully(head);int size=0;for(int i=6;i<10;i++)size=(size<<7)|(head[i]&127);byte[] raw=new byte[size+10];input.seek(0);input.readFully(raw);tag=new org.jaudiotagger.tag.id3.ID3v24Tag(java.nio.ByteBuffer.wrap(raw));}}
  else tag=AudioFileIO.read(f).getTag();
  if(!tag.getFirst(FieldKey.ALBUM).equals("Identified book")||!tag.getFirst(FieldKey.ARTIST).equals("Writer")||!tag.getFirst(FieldKey.GENRE).equals("Science Fiction")||!tag.getFirst(FieldKey.YEAR).equals("1977"))throw new AssertionError("Tag round-trip failed");
 }
}