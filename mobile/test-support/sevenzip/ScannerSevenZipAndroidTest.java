package app.archivist.reader;

import java.io.*;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.*;

/** Runs the production selected-entry reader with the exact Android AAR JNI. */
public final class ScannerSevenZipAndroidTest {
  private static void check(boolean ok,String reason){if(!ok)throw new AssertionError(reason);}
  private static Object run(ScannerTaskPool.Operation operation)throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(1,1,10000)){
      ArrayBlockingQueue<ScannerTaskPool.Result> queue=new ArrayBlockingQueue<>(1);
      pool.submit("fixture",operation,queue::add);
      ScannerTaskPool.Result result=queue.poll(12,TimeUnit.SECONDS);
      check(result!=null&&"ok".equals(result.state),"Native archive operation failed: "+(result==null?"deadline":result.state+":"+result.reason));
      return result.value;
    }
  }
  public static void main(String[] args)throws Exception{
    File root=new File(args[0]);System.setProperty("java.io.tmpdir",root.getAbsolutePath());
    System.load(new File(root,"lib7-Zip-JBinding.so").getAbsolutePath());
    net.sf.sevenzipjbinding.SevenZip.initLoadedLibraries();
    File book=new File(root,"fixture.cb7");byte[] expected=Files.readAllBytes(new File(root,"page01.png").toPath());
    run(token->{
      check(ScannerSevenZipReader.listImages(book,token).equals(Arrays.asList("page01.png","page02.png")),"Image index");
      check(Arrays.equals(expected,ScannerSevenZipReader.readImage(book,"page02.png",token)),"Selected-page bytes");
      check(Arrays.equals(expected,ScannerSevenZipReader.readCover(book,token)),"Cover bytes");
      String xml=new String(ScannerSevenZipReader.readComicInfo(book,token),"UTF-8");check(xml.contains("Fixture Comic"),"ComicInfo extraction");
      ScannerArchiveReader.Clues clues=ScannerArchiveReader.read(t->new FileInputStream(book),token);
      check("parsed".equals(clues.status)&&"Fixture Comic".equals(clues.fields.get("title")),"Scanner CB7 metadata dispatch: "+clues.reason);
      check(Arrays.equals(expected,ScannerArchiveReader.readCover(t->new FileInputStream(book),token)),"Scanner cover dispatch");
      ScannerArchiveReader.PageEvidence evidence=ScannerArchiveReader.readEvidencePages(t->new FileInputStream(book),token);
      check(evidence.images.size()==2&&Arrays.equals(expected,evidence.images.get(0)),"R4 selected pages");
      for(String name:Arrays.asList("encrypted.cb7","truncated.cb7")){
        boolean failed=false;try{ScannerSevenZipReader.readComicInfo(new File(root,name),token);}catch(ScannerSevenZipReader.Failure error){failed=true;}
        check(failed,"Invalid/encrypted archive accepted: "+name);
      }
      boolean oversized=false;try{ScannerSevenZipReader.readImage(new File(root,"oversized.cb7"),"large.png",token);}catch(ScannerSevenZipReader.Failure error){oversized=true;}check(oversized,"Oversized entry accepted");
      boolean unsafe=false;try{ScannerSevenZipReader.readImage(book,"../page01.png",token);}catch(ScannerSevenZipReader.Failure error){unsafe=true;}check(unsafe,"Unsafe member accepted");
      token.cancel();boolean cancelled=false;try{ScannerSevenZipReader.listImages(book,token);}catch(CancellationException expectedCancel){cancelled=true;}check(cancelled,"Cancelled read proceeded");
      return true;
    });
    check(root.listFiles((dir,name)->name.startsWith("scanner-7z-")).length==0,"Scanner staging files leaked");
    System.out.println("PASS: Android JNI CB7 metadata, cover, selected pages, R4 pages, invalid/encrypted/oversized rejection and cancellation");
  }
}
