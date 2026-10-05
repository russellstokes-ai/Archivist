import {Image} from 'react-native';
import {createDownloadResumable,deleteAsync,documentDirectory,getInfoAsync,makeDirectoryAsync} from 'expo-file-system/legacy';

const root=(documentDirectory||'')+'archivist-covers/';

const coverDownloadTimeoutMs=10_000;
const coverDimensionTimeoutMs=3_000;
const maxCoverBytes=12*1024*1024;

function timeoutError(label:string){
  return Error(label+' timed out.');
}

function withTimeout<T>(promise:Promise<T>,timeoutMs:number,label:string){
  return new Promise<T>((resolve,reject)=>{
    let settled=false;
    const timer=setTimeout(()=>{
      if(settled)return;
      settled=true;
      reject(timeoutError(label));
    },timeoutMs);
    promise.then(value=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve(value);
    },error=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16).padStart(8,'0');
}

function safePart(value:string){
  return String(value||'cover').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,72)||'cover';
}

async function ensureRoot(){
  if(!documentDirectory)throw Error('Persistent cover storage is unavailable.');
  const info=await getInfoAsync(root);
  if(!info.exists)await makeDirectoryAsync(root,{intermediates:true});
}

export function cachedCoverUri(key:string,remoteUri:string){
  return root+safePart(key)+'-'+hash(remoteUri)+'.jpg';
}

export async function cacheRemoteCover(key:string,remoteUri:string){
  if(!/^https:\/\//i.test(remoteUri))throw Error('Only HTTPS cover artwork can be cached.');
  await ensureRoot();
  const target=cachedCoverUri(key,remoteUri);
  const existing=await getInfoAsync(target).catch(()=>({exists:false} as const));
  if(existing.exists&&(!('size' in existing)||typeof existing.size!=='number'||existing.size>256))return target;
  const temp=target+'.download';
  await deleteAsync(temp,{idempotent:true}).catch(()=>undefined);
  let oversized=false;
  const task=createDownloadResumable(remoteUri,temp,{},progress=>{
    const total=Number(progress.totalBytesExpectedToWrite)||0;
    const written=Number(progress.totalBytesWritten)||0;
    if((total>maxCoverBytes||written>maxCoverBytes)&&!oversized){
      oversized=true;
      void task.cancelAsync().catch(()=>undefined);
    }
  });
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    const result=await Promise.race([
      task.downloadAsync(),
      new Promise<never>((_,reject)=>{
        timer=setTimeout(()=>{
          void task.cancelAsync().catch(()=>undefined);
          reject(timeoutError('Cover download'));
        },coverDownloadTimeoutMs);
      }),
    ]);
    if(oversized)throw Error('Cover exceeds the 12 MB safety limit.');
    if(!result)throw Error('Cover download was cancelled.');
    if(result.status<200||result.status>=300)throw Error('Cover download failed with HTTP '+result.status+'.');
  }catch(error){
    await deleteAsync(temp,{idempotent:true}).catch(()=>undefined);
    throw error;
  }finally{
    if(timer)clearTimeout(timer);
  }
  const info=await getInfoAsync(temp);
  if(!info.exists||('size' in info&&typeof info.size==='number'&&info.size<=256)){
    await deleteAsync(temp,{idempotent:true}).catch(()=>undefined);
    throw Error('Downloaded cover was empty.');
  }
  await deleteAsync(target,{idempotent:true}).catch(()=>undefined);
  // expo-file-system legacy has no atomic rename on every provider. copyAsync
  // would duplicate bytes; moveAsync is used only inside the app document dir.
  const {moveAsync}=await import('expo-file-system/legacy');
  await moveAsync({from:temp,to:target});
  return target;
}

export function imageDimensions(uri:string,timeoutMs=coverDimensionTimeoutMs):Promise<{width:number;height:number}>{
  return withTimeout(new Promise((resolve,reject)=>{
    Image.getSize(uri,(width,height)=>resolve({width,height}),reject);
  }),timeoutMs,'Cover dimension probe');
}

export async function cachePortraitCover(key:string,remoteUri:string){
  const uri=await cacheRemoteCover(key,remoteUri);
  try{
    const dimensions=await imageDimensions(uri);
    if(!dimensions.width||!dimensions.height)throw Error('Cover dimensions are unavailable.');
    const ratio=dimensions.width/dimensions.height;
    if(ratio<0.48||ratio>0.80)throw Error('Cover is not a suitable portrait book jacket.');
    return {uri,...dimensions,aspectRatio:ratio};
  }catch(error){
    await removeCachedCover(uri).catch(()=>undefined);
    throw error;
  }
}
export async function removeCachedCover(uri:string){
  if(!uri.startsWith(root))return false;
  await deleteAsync(uri,{idempotent:true});
  return true;
}
