import {cachePortraitCover} from './coverCache';
import {LocalBook,extractLocalAudioArtwork} from './localLibrary';
import {LocalWork,groupLocalWorks} from './localWorks';
import {lookupBookMetadata,MetadataMatch} from './metadataLookup';

export type LocalEnrichmentCacheEntry={
  version:2;
  fingerprint:string;
  querySignature:string;
  title:string;
  author:string;
  series:string;
  genre:string;
  publishedYear?:number;
  coverUri?:string;
  coverShape:'portrait'|'square';
  livingBookCoverUri?:string;
  livingBookCoverSource?:LocalBook['livingBookCoverSource'];
  livingBookCoverConfidence?:number;
  metadataProvider?:LocalBook['metadataProvider'];
  metadataProviderId?:string;
  identityReady:boolean;
  publishReady:boolean;
  reviewReason:string;
  updatedAt:string;
  retryAfter?:string;
};

export type LocalEnrichmentCache=Record<string,LocalEnrichmentCacheEntry>;
export type LocalEnrichmentProgress={
  total:number;
  processed:number;
  published:number;
  attention:number;
  currentTitle:string;
};

export type LocalEnrichmentDelta={
  books:LocalBook[];
  entry:LocalEnrichmentCacheEntry;
};

type Dependencies={
  lookup?:(input:{title:string;author?:string;series?:string;publishedYear?:number;isbn?:string;identifiers?:string[]},minimum?:number)=>Promise<MetadataMatch|null>;
  extractAudioArtwork?:(uri:string)=>Promise<{uri:string;mimeType:string;width:number;height:number}|null>;
  cachePortrait?:(key:string,uri:string)=>Promise<{uri:string;width:number;height:number;aspectRatio:number}>;
  now?:()=>Date;
  lookupDelayMs?:number;
};

function clean(value:string){return String(value||'').replace(/\s+/g,' ').trim();}
function normal(value:string){return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16).padStart(8,'0');
}
function delay(ms:number){return ms>0?new Promise<void>(resolve=>setTimeout(resolve,ms)):Promise.resolve();}

export function localWorkFingerprint(work:Pick<LocalWork,'tracks'|'format'|'space'>){
  return hash(work.format+'|'+work.space+'|'+work.tracks.map(track=>track.uri+'@'+(track.assetSignature||'unversioned')).sort().join('|'));
}

function workIdentifiers(work:Pick<LocalWork,'tracks'>){
  const values:string[]=[];
  for(const track of work.tracks){
    if(track.isbn)values.push(track.isbn);
    for(const value of track.identifiers||[])values.push(value);
  }
  return [...new Set(values.map(clean).filter(Boolean))].sort();
}

function workIsbn(work:Pick<LocalWork,'tracks'>){
  const values=workIdentifiers(work);
  return values.find(value=>{
    const normalized=value.toUpperCase().replace(/[^0-9X]/g,'');
    return normalized.length===10||normalized.length===13;
  });
}

export function localWorkQuerySignature(work:Pick<LocalWork,'title'|'author'|'series'|'publishedYear'|'tracks'>){
  return [
    normal(work.title),
    normal(work.author),
    normal(work.series),
    work.publishedYear||'',
    ...workIdentifiers(work).map(normal),
  ].join('|');
}

export function publishableLocalWork(work:Pick<LocalWork,'title'|'needsReview'|'coverUri'>){
  return !work.needsReview&&clean(work.title).toLowerCase()!=='untitled'&&!!work.coverUri;
}

function shape(width:number,height:number):'portrait'|'square'{
  if(width>0&&height>0&&width/height<=0.82)return 'portrait';
  return 'square';
}

function identityReady(work:LocalWork){
  return !work.needsReview&&!!clean(work.title)&&clean(work.title).toLowerCase()!=='untitled';
}

function bestGenre(match:MetadataMatch|undefined,current:string){
  return clean(current)||clean(match?.genres?.[0]||'');
}

