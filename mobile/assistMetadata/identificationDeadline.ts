// Bound the complete lookup, including native evidence and provider fallbacks.
// Aborting also fences late responses before they can commit metadata.
export async function boundedIdentification<T>(operation:()=>Promise<T>,owner:AbortController,timeoutMs=120000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined,expired=false;
 let abort=()=>{};
 const stopped=new Promise<never>((_,reject)=>{
  abort=()=>reject(Error(expired?'Identification deadline':'Identification cancelled'));
  owner.signal.addEventListener('abort',abort,{once:true});
  if(owner.signal.aborted)abort();
  else timer=setTimeout(()=>{expired=true;owner.abort();},timeoutMs);
 });
 try{return await Promise.race([stopped,Promise.resolve().then(()=>{
  if(owner.signal.aborted)throw Error('Identification cancelled');
  return operation();
 })]);}
 finally{clearTimeout(timer);owner.signal.removeEventListener('abort',abort);}
}
