import {Platform} from 'react-native';
import {deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, readAsStringAsync, readDirectoryAsync, writeAsStringAsync} from 'expo-file-system/legacy';
import type {LocalWork} from './localWorks';

export type AndroidAutoProgressPoint={uri?:string;seconds?:number;complete?:boolean};
export type AndroidAutoTrack={id:string;title:string;uri:string};
export type AndroidAutoWork={
  id:string;
  key:string;
  title:string;
  author:string;
  series:string;
  genre:string;
  coverUri?:string;
  readingState:'not-started'|'in-progress'|'finished';
  favourite:boolean;
  resumeTrackId?:string;
  resumeSeconds:number;
  tracks:AndroidAutoTrack[];
};
export type AndroidAutoResumeHint={workKey?:string;updatedAt?:number};
export type AndroidAutoLibrarySnapshot={version:3;generatedAt:string;resumeWorkKey?:string;resumeUpdatedAt?:number;works:AndroidAutoWork[]};
export type AndroidAutoProgress={version:1;workKey:string;trackUri:string;seconds:number;complete:boolean;updatedAt:number;eventId?:string};
type PersonalAudioWork=LocalWork&{readingState?:'not-started'|'in-progress'|'finished';favourite?:boolean};

function clean(value:unknown){return typeof value==='string'?value.trim():'';}

export function buildAndroidAutoLibrary(
  works:PersonalAudioWork[],
  progress:Record<string,AndroidAutoProgressPoint>={},
  resume:AndroidAutoResumeHint={},
):AndroidAutoLibrarySnapshot{
  const audioWorks=works
    .filter(work=>work.format==='Audio'&&work.available)
    .map(work=>{
      const tracks=work.tracks
        .filter(track=>!!track.uri&&track.available!==false)
        .map((track,index)=>({
          id:'track:'+work.key+':'+index,
          title:clean(track.title)||clean(work.title)||('Track '+(index+1)),
          uri:String(track.uri),
        }));
      const point=progress[work.key];
      const foundIndex=tracks.findIndex(track=>track.uri===point?.uri);
      const resumeIndex=foundIndex>=0?foundIndex:0;
      const inferredState=point?.complete?'finished':(Number(point?.seconds)||0)>0?'in-progress':'not-started';
      const state:AndroidAutoWork['readingState']=work.readingState==='in-progress'||work.readingState==='finished'?work.readingState:inferredState;
      return {
        id:'work:'+work.key,
        key:work.key,
        title:clean(work.title)||'Untitled audiobook',
        author:clean(work.author),
        series:clean(work.series),
        genre:clean(work.genre),
        coverUri:clean(work.coverUri)||undefined,
        readingState:state,
        favourite:!!work.favourite,
        resumeTrackId:tracks[resumeIndex]?.id,
        resumeSeconds:Math.max(0,Number(point?.seconds)||0),
        tracks,
      };
    })
    .filter(work=>work.tracks.length>0)
    .sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}));
  const resumeWorkKey=clean(resume.workKey);
  const resumeUpdatedAt=Math.max(0,Number(resume.updatedAt)||0);
  return {version:3,generatedAt:new Date().toISOString(),...(resumeWorkKey?{resumeWorkKey,resumeUpdatedAt}:{}),works:audioWorks};
}

export async function persistAndroidAutoLibrary(
  works:PersonalAudioWork[],
  progress:Record<string,AndroidAutoProgressPoint>={},
  resume:AndroidAutoResumeHint={},
){
  if(Platform.OS!=='android'||!documentDirectory)return;
  const root=documentDirectory+'android-auto/';
  await makeDirectoryAsync(root,{intermediates:true});
  await writeAsStringAsync(root+'library.json',JSON.stringify(buildAndroidAutoLibrary(works,progress,resume)));
}

// The native service stores rare outgoing-chapter transitions in separate
// private AtomicFiles. The current 5-second position continues in progress.json.
const pendingEventPattern=/^event-\d{13}-\d{6}-[a-f0-9]{32}\.json$/;
function decodeProgress(raw:string,eventId?:string):AndroidAutoProgress|null{
  if(raw.length>16384)return null;
  try{
    const value=JSON.parse(raw);
    if(value?.version!==1||typeof value.workKey!=='string'||typeof value.trackUri!=='string'
       ||typeof value.seconds!=='number'||!Number.isFinite(value.seconds)
       ||value.seconds<0||value.seconds>31536000||typeof value.complete!=='boolean'
       ||!Number.isSafeInteger(value.updatedAt)||value.updatedAt<1)return null;
    if(eventId!==undefined&&(!pendingEventPattern.test(eventId)||value.eventId!==eventId))
      return null;
    const workKey=clean(value.workKey),trackUri=clean(value.trackUri);
    if(!workKey||workKey.length>512||!trackUri||trackUri.length>8192)return null;
    return {version:1,workKey,trackUri,seconds:value.seconds,complete:value.complete,
      updatedAt:value.updatedAt,...(eventId?{eventId}:{})};
  }catch{return null;}
}
async function verifiedProgress(uri:string,eventId?:string):Promise<AndroidAutoProgress|null>{
  const info=await getInfoAsync(uri);
  if(!info.exists || ('size' in info&&typeof info.size==='number'&&info.size>16384))return null;
  return decodeProgress(await readAsStringAsync(uri),eventId);
}

