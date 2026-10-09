package app.archivist.reader;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

/** Native operations retain their slot until they really return, even after a caller deadline. */
public final class ScannerTaskPool implements AutoCloseable {
  public interface Operation { Object run(Token token) throws Exception; }
  public static final class Result {
    public final String state; public final Object value; public final String reason;
    Result(String state,Object value,String reason){this.state=state;this.value=value;this.reason=reason;}
  }
  public static final class Stats {
    public final int active,queued,quarantined;
    Stats(int active,int queued,int quarantined){this.active=active;this.queued=queued;this.quarantined=quarantined;}
  }
  public final class Token {
    private boolean cancelled,dispatched;private Runnable hook;
    public synchronized boolean isCancelled(){return cancelled;}
    public void onCancel(Runnable action){
      Runnable dispatch=null;
      synchronized(this){if(hook!=null)throw new IllegalStateException("Only one cancellation hook per operation");hook=action;if(cancelled&&!dispatched){dispatched=true;dispatch=hook;}}
      dispatchCancel(dispatch);
    }
    void cancel(){
      Runnable dispatch=null;
      synchronized(this){cancelled=true;if(hook!=null&&!dispatched){dispatched=true;dispatch=hook;}}
      dispatchCancel(dispatch);
    }
    public void check(){if(isCancelled())throw new CancellationException("Operation cancelled");}
  }
  private final Object lock=new Object();
  private final Set<Job> jobs=new HashSet<>();
  private final ThreadPoolExecutor workers,cancellations;
  private final ScheduledExecutorService watchdog;
  private final int slots,queueCapacity;private final long deadlineMs;private boolean closed;
  private static final AtomicInteger poolIds=new AtomicInteger();

  public ScannerTaskPool(int slots,int queueCapacity,long deadlineMs){
    if(slots<1||slots>2||queueCapacity<0||queueCapacity>128||deadlineMs<1||deadlineMs>30000)throw new IllegalArgumentException("Invalid native scanner budgets");
    this.slots=slots;this.queueCapacity=queueCapacity;this.deadlineMs=deadlineMs;
    int poolId=poolIds.incrementAndGet();
    workers=new ThreadPoolExecutor(slots,slots,0,TimeUnit.MILLISECONDS,queueCapacity==0?new SynchronousQueue<>():new ArrayBlockingQueue<>(queueCapacity),factory("scanner-io-"+poolId),new ThreadPoolExecutor.AbortPolicy());
    cancellations=new ThreadPoolExecutor(1,1,0,TimeUnit.MILLISECONDS,new ArrayBlockingQueue<>(128),factory("scanner-cancel-"+poolId),new ThreadPoolExecutor.AbortPolicy());
    watchdog=Executors.newSingleThreadScheduledExecutor(factory("scanner-watchdog-"+poolId));
  }
  private static ThreadFactory factory(String name){AtomicInteger ids=new AtomicInteger();return action->{Thread thread=new Thread(action,name+"-"+ids.incrementAndGet());thread.setDaemon(true);return thread;};}
  private void dispatchCancel(Runnable action){
    if(action==null)return;
    try{cancellations.execute(()->{try{action.run();}catch(RuntimeException ignored){}});}catch(RejectedExecutionException ignored){/* Do not spawn replacement cancellation workers. */}
  }
  public Stats stats(){synchronized(lock){int active=0,queued=0,quarantined=0;for(Job job:jobs){if(job.running){active++;if(job.quarantined)quarantined++;}else if(!job.settled)queued++;}return new Stats(active,queued,quarantined);}}
  public void submit(String scope,Operation operation,Consumer<Result> callback){
    if(scope==null||scope.isEmpty())throw new IllegalArgumentException("Task scope is required");
    Job job=new Job(scope,operation,callback);String rejection=null;
    synchronized(lock){
      Stats stats=stats();
      if(closed)rejection="cancelled";
      else if(stats.quarantined==slots)rejection="circuit-open";
      else if(jobs.size()>=slots+queueCapacity)rejection="queue-full";
      else {jobs.add(job);try{workers.execute(job);}catch(RejectedExecutionException error){jobs.remove(job);rejection="queue-full";}}
    }
    if(rejection!=null)notify(job,new Result(rejection,null,null));
  }
  public void cancel(String scope){List<Job> selected=new ArrayList<>();synchronized(lock){for(Job job:jobs)if(job.scope.equals(scope))selected.add(job);selected.sort(Comparator.comparingInt(job->job.running?1:0));}for(Job job:selected)finish(job,new Result("cancelled",null,null),true);}
  private static void notify(Job job,Result result){try{job.callback.accept(result);}catch(RuntimeException ignored){/* A consumer cannot kill a worker or the watchdog. */}}
  private void finish(Job job,Result result,boolean requestCancel){
    List<Job> blocked=new ArrayList<>();
    synchronized(lock){
      if(job.settled)return;job.settled=true;if(job.timer!=null)job.timer.cancel(false);
      if(requestCancel&&job.running)job.quarantined=true;
      if(!job.running){jobs.remove(job);workers.remove(job);}
      if(stats().quarantined==slots)for(Job pending:jobs)if(!pending.running&&!pending.settled)blocked.add(pending);
    }
    if(requestCancel)job.token.cancel();
    notify(job,result);
    for(Job pending:blocked)finish(pending,new Result("circuit-open",null,null),true);
  }
  private final class Job implements Runnable {
    final String scope;final Operation operation;final Consumer<Result> callback;final Token token=new Token();
    boolean running,settled,quarantined;ScheduledFuture<?> timer;
    Job(String scope,Operation operation,Consumer<Result> callback){this.scope=scope;this.operation=operation;this.callback=callback;}
    public void run(){
      synchronized(lock){if(settled){jobs.remove(this);return;}running=true;timer=watchdog.schedule(()->finish(this,new Result("timeout",null,"native-operation-deadline"),true),deadlineMs,TimeUnit.MILLISECONDS);}
      try{token.check();Object value=operation.run(token);finish(this,new Result("ok",value,null),false);}
      catch(Exception|LinkageError error){finish(this,new Result(token.isCancelled()?"cancelled":"error",null,error.getMessage()),false);}
      finally{synchronized(lock){if(timer!=null)timer.cancel(false);jobs.remove(this);running=false;quarantined=false;}}
    }
  }
  public void close(){List<Job> selected;synchronized(lock){closed=true;selected=new ArrayList<>(jobs);}for(Job job:selected)finish(job,new Result("cancelled",null,null),true);watchdog.shutdown();workers.shutdownNow();cancellations.shutdown();}
}
