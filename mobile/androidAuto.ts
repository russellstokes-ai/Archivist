import {Platform} from 'react-native';
import {documentDirectory, getInfoAsync, makeDirectoryAsync, readAsStringAsync, writeAsStringAsync} from 'expo-file-system/legacy';
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
export type AndroidAutoProgress={version:1;workKey:string;trackUri:string;seconds:number;complete:boolean;updatedAt:number};
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

// Never delete the native AtomicFile when reading it. A native writer can
// publish a newer chapter while JS is awaiting React state persistence, and a
// read+delete sequence would erase that newer progress as well. The phone
// records a durable receipt in stateStore *after* all state updates complete.
export async function consumeAndroidAutoProgress():Promise<AndroidAutoProgress|null>{
  if(Platform.OS!=='android'||!documentDirectory)return null;
  const uri=documentDirectory+'android-auto/progress.json';
  try{
    const info=await getInfoAsync(uri);
    if(!info.exists||('size' in info&&typeof info.size==='number'&&info.size>16384))return null;
    const raw=await readAsStringAsync(uri);
    if(raw.length>16384)return null;
    const value=JSON.parse(raw);
    if(value?.version!==1||typeof value.workKey!=='string'||typeof value.trackUri!=='string'
       ||typeof value.seconds!=='number'||!Number.isFinite(value.seconds)
       ||value.seconds<0||value.seconds>31536000
       ||typeof value.complete!=='boolean'
       ||!Number.isSafeInteger(value.updatedAt)||value.updatedAt<1)return null;
    const workKey=clean(value.workKey),trackUri=clean(value.trackUri);
    if(!workKey||workKey.length>512||!trackUri||trackUri.length>8192)return null;
    return {version:1,workKey,trackUri,seconds:value.seconds,
      complete:value.complete,updatedAt:value.updatedAt};
  }catch{
    // A torn/busy native write is never an instruction to delete the original.
    return null;
  }
}
export function sameAndroidAutoProgress(a:AndroidAutoProgress|null|undefined,b:AndroidAutoProgress|null|undefined){
  return !!a&&!!b&&a.version===b.version&&a.workKey===b.workKey&&a.trackUri===b.trackUri
    &&a.seconds===b.seconds&&a.complete===b.complete&&a.updatedAt===b.updatedAt;
}
export async function acknowledgeAndroidAutoProgress(
  progress:AndroidAutoProgress,
  handlers:{
    readReceipt:()=>Promise<AndroidAutoProgress|null>;
    persistReceipt:(progress:AndroidAutoProgress)=>Promise<void>;
    apply:(progress:AndroidAutoProgress)=>Promise<void>;
  },
):Promise<boolean>{
  const receipt=await handlers.readReceipt();
  if(sameAndroidAutoProgress(progress,receipt))return false;
  // Strict at-least-once ordering. Any failure, including a failed receipt
  // write, retains the native event for idempotent replay on restart.
  await handlers.apply(progress);
  await handlers.persistReceipt(progress);
  return true;
}
