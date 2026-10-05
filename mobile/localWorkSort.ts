import {StorageAccessFramework} from 'expo-file-system/legacy';
import type {LocalBook} from './localLibrary';
import type {LocalWork} from './localWorks';

export type LocalWorkSortState='ready'|'same'|'conflict'|'review';

export type LocalWorkSortMember={
  id:string;
  asset:number;
  filename:string;
  fileUri:string;
  sourceTreeUri:string;
  relativePath:string;
  from:string;
  to:string;
};

export type LocalWorkSortPreview={
  id:string;
  workKey:string;
  title:string;
  author:string;
  files:number;
  to:string;
  state:LocalWorkSortState;
  reason:string;
  members:LocalWorkSortMember[];
};

export type LocalWorkSortApplyResult={
  copied:Array<{id:string;title:string;uri:string}>;
  failed:Array<{id:string;title:string;error:string}>;
};

export function sortableLocalWork(work:LocalWork){
  if(work.needsReview)return false;
  if(!clean(work.title)||normal(work.title)==='untitled')return false;
  if(!work.coverUri)return false;
  if(!work.tracks.length)return false;
  return work.tracks.every(track=>
    !!track.uri &&
    !!track.sourceUri &&
    track.identificationConfidence==='high' &&
    !track.needsReview
  );
}

export function previewLocalWorkSort(works:LocalWork[],template:string):LocalWorkSortPreview[]{
  const previews=works.map(work=>previewWork(work,template));
  const destinationOwners=new Map<string,string[]>();

  for(const preview of previews){
    if(preview.state==='review')continue;
    for(const member of preview.members){
      const owners=destinationOwners.get(member.to)||[];
      owners.push(preview.id);
      destinationOwners.set(member.to,owners);
    }
  }

  return previews.map(preview=>{
    if(preview.state==='review')return preview;
    const collision=preview.members.some(member=>(destinationOwners.get(member.to)||[]).some(owner=>owner!==preview.id));
    if(collision)return {...preview,state:'conflict' as const,reason:'Another resolved work would use the same destination file.'};

    const duplicateWithin=new Set<string>();
    for(const member of preview.members){
      if(duplicateWithin.has(member.to)){
        return {...preview,state:'conflict' as const,reason:'Two files in this work would use the same destination name.'};
      }
      duplicateWithin.add(member.to);
    }

    const allSame=preview.members.length>0&&preview.members.every(member=>normalizedPath(member.from).endsWith(normalizedPath(member.relativePath)));
    if(allSame)return {...preview,state:'same' as const,reason:'Already organised.'};
    return {...preview,state:'ready' as const,reason:''};
  });
}

function previewWork(work:LocalWork,template:string):LocalWorkSortPreview{
  const sourceRoots=[...new Set(work.tracks.map(track=>track.sourceUri||'').filter(Boolean))];
  const eligible=sortableLocalWork(work)&&sourceRoots.length===1;
  const base=workDestination(work,template);
  const members=work.tracks.map(track=>memberPreview(work,track,sourceRoots[0]||'',base));
  return {
    id:'work:'+work.key,
    workKey:work.key,
    title:work.title,
    author:work.author,
    files:work.tracks.length,
    to:base,
    state:eligible?'ready':'review',
    reason:eligible?'':reviewReason(work,sourceRoots),
    members,
  };
}

function reviewReason(work:LocalWork,sourceRoots:string[]){
  if(work.needsReview)return 'Metadata review is required before organising this work.';
  if(!work.coverUri)return 'Cover and metadata resolution must finish before organising this work.';
  if(!clean(work.title)||normal(work.title)==='untitled')return 'A resolved title is required before organising this work.';
  if(sourceRoots.length!==1)return 'All files in a work must belong to one selected source folder.';
  if(work.tracks.some(track=>track.identificationConfidence!=='high'))return 'Only high-confidence resolved works can be organised.';
  if(work.tracks.some(track=>!track.sourceUri))return 'The selected source folder is missing for one or more files.';
  return 'This work is not ready to organise.';
}

function memberPreview(work:LocalWork,track:LocalBook,rootUri:string,base:string):LocalWorkSortMember{
  const filename=fileNameFromUri(track.uri);
  const discFolder=discSubfolder(track,work.tracks);
  const relativePath=[base,discFolder,filename].filter(Boolean).join('/');
  return {
    id:'work:'+work.key+':asset:'+track.id,
    asset:track.id,
    filename,
    fileUri:track.uri,
    sourceTreeUri:rootUri,
    relativePath,
    from:displayPath(track.uri),
    to:relativePath,
  };
}

