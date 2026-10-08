import type {LocalBook} from './localLibrary';
import {groupLocalWorks, type LocalWork} from './localWorks';
import {isGenericMediaTitle} from './libraryIntelligence';

export type PublicationBlocker =
  | 'needs-review'
  | 'missing-title'
  | 'missing-author'
  | 'missing-library-cover'
  | 'missing-living-book-cover'
  | 'remote-library-cover'
  | 'remote-living-book-cover';

export type PublicationAssessment={
  ready:boolean;
  blockers:PublicationBlocker[];
  libraryCoverUri?:string;
  livingBookCoverUri?:string;
};

export function isVerifiedLocalArtworkUri(uri:unknown){
  const value=String(uri||'').trim();
  return /^(?:file|content):\/\//i.test(value)||/^data:image\//i.test(value);
}

export function workLibraryCoverUri(work:LocalWork){
  // Prefer a locally usable image from any chapter over a remote URL attached
  // to the first chapter. This is a WORK-level publication decision.
  const candidates=[
    work.libraryCoverUri,work.coverUri,
    ...work.tracks.map(track=>track.libraryCoverUri),
    ...work.tracks.map(track=>track.coverUri),
  ].map(uri=>String(uri||'').trim()).filter(Boolean);
  return candidates.find(isVerifiedLocalArtworkUri)||candidates[0]||undefined;
}

export function workLivingBookCoverUri(work:LocalWork){
  return String(
    work.livingBookCoverUri ||
    work.tracks.find(track=>track.livingBookCoverUri)?.livingBookCoverUri ||
    ''
  ).trim()||undefined;
}

export function assessLocalWorkForPublication(work:LocalWork):PublicationAssessment{
  const blockers:PublicationBlocker[]=[];
  const title=String(work.title||'').trim();
  const author=String(work.author||'').trim();
  const libraryCoverUri=workLibraryCoverUri(work);
  const livingBookCoverUri=workLivingBookCoverUri(work);
  const authorMayRemainIncomplete=!work.needsReview&&!isGenericMediaTitle(title,work.format,work.files);
  const pendingClues=work.tracks.some(track=>track.identificationState==='clues-saved'||track.identificationState==='unresolved');
  const blockingReview=pendingClues||work.needsReview||isGenericMediaTitle(title,work.format,work.files);

  if(blockingReview)blockers.push('needs-review');
  if(!title)blockers.push('missing-title');
  if(!author&&!authorMayRemainIncomplete)blockers.push('missing-author');
  if(!libraryCoverUri)blockers.push('missing-library-cover');
  else if(!isVerifiedLocalArtworkUri(libraryCoverUri))blockers.push('remote-library-cover');
  // Living Book artwork is an OPTIONAL presentation enhancement, not a second
  // catalogue publication gate. Audio uses the existing square-art jacket
  // renderer, while portrait book/comic art uses its Library image.
  // Never advertise a remote-only texture as locally available.

  return {ready:blockers.length===0,blockers,libraryCoverUri,
    livingBookCoverUri:isVerifiedLocalArtworkUri(livingBookCoverUri)?livingBookCoverUri:undefined};
}

export function partitionLocalBooksByPublication(books:LocalBook[]){
  const published:LocalBook[]=[];
  const staged:LocalBook[]=[];
  const assessments=new Map<string,PublicationAssessment>();

  for(const work of groupLocalWorks(books)){
    const assessment=assessLocalWorkForPublication(work);
    assessments.set(work.key,assessment);
    (assessment.ready?published:staged).push(...work.tracks);
  }
  return {published,staged,assessments};
}

export function migrateLegacyPublishedArtwork(books:LocalBook[]){
  return books.map(book=>{
    if(book.libraryCoverUri||book.livingBookCoverUri||book.needsReview)return book;
    const cover=String(book.coverUri||'').trim();
    if(!isVerifiedLocalArtworkUri(cover))return book;
    // Test 13 stored one accepted cover slot. Preserve those already accepted
    // books on upgrade; later enrichment may replace the low-confidence
    // audiobook Living Book fallback with a portrait publication jacket.
    return {
      ...book,
      libraryCoverUri:cover,
      livingBookCoverUri:cover,
      livingBookCoverSource:'embedded' as const,
      livingBookCoverConfidence:book.format==='Audio'?0.45:1,
    };
  });
}

export function reconcilePublishedLocalBooks(previousPublished:LocalBook[],stagedBooks:LocalBook[]){
  const partition=partitionLocalBooksByPublication(stagedBooks);
  const stagedUris=new Set(stagedBooks.map(book=>book.uri).filter(Boolean));
  const readyUris=new Set(partition.published.map(book=>book.uri).filter(Boolean));
  // A staged but incomplete replacement must not degrade the user's current
  // Library. Keep the previous verified version for matching physical assets.
  const retained=previousPublished.filter(book=>!!book.uri&&stagedUris.has(book.uri)&&!readyUris.has(book.uri));
  const byUri=new Map<string,LocalBook>();
  for(const book of [...partition.published,...retained])if(book.uri&&!byUri.has(book.uri))byUri.set(book.uri,book);
  return {published:[...byUri.values()],staged:partition.staged,assessments:partition.assessments};
}

export function publicationBlockerCopy(blocker:PublicationBlocker){
  switch(blocker){
    case 'needs-review': return 'Metadata needs review';
    case 'missing-title': return 'Title is missing';
    case 'missing-author': return 'Author is missing';
    case 'missing-library-cover': return 'Library cover is missing';
    case 'missing-living-book-cover': return 'Living Book cover is missing';
    case 'remote-library-cover': return 'Library cover has not been cached';
    case 'remote-living-book-cover': return 'Living Book cover has not been cached';
  }
}

/** Review visibility follows publication, including accepted works with failed artwork. */
export function localWorksForReview(books:LocalBook[]){
  return groupLocalWorks(books).map(work=>{
    const assessment=assessLocalWorkForPublication(work);
    return {...work.tracks[0],title:work.title,author:work.author,series:work.series,
      coverUri:work.coverUri,needsReview:!assessment.ready,
      reviewReason:assessment.blockers.map(publicationBlockerCopy).join('. ')};
  });
}

export function restorePublishedCatalogue(books:LocalBook[]):LocalBook[]{
  const previous=books.flatMap(book=>book.publishedSnapshot?[book.publishedSnapshot]:[]);
  return reconcilePublishedLocalBooks(previous,books).published;
}

export function retainPublishedSnapshots(books:LocalBook[],previous:LocalBook[]):LocalBook[]{
  const good=new Map(restorePublishedCatalogue(previous).map(book=>[book.uri,book]));
  const ready=new Set(partitionLocalBooksByPublication(books).published.map(book=>book.uri));
  return books.map(book=>{
    const {publishedSnapshot:ignored,...current}=book;
    const old=good.get(book.uri);
    if(ready.has(book.uri))return {...current,identificationState:book.identificationState||'accepted'};
    if(!old)return current;
    const {publishedSnapshot:nested,...snapshot}=old;
    return {...current,publishedSnapshot:snapshot};
  });
}
