package app.archivist.reader;
import java.io.*;import java.nio.file.*;import java.util.*;import java.util.concurrent.*;import java.util.zip.*;
public final class ScannerArchiveTest {
 static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
 static ScannerArchiveReader.Clues read(File file)throws Exception{
  try(ScannerTaskPool pool=new ScannerTaskPool(1,1,2000)){
   ArrayBlockingQueue<ScannerTaskPool.Result> result=new ArrayBlockingQueue<>(1);
   pool.submit("archive",token->ScannerArchiveReader.read(t->new FileInputStream(file),token),result::add);
   ScannerTaskPool.Result value=result.poll(3,TimeUnit.SECONDS);check(value!=null&&"ok".equals(value.state),"Archive caller settles: "+(value==null?"none":value.reason));return (ScannerArchiveReader.Clues)value.value;
  }
 }
 static void zip(File file,int entries,String xml)throws Exception{try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(file))){for(int i=0;i<entries;i++){out.putNextEntry(new ZipEntry(i==0?"ComicInfo.xml":"page-"+i+".jpg"));out.write((i==0?xml:"generated page").getBytes("UTF-8"));out.closeEntry();}}}
 public static void main(String[] args)throws Exception{
  File fixture=File.createTempFile("scanner-archive-",".zip");
  try{
   zip(fixture,2,"<ComicInfo><Title>Generated Comic</Title><Writer>Fixture Writer</Writer><Genre>Science Fiction</Genre></ComicInfo>");
   ScannerArchiveReader.Clues result=read(fixture);check("parsed".equals(result.status)&&"Generated Comic".equals(result.fields.get("title")),"Bounded deflated ComicInfo");check(result.bytesRead<8388608,"Source budget");
   zip(fixture,1025,"<ComicInfo/>");check("archive-entry-budget".equals(read(fixture).reason),"Too many entries cannot start decompression");
   zip(fixture,1,"<!DOCTYPE ComicInfo [<!ENTITY x SYSTEM 'https://invalid.example/secret'>]><ComicInfo><Title>&x;</Title></ComicInfo>");check("archive-metadata-invalid".equals(read(fixture).reason),"External entities never fetched");
   zip(fixture,1,"<ComicInfo><Title>"+"x".repeat(300000)+"</Title></ComicInfo>");check("archive-metadata-budget".equals(read(fixture).reason),"Inflation bomb rejected before allocation");
   Files.write(fixture.toPath(),new byte[]{80,75,3,4});check("archive-index-missing".equals(read(fixture).reason),"Corrupt archive visible");
   Files.write(fixture.toPath(),new byte[]{82,97,114,33,26,7,1,0});check("rar-metadata-unsupported".equals(read(fixture).reason),"Unsupported RAR retained without whole-file fallback");
   System.out.println("PASS: bounded compressed ZIP metadata, entry/decompression limits, corrupt archives, external entity rejection and explicit RAR fallback");
  }finally{check(fixture.delete(),"Fixture descriptor closed");}
 }
}
