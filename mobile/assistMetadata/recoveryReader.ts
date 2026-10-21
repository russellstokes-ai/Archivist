import {BoundedTasks} from '../scannerVNext/tasks';

/** Read-only recovery must not hold up discovery or exhaust native workers. */
export class RecoveryReader {
 private readonly tasks:BoundedTasks;
 // Native hashing has a 60-second budget; allow it to finish on large audio.
 constructor(deadlineMs=65000){this.tasks=new BoundedTasks({slots:1,queueCapacity:0,deadlineMs});}
 async read(operation:()=>Promise<string|null>,signal?:AbortSignal):Promise<string|null>{
  if(signal?.aborted)throw Error('Recovery cancelled');
  let abort:()=>void=()=>{};
  const cancelled=new Promise<never>((_,reject)=>{abort=()=>reject(Error('Recovery cancelled'));signal?.addEventListener('abort',abort,{once:true});});
  try{
   const outcome=await Promise.race([this.tasks.run(operation,this.tasks.snapshot().generation),cancelled]);
   if(signal?.aborted)throw Error('Recovery cancelled');
   if(outcome.state!=='ok')throw Error('Recovery '+outcome.state);
   return outcome.value;
  }finally{signal?.removeEventListener('abort',abort);}
 }
}
