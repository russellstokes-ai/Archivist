export type TaskOutcome<T>={state:'ok';value:T}|{state:'cancelled'|'timeout'|'error'|'queue-full'|'circuit-open'|'stale';reason?:string};
type Pending={generation:number;operation:(signal:AbortSignal)=>Promise<unknown>;finish:(outcome:TaskOutcome<unknown>)=>void;controller:AbortController;settled:boolean;quarantined:boolean;timer?:ReturnType<typeof setTimeout>};

export class BoundedTasks {
  private generation=0;
  private active=new Set<Pending>();
  private queue:Pending[]=[];
  constructor(private limits:{slots:number;queueCapacity:number;deadlineMs:number}){
    if(!Number.isInteger(limits.slots)||limits.slots<1||limits.slots>2||!Number.isInteger(limits.queueCapacity)||limits.queueCapacity<0||limits.queueCapacity>128||limits.deadlineMs<1||!Number.isFinite(limits.deadlineMs))throw new RangeError('Invalid task budgets');
  }
  snapshot(){return {active:this.active.size,queued:this.queue.length,quarantined:[...this.active].filter(p=>p.quarantined).length,generation:this.generation};}
  private finish(pending:Pending,outcome:TaskOutcome<unknown>){
    if(pending.settled)return;pending.settled=true;clearTimeout(pending.timer);pending.finish(outcome);
  }
  run<T>(operation:(signal:AbortSignal)=>Promise<T>,generation:number):Promise<TaskOutcome<T>>{
    if(generation!==this.generation)return Promise.resolve({state:'stale'});
    if(this.snapshot().quarantined===this.limits.slots)return Promise.resolve({state:'circuit-open'});
    if(this.active.size===this.limits.slots&&this.queue.length===this.limits.queueCapacity)return Promise.resolve({state:'queue-full'});
    return new Promise<TaskOutcome<T>>(resolve=>{
      const pending:Pending={operation,generation,finish:outcome=>resolve(outcome as TaskOutcome<T>),controller:new AbortController(),settled:false,quarantined:false};
      this.queue.push(pending);this.pump();
    });
  }
  cancelGeneration(){
    this.generation++;
    for(const pending of this.queue.splice(0)){this.finish(pending,{state:'cancelled'});pending.controller.abort();}
    for(const pending of this.active){pending.quarantined=true;this.finish(pending,{state:'cancelled'});pending.controller.abort();}
  }
  private pump(){
    while(this.queue.length&&this.active.size<this.limits.slots){
      const pending=this.queue.shift()!;
      if(pending.generation!==this.generation){this.finish(pending,{state:'stale'});continue;}
      this.active.add(pending);
      pending.timer=setTimeout(()=>{
        pending.quarantined=true;this.finish(pending,{state:'timeout'});pending.controller.abort();
        if(this.snapshot().quarantined===this.limits.slots)for(const queued of this.queue.splice(0))this.finish(queued,{state:'circuit-open'});
      },this.limits.deadlineMs);
      let promise:Promise<unknown>;
      try{promise=Promise.resolve(pending.operation(pending.controller.signal));}
      catch(error){promise=Promise.reject(error);}
      promise.then(value=>this.finish(pending,pending.generation===this.generation?{state:'ok',value}:{state:'stale'}),error=>this.finish(pending,{state:'error',reason:error instanceof Error?error.message:'Task failed'}))
        .finally(()=>{clearTimeout(pending.timer);this.active.delete(pending);this.pump();});
    }
  }
}
