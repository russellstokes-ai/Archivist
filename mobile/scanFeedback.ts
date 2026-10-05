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
  if(phase==='covers')return 'Finding covers';
  if(phase==='online-books')return 'Matching books & audiobooks';
  if(phase==='online-comics')return 'Matching comics';
  if(phase==='preparing')return 'Saving library';
  return 'Library updated';
}

export function scanPhaseStep(phase:LocalScanProgress['phase']) {
  const steps:Record<LocalScanProgress['phase'],number>={
    discovering:1,
    'reading-metadata':2,
    matching:3,
    'checking-duplicates':4,
    covers:5,
    'online-books':6,
    'online-comics':7,
    preparing:8,
    complete:8,
  };
  return steps[phase];
}


export function scanProgressPercent(progress:LocalScanProgress){
  if(progress.phase==='complete')return 100;
  const ratio=progress.total&&progress.total>0
    ? Math.max(0,Math.min(1,(progress.processed||0)/progress.total))
    : 0;
  const ranges:Record<LocalScanProgress['phase'],[number,number]>={
    discovering:[3,18],
    'reading-metadata':[18,42],
    matching:[42,48],
    'checking-duplicates':[48,52],
    covers:[52,68],
    'online-books':[68,88],
    'online-comics':[88,97],
    preparing:[97,99],
    complete:[100,100],
  };
  const [start,end]=ranges[progress.phase];
  if(progress.phase==='discovering'&&!progress.total){
    return Math.min(end,start+Math.floor(Math.log2(Math.max(1,progress.entriesVisited+1))*2));
  }
  return Math.round(start+(end-start)*ratio);
}
