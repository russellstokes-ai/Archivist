import {
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import {Session} from './connection';
import {LocalWork} from './localWorks';

export type OfflineServerTrack={
  id:number;
  title:string;
  format:string;
  edition:number;
  available:boolean;
  name?:string;
  size?:number;
};

export type OfflineServerWork={
  key:string;
  server:string;
  workId:number;
  title:string;
  author:string;
  series:string;
  genre:string;
  format:string;
  space:string;
  downloadedAt:string;
  bytes:number;
  tracks:Array<OfflineServerTrack & {uri:string;localFormat:string}>;
  coverUri?:string;
};

const maxOfflineWorkBytes=8*1024*1024*1024;

function safePart(value:string){
  return String(value||'file').replace(/[^a-z0-9._-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,120)||'file';
}

function extensionFor(track:OfflineServerTrack){
  const name=String(track.name||'');
  const match=name.match(/\.([a-z0-9]{1,8})$/i);
  if(match)return match[0].toLowerCase();
  if(track.format==='Audio')return '.m4b';
  if(track.format==='Ebook')return '.epub';
  if(track.format==='PDF')return '.pdf';
  if(track.format==='Comic')return '.cbz';
  return '.bin';
}

function localFormat(track:OfflineServerTrack){
  if(track.format==='Ebook')return 'EPUB';
  return track.format;
}

function offlineKey(server:string,workId:number){
  return server+'|'+workId;
}

export async function downloadOfflineWork(
  session:Session,
  work:{id:number;title:string;author:string;series:string;genre?:string;format:string;space:string},
  tracks:OfflineServerTrack[],
  onProgress?:(written:number,total:number)=>void,
):Promise<OfflineServerWork>{
  if(!documentDirectory)throw Error('Offline storage is unavailable on this device.');
  const available=tracks.filter(track=>track.available);
  if(!available.length)throw Error('No available files can be downloaded for this work.');
  const unsupported=available.find(track=>track.format==='Comic' && /\.(?:cbr|cbt)$/i.test(track.name||''));
  if(unsupported)throw Error('Offline comic downloads currently require CBZ/ZIP. CBR/CBT can still be read from your Archivist server.');
  const knownTotal=available.reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(knownTotal>maxOfflineWorkBytes)throw Error('This work is larger than the 8 GB offline safety limit.');

  const root=documentDirectory+'archivist-offline/';
  const dir=root+safePart(btoa(unescape(encodeURIComponent(session.server))).slice(0,32))+'-'+work.id+'/';
  await makeDirectoryAsync(root,{intermediates:true});
  await deleteAsync(dir,{idempotent:true}).catch(()=>undefined);
  await makeDirectoryAsync(dir,{intermediates:true});

  let written=0;
  const resultTracks:OfflineServerWork['tracks']=[];
  try{
    for(let index=0;index<available.length;index++){
      const track=available[index];
      const ext=extensionFor(track);
      const base=safePart((track.name||track.title||('track-'+(index+1))).replace(/\.[^.]+$/,''));
      const uri=dir+String(index+1).padStart(3,'0')+'-'+base+ext;
      const result=await downloadAsync(
        session.server+'/api/assets/'+track.id,
        uri,
        {headers:{Authorization:'Bearer '+session.token}},
      );
      if(result.status<200||result.status>=300)throw Error('Download failed with HTTP '+result.status+'.');
      const info=await getInfoAsync(uri);
      const size='size' in info && typeof info.size==='number' ? info.size : Math.max(0,Number(track.size)||0);
      written+=size;
      if(written>maxOfflineWorkBytes)throw Error('Offline download exceeded the 8 GB safety limit.');
      resultTracks.push({...track,uri,localFormat:localFormat(track)});
      onProgress?.(written,knownTotal||written);
    }

    let coverUri:string|undefined;
    try{
      const candidate=dir+'cover.jpg';
      const cover=await downloadAsync(
        session.server+'/api/works/'+work.id+'/cover',
        candidate,
        {headers:{Authorization:'Bearer '+session.token}},
      );
      if(cover.status>=200&&cover.status<300)coverUri=candidate;
    }catch{
      // Cover artwork is optional; never invalidate a successfully downloaded work.
    }

    return {
      key:offlineKey(session.server,work.id),
      server:session.server,
      workId:work.id,
      title:work.title,
      author:work.author,
      series:work.series,
      genre:work.genre||'',
      format:work.format,
      space:work.space,
      downloadedAt:new Date().toISOString(),
      bytes:written,
      tracks:resultTracks,
      coverUri,
    };
  }catch(error){
    await deleteAsync(dir,{idempotent:true}).catch(()=>undefined);
    throw error;
  }
}

export async function removeOfflineWork(work:OfflineServerWork){
  const first=work.tracks[0]?.uri||work.coverUri;
  if(!first)return;
  const dir=first.replace(/[^/]+$/,'');
  await deleteAsync(dir,{idempotent:true});
}

export function offlineToLocalWork(work:OfflineServerWork):LocalWork{
  return {
    key:'offline:'+work.key,
    title:work.title,
    author:work.author,
    series:work.series,
    genre:work.genre,
    format:work.format==='Ebook'?'EPUB':work.format,
    space:work.space,
    available:true,
    files:work.tracks.length,
    tracks:work.tracks.map((track,index)=>({
      id:-(work.workId*10000+index+1),
      uri:track.uri,
      title:track.title||work.title,
      author:work.author,
      series:work.series,
      genre:work.genre,
      format:track.localFormat,
      space:work.space,
      available:true,
      coverShape:track.format==='Audio'?'square':'portrait',
      coverUri:work.coverUri,
      metadataSource:'manual',
      identificationConfidence:'high',
      needsReview:false,
      reviewReason:'',
    })),
    needsReview:false,
    reviewReason:'',
    coverUri:work.coverUri,
    coverShape:work.format==='Audio'?'square':'portrait',
  };
}
