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
 static ScannerArchiveReader.PageEvidence evidence(File file)throws Exception{
  try(ScannerTaskPool pool=new ScannerTaskPool(1,1,2000)){
   ArrayBlockingQueue<ScannerTaskPool.Result> result=new ArrayBlockingQueue<>(1);
   pool.submit("evidence",token->ScannerArchiveReader.readEvidencePages(t->new FileInputStream(file),token),result::add);
   ScannerTaskPool.Result value=result.poll(3,TimeUnit.SECONDS);check(value!=null&&"ok".equals(value.state),"Evidence caller settles: "+(value==null?"none":value.reason));return (ScannerArchiveReader.PageEvidence)value.value;
  }
 }
 static void zipEntry(ZipOutputStream out,String name,String value)throws Exception{out.putNextEntry(new ZipEntry(name));out.write(value.getBytes("UTF-8"));out.closeEntry();} static ScannerTaskPool.Result cover(File file)throws Exception{
  try(ScannerTaskPool pool=new ScannerTaskPool(1,1,2000)){
   ArrayBlockingQueue<ScannerTaskPool.Result> result=new ArrayBlockingQueue<>(1);
   pool.submit("cover",token->ScannerArchiveReader.readCover(t->new FileInputStream(file),token),result::add);
   ScannerTaskPool.Result value=result.poll(3,TimeUnit.SECONDS);check(value!=null,"Cover caller settles");return value;
  }
 }
 public static void main(String[] args)throws Exception{
  File fixture=File.createTempFile("scanner-archive-",".zip");
  try{
   zip(fixture,2,"<ComicInfo><Title>Generated Comic</Title><Writer>Fixture Writer</Writer><Genre>Science Fiction</Genre></ComicInfo>");
   ScannerArchiveReader.Clues result=read(fixture);check("parsed".equals(result.status)&&"Generated Comic".equals(result.fields.get("title")),"Bounded deflated ComicInfo");check(result.bytesRead<8388608,"Source budget");
   check(Arrays.equals("generated page".getBytes("UTF-8"),(byte[])cover(fixture).value),"Comic first page bytes preserved for image validation");
   zip(fixture,1,"<ComicInfo><Series>Example</Series><Number>003</Number><Year>1980</Year><Publisher>Press</Publisher><Writer>One</Writer><Writer>Two</Writer><Genre>Fiction</Genre><Genre>Science Fiction</Genre></ComicInfo>");
   result=read(fixture);check("003".equals(result.fields.get("seriesNumber")),"Comic issue preserved");check("One; Two".equals(result.fields.get("author")),"Multiple creators preserved");check("Fiction; Science Fiction".equals(result.fields.get("genre")),"All subjects retained");
   zip(fixture,1,"<package><metadata><identifier>urn:isbn:9780140328721</identifier><title>Example</title></metadata></package>");check("9780140328721".equals(read(fixture).fields.get("isbn")),"EPUB ISBN URI extracted");   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){
    zipEntry(out,"META-INF/container.xml","<container><rootfiles><rootfile full-path=\"OPS/book.opf\" media-type=\"application/oebps-package+xml\"/></rootfiles></container>");
    zipEntry(out,"OPS/book.opf","<package xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><metadata><dc:title>Bounded Book</dc:title><dc:identifier>9780140328721</dc:identifier></metadata><manifest><item id=\"c1\" href=\"c1.xhtml\" media-type=\"application/xhtml+xml\"/><item id=\"c2\" href=\"c2.xhtml\" media-type=\"application/xhtml+xml\"/><item id=\"c3\" href=\"c3.xhtml\" media-type=\"application/xhtml+xml\"/><item id=\"c4\" href=\"c4.xhtml\" media-type=\"application/xhtml+xml\"/></manifest><spine><itemref idref=\"c1\"/><itemref idref=\"c2\"/><itemref idref=\"c3\"/><itemref idref=\"c4\"/></spine></package>");
    zipEntry(out,"OPS/c1.xhtml","<html><head><title>Hidden</title></head><body><p>Title: Chapter One</p><p>Author: Fixture Writer</p><p>ISBN: 9780140328721</p></body></html>");zipEntry(out,"OPS/c2.xhtml","<html><body><p>Chapter two text</p></body></html>");zipEntry(out,"OPS/c3.xhtml","<html><body><p>Chapter three text</p></body></html>");zipEntry(out,"OPS/c4.xhtml","<html><body><p>FOURTH_SPINE_SENTINEL</p></body></html>");
   }
   ScannerArchiveReader.PageEvidence epub=evidence(fixture);check("parsed".equals(epub.status)&&epub.container.equals("epub"),"EPUB first-spine evidence parsed");check(epub.text.contains("9780140328721")&&epub.text.contains("Chapter two text")&&epub.text.contains("Chapter three text"),"Text from the first three EPUB spine documents includes ISBN clues");check(epub.text.contains("Title: Chapter One\nAuthor: Fixture Writer\nISBN: 9780140328721"),"XHTML block boundaries keep title, author and ISBN labels distinct");check(!epub.text.contains("FOURTH_SPINE_SENTINEL")&&!epub.text.contains("Hidden")&&epub.text.getBytes("UTF-8").length<=16384,"EPUB page text and byte limits are applied");
   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){zipEntry(out,"META-INF/container.xml","<container><rootfiles><rootfile full-path=\"OPS/book.opf\"/></rootfiles></container>");zipEntry(out,"OPS/book.opf","<package><manifest><item id=\"c1\" href=\"c1.xhtml\" media-type=\"application/xhtml+xml\"/></manifest><spine><itemref idref=\"c1\"/></spine></package>");zipEntry(out,"OPS/c1.xhtml","<html><body><p>"+"x".repeat(24000)+"</p></body></html>");}
   epub=evidence(fixture);check("parsed".equals(epub.status)&&epub.text.getBytes("UTF-8").length==16384,"EPUB extracted text is capped at 16 KiB UTF-8");   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){out.putNextEntry(new ZipEntry("page-02.jpg"));out.write("second-page".getBytes("UTF-8"));out.closeEntry();out.putNextEntry(new ZipEntry("page-01.jpg"));out.write("first-page".getBytes("UTF-8"));out.closeEntry();out.putNextEntry(new ZipEntry("page-03.jpg"));out.write("third-page".getBytes("UTF-8"));out.closeEntry();}
   ScannerArchiveReader.PageEvidence comic=evidence(fixture);check("parsed".equals(comic.status)&&comic.images.size()==2&&Arrays.equals("first-page".getBytes("UTF-8"),comic.images.get(0))&&Arrays.equals("second-page".getBytes("UTF-8"),comic.images.get(1)),"Only the first two sorted comic images are returned");
   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){zipEntry(out,"META-INF/container.xml","<!DOCTYPE container [<!ENTITY x SYSTEM 'file:///private/sentinel'>]><container><rootfiles><rootfile full-path=\"OPS/book.opf\"/></rootfiles></container>");}
   ScannerArchiveReader.PageEvidence malicious=evidence(fixture);check("unresolved".equals(malicious.status)&&malicious.text.isEmpty()&&"archive-metadata-invalid".equals(malicious.reason),"EPUB container entities are rejected before resolution");
   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){zipEntry(out,"META-INF/container.xml","<container><rootfiles><rootfile full-path=\"../../escape.opf\"/></rootfiles></container>");}
   malicious=evidence(fixture);check("unresolved".equals(malicious.status)&&malicious.text.isEmpty(),"EPUB package traversal is rejected");
   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){zipEntry(out,"META-INF/container.xml","<container><rootfiles><rootfile full-path=\"OPS/book.opf\"/></rootfiles></container>");zipEntry(out,"OPS/book.opf","<package><manifest><item id=\"c1\" href=\"c1.xhtml\" media-type=\"application/xhtml+xml\"/></manifest><spine><itemref idref=\"c1\"/></spine></package>");zipEntry(out,"OPS/c1.xhtml","<!DOCTYPE html [<!ENTITY x SYSTEM 'file:///private/sentinel'>]><html><body><p>&x;</p></body></html>");}
   malicious=evidence(fixture);check("unresolved".equals(malicious.status)&&malicious.text.isEmpty()&&"archive-metadata-invalid".equals(malicious.reason),"XHTML external entities are rejected");
   try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(fixture))){
    out.putNextEntry(new ZipEntry("cover.jpg"));out.write(new byte[4194305]);out.closeEntry();
   }
   check(!"ok".equals(cover(fixture).state),"Oversized embedded cover rejected before inflation");
   zip(fixture,1025,"<ComicInfo/>");check("archive-entry-budget".equals(read(fixture).reason),"Too many entries cannot start decompression");
   zip(fixture,1,"<!DOCTYPE ComicInfo [<!ENTITY x SYSTEM 'https://invalid.example/secret'>]><ComicInfo><Title>&x;</Title></ComicInfo>");check("archive-metadata-invalid".equals(read(fixture).reason),"External entities never fetched");
   zip(fixture,1,"<ComicInfo><Title>"+"x".repeat(300000)+"</Title></ComicInfo>");check("archive-metadata-budget".equals(read(fixture).reason),"Inflation bomb rejected before allocation");
   Files.write(fixture.toPath(),new byte[]{80,75,3,4});check("archive-index-missing".equals(read(fixture).reason),"Corrupt archive visible");
   Files.write(fixture.toPath(),new byte[]{82,97,114,33,26,7,1,0});ScannerArchiveReader.Clues rar=read(fixture);check("cbr".equals(rar.container)&&("rar-metadata-engine-unavailable".equals(rar.reason)||"archive-metadata-missing".equals(rar.reason)||"rar-metadata-invalid".equals(rar.reason)),"RAR metadata follows the bounded Junrar path");
   Files.write(fixture.toPath(),new byte[]{0x37,0x7a,(byte)0xbc,(byte)0xaf,0x27,0x1c,0,4});ScannerArchiveReader.Clues cb7=read(fixture);check("cb7".equals(cb7.container)&&("7z-engine-unavailable".equals(cb7.reason)||"7z-archive-invalid".equals(cb7.reason)),"CB7 dispatch reports missing SevenZip engine explicitly: "+cb7.reason);if(args.length>1){ScannerArchiveReader.Clues sevenZip=read(new File(args[1]));check("cb7".equals(sevenZip.container)&&"parsed".equals(sevenZip.status)&&!sevenZip.fields.isEmpty(),"CB7 ComicInfo extracted through bounded SevenZip reader");ScannerTaskPool.Result sevenZipCover=cover(new File(args[1]));check("ok".equals(sevenZipCover.state)&&((byte[])sevenZipCover.value).length>0&&((byte[])sevenZipCover.value).length<=4194304,"CB7 first cover extracted within the decoded-byte cap");}
   File rarFixture=null,sevenZipFixture=null;for(String argument:args){if(argument.startsWith("--7z="))sevenZipFixture=new File(argument.substring(5));else rarFixture=new File(argument);}if(rarFixture!=null){ScannerArchiveReader.Clues compressedRar=read(rarFixture);check("cbr".equals(compressedRar.container)&&"parsed".equals(compressedRar.status)&&"bounded-rar-metadata".equals(compressedRar.reason)&&!compressedRar.fields.isEmpty(),"Compressed CBR ComicInfo extracted through Junrar");ScannerTaskPool.Result rarCover=cover(rarFixture);check("ok".equals(rarCover.state)&&Arrays.equals(new byte[]{(byte)0xff,(byte)0xd8,1,2,(byte)0xff,(byte)0xd9},(byte[])rarCover.value),"First sorted safe CBR image is extracted within the decoded-byte cap");}if(sevenZipFixture!=null){ScannerArchiveReader.Clues sevenZip=read(sevenZipFixture);check("cb7".equals(sevenZip.container)&&"parsed".equals(sevenZip.status)&&!sevenZip.fields.isEmpty(),"CB7 ComicInfo extracted through bounded SevenZip reader");ScannerTaskPool.Result sevenZipCover=cover(sevenZipFixture);check("ok".equals(sevenZipCover.state)&&((byte[])sevenZipCover.value).length>0&&((byte[])sevenZipCover.value).length<=4194304,"CB7 first cover extracted within the decoded-byte cap");}
   System.out.println("PASS: bounded compressed ZIP metadata, entry/decompression limits, corrupt archives, external entity rejection and bounded RAR metadata and cover extraction, EPUB block boundaries and explicit CB7 fallback");
  }finally{check(fixture.delete(),"Fixture descriptor closed");}
 }
}
