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
  // A published flag alone can be stale after a metadata edit, or only one
  // chapter of a multi-file work may have been accepted. Both cases must
  // remain in Needs Review, never appear prematurely in Atlas.
  const complete=local.needsReview===false &&
    !!String(local.title||work.title).trim() &&
    !!String(local.author||work.author).trim() &&
    !!String(local.coverUri||work.coverUri||'').trim() &&
    recognisedFormats.has(local.format||work.format);
  if(!complete)return false;
  if(staged){
    // Work-level publication is all-or-nothing: every scanner chapter must
    // have explicit current publication, not a single old accepted member.
    return local.tracks.every(track=>typeof track.scannerWorkId==='string' &&
      !!track.scannerWorkId.trim() && track.scannerPublished===true);
  }
  // Historic approved libraries had no publication flag; retain complete
  // reviewed legacy works without modifying the canonical scanner.
  return true;
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
