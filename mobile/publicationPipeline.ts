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
  return String(work.libraryCoverUri||work.coverUri||'').trim()||undefined;
}

export function workLivingBookCoverUri(work:LocalWork){
  return String(
    work.livingBookCoverUri ||
    work.tracks.find(track=>track.livingBookCoverUri)?.livingBookCoverUri ||
    ''
  ).trim()||undefined;
}

function hasImportantIdentityConflict(work:LocalWork){
  return work.tracks.some(track=>(track.metadataConflicts||[]).some(conflict=>
    ['title','author','series','seriesNumber','isbn','asin'].includes(String(conflict.field||''))
  ));
}

function trustedTitleWithoutAuthor(work:LocalWork,title:string,author:string){
  if(author||!title||isGenericMediaTitle(title,work.format,work.files)||hasImportantIdentityConflict(work))return false;
  const rank={low:0,medium:1,high:2} as const;
  let best=0;
  let trustedSource=false;
  for(const track of work.tracks){
    const confidence=track.metadataFieldConfidence?.title;
    if(confidence)best=Math.max(best,rank[confidence]);
    const source=String(track.metadataProvenance?.title||track.metadataSource||'');
    if(['manual','embedded','sidecar','online'].includes(source))trustedSource=true;
  }
  return trustedSource||best>=rank.medium;
}

export function assessLocalWorkForPublication(work:LocalWork):PublicationAssessment{
  const blockers:PublicationBlocker[]=[];
  const title=String(work.title||'').trim();
  const author=String(work.author||'').trim();
  const libraryCoverUri=workLibraryCoverUri(work);
  const livingBookCoverUri=workLivingBookCoverUri(work);
  const authorMayRemainIncomplete=trustedTitleWithoutAuthor(work,title,author);
  const blockingReview=work.needsReview&&!authorMayRemainIncomplete;

  if(blockingReview)blockers.push('needs-review');
  if(!title)blockers.push('missing-title');
  if(!author&&!authorMayRemainIncomplete)blockers.push('missing-author');
  if(!libraryCoverUri)blockers.push('missing-library-cover');
  else if(!isVerifiedLocalArtworkUri(libraryCoverUri))blockers.push('remote-library-cover');
  if(!livingBookCoverUri)blockers.push('missing-living-book-cover');
  else if(!isVerifiedLocalArtworkUri(livingBookCoverUri))blockers.push('remote-living-book-cover');

  return {ready:blockers.length===0,blockers,libraryCoverUri,livingBookCoverUri};
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
