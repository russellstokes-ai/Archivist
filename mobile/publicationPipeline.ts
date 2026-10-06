import type {LocalBook} from './localLibrary';
import {groupLocalWorks, type LocalWork} from './localWorks';

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

export function assessLocalWorkForPublication(work:LocalWork):PublicationAssessment{
  const blockers:PublicationBlocker[]=[];
  const title=String(work.title||'').trim();
  const author=String(work.author||'').trim();
  const libraryCoverUri=workLibraryCoverUri(work);
  const livingBookCoverUri=workLivingBookCoverUri(work);

  if(work.needsReview)blockers.push('needs-review');
  if(!title)blockers.push('missing-title');
  if(!author)blockers.push('missing-author');
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
