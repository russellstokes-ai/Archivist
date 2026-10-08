import {editionKey,logicalWorkKey} from './libraryIntelligence';
import {isVerifiedLocalArtworkUri} from './publicationPipeline';
import type {LocalBook,LocalMetadataOverride} from './localLibrary';
import {mergeOnlineBookCandidate,type OnlineBookCandidate} from './onlineBookMetadata';
import {mergeOnlineComicCandidate,type OnlineComicCandidate} from './onlineComicMetadata';

/** Provider suggestions do not override verified, on-device artwork. */
export function acceptedArtworkPreference(book:LocalBook,candidateCoverUri?:string){
  const choices=[book.manualOverride?.coverUri,book.libraryCoverUri,book.coverUri];
  const existing=choices.map(uri=>String(uri||'').trim()).find(uri=>isVerifiedLocalArtworkUri(uri));
  const living=String(book.livingBookCoverUri||'').trim();
  return {
    coverUri:existing||String(candidateCoverUri||book.coverUri||'').trim()||undefined,
    libraryCoverUri:existing||String(candidateCoverUri||book.libraryCoverUri||'').trim()||undefined,
    livingBookCoverUri:isVerifiedLocalArtworkUri(living)?living:undefined,
  };
}

/** Only an explicitly chosen cover may replace an accepted local cover on Save. */
export function editorCoverOverride(editedCoverUri:string,providerCandidateCoverUri?:string,pickedFromDevice=false){
  const proposed=String(editedCoverUri||'').trim();
  if(!proposed)return undefined;
  if(!pickedFromDevice&&providerCandidateCoverUri&&proposed===String(providerCandidateCoverUri).trim()&&/^https?:\/\//i.test(proposed))return undefined;
  return proposed;
}

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
    const artwork=acceptedArtworkPreference(book,candidate.coverUri);
    const next:LocalBook={
      ...merged,
      ...selectedFields,
      metadataSource:'manual',
      metadataConflicts:[],
      metadataProvenance:{...(merged.metadataProvenance||{}),...Object.fromEntries(Object.keys(selectedFields).map(field=>[field,'manual' as const]))},
      identificationState:'accepted',
      needsReview:false,reviewReason:'',
      coverUri:artwork.coverUri,
      libraryCoverUri:artwork.libraryCoverUri,
      livingBookCoverUri:artwork.livingBookCoverUri,
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
    const artwork=acceptedArtworkPreference(book,candidate.coverUri);
    const next:LocalBook={
      ...merged,
      ...selectedFields,
      metadataSource:'manual',
      metadataConflicts:[],
      metadataProvenance:{...(merged.metadataProvenance||{}),...Object.fromEntries(Object.keys(selectedFields).map(field=>[field,'manual' as const]))},
      identificationState:'accepted',
      needsReview:false,reviewReason:'',
      coverUri:artwork.coverUri,
      libraryCoverUri:artwork.libraryCoverUri,
      livingBookCoverUri:artwork.livingBookCoverUri,
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