function enrichBook(book:LocalBook,reviewUri:string|undefined,entry:LocalEnrichmentCacheEntry){
  const manual=book.metadataSource==='manual';
  const audio=book.format==='Audio';
  return {
    ...book,
    title:audio?book.title:(manual?book.title:entry.title||book.title),
    workTitleHint:audio?(entry.title||book.workTitleHint):book.workTitleHint,
    author:manual&&book.author?book.author:(entry.author||book.author),
    series:manual&&book.series?book.series:(entry.series||book.series),
    genre:manual&&book.genre?book.genre:(entry.genre||book.genre),
    publishedYear:book.publishedYear||entry.publishedYear,
    coverUri:entry.coverUri||book.coverUri,
    coverShape:entry.coverUri?entry.coverShape:book.coverShape,
    livingBookCoverUri:entry.livingBookCoverUri,
    livingBookCoverSource:entry.livingBookCoverSource,
    livingBookCoverConfidence:entry.livingBookCoverConfidence,
    metadataProvider:entry.metadataProvider,
    metadataProviderId:entry.metadataProviderId,
    metadataSource:manual?'manual':entry.metadataProvider?'online':book.metadataSource,
    identificationConfidence:entry.identityReady?'high':book.identificationConfidence,
    needsReview:!entry.publishReady&&book.uri===reviewUri,
    reviewReason:entry.publishReady||book.uri!==reviewUri?'':entry.reviewReason,
  };
}

function applyEntryIndexed(
  books:LocalBook[],
  indexByUri:Map<string,number>,
  work:LocalWork,
  entry:LocalEnrichmentCacheEntry,
){
  const changed:LocalBook[]=[];
  const reviewUri=work.tracks[0]?.uri;
  for(const track of work.tracks){
    const index=indexByUri.get(track.uri);
    if(index===undefined)continue;
    const updated=enrichBook(books[index],reviewUri,entry);
    books[index]=updated;
    changed.push(updated);
  }
  return changed;
}

function currentWorkFor(
  originalWork:LocalWork,
  books:LocalBook[],
  indexByUri:Map<string,number>,
){
  const tracks=originalWork.tracks.map(track=>{
    const index=indexByUri.get(track.uri);
    return index===undefined?track:books[index];
  });
  return groupLocalWorks(tracks)[0]||{...originalWork,tracks};
}

function cacheReusable(entry:LocalEnrichmentCacheEntry|undefined,querySignature:string,now:Date){
  if(!entry||entry.version!==2)return false;
  if(entry.querySignature!==querySignature)return false;
  if(entry.publishReady)return true;
  return !!entry.retryAfter&&Date.parse(entry.retryAfter)>now.getTime();
}

