import {deleteAsync,documentDirectory,downloadAsync,getInfoAsync,makeDirectoryAsync} from 'expo-file-system/legacy';

const root=(documentDirectory||'')+'archivist-covers/';

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
  const result=await downloadAsync(remoteUri,temp);
  if(result.status<200||result.status>=300){
    await deleteAsync(temp,{idempotent:true}).catch(()=>undefined);
    throw Error('Cover download failed with HTTP '+result.status+'.');
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

export async function removeCachedCover(uri:string){
  if(!uri.startsWith(root))return false;
  await deleteAsync(uri,{idempotent:true});
  return true;
}