function discSubfolder(track:LocalBook,tracks:LocalBook[]){
  const filename=fileNameFromUri(track.uri);
  const duplicates=tracks.filter(other=>fileNameFromUri(other.uri).toLowerCase()===filename.toLowerCase()).length;
  if(duplicates<2)return '';
  if((track.discNumber||0)>0)return 'Disc '+track.discNumber;
  const parts=decodedPath(track.uri);
  const parent=clean(parts[parts.length-2]||'');
  return /^(?:cd|disc|disk)\s*[-_. ]*0*\d{1,3}$/i.test(parent)?parent:'';
}

function workDestination(work:LocalWork,template:string){
  const author=cleanPart(work.author||'Unknown author');
  const series=cleanPart(work.series||'Standalone');
  const title=cleanPart(work.title);
  const format=cleanPart(work.format||'Books');
  if(template==='author-series-title')return [author,series,title].join('/');
  if(template==='format-author-title')return [format,author,title].join('/');
  return [author,title].join('/');
}

export async function applyLocalWorkSortCopies(previews:LocalWorkSortPreview[]):Promise<LocalWorkSortApplyResult>{
  const copied:LocalWorkSortApplyResult['copied']=[];
  const failed:LocalWorkSortApplyResult['failed']=[];

  for(const preview of previews){
    if(preview.state!=='ready')continue;
    const created:Array<{id:string;title:string;uri:string}>=[];
    const createdTargets:string[]=[];
    try{
      for(const member of preview.members){
        const target=await createTargetFile(member.sourceTreeUri,member.relativePath);
        createdTargets.push(target);
        await StorageAccessFramework.copyAsync({from:member.fileUri,to:target});
        created.push({id:member.id,title:preview.title,uri:target});
      }
      copied.push(...created);
    }catch(error){
      for(const uri of createdTargets.reverse()){
        try{await StorageAccessFramework.deleteAsync(uri);}catch{}
      }
      failed.push({
        id:preview.id,
        title:preview.title,
        error:(error as Error).message,
      });
    }
  }

  return {copied,failed};
}

async function createTargetFile(sourceTreeUri:string,relativePath:string){
  if(!sourceTreeUri)throw Error('Missing selected source folder for this work.');
  const parts=relativePath.split('/').filter(Boolean);
  if(!parts.length)throw Error('Missing destination file name.');
  const filename=parts.pop()!;
  let dir=sourceTreeUri;
  for(const part of parts)dir=await ensureDirectory(dir,part);
  const dot=filename.lastIndexOf('.');
  const name=dot>0?filename.slice(0,dot):filename;
  const ext=dot>0?filename.slice(dot+1).toLowerCase():'';
  return StorageAccessFramework.createFileAsync(dir,name,mimeType(ext));
}

async function ensureDirectory(parent:string,name:string){
  const children=await StorageAccessFramework.readDirectoryAsync(parent);
  const existing=children.find(child=>lastPathPart(child)===name&&!extension(child));
  if(existing)return existing;
  return StorageAccessFramework.makeDirectoryAsync(parent,name);
}

function fileNameFromUri(uri:string){
  const parts=decodedPath(uri);
  return parts[parts.length-1]||'item';
}

function decodedPath(uri:string){
  try{
    const decoded=decodeURIComponent(uri).split('?')[0];
    const marker=decoded.includes('/document/')?(decoded.split('/document/').pop()||decoded):decoded;
    return marker.replace(/^primary:/,'').split('/').filter(Boolean);
  }catch{
    return uri.split('/').filter(Boolean);
  }
}

function displayPath(uri:string){
  return decodedPath(uri).join('/');
}

function lastPathPart(uri:string){
  const parts=decodedPath(uri);
  return parts[parts.length-1]||uri;
}

function extension(uri:string){
  const name=fileNameFromUri(uri);
  const dot=name.lastIndexOf('.');
  return dot>0&&dot<name.length-1?name.slice(dot+1).toLowerCase():'';
}

function mimeType(ext:string){
  if(ext==='epub')return 'application/epub+zip';
  if(ext==='pdf')return 'application/pdf';
  if(ext==='cbz'||ext==='zip')return 'application/zip';
  if(ext==='cbr')return 'application/vnd.comicbook-rar';
  if(ext==='cbt')return 'application/x-tar';
  if(ext==='mp3')return 'audio/mpeg';
  if(ext==='m4a'||ext==='m4b')return 'audio/mp4';
  if(ext==='aac')return 'audio/aac';
  if(ext==='flac')return 'audio/flac';
  if(ext==='wav')return 'audio/wav';
  if(ext==='ogg'||ext==='opus')return 'audio/ogg';
  return 'application/octet-stream';
}

function cleanPart(value:string){
  return clean(value).replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim()||'Unknown';
}

function normalizedPath(value:string){
  return value.replace(/\\/g,'/').replace(/\/+?/g,'/').replace(/^\/+|\/+$/g,'').toLowerCase();
}

function normal(value:string){
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function clean(value:string){
  return String(value||'').replace(/\s+/g,' ').trim();
}
