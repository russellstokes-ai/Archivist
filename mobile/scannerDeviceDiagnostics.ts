import type {LocalBook} from './localLibrary';
import {groupLocalWorks} from './localWorks';
import {audioWorkGroupKeys} from './metadataSync';
import {decodedPathParts} from './libraryIntelligence';

/** A deliberately non-identifying diagnostic contract: NEVER export paths,
 * titles, file URIs, network URLs, filenames, credentials or catalogue records.
 * Use only aggregated counters to reproduce test-device scanner divergence.
 */
export type ScannerStagePhase='discovery'|'identify-start'|'audio'|'audio-probe'|'archive'|'archive-probe'|'online'|'book-metadata'|'comic-metadata'|'artwork'|'publish'|'finish'|'failed';
export type ScannerStageRecord={
  schema:'archivist-scanner-stage-v1';
  phase:ScannerStagePhase;
  recordedAt:string;
  elapsedMs:number;
  counts:{
    physicalFiles:number;audioFiles:number;comicFiles:number;ebookFiles:number;
    logicalWorks:number;audioWorks:number;reviewFlaggedWorks:number;
    audioGroupsByIdentity:{directory:number;album:number;root:number;singleFile:number;standaloneSeries:number};
    workFileCountBands:{one:number;twoToThree:number;fourToNine:number;tenPlus:number};
    audioFolderEvidence:{total:number;omitted:number;largest:Array<{
      position:number;files:number;logicalGroups:number;albumTagVariants:number;missingAlbumTags:number;
    }>};
  };
  counters:Record<string,number>;
};
const safeCounterNames=[
  'nativeDirectoryQueries','legacyDirectoryReads','fallbackDirectoryReads',
  'perFileStats','entriesVisited','skipped','physicalFiles','logicalWorks',
  'metadataAttempted','metadataTimedOut','metadataSkipped','archiveBlocked',
  'lookupUnits','cachedCoverUrls','coverDownloads','publishedWorks',
  'maxJsDelayMs','errorCount',
] as const;

export function makeScannerStageRecord(
  phase:ScannerStagePhase,books:LocalBook[],elapsedMs:number,counters?:object,
):ScannerStageRecord {
  const works=groupLocalWorks(books);
  const audioKeys=audioWorkGroupKeys(books);
  const unique=new Set<string>();
  const byIdentity={directory:0,album:0,root:0,singleFile:0,standaloneSeries:0};
  for(const key of audioKeys.values()){
    if(unique.has(key))continue;
    unique.add(key);
    if(key.startsWith('audio-dir:'))byIdentity.directory++;
    else if(key.startsWith('audio-album:'))byIdentity.album++;
    else if(key.startsWith('audio-root:'))byIdentity.root++;
    else if(key.startsWith('audio-series-file:'))byIdentity.standaloneSeries++;
    else byIdentity.singleFile++;
  }
  const bands={one:0,twoToThree:0,fourToNine:0,tenPlus:0};
  for(const work of works){
    if(work.files===1)bands.one++;
    else if(work.files<=3)bands.twoToThree++;
    else if(work.files<=9)bands.fourToNine++;
    else bands.tenPlus++;
  }
  // Folder and URI keys never leave this routine. Export only anonymous counts.
  const dirs=new Map<string,{files:number;keys:Set<string>;albums:Set<string>;missing:number}>();
  for(const book of books){
    if(book.format!=='Audio')continue;
    const folder=decodedPathParts(book.uri).slice(0,-1).join('/');
    const item=dirs.get(folder)||{files:0,keys:new Set<string>(),albums:new Set<string>(),missing:0};
    item.files++;
    item.keys.add(audioKeys.get(book.uri)||('audio-file:'+book.uri));
    const album=String(book.embeddedMetadata?.workTitle||'').trim();
    if(album)item.albums.add(album.toLowerCase());
    else item.missing++;
    dirs.set(folder,item);
  }
  const largest=[...dirs.values()].sort((a,b)=>b.files-a.files||b.keys.size-a.keys.size)
    .slice(0,40).map((item,index)=>({
      position:index+1,files:item.files,logicalGroups:item.keys.size,
      albumTagVariants:item.albums.size,missingAlbumTags:item.missing,
    }));
  const values=(counters||{}) as Record<string,unknown>;
  const cleanCounters:Record<string,number>={};
  for(const key of safeCounterNames){
    const value=values[key];
    if(typeof value==='number'&&Number.isFinite(value))cleanCounters[key]=Math.max(0,Math.round(value));
  }
  return {
    schema:'archivist-scanner-stage-v1',
    phase,
    recordedAt:new Date().toISOString(),
    elapsedMs:Number.isFinite(elapsedMs)?Math.max(0,Math.round(elapsedMs)):0,
    counts:{
      physicalFiles:books.length,
      audioFiles:books.filter(book=>book.format==='Audio').length,
      comicFiles:books.filter(book=>book.format==='Comic').length,
      ebookFiles:books.filter(book=>book.format==='EPUB'||book.format==='PDF').length,
      logicalWorks:works.length,
      audioWorks:works.filter(work=>work.format==='Audio').length,
      reviewFlaggedWorks:works.filter(work=>work.needsReview).length,
      audioGroupsByIdentity:byIdentity,
      workFileCountBands:bands,
      audioFolderEvidence:{total:dirs.size,omitted:Math.max(0,dirs.size-largest.length),largest},
    },
    counters:cleanCounters,
  };
}