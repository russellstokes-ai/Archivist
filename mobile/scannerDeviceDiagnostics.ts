import type {LocalBook} from './localLibrary';
import {groupLocalWorks} from './localWorks';
import {audioWorkGroupKeys} from './metadataSync';

/** A deliberately non-identifying diagnostic contract: NEVER export paths,
 * titles, file URIs, network URLs, filenames, credentials or catalogue records.
 * Use only aggregated counters to reproduce test-device scanner divergence.
 */
export type ScannerStagePhase='discovery'|'identify-start'|'audio'|'archive'|'online'|'artwork'|'publish'|'finish'|'failed';
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
    },
    counters:cleanCounters,
  };
}