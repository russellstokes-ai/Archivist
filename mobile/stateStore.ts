import * as SecureStore from 'expo-secure-store';
import {
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

// Central persistence is also used by the approved scanner and Archivist
// Assist. This changes only the storage implementation, not their workflows.
// V2 uses three independent, collision-free file slots per key. A failed or
// torn save can damage at most the oldest/invalid slot; the latest valid
// generation and at least one additional generation remain untouched.
const root=(documentDirectory || '')+'archivist-state/';
const pendingWrites=new Map<string,Promise<unknown>>();
const slotsPerKey=3;
const maxKeyBytes=112; // Bound Android filesystem component length (<255 bytes).
const maxRecordChars=48*1024*1024;
type StoredSlot={uri:string;revision:number;value:unknown;deleted:boolean};
type CheckedSlot={uri:string;exists:boolean;valid:StoredSlot|null};
type RecordV2={
  archivistState:2;key:string;revision:number;deleted:boolean;data:string;checksum:string;
};

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
function queueWrite<T>(key:string,operation:()=>Promise<T>):Promise<T>{
  const previous=pendingWrites.get(key)||Promise.resolve();
  const next=previous.catch(()=>undefined).then(operation);
  pendingWrites.set(key,next);
  return next.finally(()=>{
    if(pendingWrites.get(key)===next)pendingWrites.delete(key);
  });
}
// The old implementation replaced every non-name character with '_', which
// collided for distinct keys. Hex of UTF-8 is reversible and unique (also on
// case-insensitive filesystems). No crypto/global Buffer/TextEncoder required.
function keyHex(key:string):string{
  if(typeof key!=='string'||!key)throw Error('Archivist state key is invalid');
  const tokens=encodeURIComponent(key).match(/%[0-9a-fA-F]{2}|./g)||[];
  if(!tokens.length||tokens.length>maxKeyBytes)
    throw Error('Archivist state key is longer than the supported safe filename');
  return tokens.map(value=>value.charAt(0)==='%'
    ? value.slice(1).toLowerCase()
    : value.charCodeAt(0).toString(16).padStart(2,'0')).join('');
}
function slotPaths(key:string):string[]{
  const prefix=root+'k'+keyHex(key);
  return Array.from({length:slotsPerKey},(_,index)=>prefix+'.s'+index+'.json');
}
function legacyPaths(key:string){
  // A legacy sanitized path does not prove ownership of arbitrary keys. Only
  // the pre-existing app's unescaped dot-prefixed namespace is unambiguous.
  // Exotic keys get isolated V2 paths but must never claim another key's old
  // alias (e.g. archivist/a:b and archivist:a/b).
  if(!/^archivist\.[a-zA-Z0-9._-]+$/.test(key))return null;
  const primary=root+key+'.json';
  return {primary,backup:primary+'.bak'};
}
function checksum(key:string,revision:number,deleted:boolean,data:string):string{
  // Non-cryptographic corruption detection for unexpected partial/bit-flipped
  // filesystem writes. Security/authenticity is NOT supplied by this checksum.
  let hash=2166136261;
  const value=key+'\0'+revision+'\0'+(deleted?'D':'V')+'\0'+data;
  for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);
  return (hash>>>0).toString(16).padStart(8,'0');
}
async function ensureRoot(){
  if(!documentDirectory)return false;
  const info=await getInfoAsync(root);
  if(!info.exists)await makeDirectoryAsync(root,{intermediates:true});
  return true;
}
async function readJSONFile(uri:string):Promise<{ok:true;value:unknown}|{ok:false}>{
  // Existing legacy input may contain arbitrary JSON; a corrupt primary is
  // not authority to replace the valid legacy backup.
  try{
    const info=await getInfoAsync(uri);
    if(!info.exists)return {ok:false};
    const contents=await readAsStringAsync(uri);
    return {ok:true,value:JSON.parse(contents)};
  }catch{
    return {ok:false};
  }
}
async function checkedSlot(uri:string,key:string):Promise<CheckedSlot>{
  const info=await getInfoAsync(uri); // Fail closed on permission/IO errors.
  if(!info.exists)return {uri,exists:false,valid:null};
  if(typeof info.size==='number'&&info.size>maxRecordChars)
    return {uri,exists:true,valid:null};
  try{
    const raw=await readAsStringAsync(uri);
    if(raw.length>maxRecordChars)return {uri,exists:true,valid:null};
    const item=JSON.parse(raw) as Partial<RecordV2>;
    if(!item||item.archivistState!==2||item.key!==key
       ||!Number.isSafeInteger(item.revision)||item.revision!<1
       ||typeof item.deleted!=='boolean'||typeof item.data!=='string'
       ||typeof item.checksum!=='string'
       ||item.checksum!==checksum(key,item.revision!,item.deleted,item.data))
      return {uri,exists:true,valid:null};
    const value=item.deleted?null:JSON.parse(item.data);
    return {uri,exists:true,valid:{
      uri,revision:item.revision!,value,deleted:item.deleted
    }};
  }catch{
    return {uri,exists:true,valid:null};
  }
}
async function slotsFor(key:string):Promise<CheckedSlot[]>{
  return Promise.all(slotPaths(key).map(uri=>checkedSlot(uri,key)));
}
function newestValid(slots:CheckedSlot[]):StoredSlot|null{
  return slots.map(item=>item.valid).filter((v):v is StoredSlot=>!!v)
    .sort((a,b)=>b.revision-a.revision)[0]||null;
}
async function legacyValue(key:string):Promise<{ok:true;value:unknown}|{ok:false}>{
  const paths=legacyPaths(key);
  if(!paths)return {ok:false};
  const current=await readJSONFile(paths.primary);
  if(current.ok)return current;
  return readJSONFile(paths.backup);
}
async function secureLegacy<T>(key:string):Promise<T|null>{
  const raw=await SecureStore.getItemAsync(key);
  if(!raw)return null;
  return JSON.parse(raw) as T;
}

