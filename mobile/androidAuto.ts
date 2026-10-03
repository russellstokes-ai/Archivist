import {Platform} from 'react-native';
import {documentDirectory, makeDirectoryAsync, writeAsStringAsync} from 'expo-file-system/legacy';
import type {LocalWork} from './localWorks';

export type AndroidAutoTrack={
  id:string;
  title:string;
  uri:string;
};

export type AndroidAutoWork={
  id:string;
  title:string;
  author:string;
  series:string;
  coverUri?:string;
  tracks:AndroidAutoTrack[];
};

export type AndroidAutoLibrarySnapshot={
  version:1;
  generatedAt:string;
  works:AndroidAutoWork[];
};

export function buildAndroidAutoLibrary(works:LocalWork[]):AndroidAutoLibrarySnapshot{
  const audioWorks=works
    .filter(work=>work.format==='Audio'&&work.available)
    .map(work=>{
      const tracks=work.tracks
        .filter(track=>!!track.uri&&track.available!==false)
        .map((track,index)=>({
          id:'track:'+work.key+':'+index,
          title:(track.title||work.title||('Track '+(index+1))).trim(),
          uri:String(track.uri),
        }));
      return {
        id:'work:'+work.key,
        title:(work.title||'Untitled audiobook').trim(),
        author:(work.author||'').trim(),
        series:(work.series||'').trim(),
        coverUri:work.coverUri,
        tracks,
      };
    })
    .filter(work=>work.tracks.length>0)
    .sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}));
  return {version:1,generatedAt:new Date().toISOString(),works:audioWorks};
}

export async function persistAndroidAutoLibrary(works:LocalWork[]){
  if(Platform.OS!=='android'||!documentDirectory)return;
  const root=documentDirectory+'android-auto/';
  await makeDirectoryAsync(root,{intermediates:true});
  await writeAsStringAsync(root+'library.json',JSON.stringify(buildAndroidAutoLibrary(works)));
}
