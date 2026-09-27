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
  if(await ensureRoot()){
    const {primary,backup}=paths(key);
    const current=await readJSONFile(primary);
    if(current.ok)return current.value as T;
    const previous=await readJSONFile(backup);
    if(previous.ok)return previous.value as T;
  }

  // One-time migration from builds that kept all local state in SecureStore.
  try{
    const legacy=await SecureStore.getItemAsync(key);
    if(!legacy)return null;
    const value=JSON.parse(legacy) as T;
    await setPersistedJSON(key,value);
    await SecureStore.deleteItemAsync(key).catch(()=>undefined);
    return value;
  }catch{
    return null;
  }
}

export async function setPersistedJSON(key:string,value:unknown):Promise<void>{
  const encoded=JSON.stringify(value);
  if(!(await ensureRoot())){
    // Extremely defensive fallback for runtimes without a document directory.
    await SecureStore.setItemAsync(key,encoded);
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
}

export async function deletePersistedJSON(key:string):Promise<void>{
  if(await ensureRoot()){
    const {primary,backup}=paths(key);
    await Promise.all([
      deleteAsync(primary,{idempotent:true}).catch(()=>undefined),
      deleteAsync(backup,{idempotent:true}).catch(()=>undefined),
    ]);
  }
  await SecureStore.deleteItemAsync(key).catch(()=>undefined);
}
