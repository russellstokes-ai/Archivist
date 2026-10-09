package app.archivist.reader;

import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.DocumentsContract;
import android.util.Log;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.json.JSONObject;
import java.io.File;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public final class ScannerSafTest {
  private final Uri root=DocumentsContract.buildTreeDocumentUri("app.archivist.scannerlab.documents","root");
  private ContentResolver resolver;private ScannerDocumentAccess documents;
  @Before public void setup(){
    android.content.Context target=InstrumentationRegistry.getInstrumentation().getTargetContext();
    target.grantUriPermission(target.getPackageName(),root,Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
    resolver=target.getContentResolver();documents=new ScannerDocumentAccess(resolver);
  }
  private ScannerTaskPool.Result task(ScannerTaskPool pool,String scope,ScannerTaskPool.Operation operation)throws Exception{
    ArrayBlockingQueue<ScannerTaskPool.Result> result=new ArrayBlockingQueue<>(1);pool.submit(scope,operation,result::add);
    ScannerTaskPool.Result value=result.poll(10,TimeUnit.SECONDS);assertNotNull("Native caller must settle",value);return value;
  }
  private ScannerDocumentAccess.Page page(ScannerTaskPool pool,String parent,int offset)throws Exception{
    ScannerTaskPool.Result result=task(pool,"scan",token->documents.queryChildren(root,parent,offset,128,token));assertEquals("ok",result.state);return (ScannerDocumentAccess.Page)result.value;
  }
  private long enumerate(int count)throws Exception{
    resolver.call(root,"fixture-count",Integer.toString(count),null);
    try(ScannerTaskPool pool=new ScannerTaskPool(2,128,8000)){
      long start=SystemClock.elapsedRealtime();assertEquals("book",page(pool,"root",0).entries.get(0).documentId);
      Set<String> ids=new HashSet<>();Integer offset=0;int batches=0;
      do{ScannerDocumentAccess.Page page=page(pool,"book",offset);assertTrue(page.entries.size()<=128);for(ScannerDocumentAccess.Entry entry:page.entries){assertFalse(entry.directory);assertTrue(entry.size>0);assertTrue(ids.add(entry.documentId));}offset=page.nextOffset;batches++;}while(offset!=null);
      assertEquals(count,ids.size());long elapsed=SystemClock.elapsedRealtime()-start;
      JSONObject metrics=new JSONObject();metrics.put("scope","native controlled-provider query only");metrics.put("files",count);metrics.put("batches",batches);metrics.put("elapsedMs",elapsed);Log.i("ScannerVNextLab",metrics.toString());return elapsed;
    }
  }
  @Test public void discovers342RealProviderEntriesInBoundedPages()throws Exception{enumerate(342);}
  @Test public void discovers5000RealProviderEntriesInBoundedPages()throws Exception{enumerate(5000);}
  private int descriptors(){String[] files=new File("/proc/self/fd").list();assertNotNull(files);return files.length;}
  @Test public void repeatedBoundedReadsCloseActualDescriptors()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,128,8000)){
      for(int i=0;i<5;i++)task(pool,"warm",token->documents.readHeader(root,"book/000001",4,token));
      int before=descriptors();
      for(int i=0;i<100;i++){ScannerTaskPool.Result result=task(pool,"read",token->documents.readHeader(root,"book/000001",4,token));assertEquals("ok",result.state);ScannerBoundedIO.Header header=(ScannerBoundedIO.Header)result.value;assertEquals(4,header.bytes.length);assertEquals('I',header.bytes[0]);assertEquals('D',header.bytes[1]);assertEquals('3',header.bytes[2]);}
      assertTrue("No growing file descriptor leak",descriptors()<=before+2);
    }
  }
  @Test public void ignoredQueryCancellationKeepsWorkersBoundedAndRejectsLateResults()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,1,150)){
      CountDownLatch settled=new CountDownLatch(2);AtomicInteger callbacks=new AtomicInteger();List<String> states=Collections.synchronizedList(new ArrayList<>());
      for(int i=1;i<=2;i++){final String parent="slow-query-"+i;pool.submit("slow",token->documents.queryChildren(root,parent,0,128,token),result->{callbacks.incrementAndGet();states.add(result.state);settled.countDown();});}
      assertTrue(settled.await(3,TimeUnit.SECONDS));assertEquals(Arrays.asList("timeout","timeout"),states);
      assertEquals(2,pool.stats().active);assertEquals(2,pool.stats().quarantined);
      assertEquals("circuit-open",task(pool,"blocked",token->documents.queryChildren(root,"book",0,128,token)).state);
      long end=SystemClock.elapsedRealtime()+5000;while(pool.stats().active>0&&SystemClock.elapsedRealtime()<end)Thread.sleep(20);
      assertEquals(0,pool.stats().active);assertEquals(2,callbacks.get());
    }
  }
  @Test public void cancelledLateDescriptorOpenClosesWithoutDeliveringBytes()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,1,8000)){
      int before=descriptors();Bundle initial=resolver.call(root,"fixture-stats",null,null);int opened=initial.getInt("opened"),cancelled=initial.getInt("cancelled");
      ArrayBlockingQueue<ScannerTaskPool.Result> outcomes=new ArrayBlockingQueue<>(1);pool.submit("cancel-open",token->documents.readHeader(root,"slow-open",64,token),outcomes::add);
      long end=SystemClock.elapsedRealtime()+3000;while(resolver.call(root,"fixture-stats",null,null).getInt("opened")==opened&&SystemClock.elapsedRealtime()<end)Thread.sleep(10);
      assertTrue(resolver.call(root,"fixture-stats",null,null).getInt("opened")>opened);
      long start=SystemClock.elapsedRealtime();pool.cancel("cancel-open");assertEquals("cancelled",outcomes.poll(1,TimeUnit.SECONDS).state);assertTrue(SystemClock.elapsedRealtime()-start<1000);
      end=SystemClock.elapsedRealtime()+5000;while(pool.stats().active>0&&SystemClock.elapsedRealtime()<end)Thread.sleep(20);
      assertEquals(0,pool.stats().active);assertNull(outcomes.poll());assertTrue(descriptors()<=before+2);
      assertTrue(resolver.call(root,"fixture-stats",null,null).getInt("cancelled")>cancelled);
    }
  }
  @Test public void rejectsDocumentsOutsideSelectedTree()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,1,8000)){assertEquals("error",task(pool,"outside",token->documents.readHeader(root,"outside",64,token)).state);}
  }
  @Test public void seekableReadsReachExactRangeAndCloseDescriptors()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,128,8000)){
      ScannerTaskPool.Result seed=task(pool,"seed",token->documents.readHeader(root,"book/000001",64,token));assertEquals("ok",seed.state);
      byte[] expected=Arrays.copyOfRange(((ScannerBoundedIO.Header)seed.value).bytes,10,14);int before=descriptors();
      for(int i=0;i<50;i++){
        ScannerTaskPool.Result result=task(pool,"range",token->documents.readRange(root,"book/000001",10,4,token));assertEquals("ok",result.state);
        ScannerBoundedIO.Header range=(ScannerBoundedIO.Header)result.value;assertArrayEquals(expected,range.bytes);assertEquals(10,range.offset);assertTrue(range.budgetReached);
      }
      assertTrue("Seekable reads close descriptors",descriptors()<=before+2);
    }
  }
  @Test public void nonseekableProviderFailsWithoutCopyingOrLeaking()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,128,8000)){
      task(pool,"warm-pipe",token->documents.readRange(root,"book/pipe",2,4,token));int before=descriptors();
      for(int i=0;i<20;i++)assertEquals("error",task(pool,"pipe",token->documents.readRange(root,"book/pipe",2,4,token)).state);
      assertTrue("Nonseekable descriptor failures close handles",descriptors()<=before+2);assertEquals(0,pool.stats().quarantined);
    }
  }
  @Test public void compressedArchiveMetadataUsesBoundedProductionReader()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,128,8000)){
      ScannerTaskPool.Result value=task(pool,"archive",token->documents.readArchiveClues(root,"book/archive",token));assertEquals("ok",value.state);
      ScannerArchiveReader.Clues clues=(ScannerArchiveReader.Clues)value.value;assertEquals("parsed",clues.status);assertEquals("Generated Comic",clues.fields.get("title"));assertEquals("Fixture Writer",clues.fields.get("author"));assertTrue(clues.bytesRead<8388608);
      value=task(pool,"corrupt",token->documents.readArchiveClues(root,"book/000001",token));assertEquals("ok",value.state);assertEquals("unresolved",((ScannerArchiveReader.Clues)value.value).status);
    }
  }
  @Test public void mainLooperRemainsResponsiveDuringBlockedProviderCalls()throws Exception{
    try(ScannerTaskPool pool=new ScannerTaskPool(2,1,150)){
      CountDownLatch ended=new CountDownLatch(2);for(int i=1;i<=2;i++){final String id="slow-query-"+i;pool.submit("slow",token->documents.queryChildren(root,id,0,128,token),value->ended.countDown());}
      assertTrue(ended.await(2,TimeUnit.SECONDS));assertEquals(2,pool.stats().quarantined);
      CountDownLatch tick=new CountDownLatch(1);long start=SystemClock.elapsedRealtime();new android.os.Handler(android.os.Looper.getMainLooper()).post(tick::countDown);
      assertTrue("Main looper responds while native slots remain occupied",tick.await(500,TimeUnit.MILLISECONDS));assertTrue(SystemClock.elapsedRealtime()-start<500);
    }
  }
  @Test public void artworkDecodesCachesAtomicallyAndRejectsCorruptBytes()throws Exception{
    java.io.File cache=new java.io.File(androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().getTargetContext().getCacheDir(),"artwork-test");cache.mkdirs();
    android.graphics.Bitmap image=android.graphics.Bitmap.createBitmap(100,150,android.graphics.Bitmap.Config.ARGB_8888);
    java.io.ByteArrayOutputStream encoded=new java.io.ByteArrayOutputStream();image.compress(android.graphics.Bitmap.CompressFormat.PNG,100,encoded);image.recycle();byte[] png=encoded.toByteArray();
    try(ScannerTaskPool pool=new ScannerTaskPool(2,1,8000)){
      ScannerTaskPool.Result result=task(pool,"image",token->ScannerArtworkReader.read(t->new java.io.ByteArrayInputStream(png),cache,token));assertEquals("ok",result.state);
      ScannerArtworkReader.Artwork artwork=(ScannerArtworkReader.Artwork)result.value;assertEquals(100,artwork.width);assertEquals(150,artwork.height);assertEquals(png.length,artwork.bytes);assertTrue(new java.io.File(android.net.Uri.parse(artwork.uri).getPath()).exists());
      ScannerTaskPool.Result selected=task(pool,"selected-art",token->documents.readArtwork(root,"book/cover",cache,token));assertEquals("ok",selected.state);assertEquals(artwork.sha256,((ScannerArtworkReader.Artwork)selected.value).sha256);
      assertEquals("error",task(pool,"corrupt-art",token->ScannerArtworkReader.read(t->new java.io.ByteArrayInputStream(new byte[]{1,2,3}),cache,token)).state);
      assertEquals("error",task(pool,"truncated-art",token->ScannerArtworkReader.read(t->new java.io.ByteArrayInputStream(java.util.Arrays.copyOf(png,28)),cache,token)).state);
      java.util.concurrent.atomic.AtomicBoolean closed=new java.util.concurrent.atomic.AtomicBoolean();
      assertEquals("error",task(pool,"large-art",token->ScannerArtworkReader.read(t->new java.io.InputStream(){public int read(){return 1;}public int read(byte[] bytes,int offset,int count){java.util.Arrays.fill(bytes,offset,offset+count,(byte)1);return count;}public void close(){closed.set(true);}},cache,token)).state);assertTrue(closed.get());
      assertEquals(1,cache.listFiles().length);
    }finally{for(java.io.File file:cache.listFiles())file.delete();cache.delete();}
  }
}
