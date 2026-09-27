import {
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getFreeDiskStorageAsync,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
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

export type OfflineDownloadCheckpoint={
  version:1;
  key:string;
  server:string;
  workId:number;
  title?:string;
  directory:string;
  completedTrackIds:number[];
  completedBytes?:number;
  current?:{
    trackId:number;
    uri:string;
    resumeData?:string;
    bytesWritten:number;
  };
  updatedAt:string;
};

export type OfflineStorageSummary={
  items:number;
  trackedBytes:number;
  actualBytes:number;
  freeBytes:number;
  capacityBytes:number;
  missingFiles:number;
  incompleteWorks:number;
  partialBytes:number;
};

export type OfflineCleanupResult={
  retained:Record<string,OfflineServerWork>;
  removedWorks:string[];
  removedOrphans:number;
};

const maxOfflineWorkBytes=8*1024*1024*1024;
const maxArchiveReaderBytes=256*1024*1024;
const maxPdfBytes=4*1024*1024*1024;
const freeSpaceReserve=128*1024*1024;

let activeDownload:{
  task:ReturnType<typeof createDownloadResumable>;
  checkpoint:OfflineDownloadCheckpoint;
  onCheckpoint?:(checkpoint:OfflineDownloadCheckpoint|null)=>Promise<void>|void;
}|null=null;

export class OfflineDownloadPausedError extends Error {
  constructor(){
    super('Offline download paused. Tap Resume download when you are ready.');
    this.name='OfflineDownloadPausedError';
  }
}

export function isOfflineDownloadPaused(error:unknown){
  return error instanceof OfflineDownloadPausedError || (error as Error)?.name==='OfflineDownloadPausedError';
}

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

export function offlineKey(server:string,workId:number){
  return server+'|'+workId;
}

function serverSlug(server:string){
  let hash=2166136261;
  for(let i=0;i<server.length;i++){
    hash^=server.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}

function offlineRoot(){
  if(!documentDirectory)throw Error('Offline storage is unavailable on this device.');
  return documentDirectory+'archivist-offline/';
}

export function offlineDirectory(server:string,workId:number){
  return offlineRoot()+serverSlug(server)+'-'+workId+'/';
}

function directoryOf(uri:string){
  return uri.replace(/[^/]+$/,'');
}

async function existingSize(uri:string){
  const info=await getInfoAsync(uri).catch(()=>({exists:false} as const));
  return info.exists && 'size' in info && typeof info.size==='number' ? info.size : -1;
}

async function persistCheckpoint(
  checkpoint:OfflineDownloadCheckpoint,
  callback?:(checkpoint:OfflineDownloadCheckpoint|null)=>Promise<void>|void,
){
  checkpoint.updatedAt=new Date().toISOString();
  await callback?.({...checkpoint,completedTrackIds:[...checkpoint.completedTrackIds],current:checkpoint.current?{...checkpoint.current}:undefined});
}

export async function pauseActiveOfflineDownload(){
  const active=activeDownload;
  if(!active)return false;
  try{
    const paused=await active.task.pauseAsync();
    if(active.checkpoint.current){
      active.checkpoint.current.resumeData=paused.resumeData || active.checkpoint.current.resumeData;
    }
    await persistCheckpoint(active.checkpoint,active.onCheckpoint);
    return true;
  }catch{
    return false;
  }
}

export async function removeOfflineCheckpoint(checkpoint:OfflineDownloadCheckpoint){
  // Never trust a persisted directory string for deletion; derive the only
  // allowed work directory from the server/work identity.
  await deleteAsync(offlineDirectory(checkpoint.server,checkpoint.workId),{idempotent:true});
}

export async function downloadOfflineWork(
  session:Session,
  work:{id:number;title:string;author:string;series:string;genre?:string;format:string;space:string},
  tracks:OfflineServerTrack[],
  onProgress?:(written:number,total:number)=>void,
  options?:{
    checkpoint?:OfflineDownloadCheckpoint;
    onCheckpoint?:(checkpoint:OfflineDownloadCheckpoint|null)=>Promise<void>|void;
  },
):Promise<OfflineServerWork>{
  const root=offlineRoot();
  const available=tracks.filter(track=>track.available);
  if(!available.length)throw Error('No available files can be downloaded for this work.');
  const unnamedComic=available.find(track=>track.format==='Comic' && !track.name);
  if(unnamedComic)throw Error('Update your Archivist server before downloading comics for offline use so the original archive type can be preserved.');
  const cbr=available.find(track=>track.format==='Comic' && /\.cbr$/i.test(track.name||''));
  if(cbr)throw Error('CBR/RAR comics are not supported. Convert this comic to CBZ/ZIP before adding it to Archivist.');
  const cbt=available.find(track=>track.format==='Comic' && /\.cbt$/i.test(track.name||''));
  if(cbt)throw Error('CBT comics can be read from the Archivist server, but offline downloads currently require CBZ/ZIP.');
  const knownTotal=available.reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(knownTotal>maxOfflineWorkBytes)throw Error('This work is larger than the 8 GB offline safety limit.');
  const archiveBytes=available.filter(track=>track.format==='Ebook'||track.format==='Comic').reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(archiveBytes>maxArchiveReaderBytes)throw Error('This ebook/comic is larger than the 256 MB offline reader safety limit.');
  const pdfBytes=available.filter(track=>track.format==='PDF').reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(pdfBytes>maxPdfBytes)throw Error('This PDF is larger than the 4 GB offline safety limit.');

  const key=offlineKey(session.server,work.id);
  const dir=offlineDirectory(session.server,work.id);
  const compatibleCheckpoint=options?.checkpoint?.version===1 &&
    options.checkpoint.key===key &&
    options.checkpoint.server===session.server &&
    options.checkpoint.workId===work.id;
  const checkpoint:OfflineDownloadCheckpoint=compatibleCheckpoint
    ? {...options!.checkpoint!,completedTrackIds:[...options!.checkpoint!.completedTrackIds],current:options!.checkpoint!.current?{...options!.checkpoint!.current}:undefined}
    : {version:1,key,server:session.server,workId:work.id,title:work.title,directory:dir,completedTrackIds:[],updatedAt:new Date().toISOString()};

  await makeDirectoryAsync(root,{intermediates:true});
  if(!compatibleCheckpoint){
    await deleteAsync(dir,{idempotent:true}).catch(()=>undefined);
  }
  await makeDirectoryAsync(dir,{intermediates:true});

  let written=0;
  const resultTracks:OfflineServerWork['tracks']=[];
  const completed=new Set(checkpoint.completedTrackIds);
  for(let index=0;index<available.length;index++){
    const track=available[index];
    const ext=extensionFor(track);
    const base=safePart((track.name||track.title||('track-'+(index+1))).replace(/\.[^.]+$/,''));
    const uri=dir+String(index+1).padStart(3,'0')+'-'+base+ext;
    const expected=Math.max(0,Number(track.size)||0);
    const size=await existingSize(uri);
    const reusable=size>=0 && ((expected>0 && size===expected) || (expected===0 && completed.has(track.id)));
    if(reusable){
      completed.add(track.id);
      written+=Math.max(0,size);
      resultTracks.push({...track,uri,localFormat:localFormat(track)});
    }else{
      completed.delete(track.id);
      if(size>=0 && (!checkpoint.current || checkpoint.current.trackId!==track.id || !checkpoint.current.resumeData)){
        await deleteAsync(uri,{idempotent:true}).catch(()=>undefined);
      }
    }
  }
  checkpoint.title=work.title;
  checkpoint.completedTrackIds=[...completed];
  checkpoint.completedBytes=written;

  if(knownTotal>0){
    try{
      const free=await getFreeDiskStorageAsync();
      const remaining=Math.max(0,knownTotal-written);
      if(free<remaining+freeSpaceReserve){
        throw Error('Not enough free storage for this download. Free some space in Settings → Offline downloads and try again.');
      }
    }catch(error){
      if((error as Error).message.startsWith('Not enough free storage'))throw error;
    }
  }

  onProgress?.(written,knownTotal||written);
  try{
    for(let index=0;index<available.length;index++){
      const track=available[index];
      if(completed.has(track.id))continue;
      const ext=extensionFor(track);
      const base=safePart((track.name||track.title||('track-'+(index+1))).replace(/\.[^.]+$/,''));
      const uri=dir+String(index+1).padStart(3,'0')+'-'+base+ext;
      const resumeData=checkpoint.current?.trackId===track.id && checkpoint.current.uri===uri
        ? checkpoint.current.resumeData
        : undefined;
      if(!resumeData)await deleteAsync(uri,{idempotent:true}).catch(()=>undefined);
      checkpoint.current={trackId:track.id,uri,resumeData,bytesWritten:checkpoint.current?.trackId===track.id?checkpoint.current.bytesWritten:0};
      await persistCheckpoint(checkpoint,options?.onCheckpoint);

      const baseWritten=written;
      const task=createDownloadResumable(
        session.server+'/api/assets/'+track.id,
        uri,
        {headers:{Authorization:'Bearer '+session.token}},
        progress=>{
          if(checkpoint.current?.trackId!==track.id)return;
          checkpoint.current.bytesWritten=Math.max(0,progress.totalBytesWritten||0);
          const total=knownTotal || baseWritten + Math.max(progress.totalBytesExpectedToWrite||0,progress.totalBytesWritten||0);
          onProgress?.(baseWritten+checkpoint.current.bytesWritten,total);
        },
        resumeData,
      );
      activeDownload={task,checkpoint,onCheckpoint:options?.onCheckpoint};
      const result=resumeData ? await task.resumeAsync() : await task.downloadAsync();
      if(activeDownload?.task===task)activeDownload=null;
      if(!result)throw new OfflineDownloadPausedError();
      if(result.status<200||result.status>=300)throw Error('Download failed with HTTP '+result.status+'.');
      const size=await existingSize(uri);
      if(size<0)throw Error('Download completed but the local file is missing.');
      const expected=Math.max(0,Number(track.size)||0);
      if(expected>0 && size!==expected){
        await deleteAsync(uri,{idempotent:true}).catch(()=>undefined);
        throw Error('Downloaded file size did not match the server copy. Tap Resume download to retry this file.');
      }
      written+=size;
      if(written>maxOfflineWorkBytes)throw Error('Offline download exceeded the 8 GB safety limit.');
      completed.add(track.id);
      checkpoint.completedTrackIds=[...completed];
      checkpoint.completedBytes=written;
      checkpoint.current=undefined;
      resultTracks.push({...track,uri,localFormat:localFormat(track)});
      await persistCheckpoint(checkpoint,options?.onCheckpoint);
      onProgress?.(written,knownTotal||written);
    }

    // Preserve server track ordering even when some tracks were reused from an interrupted run.
    resultTracks.sort((a,b)=>available.findIndex(track=>track.id===a.id)-available.findIndex(track=>track.id===b.id));

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

    await options?.onCheckpoint?.(null);
    return {
      key,
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
    activeDownload=null;
    await persistCheckpoint(checkpoint,options?.onCheckpoint).catch(()=>undefined);
    throw error;
  }
}

export async function removeOfflineWork(work:OfflineServerWork){
  const first=work.tracks[0]?.uri||work.coverUri;
  if(!first)return;
  await deleteAsync(directoryOf(first),{idempotent:true});
}

export async function inspectOfflineStorage(
  works:Record<string,OfflineServerWork>,
  checkpoints:OfflineDownloadCheckpoint[]=[],
):Promise<OfflineStorageSummary>{
  let actualBytes=0,missingFiles=0,incompleteWorks=0;
  for(const work of Object.values(works)){
    let missing=false;
    for(const track of work.tracks){
      const size=await existingSize(track.uri);
      if(size<0){missingFiles++;missing=true;}else actualBytes+=size;
    }
    if(work.coverUri){
      const size=await existingSize(work.coverUri);
      if(size>0)actualBytes+=size;
    }
    if(missing)incompleteWorks++;
  }
  const [freeBytes,capacityBytes]=await Promise.all([
    getFreeDiskStorageAsync().catch(()=>0),
    getTotalDiskCapacityAsync().catch(()=>0),
  ]);
  const partialBytes=checkpoints.reduce((sum,checkpoint)=>
    sum+Math.max(0,checkpoint.completedBytes||0)+Math.max(0,checkpoint.current?.bytesWritten||0),0);
  return {
    items:Object.keys(works).length,
    trackedBytes:Object.values(works).reduce((sum,work)=>sum+Math.max(0,work.bytes||0),0),
    actualBytes,
    freeBytes,
    capacityBytes,
    missingFiles,
    incompleteWorks,
    partialBytes,
  };
}

function normalizeDirectoryEntry(root:string,entry:string){
  if(entry.startsWith('file://'))return entry.endsWith('/')?entry:entry+'/';
  return root+entry.replace(/^\/+|\/+$/g,'')+'/';
}

export async function cleanupOfflineStorage(
  works:Record<string,OfflineServerWork>,
  protectedCheckpoints:OfflineDownloadCheckpoint[]=[],
):Promise<OfflineCleanupResult>{
  const root=offlineRoot();
  await makeDirectoryAsync(root,{intermediates:true});
  const retained:Record<string,OfflineServerWork>={};
  const removedWorks:string[]=[];
  const referenced=new Set<string>();
  for(const checkpoint of protectedCheckpoints)referenced.add(checkpoint.directory.endsWith('/')?checkpoint.directory:checkpoint.directory+'/');

  for(const [key,work] of Object.entries(works)){
    let valid=work.tracks.length>0;
    for(const track of work.tracks){
      if(await existingSize(track.uri)<0){valid=false;break;}
    }
    const first=work.tracks[0]?.uri||work.coverUri;
    if(valid){
      retained[key]=work;
      if(first)referenced.add(directoryOf(first));
    }else{
      removedWorks.push(key);
      if(first)await deleteAsync(directoryOf(first),{idempotent:true}).catch(()=>undefined);
    }
  }

  let removedOrphans=0;
  const entries=await readDirectoryAsync(root).catch(()=>[] as string[]);
  for(const entry of entries){
    const dir=normalizeDirectoryEntry(root,entry);
    if(referenced.has(dir))continue;
    await deleteAsync(dir,{idempotent:true}).catch(()=>undefined);
    removedOrphans++;
  }
  return {retained,removedWorks,removedOrphans};
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
