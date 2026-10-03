import * as SecureStore from 'expo-secure-store';
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

const root=(documentDirectory || '')+'archivist-state/';
const pendingWrites=new Map<string,Promise<void>>();

function browserStorageAvailable(){
  try{return typeof globalThis!=='undefined'&&!!globalThis.localStorage;}catch{return false;}
}

function readBrowserValue<T>(key:string):T|null{
  if(!browserStorageAvailable())return null;
  try{
    const raw=globalThis.localStorage.getItem(key);
    return raw?JSON.parse(raw) as T:null;
  }catch{return null;}
}

function writeBrowserValue(key:string,value:string){
  if(!browserStorageAvailable())return false;
  try{globalThis.localStorage.setItem(key,value);return true;}catch{return false;}
}

function deleteBrowserValue(key:string){
  if(!browserStorageAvailable())return;
  try{globalThis.localStorage.removeItem(key);}catch{}
}

function queueWrite(key:string,operation:()=>Promise<void>):Promise<void>{
  const previous=pendingWrites.get(key) || Promise.resolve();
  const next=previous.catch(()=>undefined).then(operation);
  pendingWrites.set(key,next);
  return next.finally(()=>{
    if(pendingWrites.get(key)===next)pendingWrites.delete(key);
  });
}

function fileName(key:string){
  return key.replace(/[^a-z0-9._-]+/gi,'_')+'.json';
}

function paths(key:string){
  const primary=root+fileName(key);
  return {primary,backup:primary+'.bak'};
}

async function ensureRoot(){
  if(!documentDirectory) return false;
  const info=await getInfoAsync(root);
  if(!info.exists) await makeDirectoryAsync(root,{intermediates:true});
  return true;
}

async function readJSONFile(uri:string):Promise<{ok:true;value:unknown}|{ok:false}>{
  try{
    const info=await getInfoAsync(uri);
    if(!info.exists)return {ok:false};
    return {ok:true,value:JSON.parse(await readAsStringAsync(uri))};
  }catch{
    return {ok:false};
  }
}

export async function getPersistedJSON<T>(key:string):Promise<T|null>{
  await pendingWrites.get(key)?.catch(()=>undefined);
  if(await ensureRoot()){
    const {primary,backup}=paths(key);
    const current=await readJSONFile(primary);
    if(current.ok)return current.value as T;
    const previous=await readJSONFile(backup);
    if(previous.ok)return previous.value as T;
  }

  // Draftbit/web previews do not always expose the native SecureStore bridge.
  // Use browser storage there instead of touching an unavailable native module.
  const browserValue=readBrowserValue<T>(key);
  if(browserValue!==null)return browserValue;

  // One-time migration from older native builds that kept local state in SecureStore.
  try{
    const legacy=await SecureStore.getItemAsync(key);
    if(!legacy)return null;
    const value=JSON.parse(legacy) as T;
    await setPersistedJSON(key,value);
    deleteBrowserValue(key);
    await SecureStore.deleteItemAsync(key).catch(()=>undefined);
    return value;
  }catch{
    return null;
  }
}

export function setPersistedJSON(key:string,value:unknown):Promise<void>{
  const encoded=JSON.stringify(value);
  return queueWrite(key,async()=>{
    if(!(await ensureRoot())){
      // Draftbit/web previews have no native document directory. Prefer browser
      // storage so an unavailable SecureStore bridge never surfaces as a UI error.
      if(writeBrowserValue(key,encoded))return;
      try{await SecureStore.setItemAsync(key,encoded);}catch{return;}
      return;
    }
    const {primary,backup}=paths(key);
    try{
      const info=await getInfoAsync(primary);
      if(info.exists){
        await deleteAsync(backup,{idempotent:true}).catch(()=>undefined);
        await copyAsync({from:primary,to:backup});
      }
    }catch{
      // A backup is best-effort; never block the fresh state write.
    }
    await writeAsStringAsync(primary,encoded);
  });
}

export function deletePersistedJSON(key:string):Promise<void>{
  return queueWrite(key,async()=>{
    if(await ensureRoot()){
      const {primary,backup}=paths(key);
      await Promise.all([
        deleteAsync(primary,{idempotent:true}).catch(()=>undefined),
        deleteAsync(backup,{idempotent:true}).catch(()=>undefined),
      ]);
    }
    await SecureStore.deleteItemAsync(key).catch(()=>undefined);
  });
}
