import {
  copyAsync,
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getFreeDiskStorageAsync,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  makeDirectoryAsync,
  moveAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';
import {Session} from './connection';
import {LocalWork} from './localWorks';
import {Chapter} from './playback';

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
  chaptersByTrackId?:Record<string,Chapter[]>;
  // Preserved when a file is missing, so intact tracks remain playable.
  missingTrackIds?:number[];
};

export type OfflineDownloadCheckpoint={
  version:1;
  key:string;
  server:string;
  workId:number;
  title?:string;
  directory:string;
  completedTrackIds:number[];
  // New copy-on-write downloads may publish to an alternate immutable media URI.
  // These are verified file pointers, never permission to remove another file.
  completedFiles?:Record<string,string>;
  completedBytes?:number;
  current?:{
    trackId:number;
    uri:string;
    // New-format current.uri always identifies a uniquely owned staging file.
    // Legacy version-one direct-media checkpoints are migrated by copying only.
    targetUri?:string;
    expectedSize?:number;
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
// There must never be two writers to the same offline work within a process.
const activeWorkDownloads=new Set<string>();

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

// A media file already visible in an offline manifest is immutable. Replacement
// bytes are downloaded beside it and receive a different final name. No code in
// the download path invokes deleteAsync on a published media URI.
function attemptToken(){
  return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
}
function isOwnedVersionUri(candidate:string,standard:string,ext:string){
  const stem=standard.slice(0,-ext.length)+'-v';
  if(!candidate.startsWith(stem)||!candidate.endsWith(ext))return false;
  return /^[a-z0-9-]{8,64}$/.test(candidate.slice(stem.length,-ext.length));
}
function isOwnedStageUri(candidate:string,target:string){
  const prefix=target+'.archivist-partial-';
  return candidate.startsWith(prefix)&&/^[a-z0-9-]{8,64}$/.test(candidate.slice(prefix.length));
}
async function newStagedUri(target:string){
  for(let i=0;i<8;i++){
    const uri=target+'.archivist-partial-'+attemptToken();
    // Propagate unreadable/permission errors: an unknown result is NOT proof
    // that a potentially valuable stage path can safely be reused.
    if(!(await getInfoAsync(uri)).exists)return uri;
  }
  throw Error('Could not allocate a distinct offline staging file. Existing files have not been changed.');
}
async function newVersionUri(standard:string,ext:string){
  for(let i=0;i<8;i++){
    const uri=standard.slice(0,-ext.length)+'-v'+attemptToken()+ext;
    if(!(await getInfoAsync(uri)).exists)return uri;
  }
  throw Error('Could not allocate a distinct offline replacement file. Existing files have not been changed.');
}

async function persistCheckpoint(
  checkpoint:OfflineDownloadCheckpoint,
  callback?:(checkpoint:OfflineDownloadCheckpoint|null)=>Promise<void>|void,
){
  checkpoint.updatedAt=new Date().toISOString();
  await callback?.({...checkpoint,completedTrackIds:[...checkpoint.completedTrackIds],
    completedFiles:checkpoint.completedFiles?{...checkpoint.completedFiles}:undefined,
    current:checkpoint.current?{...checkpoint.current}:undefined});
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
  // Version-one direct-file checkpoints cannot prove a file belongs to an
  // unfinished operation. Never delete those files, even on Discard partial.
  // Only new, internally named staging files are safe to discard.
  const current=checkpoint.current;
  if(!current || checkpoint.completedTrackIds.includes(current.trackId))return;
  const dir=offlineDirectory(checkpoint.server,checkpoint.workId);
  const target=current.targetUri;
  if(!target || !target.startsWith(dir) || directoryOf(target)!==dir)return;
  if(!/^\d{3}-[a-z0-9._-]+\.[a-z0-9]{1,8}$/i.test(target.slice(dir.length)))return;
  if(!isOwnedStageUri(current.uri,target))return;
  await deleteAsync(current.uri,{idempotent:true});
}

export async function downloadOfflineWork(
  session:Session,
  work:{id:number;title:string;author:string;series:string;genre?:string;format:string;space:string},
  tracks:OfflineServerTrack[],
  onProgress?:(written:number,total:number)=>void,
  options?:{
    checkpoint?:OfflineDownloadCheckpoint;
    onCheckpoint?:(checkpoint:OfflineDownloadCheckpoint|null)=>Promise<void>|void;
    // Called exactly once after files are verified and before the recovery
    // checkpoint may be cleared. Failure leaves the full checkpoint intact.
    onPublished?:(completedWork:OfflineServerWork)=>Promise<void>;
    chaptersByTrackId?:Record<string,Chapter[]>;
  },
):Promise<OfflineServerWork>{
  const root=offlineRoot();
  const available=tracks.filter(track=>track.available);
  if(!available.length)throw Error('No available files can be downloaded for this work.');
  const unnamedComic=available.find(track=>track.format==='Comic' && !track.name);
  if(unnamedComic)throw Error('Update your Archivist server before downloading comics for offline use so the original archive type can be preserved.');
  const knownTotal=available.reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(knownTotal>maxOfflineWorkBytes)throw Error('This work is larger than the 8 GB offline safety limit.');
  const archiveBytes=available.filter(track=>track.format==='Ebook'||track.format==='Comic').reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(archiveBytes>maxArchiveReaderBytes)throw Error('This ebook/comic is larger than the 256 MB offline reader safety limit.');
  const pdfBytes=available.filter(track=>track.format==='PDF').reduce((sum,track)=>sum+Math.max(0,Number(track.size)||0),0);
  if(pdfBytes>maxPdfBytes)throw Error('This PDF is larger than the 4 GB offline safety limit.');

  const key=offlineKey(session.server,work.id);
  const dir=offlineDirectory(session.server,work.id);
  if(activeWorkDownloads.size>0)
    throw Error('An offline work is already downloading. Pause or complete that download before retrying.');
  activeWorkDownloads.add(key);
  try{
  const compatibleCheckpoint=options?.checkpoint?.version===1 &&
    options.checkpoint.key===key &&
    options.checkpoint.server===session.server &&
    options.checkpoint.workId===work.id;
  const checkpoint:OfflineDownloadCheckpoint=compatibleCheckpoint
    ? {...options!.checkpoint!,completedTrackIds:[...options!.checkpoint!.completedTrackIds],
      completedFiles:{...(options!.checkpoint!.completedFiles||{})},
      current:options!.checkpoint!.current?{...options!.checkpoint!.current}:undefined}
    : {version:1,key,server:session.server,workId:work.id,title:work.title,directory:dir,
      completedTrackIds:[],completedFiles:{},updatedAt:new Date().toISOString()};

  // Never let an old complete file disappear because a new server advertises
  // another length. Without a checkpoint, require explicit user removal for
  // ambiguous files. A compatible checkpoint may stage an alternate version.
  if(!compatibleCheckpoint){
    for(let index=0;index<available.length;index++){
      const track=available[index];
      const ext=extensionFor(track);
      const base=safePart((track.name||track.title||('track-'+(index+1))).replace(/\.[^.]+$/,''));
      const uri=dir+String(index+1).padStart(3,'0')+'-'+base+ext;
      const size=await existingSize(uri);
      const expected=Math.max(0,Number(track.size)||0);
      if(size>=0 && (expected===0 || size!==expected)){
        throw Error('An existing offline file cannot be safely verified or replaced. Keep the current download and use Remove offline download explicitly before downloading again.');
      }
    }
  }
  await makeDirectoryAsync(root,{intermediates:true});
  await makeDirectoryAsync(dir,{intermediates:true});

  let written=0;
  const resultTracks:OfflineServerWork['tracks']=[];
  const completed=new Set(checkpoint.completedTrackIds);
  for(let index=0;index<available.length;index++){
    const track=available[index];
    const ext=extensionFor(track);
    const base=safePart((track.name||track.title||('track-'+(index+1))).replace(/\.[^.]+$/,''));
    const standard=dir+String(index+1).padStart(3,'0')+'-'+base+ext;
    const recorded=checkpoint.completedFiles?.[String(track.id)];
    // Checkpoint-provided URI is read-only and only trusted inside the derived
    // work directory with the exact generated filename convention.
    const candidate=recorded && (recorded===standard||isOwnedVersionUri(recorded,standard,ext))
      ? recorded : standard;
    const size=await existingSize(candidate);
    const expected=Math.max(0,Number(track.size)||0);
    const reusable=size>0 && ((expected>0&&size===expected) || (expected===0&&completed.has(track.id)));
    if(reusable){
      completed.add(track.id);
      written+=size;
      checkpoint.completedFiles![String(track.id)]=candidate;
      resultTracks.push({...track,uri:candidate,localFormat:localFormat(track)});
    }else{
      completed.delete(track.id);
      delete checkpoint.completedFiles![String(track.id)];
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
      const standard=dir+String(index+1).padStart(3,'0')+'-'+base+ext;
      const expected=Math.max(0,Number(track.size)||0);
      const prior=checkpoint.current?.trackId===track.id?checkpoint.current:undefined;
      const standardSize=await existingSize(standard);
      let target=standard;
      if(prior?.targetUri && (prior.targetUri===standard||isOwnedVersionUri(prior.targetUri,standard,ext))){
        target=prior.targetUri;
      }else if(standardSize>=0){
        // Legacy partials or old media already occupy the original filename.
        // Publish into a unique versioned URI; never overwrite prior bytes.
        target=await newVersionUri(standard,ext);
      }

      let stage:string;
      let resumeData:string|undefined;
      let bytesWritten=0;
      const staged=prior?.targetUri===target && prior.uri!==target
        && isOwnedStageUri(prior.uri,target) && (prior.expectedSize===undefined||prior.expectedSize===expected)
        && await existingSize(prior.uri)>=0;
      if(staged){
        stage=prior!.uri;
        const stageSize=await existingSize(stage);
        // Never replay a resume token with a different stage/file position.
        if(prior!.resumeData && prior!.bytesWritten===stageSize && (expected===0||stageSize<=expected)){
          resumeData=prior!.resumeData;bytesWritten=stageSize;
        }else{
          stage=await newStagedUri(target);
        }
      }else{
        stage=await newStagedUri(target);
        // Legacy v1 checkpoints wrote a partial directly to its final media
        // name. Copy it into private staging; never mutate the original URI.
        if(prior?.uri===standard && prior.resumeData && standardSize>0 &&
          prior.bytesWritten===standardSize && (expected===0||standardSize<expected)){
          await copyAsync({from:standard,to:stage});
          if(await existingSize(stage)!==standardSize)
            throw Error('Failed to copy legacy offline checkpoint into safe staging.');
          resumeData=prior.resumeData;bytesWritten=standardSize;
        }
      }
      checkpoint.current={trackId:track.id,uri:stage,targetUri:target,expectedSize:expected,
        resumeData,bytesWritten};
      await persistCheckpoint(checkpoint,options?.onCheckpoint);

      const baseWritten=written;
      const task=createDownloadResumable(
        session.server+'/api/assets/'+track.id,
        stage,
        {headers:{Authorization:'Bearer '+session.token}},
        progress=>{
          if(checkpoint.current?.trackId!==track.id)return;
          checkpoint.current.bytesWritten=Math.max(0,progress.totalBytesWritten||0);
          const total=knownTotal || baseWritten+Math.max(progress.totalBytesExpectedToWrite||0,progress.totalBytesWritten||0);
          onProgress?.(baseWritten+checkpoint.current.bytesWritten,total);
        },
        resumeData,
      );
      activeDownload={task,checkpoint,onCheckpoint:options?.onCheckpoint};
      const result=resumeData?await task.resumeAsync():await task.downloadAsync();
      if(activeDownload?.task===task)activeDownload=null;
      if(!result)throw new OfflineDownloadPausedError();
      if(result.status<200||result.status>=300)throw Error('Download failed with HTTP '+result.status+'.');
      const size=await existingSize(stage);
      if(size<=0)throw Error(size===0?'Downloaded file is empty. Tap Resume download to retry this file.':
        'Download completed but the staged local file is missing.');
      if(expected>0 && size!==expected)
        throw Error('Downloaded file size did not match the server copy. Tap Resume download to retry this file.');
      if(size>maxOfflineWorkBytes || written+size>maxOfflineWorkBytes)
        throw Error('Offline download exceeded the 8 GB safety limit.');
      if((track.format==='Comic'||track.format==='Ebook') && size>maxArchiveReaderBytes)
        throw Error('Downloaded ebook/comic exceeded the 256 MB offline reader safety limit.');
      if(track.format==='PDF' && size>maxPdfBytes)
        throw Error('Downloaded PDF exceeded the 4 GB offline safety limit.');

      // An old published file, a legacy partial and another concurrent writer
      // must never be overwritten, even if promotion is interrupted.
      // Do not collapse an unreadable/failed stat into "file absent". An
      // uncertain destination must never be passed into a possibly replacing
      // native move operation.
      const targetInfo=await getInfoAsync(target);
      const targetSize=targetInfo.exists
        ? (typeof targetInfo.size==='number'?targetInfo.size:-1) : -1;
      if(targetInfo.exists){
        if(expected>0 && targetSize===expected && prior?.targetUri===target){
          // Crash after a successful stage->target rename, before checkpoint save.
          // Do not overwrite the already-published file on recovery.
        }else{
          throw Error('Offline destination already exists. Existing media was kept intact; retry after reviewing storage.');
        }
      }else{
        await moveAsync({from:stage,to:target});
        if(await existingSize(target)!==size)
          throw Error('Offline staging promotion could not be verified. The previous media remains intact.');
      }
      written+=size;
      completed.add(track.id);
      checkpoint.completedFiles![String(track.id)]=target;
      checkpoint.completedTrackIds=[...completed];
      checkpoint.completedBytes=written;
      checkpoint.current=undefined;
      resultTracks.push({...track,uri:target,localFormat:localFormat(track)});
      await persistCheckpoint(checkpoint,options?.onCheckpoint);
      onProgress?.(written,knownTotal||written);
    }

    // Preserve server track ordering even when some tracks were reused from an interrupted run.
    resultTracks.sort((a,b)=>available.findIndex(track=>track.id===a.id)-available.findIndex(track=>track.id===b.id));

    let coverUri:string|undefined;
    try{
      const candidate=dir+'cover.jpg';
      if(await existingSize(candidate)>0){
        coverUri=candidate;
      }else{
        const cover=await downloadAsync(
          session.server+'/api/works/'+work.id+'/cover',
          candidate,
          {headers:{Authorization:'Bearer '+session.token}},
        );
        if(cover.status>=200&&cover.status<300 && await existingSize(candidate)>0)coverUri=candidate;
      }
    }catch{
      // Offline artwork is best-effort; leave any previously cached cover intact.
    }

    const published:OfflineServerWork={
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
      chaptersByTrackId:options?.chaptersByTrackId,
    };
    // A crash, storage exhaustion or denied persistent write must not clear
    // the only recovery information. The caller must durably commit the
    // offline manifest BEFORE the checkpoint is allowed to disappear.
    await options?.onPublished?.(published);
    await options?.onCheckpoint?.(null);
    return published;
  }catch(error){
    activeDownload=null;
    await persistCheckpoint(checkpoint,options?.onCheckpoint).catch(()=>undefined);
    throw error;
  }
  }finally{
    activeWorkDownloads.delete(key);
  }
}

export async function removeOfflineWork(work:OfflineServerWork){
  await deleteAsync(offlineDirectory(work.server,work.workId),{idempotent:true});
}

// A local file is playable only if it exists, has real content and, when
// the server supplied a trustworthy byte length, still matches that length.
// Never delete an invalid file here: partial media may be recoverable.
function offlineTrackSizeValid(actual:number,declared?:number):boolean {
  if(!Number.isSafeInteger(actual)||actual<=0)return false;
  const expected=Number(declared);
  return !Number.isSafeInteger(expected)||expected<=0||actual===expected;
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
      if(!offlineTrackSizeValid(size,track.size)){missingFiles++;missing=true;}
      if(size>0)actualBytes+=size;
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
  for(const checkpoint of protectedCheckpoints)referenced.add(offlineDirectory(checkpoint.server,checkpoint.workId));

  for(const [key,work] of Object.entries(works)){
    const missingTrackIds:number[]=[];
    for(const track of work.tracks){
      if(!offlineTrackSizeValid(await existingSize(track.uri),track.size))
        missingTrackIds.push(track.id);
    }
    const dir=offlineDirectory(work.server,work.workId);
    // A missing track never authorises deleting the other downloaded files.
    // Retain the work record so the user can recover tracks or re-download.
    retained[key]=missingTrackIds.length?{...work,missingTrackIds}:{...work,missingTrackIds:undefined};
    referenced.add(dir);
  }

  let removedOrphans=0;
  const entries=await readDirectoryAsync(root).catch(()=>[] as string[]);
  for(const entry of entries){
    const dir=normalizeDirectoryEntry(root,entry);
    if(referenced.has(dir))continue;
    // Unknown folders may contain recoverable completed downloads after a
    // crash. Only remove an orphan when proven to be an empty directory.
    const info=await getInfoAsync(dir).catch(()=>null);
    if(!info?.exists || !('isDirectory' in info) || !info.isDirectory)continue;
    const contents=await readDirectoryAsync(dir).catch(()=>null);
    if(contents===null || contents.length>0)continue;
    await deleteAsync(dir,{idempotent:true});
    removedOrphans++;
  }
  return {retained,removedWorks,removedOrphans};
}

export function offlineToLocalWork(work:OfflineServerWork):LocalWork{
  const missing=new Set(work.missingTrackIds||[]);
  const tracks=work.tracks.map((track,index)=>({track,index})).filter(({track})=>!missing.has(track.id));
  return {
    key:'offline:'+work.key,
    source:'downloaded',
    originServer:work.server,
    originWorkId:work.workId,
    title:work.title,
    author:work.author,
    series:work.series,
    genre:work.genre,
    format:work.format==='Ebook'?'EPUB':work.format,
    space:work.space,
    available:tracks.length>0,
    files:tracks.length,
    tracks:tracks.map(({track,index})=>({
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
    // A partial work is still useful offline, but a complete reachable
    // server copy must win while connected. This is derived solely from the
    // verified manifest, not from guessing at file names or titles.
    offlineIncomplete:missing.size>0,
  } as LocalWork & {offlineIncomplete:boolean};
}
