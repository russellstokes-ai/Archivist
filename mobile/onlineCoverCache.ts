export const MAX_ONLINE_COVER_BYTES=12*1024*1024;

export type OnlineCoverBook={
  coverUri?:string;
  coverCandidates?:string[];
  onlineMetadataMatch?:{coverUri?:string};
  onlineComicMetadataMatch?:{coverUri?:string};
};

export type OnlineCoverOps={
  documentDirectory?:string|null;
  makeDirectoryAsync:(uri:string,options?:{intermediates?:boolean})=>Promise<unknown>;
  downloadAsync:(uri:string,target:string)=>Promise<{uri?:string;status?:number}>;
  getInfoAsync:(uri:string)=>Promise<{exists?:boolean;size?:number}>;
  deleteAsync:(uri:string,options?:{idempotent?:boolean})=>Promise<unknown>;
};

function isRemote(uri:unknown){
  return /^https?:\/\//i.test(String(uri||''));
}
function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i+=1){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16).padStart(8,'0');
}
function extension(uri:string){
  const path=uri.split('?')[0].toLowerCase();
  const match=path.match(/\.([a-z0-9]{2,5})$/);
  const ext=match?.[1];
  return ext&&['jpg','jpeg','png','webp','gif'].includes(ext)?ext:'jpg';
}
function unique(values:string[]){
  return values.filter((value,index)=>value&&values.indexOf(value)===index);
}

export async function persistOnlineCover(uri:string,ops:OnlineCoverOps){
  if(!isRemote(uri)||!ops.documentDirectory)return uri;
  const directory=ops.documentDirectory+'covers/online/';
  await ops.makeDirectoryAsync(directory,{intermediates:true});
  const target=directory+'cover-'+hash(uri)+'.'+extension(uri);
  const existing=await ops.getInfoAsync(target).catch(()=>null);
  if(existing?.exists&&Number(existing.size)>0&&Number(existing.size)<=MAX_ONLINE_COVER_BYTES)return target;
  if(existing?.exists)await ops.deleteAsync(target,{idempotent:true}).catch(()=>undefined);
  try{
    const result=await ops.downloadAsync(uri,target);
    if(result?.status!==undefined&&(result.status<200||result.status>=300))throw Error('Cover download returned '+result.status);
    const info=await ops.getInfoAsync(target).catch(()=>null);
    const size=Number(info?.size||0);
    if(!info?.exists||!size||size>MAX_ONLINE_COVER_BYTES)throw Error('Downloaded cover failed size validation');
    return target;
  }catch{
    await ops.deleteAsync(target,{idempotent:true}).catch(()=>undefined);
    return uri;
  }
}

export async function cacheOnlineCoverUris<T extends OnlineCoverBook>(
  books:T[],
  ops:OnlineCoverOps,
  options:{concurrency?:number;shouldContinue?:()=>boolean}={},
):Promise<{books:T[];attempted:number;cached:number}>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const concurrency=Math.max(1,Math.min(4,Math.trunc(options.concurrency||3)));
  const next=books.slice();
  // Build one job per distinct remote cover URL. MP3 chapters commonly carry
  // identical cover links, and simultaneous per-track workers previously
  // downloaded into the same hashed destination before it existed on disk.
  const jobs=new Map<string,number[]>();
  books.forEach((book,index)=>{
    const remote=String(book.coverUri||'').trim();
    if(!isRemote(remote))return;
    const indices=jobs.get(remote)||[];
    indices.push(index);
    jobs.set(remote,indices);
  });

  const queue=[...jobs.entries()];
  let cursor=0,attempted=0,cached=0;
  const worker=async()=>{
    while(shouldContinue()){
      const slot=cursor++;
      if(slot>=queue.length)return;
      const [remote,indices]=queue[slot];
      attempted+=1;
      const local=await persistOnlineCover(remote,ops);
      // Never apply an incomplete or stale remote result after cancellation.
      if(!shouldContinue())return;
      if(local===remote)continue;
      cached+=1;
      for(const index of indices){
        const book=next[index];
        next[index]={
          ...book,
          coverUri:local,
          coverCandidates:unique([local,...(book.coverCandidates||[]),remote]),
        };
      }
    }
  };
  await Promise.all(Array.from({length:Math.min(concurrency,queue.length)},()=>worker()));
  return {books:next,attempted,cached};
}