export async function enrichLocalCatalogue(
  inputBooks:LocalBook[],
  inputCache:LocalEnrichmentCache={},
  onProgress?:(progress:LocalEnrichmentProgress,delta:LocalEnrichmentDelta)=>void|Promise<void>,
  dependencies:Dependencies={},
){
  const lookup=dependencies.lookup||lookupBookMetadata;
  const extract=dependencies.extractAudioArtwork||extractLocalAudioArtwork;
  const cachePortrait=dependencies.cachePortrait||cachePortraitCover;
  const nowFn=dependencies.now||(()=>new Date());
  const lookupDelayMs=dependencies.lookupDelayMs??425;
  const books=inputBooks.map(book=>({...book}));
  const indexByUri=new Map<string,number>();
  for(let index=0;index<books.length;index++)if(books[index].uri)indexByUri.set(books[index].uri,index);
  const seedCache=inputCache;
  const cache:{[key:string]:LocalEnrichmentCacheEntry}={};
  const works=groupLocalWorks(books);
  let processed=0,published=0,attention=0;

  for(const originalWork of works){
    const work=currentWorkFor(originalWork,books,indexByUri);
    const fingerprint=localWorkFingerprint(originalWork);
    const querySignature=localWorkQuerySignature(work);
    const now=nowFn();
    const cached=seedCache[fingerprint];
    if(cacheReusable(cached,querySignature,now)){
      cache[fingerprint]=cached;
      const changedBooks=applyEntryIndexed(books,indexByUri,work,cached);
      processed++;
      if(cached.publishReady)published++;else attention++;
      await onProgress?.(
        {total:works.length,processed,published,attention,currentTitle:cached.title||work.title},
        {books:changedBooks,entry:cached},
      );
      continue;
    }

    let coverUri=work.coverUri;
    let coverShape=work.coverShape;
    let livingBookCoverUri=work.tracks.find(track=>track.livingBookCoverUri)?.livingBookCoverUri;
    let livingBookCoverSource=work.tracks.find(track=>track.livingBookCoverSource)?.livingBookCoverSource;
    let livingBookCoverConfidence=work.tracks.find(track=>track.livingBookCoverConfidence)?.livingBookCoverConfidence;
    let readyIdentity=identityReady(work);
    let resolvedTitle=clean(work.title);
    let resolvedAuthor=clean(work.author);
    let resolvedSeries=clean(work.series);
    let resolvedGenre=clean(work.genre);
    let resolvedYear=work.publishedYear;
    let provider:LocalBook['metadataProvider'];
    let providerId:string|undefined;

    if(work.format==='Audio'&&!coverUri){
      for(const track of work.tracks.slice(0,3)){
        try{
          const art=await extract(track.uri);
          if(!art?.uri)continue;
          coverUri=art.uri;
          coverShape=shape(art.width,art.height);
          break;
        }catch{}
      }
    }

    const needsOnline=!readyIdentity||!coverUri||(work.format==='Audio'&&!livingBookCoverUri);
    let match:MetadataMatch|null=null;
    if(needsOnline&&resolvedTitle&&resolvedTitle.toLowerCase()!=='untitled'){
      try{
        const identifiers=workIdentifiers(work);
        match=await lookup({
          title:resolvedTitle,
          author:resolvedAuthor||undefined,
          series:resolvedSeries||undefined,
          publishedYear:resolvedYear,
          isbn:workIsbn(work),
          identifiers:identifiers.length?identifiers:undefined,
        },0.86);
      }catch{}
      await delay(lookupDelayMs);
    }

    if(match){
      provider=match.provider;
      providerId=match.providerId;
      if(!readyIdentity){
        resolvedTitle=clean(match.title)||resolvedTitle;
        resolvedAuthor=clean(match.authors?.[0]||'')||resolvedAuthor;
        resolvedGenre=bestGenre(match,resolvedGenre);
        resolvedYear=resolvedYear||match.publishedYear;
        readyIdentity=!!resolvedTitle&&resolvedTitle.toLowerCase()!=='untitled'&&!!resolvedAuthor;
      }else{
        resolvedGenre=bestGenre(match,resolvedGenre);
        resolvedYear=resolvedYear||match.publishedYear;
      }
      if(match.coverUri){
        try{
          const portrait=await cachePortrait(fingerprint+'-'+match.provider,match.coverUri);
          livingBookCoverUri=portrait.uri;
          livingBookCoverSource=match.provider;
          livingBookCoverConfidence=match.confidence;
          if(!coverUri){coverUri=portrait.uri;coverShape='portrait';}
        }catch{}
      }
    }

    if(work.format==='Audio'&&!livingBookCoverUri&&coverUri){
      livingBookCoverUri=coverUri;
      livingBookCoverSource='jacket';
      livingBookCoverConfidence=1;
    }else if(work.format!=='Audio'&&!livingBookCoverUri&&coverUri&&coverShape==='portrait'){
      livingBookCoverUri=coverUri;
      livingBookCoverSource=provider||'embedded';
      livingBookCoverConfidence=provider?match?.confidence||0.9:1;
    }

    const publishReady=readyIdentity&&!!coverUri;
    const reviewReason=!readyIdentity?'Archivist could not confidently identify this work.':!coverUri?'Archivist could not resolve cover artwork.':'';
    const entry:LocalEnrichmentCacheEntry={
      version:2,fingerprint,querySignature,title:resolvedTitle,author:resolvedAuthor,series:resolvedSeries,genre:resolvedGenre,
      publishedYear:resolvedYear,coverUri,coverShape,livingBookCoverUri,livingBookCoverSource,livingBookCoverConfidence,
      metadataProvider:provider,metadataProviderId:providerId,identityReady:readyIdentity,publishReady,reviewReason,
      updatedAt:now.toISOString(),
      ...(!publishReady?{retryAfter:new Date(now.getTime()+6*60*60*1000).toISOString()}:{}),
    };
    cache[fingerprint]=entry;
    const changedBooks=applyEntryIndexed(books,indexByUri,work,entry);
    processed++;
    if(publishReady)published++;else attention++;
    await onProgress?.(
      {total:works.length,processed,published,attention,currentTitle:resolvedTitle||work.title},
      {books:changedBooks,entry},
    );
  }

  return {books,cache,progress:{total:works.length,processed,published,attention,currentTitle:''}};
}
