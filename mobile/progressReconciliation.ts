// Offline-safe progress outbox. Deliberately separate from the approved reader
// renderer, native scanner and Archivist Assist. The caller supplies durable
// storage scoped to one server and signed-in profile; never persist access tokens.
export type ProgressKind = 'edition'|'listening'|'reading';
export type ProgressValue = {
  asset?:number; seconds?:number; part?:number; fraction?:number; complete:boolean;
};
export type RemoteProgress = ProgressValue & {
  kind:ProgressKind; id:number; revision:number;
};
export type PendingProgress = {
  kind:ProgressKind; id:number; baseRevision:number;
  position:ProgressValue; sequence:number;
};
type Envelope = {version:1; nextSequence:number; entries:PendingProgress[]};
export type ProgressStorage = {
  read:(key:string)=>Promise<string|null>;
  write:(key:string,serialized:string)=>Promise<void>;
};
export type ProgressDecision = {
  pending:PendingProgress;
  action:'upload'|'conflict'|'already-synced'|'wait-for-all-pages';
  remote?:RemoteProgress;
};
const kinds=new Set<ProgressKind>(['edition','listening','reading']);
const MAX_ENTRIES=500;
const MAX_RAW=1024*1024;

function validRecord(kind:ProgressKind,id:number,position:ProgressValue,revision:number):boolean{
  if(!kinds.has(kind)||!Number.isSafeInteger(id)||id<1
     ||!Number.isSafeInteger(revision)||revision<0||typeof position.complete!=='boolean')return false;
  if(kind==='reading'){
    return Number.isSafeInteger(position.part)&&position.part!>=0&&position.part!<=100000
      &&typeof position.fraction==='number'&&Number.isFinite(position.fraction)
      &&position.fraction>=0&&position.fraction<=1;
  }
  return Number.isSafeInteger(position.asset)&&position.asset!>0
    &&typeof position.seconds==='number'&&Number.isFinite(position.seconds)
    &&position.seconds>=0&&position.seconds<=31536000
    &&(kind==='listening'?position.asset===id:true);
}
function copyPosition(kind:ProgressKind,position:ProgressValue):ProgressValue{
  return kind==='reading'
    ? {part:position.part,fraction:position.fraction,complete:position.complete}
    : {asset:position.asset,seconds:position.seconds,complete:position.complete};
}
function samePosition(kind:ProgressKind,a:ProgressValue,b:ProgressValue):boolean{
  return a.complete===b.complete&&(kind==='reading'
    ? a.part===b.part&&a.fraction===b.fraction
    : a.asset===b.asset&&a.seconds===b.seconds);
}
function parseEnvelope(serialized:string|null):Envelope{
  if(serialized===null)return {version:1,nextSequence:1,entries:[]};
  if(serialized.length>MAX_RAW)throw Error('Offline progress journal is too large; original saved state retained.');
  let parsed:unknown;
  try{parsed=JSON.parse(serialized)}catch{throw Error('Offline progress journal is damaged; original saved state retained.')}
  const x=parsed as Partial<Envelope>;
  if(!x||x.version!==1||!Number.isSafeInteger(x.nextSequence)||x.nextSequence!<1
     ||!Array.isArray(x.entries)||x.entries.length>MAX_ENTRIES){
    throw Error('Offline progress journal is incompatible; original saved state retained.');
  }
  const keys=new Set<string>();
  for(const entry of x.entries){
    if(!entry||!Number.isSafeInteger(entry.sequence)||entry.sequence<1
       ||entry.sequence>=x.nextSequence!||!validRecord(entry.kind,entry.id,entry.position,entry.baseRevision)){
      throw Error('Offline progress journal has invalid entries; original saved state retained.');
    }
    const key=entry.kind+':'+entry.id;
    if(keys.has(key))throw Error('Offline progress journal has duplicate entries; original saved state retained.');
    keys.add(key);
  }
  return x as Envelope;
}

// Fetch all pages before planning any replay. A partial page must never be
// mistaken for missing server history; fail closed on duplicates or gaps.
export async function fetchCompleteProgressSnapshot(
  read:(path:string)=>Promise<unknown>,limit=100,maxPages=100,
):Promise<RemoteProgress[]>{
  if(!Number.isSafeInteger(limit)||limit<1||limit>200
     ||!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>100){
    throw Error('Invalid progress snapshot bounds');
  }
  const all:RemoteProgress[]=[];
  const seen=new Set<string>();
  let offset=0;
  for(let page=0;page<maxPages;page++){
    const raw=await read('/api/sync/progress?limit='+limit+'&offset='+offset);
    const response=raw as {items?:unknown;hasMore?:unknown;nextOffset?:unknown}|null;
    if(!response||!Array.isArray(response.items)||typeof response.hasMore!=='boolean'
       ||!Number.isSafeInteger(response.nextOffset)
       ||response.items.length>limit || response.nextOffset!==offset+response.items.length
       ||(response.hasMore && response.items.length!==limit)){
      throw Error('Progress snapshot incomplete or malformed; preserve all offline bookmarks');
    }
    for(const entry of response.items){
      if(!entry||typeof entry!=='object')throw Error('Invalid server progress snapshot entry');
      const item=entry as RemoteProgress;
      if(!validRecord(item.kind,item.id,item,item.revision)){
        throw Error('Invalid server progress snapshot entry');
      }
      const key=item.kind+':'+item.id;
      if(seen.has(key))throw Error('Duplicate server progress snapshot entry; preserve offline bookmarks');
      seen.add(key);all.push({...item});
    }
    if(!response.hasMore)return all;
    offset=response.nextOffset as number;
  }
  throw Error('Progress snapshot exceeded page limit; preserve offline bookmarks');
}

