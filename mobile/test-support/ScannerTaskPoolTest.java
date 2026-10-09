package app.archivist.reader;

import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.*;
import java.io.*;

public final class ScannerTaskPoolTest {
  private static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
  private static void waitFor(java.util.function.BooleanSupplier condition,String message)throws Exception{
    long until=System.nanoTime()+TimeUnit.SECONDS.toNanos(3);
    while(!condition.getAsBoolean()&&System.nanoTime()<until)Thread.sleep(1);
    check(condition.getAsBoolean(),message);
  }
  private static void awaitIgnoringInterrupts(CountDownLatch latch){
    while(latch.getCount()>0)try{latch.await();}catch(InterruptedException ignored){}
  }
  public static void main(String[] args)throws Exception{
    long start=System.nanoTime();
    ScannerTaskPool pool=new ScannerTaskPool(2,1,80);
    CountDownLatch release=new CountDownLatch(1),started=new CountDownLatch(2),completed=new CountDownLatch(3);
    AtomicInteger invoked=new AtomicInteger();List<String> outcomes=Collections.synchronizedList(new ArrayList<>());
    ScannerTaskPool.Operation blocking=token->{invoked.incrementAndGet();started.countDown();awaitIgnoringInterrupts(release);return "late";};
    try{
      pool.submit("scan",blocking,result->{outcomes.add(result.state);completed.countDown();});
      pool.submit("scan",blocking,result->{outcomes.add(result.state);completed.countDown();});
      check(started.await(3,TimeUnit.SECONDS),"Both actual native workers must start");
      pool.submit("scan",blocking,result->{outcomes.add(result.state);completed.countDown();});
      AtomicReference<String> full=new AtomicReference<>();pool.submit("scan",blocking,result->full.set(result.state));
      check("queue-full".equals(full.get()),"Reject work beyond bounded queue");
      check(completed.await(3,TimeUnit.SECONDS),"Caller must recover from ignored cancellation");
      check(Collections.frequency(outcomes,"timeout")==2,"Two timed-out native operations");
      check(Collections.frequency(outcomes,"circuit-open")==1,"Queued work must stop when all slots are quarantined");
      check(pool.stats().active==2&&pool.stats().quarantined==2&&pool.stats().queued==0,"Timed-out workers retain their slots");
      pool.submit("scan",blocking,result->full.set(result.state));check("circuit-open".equals(full.get()),"No replacement workers");
      check(invoked.get()==2,"Exactly two operations started");
      release.countDown();waitFor(()->pool.stats().active==0,"Workers recover after real return");
      check(outcomes.size()==3,"Late results must never reach the caller");
      CountDownLatch success=new CountDownLatch(1);pool.submit("retry",token->7,result->{check("ok".equals(result.state)&&Integer.valueOf(7).equals(result.value),"Recovery result");success.countDown();});check(success.await(3,TimeUnit.SECONDS),"Pool recovers without creating replacement capacity");
      CountDownLatch decoderFailure=new CountDownLatch(1);pool.submit("decoder",token->{throw new LinkageError("Unavailable native decoder");},result->{check("error".equals(result.state),"Native decoder failure must report an error");decoderFailure.countDown();});check(decoderFailure.await(1,TimeUnit.SECONDS),"Native decoder failure cannot leave a caller hanging");
    }finally{release.countDown();pool.close();}
    ScannerTaskPool cancelled=new ScannerTaskPool(1,1,2000);CountDownLatch returnLate=new CountDownLatch(1),cancelStarted=new CountDownLatch(1),callbacks=new CountDownLatch(2);AtomicInteger hookCount=new AtomicInteger();
    try{
      cancelled.submit("old",token->{token.onCancel(hookCount::incrementAndGet);cancelStarted.countDown();awaitIgnoringInterrupts(returnLate);return "old-data";},result->{check("cancelled".equals(result.state),"Active cancellation outcome");callbacks.countDown();});
      check(cancelStarted.await(3,TimeUnit.SECONDS),"Active task starts");
      cancelled.submit("old",token->"queued-old-data",result->{check("cancelled".equals(result.state),"Queued cancellation outcome");callbacks.countDown();});
      cancelled.cancel("old");check(callbacks.await(3,TimeUnit.SECONDS),"Both callers cancelled promptly");
      waitFor(()->hookCount.get()==1,"Provider cancellation requested exactly once");
      check(cancelled.stats().active==1,"Cancellation cannot free a blocked native slot");
      returnLate.countDown();waitFor(()->cancelled.stats().active==0,"Cancelled operation returns");
    }finally{returnLate.countDown();cancelled.close();}
    ScannerTaskPool reads=new ScannerTaskPool(1,1,2000);AtomicInteger closed=new AtomicInteger();CountDownLatch readDone=new CountDownLatch(1);
    try{
      reads.submit("header",token->ScannerBoundedIO.readHeader(t->new ByteArrayInputStream(new byte[100]){public void close(){closed.incrementAndGet();}},4,token),result->{check("ok".equals(result.state),"Header read succeeds");ScannerBoundedIO.Header header=(ScannerBoundedIO.Header)result.value;check(header.bytes.length==4&&header.budgetReached,"Byte budget enforced");readDone.countDown();});
      check(readDone.await(3,TimeUnit.SECONDS),"Bounded read callback");waitFor(()->closed.get()==1,"Stream closed exactly once");
      CountDownLatch reading=new CountDownLatch(1),returnRead=new CountDownLatch(1),cancelRead=new CountDownLatch(1);AtomicInteger closesAfterCancel=new AtomicInteger();
      reads.submit("blocked-read",token->ScannerBoundedIO.readHeader(t->new InputStream(){public int read(){reading.countDown();awaitIgnoringInterrupts(returnRead);return 42;}public void close(){closesAfterCancel.incrementAndGet();}},4,token),result->{check("cancelled".equals(result.state),"Blocked read cancellation");cancelRead.countDown();});
      check(reading.await(3,TimeUnit.SECONDS),"Stream read genuinely blocked");reads.cancel("blocked-read");check(cancelRead.await(3,TimeUnit.SECONDS),"Caller unblocked by cancellation");check(reads.stats().active==1,"Blocked read retains slot");returnRead.countDown();waitFor(()->closesAfterCancel.get()==1,"Late read closes descriptor-owning stream");
    }finally{reads.close();}
    File fixture=File.createTempFile("archivist-range-",".bin");
    try(ScannerTaskPool ranges=new ScannerTaskPool(1,1,2000)){
      try(RandomAccessFile output=new RandomAccessFile(fixture,"rw")){output.seek(2*1024*1024);output.write(new byte[]{11,22,33,44,55});}
      AtomicInteger consumed=new AtomicInteger();AtomicBoolean rangeClosed=new AtomicBoolean();ArrayBlockingQueue<ScannerTaskPool.Result> result=new ArrayBlockingQueue<>(1);
      ranges.submit("range",token->ScannerBoundedIO.readRange(t->new FileInputStream(fixture){
        public int read(byte[] b,int off,int len)throws IOException{int n=super.read(b,off,len);if(n>0)consumed.addAndGet(n);return n;}
        public long skip(long n){throw new AssertionError("Never consume preceding media to reach metadata");}
        public void close()throws IOException{super.close();rangeClosed.set(!getFD().valid());}
      },2*1024*1024,4,token),result::add);
      ScannerTaskPool.Result value=result.poll(3,TimeUnit.SECONDS);check(value!=null&&"ok".equals(value.state),"Seekable range resolves");
      check(Arrays.equals(((ScannerBoundedIO.Header)value.value).bytes,new byte[]{11,22,33,44}),"Read exact requested range");check(consumed.get()==4&&rangeClosed.get(),"Only requested bytes consumed and descriptor closed");
      ranges.submit("eof",token->ScannerBoundedIO.readRange(t->new FileInputStream(fixture),fixture.length()+1,4,token),result::add);
      value=result.poll(3,TimeUnit.SECONDS);check(value!=null&&"ok".equals(value.state)&&((ScannerBoundedIO.Header)value.value).bytes.length==0&&!((ScannerBoundedIO.Header)value.value).budgetReached,"EOF is explicit without unbounded fallback");
      AtomicInteger invalidOpened=new AtomicInteger();ranges.submit("invalid",token->ScannerBoundedIO.readRange(t->{invalidOpened.incrementAndGet();return new FileInputStream(fixture);},-1,4,token),result::add);
      value=result.poll(3,TimeUnit.SECONDS);check(value!=null&&"error".equals(value.state)&&invalidOpened.get()==0,"Invalid offset rejected before opening provider");
    }finally{check(fixture.delete(),"Range fixture removed");}
    System.out.println("PASS: actual JVM native workers, cancellation, quarantine, bounded seek reads and descriptor cleanup ("+TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start)+"ms)");
  }
}
