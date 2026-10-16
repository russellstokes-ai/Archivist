import {
  OfflineProgressOutbox,
  fetchCompleteProgressSnapshot,
  planProgressReplay,
  type ProgressKind, type ProgressStorage, type PendingProgress, type ProgressValue,
} from './progressReconciliation';

// One fixed persisted state key per installation avoids placing raw URL/token or
// excessively long server origins in Android filenames. Values inside this map
// remain separately scoped by server origin and authenticated profile ID.
export function createProgressStorage(
  readState:()=>Promise<Record<string,string>|null>,
  persistState:(value:Record<string,string>)=>Promise<void>,
):ProgressStorage{
  let tail:Promise<unknown>=Promise.resolve();
  function enqueue<T>(operation:()=>Promise<T>):Promise<T>{
    const result=tail.catch(()=>undefined).then(operation);
    tail=result;
    return result;
  }
  return {
    read:key=>enqueue(async()=>{
      const state=await readState();
      return state?.[key]??null;
    }),
    write:(key,value)=>enqueue(async()=>{
      const current=await readState();
      await persistState({...current,[key]:value});
    }),
  };
}

export function progressIdentityFromPath(path:string):{kind:'edition'|'listening';id:number}{
  const edition=/^\/api\/editions\/([1-9][0-9]*)\/progress$/.exec(path);
  const listening=/^\/api\/assets\/([1-9][0-9]*)\/listening-progress$/.exec(path);
  const value=edition||listening;
  const id=Number(value?.[1]);
  if(!value||!Number.isSafeInteger(id)||id<1)
    throw Error('Only authenticated revisioned audiobook progress can be journalled');
  return {kind:edition?'edition':'listening',id};
}
export function progressURL(kind:ProgressKind,id:number):string{
  if(!Number.isSafeInteger(id)||id<1)throw Error('Invalid progress journal identity');
  if(kind==='edition')return '/api/editions/'+id+'/progress';
  if(kind==='listening')return '/api/assets/'+id+'/listening-progress';
  // Reader documents have their own native save contract. Do not invent an
  // incompatible reading PUT payload or alter a protected reader.
  throw Error('Reading-progress replay requires a verified native reader contract');
}
export type ProgressTransport=(path:string,method?:string,data?:unknown)=>Promise<any>;
export type ProgressReplaySummary={alreadySynced:number;uploaded:number;conflicts:number;retained:number};

export async function replayDurableProgress(
  outbox:OfflineProgressOutbox,
  transport:ProgressTransport,
):Promise<ProgressReplaySummary>{
  const pending=await outbox.list();
  if(!pending.length)return {alreadySynced:0,uploaded:0,conflicts:0,retained:0};
  // The server's cursor is bound to an authenticated profile, authorisation
  // revision, 3-minute TTL and one coherent SQLite snapshot. Any 409/IO error
  // aborts the entire replay and leaves the unacknowledged outbox untouched.
  const remote=await fetchCompleteProgressSnapshot(path=>transport(path));
  const decisions=planProgressReplay(pending,remote,false);
  let uploaded=0,alreadySynced=0,conflicts=0;
  for(const decision of decisions){
    const item:PendingProgress=decision.pending;
    if(decision.action==='already-synced'){
      if(await outbox.acknowledge(item.kind,item.id,item.sequence))alreadySynced++;
      continue;
    }
    if(decision.action!=='upload'){
      conflicts++;
      continue;
    }
    if(item.kind==='reading'){
      // This phase only journals the existing audiobook Playback.save() APIs.
      // Never submit unverified reader payloads or lose a reading bookmark.
      conflicts++;
      continue;
    }
    const revision=decision.remote?.revision??item.baseRevision;
    const result=await transport(progressURL(item.kind,item.id),'PUT',
      {...item.position,revision});
    if(!result || result.revision!==revision+1 ||
      !Number.isSafeInteger(result.revision) ||
      !sameValue(item.kind,item.position,result)){
      throw Error('Progress server acknowledgement differs from saved playback; outbox retained');
    }
    if(await outbox.acknowledge(item.kind,item.id,item.sequence))uploaded++;
  }
  return {alreadySynced,uploaded,conflicts,retained:(await outbox.list()).length};
}

function sameValue(kind:ProgressKind,a:ProgressValue,b:ProgressValue){
  return a.complete===b.complete&&(kind==='reading'
    ? a.part===b.part&&a.fraction===b.fraction
    : a.asset===b.asset&&a.seconds===b.seconds);
}