// Never consume/delete events merely on read. The phone first applies
// *every* queued outgoing chapter chronologically, then the latest position.
// Failed writes, permission loss or malformed events leave original bytes
// untouched for next attempt; newer events cannot displace older pending ones.
export async function consumeAndroidAutoProgress():Promise<AndroidAutoProgress|null>{
  if(Platform.OS!=='android'||!documentDirectory)return null;
  const dir=documentDirectory+'android-auto/';
  const pendingDir=dir+'pending/';
  try{
    let entries:string[];
    try{
      entries=await readDirectoryAsync(pendingDir);
    }catch{
      // No pending/ directory exists on older installations, which is fine.
      // An *existing but unreadable* queue is different: treating it as empty
      // could skip outgoing chapters and incorrectly replay a newer position.
      const info=await getInfoAsync(pendingDir);
      if(info.exists)return null;
      entries=[];
    }
    // AtomicFile can leave an event-*.new/.bak after interrupted writing.
    // Never skip an unknown or partly published event and then consume a newer
    // checkpoint. Preserve the queue for later read/repair instead.
    if(entries.some(name=>name.startsWith('event-')&&!pendingEventPattern.test(name)))
      return null;
    const names=entries.filter(name=>pendingEventPattern.test(name)).sort();
    if(names.length){
      // A malformed/unreadable oldest event stays on disk. The phone must
      // retry it before moving to a subsequent chapter or latest position.
      return await verifiedProgress(pendingDir+names[0],names[0]);
    }
    return await verifiedProgress(dir+'progress.json');
  }catch{return null;}
}
export function sameAndroidAutoProgress(a:AndroidAutoProgress|null|undefined,b:AndroidAutoProgress|null|undefined){
  return !!a&&!!b&&a.version===b.version&&a.workKey===b.workKey&&a.trackUri===b.trackUri
    &&a.seconds===b.seconds&&a.complete===b.complete&&a.updatedAt===b.updatedAt
    &&a.eventId===b.eventId;
}
async function removeAcknowledgedNativeEvent(progress:AndroidAutoProgress){
  const eventId=progress.eventId;
  if(!eventId)return;
  if(!pendingEventPattern.test(eventId))throw Error('invalid queued event identity');
  if(!documentDirectory||Platform.OS!=='android')return;
  const uri=documentDirectory+'android-auto/pending/'+eventId;
  const current=await verifiedProgress(uri,eventId);
  if(current===null){
    const info=await getInfoAsync(uri);
    if(info.exists)throw Error('queued progress changed or is unreadable; original event retained');
    return;
  }
  if(!sameAndroidAutoProgress(progress,current))
    throw Error('queued progress changed before acknowledgment; original event retained');
  // A unique, strictly validated file is the only cleanup authority. Do not
  // remove the canonical progress.json or any newer queued event.
  await deleteAsync(uri,{idempotent:true});
}
export async function acknowledgeAndroidAutoProgress(
  progress:AndroidAutoProgress,
  handlers:{
    readReceipt:()=>Promise<AndroidAutoProgress|null>;
    persistReceipt:(progress:AndroidAutoProgress)=>Promise<void>;
    apply:(progress:AndroidAutoProgress)=>Promise<void>;
  },
):Promise<boolean>{
  if(progress.eventId!==undefined&&!pendingEventPattern.test(progress.eventId))
    throw Error('invalid queued event identity');
  const receipt=await handlers.readReceipt();
  const alreadyApplied=sameAndroidAutoProgress(progress,receipt);
  if(!alreadyApplied){
    // Failed phone state or receipt writes leave every source event on disk.
    // Reapplying after crash is safe: no network writes/auto-play happen here.
    await handlers.apply(progress);
    await handlers.persistReceipt(progress);
  }
  // If cleanup was interrupted after a successful durable receipt, this
  // retry can remove only that already-acknowledged exact native event.
  await removeAcknowledgedNativeEvent(progress);
  return !alreadyApplied;
}
