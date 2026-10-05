/** Schedule only after completion; cancellation cannot resurrect a stopped loop. */
export function startPageTurnLoop(input:{
  firstDelay:number;restDelay:number;
  reset:()=>void;animate:(done:(finished:boolean)=>void)=>void;stop:()=>void;
  preserveCurrentOnStop?:boolean;
  schedule?:(callback:()=>void,delay:number)=>any;cancel?:(timer:any)=>void;
}){
  const schedule=input.schedule||setTimeout,cancel=input.cancel||clearTimeout;
  let stopped=false,timer:any;
  const turn=()=>{
    if(stopped)return;
    input.reset();
    input.animate(finished=>{
      if(stopped||!finished)return;
      input.reset();timer=schedule(turn,input.restDelay);
    });
  };
  timer=schedule(turn,input.firstDelay);
  return()=>{
    if(stopped)return;
    stopped=true;
    cancel(timer);
    // Player close/reopen can let an in-flight native page finish behind the
    // leaf visibility gate. This avoids snapping a half-turned page backwards.
    if(!input.preserveCurrentOnStop)input.stop();
  };
}
