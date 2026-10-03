import {LocalBook, LocalScanProgress} from './localLibrary';

export type ScanResultSummary = {
  added:number;
  updated:number;
  removed:number;
  unchanged:number;
};

function fingerprint(book:LocalBook) {
  return JSON.stringify({
    size:book.fileSize ?? null,
    modified:book.modificationTime ?? null,
    title:book.title,
    author:book.author,
    series:book.series,
    seriesNumber:book.seriesNumber ?? null,
    genre:book.genre,
    year:book.publishedYear ?? null,
    narrator:book.narrator || '',
    publisher:book.publisher || '',
    isbn:book.isbn || '',
    asin:book.asin || '',
    language:book.language || '',
    description:book.description || '',
    coverUri:book.coverUri || '',
    metadataSource:book.metadataSource || '',
    needsReview:!!book.needsReview,
  });
}

export function reconcileScan(previous:LocalBook[], next:LocalBook[]):ScanResultSummary {
  const before=new Map(previous.filter(item=>!!item.uri).map(item=>[item.uri,item]));
  const after=new Map(next.filter(item=>!!item.uri).map(item=>[item.uri,item]));
  let added=0,updated=0,unchanged=0,removed=0;
  for(const [uri,item] of after){
    const old=before.get(uri);
    if(!old){added++;continue;}
    if(fingerprint(old)===fingerprint(item))unchanged++;
    else updated++;
  }
  for(const uri of before.keys())if(!after.has(uri))removed++;
  return {added,updated,removed,unchanged};
}

export function scanPhaseLabel(phase:LocalScanProgress['phase']) {
  if(phase==='discovering')return 'Discovering files';
  if(phase==='reading-metadata')return 'Reading metadata';
  if(phase==='matching')return 'Matching books and series';
  if(phase==='checking-duplicates')return 'Checking duplicates';
  if(phase==='preparing')return 'Preparing library';
  return 'Library updated';
}

export function scanPhaseStep(phase:LocalScanProgress['phase']) {
  const steps:Record<LocalScanProgress['phase'],number>={
    discovering:1,
    'reading-metadata':2,
    matching:3,
    'checking-duplicates':4,
    preparing:5,
    complete:5,
  };
  return steps[phase];
}