export async function getPersistedJSON<T>(key:string):Promise<T|null>{
  // The key is validated even when documentDirectory is unavailable.
  keyHex(key);
  await pendingWrites.get(key)?.catch(()=>undefined);
  if(await ensureRoot()){
    const slots=await slotsFor(key);
    const latest=newestValid(slots);
    if(latest)return latest.deleted?null:latest.value as T;
    const old=await legacyValue(key);
    if(old.ok)return old.value as T;
    if(slots.some(item=>item.exists))
      throw Error('Archivist saved state has damaged records; old files retained for recovery.');
  }
  const browserValue=readBrowserValue<T>(key);
  if(browserValue!==null)return browserValue;
  try{
    const prior=await secureLegacy<T>(key);
    if(prior===null)return null;
    try{
      await setPersistedJSON(key,prior);
    }catch{
      // Never discard the SecureStore original if durable migration failed.
      return prior;
    }
    deleteBrowserValue(key);
    await SecureStore.deleteItemAsync(key).catch(()=>undefined);
    return prior;
  }catch{
    return null;
  }
}

async function writeGeneration(key:string,data:string,deleted:boolean):Promise<string>{
  if(data.length>maxRecordChars)
    throw Error('Archivist saved state is too large; previous state retained.');
  const slots=await slotsFor(key);
  const valid=slots.map(item=>item.valid).filter((v):v is StoredSlot=>!!v);
  const highest=valid.reduce((max,item)=>Math.max(max,item.revision),0);
  if(highest>=Number.MAX_SAFE_INTEGER-1)
    throw Error('Archivist saved state revision exhausted; previous state retained.');
  if(!valid.length&&slots.some(s=>s.exists)){
    const old=await legacyValue(key);
    if(!old.ok)throw Error('Existing saved state is damaged; refusal to overwrite recovery files.');
  }
  // Select invalid/empty slot first; otherwise overwrite only the oldest
  // generation. For three full valid slots, the other two are untouched.
  const target=slots.find(item=>!item.valid)||
    slots.reduce((older,item)=>item.valid!.revision<older.valid!.revision?item:older);
  const revision=highest+1;
  const record:RecordV2={archivistState:2,key,revision,deleted,data,
    checksum:checksum(key,revision,deleted,data)};
  await writeAsStringAsync(target.uri,JSON.stringify(record));
  const verify=await checkedSlot(target.uri,key);
  if(!verify.valid||verify.valid.revision!==revision||verify.valid.deleted!==deleted||
     (deleted===false&&JSON.stringify(verify.valid.value)!==data)){
    throw Error('Archivist saved state could not be verified after write; previous versions retained.');
  }
  return target.uri;
}
function persistEncoded(key:string,encoded:string):Promise<void>{
  keyHex(key);
  return queueWrite(key,async()=>{
    if(!(await ensureRoot())){
      if(writeBrowserValue(key,encoded))return;
      await SecureStore.setItemAsync(key,encoded);
      return;
    }
    await writeGeneration(key,encoded,false);
  });
}
export function setPersistedJSON(key:string,value:unknown):Promise<void>{
  // Prevent undefined silently becoming a no-op or an unparseable backup.
  const encoded=JSON.stringify(value);
  if(typeof encoded!=='string')
    return Promise.reject(Error('Archivist cannot persist an undefined state'));
  return persistEncoded(key,encoded);
}
export async function setPersistedJSONArrayCooperative(
  key:string,
  values:unknown[],
  options:{batchSize?:number;shouldContinue?:()=>boolean}={},
):Promise<boolean>{
  const batchSize=Math.max(8,Math.min(256,Math.trunc(options.batchSize||48)));
  const shouldContinue=options.shouldContinue||(()=>true);
  const chunks:string[]=['['];
  for(let index=0;index<values.length;index+=1){
    if(!shouldContinue())return false;
    if(index)chunks.push(',');
    chunks.push(JSON.stringify(values[index]));
    if((index+1)%batchSize===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  if(!shouldContinue())return false;
  chunks.push(']');
  await new Promise<void>(resolve=>setTimeout(resolve,0));
  if(!shouldContinue())return false;
  await persistEncoded(key,chunks.join(''));
  return true;
}
export function deletePersistedJSON(key:string):Promise<void>{
  keyHex(key);
  return queueWrite(key,async()=>{
    if(await ensureRoot()){
      // Commit a durable V2 tombstone BEFORE removing legacy backups and
      // obsolete generations. Interrupted deletion never resurrects old data.
      const kept=await writeGeneration(key,'null',true);
      const old=legacyPaths(key);
      for(const uri of slotPaths(key)){
        if(uri!==kept)await deleteAsync(uri,{idempotent:true});
      }
      if(old){
        await deleteAsync(old.primary,{idempotent:true});
        await deleteAsync(old.backup,{idempotent:true});
      }
    }
    deleteBrowserValue(key);
    await SecureStore.deleteItemAsync(key);
  });
}
