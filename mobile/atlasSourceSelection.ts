import {dedupeForAll, matchesSource, type LibrarySource, type WorkSource} from './librarySources';

/**
 * Atlas's source boundary. It must use the same logical works as Library/Shelf,
 * but never promote staged scanner files before explicit publication.
 *
 * Legacy catalogues predate scannerPublished. Their fully reviewed, artwork-
 * complete works may enter Atlas; missing/malformed staged publication flags
 * are not silently treated as published.
 */
export type AtlasCandidate = {
  source: WorkSource;
  key:string;
  canonicalKey:string;
  logicalWorkKey?:string;
  available?:boolean;
  reachable?:boolean;
  title:string;
  author:string;
  genre:string;
  format:string;
  coverUri?:string;
  localWork?: {
    needsReview?:boolean;
    title:string;
    author:string;
    coverUri?:string;
    format:string;
    tracks:Array<{scannerWorkId?:string;scannerPublished?:boolean;format?:string}>;
    available?:boolean;
    offlineIncomplete?:boolean;
  };
};

const recognisedFormats=new Set(['Audio','Comic','EPUB','PDF','Kindle']);
export function atlasEligible<T extends AtlasCandidate>(work:T):boolean {
  if(work.source!=='local')return work.source==='downloaded'||work.source==='server';
  const local=work.localWork;
  if(!local || !local.tracks?.length)return false;
  const staged=local.tracks.some(track=>typeof track.scannerWorkId==='string'&&!!track.scannerWorkId.trim());
  if(staged){
    // Published scanner work is a real, explicit database state; incomplete or
    // unreviewed works must never be inferred from presence in Library alone.
    return local.tracks.some(track=>track.scannerPublished===true);
  }
  // Historic approved libraries had no publication field. Do not erase their
  // legitimate works from Atlas, but refuse genuinely incomplete legacy rows.
  return local.needsReview===false &&
    !!String(local.title||work.title).trim() &&
    !!String(local.author||work.author).trim() &&
    !!String(local.coverUri||work.coverUri||'').trim() &&
    recognisedFormats.has(local.format||work.format);
}

export function atlasSelectPublished<T extends AtlasCandidate>(
  works:T[],
  sourceFilter:LibrarySource='all',
):T[] {
  const eligible=works.filter(atlasEligible);
  const visible=sourceFilter==='all'?dedupeForAll(eligible):
    eligible.filter(work=>matchesSource(work.source,sourceFilter));
  const logical=new Map<string,T>();
  for(const work of visible){
    const key=work.source==='local'
      ? work.logicalWorkKey||work.canonicalKey
      : work.canonicalKey;
    const prior=logical.get(key);
    if(!prior || (prior.available===false&&work.available!==false))logical.set(key,work);
  }
  return [...logical.values()];
}

export function atlasSourceAudit<T extends AtlasCandidate>(works:T[],filter:LibrarySource) {
  // Counts only: never log book titles, file paths, private metadata or tokens.
  const local=works.filter(w=>w.source==='local');
  const eligible=works.filter(atlasEligible);
  return {
    sourceWorks:works.length,
    local:local.length,
    localPublished:local.filter(atlasEligible).length,
    localUnpublished:local.filter(w=>!atlasEligible(w)).length,
    downloaded:works.filter(w=>w.source==='downloaded').length,
    remote:works.filter(w=>w.source==='server').length,
    publishedVisible:atlasSelectPublished(works,filter).length,
  };
}
