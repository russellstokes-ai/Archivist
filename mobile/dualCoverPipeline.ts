import type {LocalBook} from './localLibrary';
import {groupLocalWorks} from './localWorks';
import {persistOnlineCover, type OnlineCoverOps} from './onlineCoverCache';
import {isVerifiedLocalArtworkUri} from './publicationPipeline';

export type DualArtworkResult={
  books:LocalBook[];
  works:number;
  libraryReady:number;
  livingReady:number;
  complete:number;
  attemptedDownloads:number;
  downloaded:number;
};

function remote(uri:unknown){return /^https?:\/\//i.test(String(uri||'').trim());}
function providerCover(book:LocalBook){
  return String(book.onlineMetadataMatch?.coverUri||book.onlineComicMetadataMatch?.coverUri||'').trim();
}
function providerSource(book:LocalBook){
  if(book.onlineMetadataMatch?.coverUri){
    return book.onlineMetadataMatch.provider==='googlebooks'?'google-books' as const:'open-library' as const;
  }
  return 'embedded' as const;
}

export async function cacheRequiredWorkArtwork(
  books:LocalBook[],
  ops:OnlineCoverOps,
  options:{shouldContinue?:()=>boolean}={},
):Promise<DualArtworkResult>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const next=books.map(book=>({...book}));
  const byUri=new Map(next.map((book,index)=>[book.uri,index]));
  let attemptedDownloads=0,downloaded=0,libraryReady=0,livingReady=0,complete=0;
  const works=groupLocalWorks(next);

  for(const work of works){
    if(!shouldContinue())break;
    const tracks=work.tracks;
    const currentLibrary=String(
      work.libraryCoverUri ||
      tracks.find(track=>isVerifiedLocalArtworkUri(track.coverUri))?.coverUri ||
      ''
    ).trim();
    const currentLiving=String(
      work.livingBookCoverUri ||
      tracks.find(track=>isVerifiedLocalArtworkUri(track.livingBookCoverUri))?.livingBookCoverUri ||
      ''
    ).trim();

    const providerTrack=tracks.find(track=>remote(providerCover(track)));
    const providerRemote=providerTrack?providerCover(providerTrack):'';
    let providerLocal='';
    if(providerRemote){
      attemptedDownloads+=1;
      const cached=await persistOnlineCover(providerRemote,ops);
      if(isVerifiedLocalArtworkUri(cached)){
        providerLocal=String(cached);
        downloaded+=1;
      }
    }

    const libraryCoverUri=
      (isVerifiedLocalArtworkUri(currentLibrary)?currentLibrary:'') ||
      providerLocal ||
      '';
    let livingBookCoverUri=isVerifiedLocalArtworkUri(currentLiving)?currentLiving:'';
    const livingConfidence=Math.max(0,...tracks.map(track=>Number(track.livingBookCoverConfidence||0)).filter(Number.isFinite));
    const legacySquareFallback=work.format==='Audio'
      && !!livingBookCoverUri
      && !!libraryCoverUri
      && livingBookCoverUri===libraryCoverUri
      && work.coverShape==='square'
      && livingConfidence<0.9;

    if(!livingBookCoverUri||legacySquareFallback){
      if(work.format==='Audio'){
        // Audiobook square edition art can remain the Library image; when a
        // provider publication cover exists it upgrades the one-time Test 13
        // square fallback used solely to preserve an existing accepted library.
        if(providerLocal)livingBookCoverUri=providerLocal;
        else if(!livingBookCoverUri&&work.coverShape==='portrait'&&libraryCoverUri)livingBookCoverUri=libraryCoverUri;
      }else{
        // EPUB/PDF/comic publication covers are already portrait artwork and
        // may satisfy both logical slots after local caching.
        livingBookCoverUri=providerLocal||libraryCoverUri;
      }
    }

    const source=providerTrack?providerSource(providerTrack):(libraryCoverUri?'embedded' as const:'none' as const);
    if(libraryCoverUri)libraryReady+=1;
    if(livingBookCoverUri)livingReady+=1;
    if(libraryCoverUri&&livingBookCoverUri)complete+=1;

    for(const track of tracks){
      const index=byUri.get(track.uri);
      if(index===undefined)continue;
      next[index]={
        ...next[index],
        coverUri:libraryCoverUri||next[index].coverUri,
        libraryCoverUri:libraryCoverUri||undefined,
        livingBookCoverUri:livingBookCoverUri||undefined,
        livingBookCoverSource:livingBookCoverUri?(providerLocal?source:(next[index].livingBookCoverSource||'embedded')):'none',
        livingBookCoverConfidence:livingBookCoverUri?1:0,
      };
    }
  }
  return {books:next,works:works.length,libraryReady,livingReady,complete,attemptedDownloads,downloaded};
}
