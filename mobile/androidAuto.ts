import {Platform} from 'react-native';
import {deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, readAsStringAsync, writeAsStringAsync} from 'expo-file-system/legacy';
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
export type AndroidAutoLibrarySnapshot={version:2;generatedAt:string;works:AndroidAutoWork[]};
export type AndroidAutoProgress={version:1;workKey:string;trackUri:string;seconds:number;complete:boolean;updatedAt:number};
type PersonalAudioWork=LocalWork&{readingState?:'not-started'|'in-progress'|'finished';favourite?:boolean};

function clean(value:unknown){return typeof value==='string'?value.trim():'';}

export function buildAndroidAutoLibrary(
  works:PersonalAudioWork[],
  progress:Record<string,AndroidAutoProgressPoint>={},
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
  return {version:2,generatedAt:new Date().toISOString(),works:audioWorks};
}

export async function persistAndroidAutoLibrary(
  works:PersonalAudioWork[],
  progress:Record<string,AndroidAutoProgressPoint>={},
){
  if(Platform.OS!=='android'||!documentDirectory)return;
  const root=documentDirectory+'android-auto/';
  await makeDirectoryAsync(root,{intermediates:true});
  await writeAsStringAsync(root+'library.json',JSON.stringify(buildAndroidAutoLibrary(works,progress)));
}

export async function consumeAndroidAutoProgress():Promise<AndroidAutoProgress|null>{
  if(Platform.OS!=='android'||!documentDirectory)return null;
  const uri=documentDirectory+'android-auto/progress.json';
  const info=await getInfoAsync(uri).catch(()=>null);
  if(!info?.exists)return null;
  try{
    const value=JSON.parse(await readAsStringAsync(uri));
    const parsed:AndroidAutoProgress={
      version:1,
      workKey:clean(value?.workKey),
      trackUri:clean(value?.trackUri),
      seconds:Math.max(0,Number(value?.seconds)||0),
      complete:!!value?.complete,
      updatedAt:Math.max(0,Number(value?.updatedAt)||0),
    };
    if(value?.version!==1||!parsed.workKey||!parsed.trackUri)return null;
    return parsed;
  }catch{
    return null;
  }finally{
    await deleteAsync(uri,{idempotent:true}).catch(()=>undefined);
  }
}
