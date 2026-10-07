import {editionKey,logicalWorkKey} from './libraryIntelligence';
import type {LocalBook,LocalMetadataOverride} from './localLibrary';
import {mergeOnlineBookCandidate,type OnlineBookCandidate} from './onlineBookMetadata';
import {mergeOnlineComicCandidate,type OnlineComicCandidate} from './onlineComicMetadata';

const clueFields=[
  'title','author','series','seriesNumber','genre','publishedYear','narrator',
  'publisher','isbn','asin','language','description',
] as const;

export function applyManualCluesToWork(
  books:LocalBook[],
  uris:string[],
  override:LocalMetadataOverride,
):LocalBook[]{
  const wanted=new Set(uris);
  return books.map(book=>{
    if(!wanted.has(book.uri))return book;
    const provenance={...(book.metadataProvenance||{})};
    const confidence={...(book.metadataFieldConfidence||{})};
    for(const field of clueFields){
      const value=(override as any)[field];
      if(value===undefined||value===null||String(value).trim()==='')continue;
      provenance[field]='manual';
      confidence[field]='high';
    }
    const next:LocalBook={
      ...book,
      ...override,
      coverUri:override.coverUri||book.coverUri,
      metadataSource:'manual',
      metadataProvenance:provenance,
      metadataFieldConfidence:confidence,
      // Saving a clue is not accepting a finished identification.
      identificationState:book.identificationState==='accepted'?'accepted':'clues-saved',
      needsReview:book.identificationState!=='accepted',
      reviewReason:book.identificationState==='accepted'?'':'Search clues saved. Choose a Smart Search match to accept this work.',
    };
    next.workKey=logicalWorkKey(next);
    next.editionKey=editionKey(next,next.format);
    return next;
  });
}

export function acceptBookCandidateForWork(
  books:LocalBook[],
  uris:string[],
  candidate:OnlineBookCandidate,
):LocalBook[]{
  const wanted=new Set(uris);
  return books.map(book=>{
    if(!wanted.has(book.uri))return book;
    const embeddedMetadata=book.embeddedMetadata;
    // Accept is an explicit choice, unlike automatic enrichment: search clues
    // must not prevent the chosen candidate from correcting the identity.
    const selectedFields=Object.fromEntries(Object.entries(candidate.fields).filter(([,value])=>value!==undefined&&value!==null&&String(value).trim()!==''));
    const merged=mergeOnlineBookCandidate(book,candidate,true) as LocalBook;
    const next:LocalBook={
      ...merged,
      ...selectedFields,
      metadataSource:'manual',
      metadataConflicts:[],
      metadataProvenance:{...(merged.metadataProvenance||{}),...Object.fromEntries(Object.keys(selectedFields).map(field=>[field,'manual' as const]))},
      identificationState:'accepted',
      needsReview:false,reviewReason:'',
      coverUri:candidate.coverUri||merged.coverUri,
      libraryCoverUri:candidate.coverUri||merged.libraryCoverUri,
      livingBookCoverUri:candidate.coverUri&&candidate.coverUri!==book.coverUri?undefined:merged.livingBookCoverUri,
      uri:book.uri,
      rootUri:book.rootUri,
      embeddedMetadata,
      onlineMetadataMatch:candidate,
      identificationConfidence:merged.needsReview?'medium':'high',
    };
    next.workKey=logicalWorkKey(next);
    next.editionKey=editionKey(next,next.format);
    return next;
  });
}

export function acceptComicCandidateForWork(
  books:LocalBook[],
  uris:string[],
  candidate:OnlineComicCandidate,
):LocalBook[]{
  const wanted=new Set(uris);
  return books.map(book=>{
    if(!wanted.has(book.uri))return book;
    const embeddedMetadata=book.embeddedMetadata;
    // Accept is an explicit choice, unlike automatic enrichment: search clues
    // must not prevent the chosen candidate from correcting the identity.
    const selectedFields=Object.fromEntries(Object.entries(candidate.fields).filter(([,value])=>value!==undefined&&value!==null&&String(value).trim()!==''));
    const merged=mergeOnlineComicCandidate(book,candidate,true) as LocalBook;
    const next:LocalBook={
      ...merged,
      ...selectedFields,
      metadataSource:'manual',
      metadataConflicts:[],
      metadataProvenance:{...(merged.metadataProvenance||{}),...Object.fromEntries(Object.keys(selectedFields).map(field=>[field,'manual' as const]))},
      identificationState:'accepted',
      needsReview:false,reviewReason:'',
      coverUri:candidate.coverUri||merged.coverUri,
      libraryCoverUri:candidate.coverUri||merged.libraryCoverUri,
      livingBookCoverUri:candidate.coverUri&&candidate.coverUri!==book.coverUri?undefined:merged.livingBookCoverUri,
      uri:book.uri,
      rootUri:book.rootUri,
      embeddedMetadata,
      onlineComicMetadataMatch:candidate,
    };
    next.workKey=logicalWorkKey(next);
    next.editionKey=editionKey(next,next.format);
    return next;
  });
}

export type MetadataProposal=
  | {kind:'book';candidate:OnlineBookCandidate}
  | {kind:'comic';candidate:OnlineComicCandidate};

export function proposalTitle(proposal:MetadataProposal){
  return String(proposal.candidate.fields.title||proposal.candidate.fields.series||'Untitled').trim()||'Untitled';
}
export function proposalCreator(proposal:MetadataProposal){
  return String(proposal.candidate.fields.author||'').trim();
}
export function proposalScore(proposal:MetadataProposal){
  return Math.max(0,Math.min(100,Math.round(Number(proposal.candidate.score)||0)));
}