// Works on a complete, profile-authorised server snapshot. A single incomplete
// page is never enough to conclude that an entry is missing on the server.
export function planProgressReplay(
  pending:PendingProgress[], remote:RemoteProgress[], hasMore:boolean,
):ProgressDecision[]{
  const remoteMap=new Map<string,RemoteProgress>();
  for(const item of remote){
    if(!validRecord(item.kind,item.id,item,item.revision))throw Error('Invalid remote progress entry');
    const key=item.kind+':'+item.id;
    if(remoteMap.has(key))throw Error('Duplicate remote progress entry; preserve offline bookmarks');
    remoteMap.set(key,item);
  }
  return pending.map(item=>{
    if(!validRecord(item.kind,item.id,item.position,item.baseRevision))throw Error('Invalid offline progress entry');
    const found=remoteMap.get(item.kind+':'+item.id);
    if(!found&&hasMore)return {pending:item,action:'wait-for-all-pages' as const};
    if(found&&samePosition(item.kind,item.position,found))return {pending:item,remote:found,action:'already-synced' as const};
    if(!found&&item.baseRevision===0)return {pending:item,action:'upload' as const};
    if(found&&found.revision===item.baseRevision)return {pending:item,remote:found,action:'upload' as const};
    return {pending:item,remote:found,action:'conflict' as const};
  });
}

export class OfflineProgressOutbox {
  readonly key:string;
  private tail:Promise<unknown>=Promise.resolve();
  constructor(private readonly storage:ProgressStorage,server:string,profileId:number){
    let origin:URL;
    try{origin=new URL(server)}catch{throw Error('Invalid progress server origin')}
    if(!['http:','https:'].includes(origin.protocol)||origin.origin!==server||!Number.isSafeInteger(profileId)||profileId<0){
      throw Error('Progress outbox requires an exact server origin and profile identity');
    }
    this.key='archivist-progress-v1:'+encodeURIComponent(server)+':'+profileId;
  }
  private enqueueOperation<T>(operation:()=>Promise<T>):Promise<T>{
    const result=this.tail.catch(()=>undefined).then(operation);
    this.tail=result;return result;
  }
  list():Promise<PendingProgress[]>{
    return this.enqueueOperation(async()=>parseEnvelope(await this.storage.read(this.key)).entries.map(
      entry=>({...entry,position:{...entry.position}})
    ));
  }
  record(kind:ProgressKind,id:number,position:ProgressValue,baseRevision:number):Promise<PendingProgress>{
    if(!validRecord(kind,id,position,baseRevision))return Promise.reject(Error('Invalid offline progress'));
    return this.enqueueOperation(async()=>{
      const old=parseEnvelope(await this.storage.read(this.key));
      const existing=old.entries.find(entry=>entry.kind===kind&&entry.id===id);
      const item:PendingProgress={
        kind,id,position:copyPosition(kind,position),
        // Maintain the original base revision while events are queued offline.
        // Otherwise we could silently overwrite another device's changes.
        baseRevision:existing?.baseRevision??baseRevision,
        sequence:old.nextSequence,
      };
      const entries=old.entries.filter(entry=>entry.kind!==kind||entry.id!==id);
      if(entries.length>=MAX_ENTRIES)throw Error('Offline progress journal is full; no progress was discarded');
      entries.push(item);
      await this.storage.write(this.key,JSON.stringify({version:1,nextSequence:old.nextSequence+1,entries}));
      return {...item,position:{...item.position}};
    });
  }
  acknowledge(kind:ProgressKind,id:number,sequence:number):Promise<boolean>{
    return this.enqueueOperation(async()=>{
      const old=parseEnvelope(await this.storage.read(this.key));
      const item=old.entries.find(entry=>entry.kind===kind&&entry.id===id);
      if(!item||item.sequence!==sequence)return false;
      // A stale success response cannot erase a newer locally queued position.
      const entries=old.entries.filter(entry=>entry!==item);
      await this.storage.write(this.key,JSON.stringify({...old,entries}));
      return true;
    });
  }
}
