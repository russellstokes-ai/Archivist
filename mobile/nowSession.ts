export type NowSessionKind='audio'|'reader';

export type NowSessionMedia={
  id:number;
  title:string;
  author:string;
  series:string;
  genre?:string;
  format:string;
  space:string;
  available:boolean;
  uri?:string;
  localWorkKey?:string;
  serverWorkId?:number;
  source?:'local'|'downloaded'|'server';
  originServer?:string;
  coverShape?:'portrait'|'square';
  coverUri?:string;
};

export type DurableNowSession={
  version:1;
  kind:NowSessionKind;
  media:NowSessionMedia;
  position:number;
  trackUri?:string;
  trackId?:number;
  wasPlaying:boolean;
  updatedAt:number;
};

function clean(value:unknown){return typeof value==='string'?value.trim():'';}
function number(value:unknown,fallback=0){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}

export function sameNowMedia(a:NowSessionMedia|undefined,b:NowSessionMedia|undefined){
  if(!a||!b)return false;
  if(a.serverWorkId&&b.serverWorkId&&a.originServer&&b.originServer){
    return a.serverWorkId===b.serverWorkId&&clean(a.originServer).replace(/\/+$/,'').toLowerCase()===clean(b.originServer).replace(/\/+$/,'').toLowerCase();
  }
  if(a.localWorkKey&&b.localWorkKey)return a.localWorkKey===b.localWorkKey;
  if(a.uri&&b.uri)return a.uri===b.uri;
  return a.source===b.source&&a.id===b.id;
}

export function createNowSession(
  media:NowSessionMedia,
  kind:NowSessionKind,
  position=0,
  options:{trackUri?:string;trackId?:number;wasPlaying?:boolean;updatedAt?:number}={},
):DurableNowSession{
  return {
    version:1,
    kind,
    media:{...media},
    position:Math.max(0,number(position)),
    trackUri:clean(options.trackUri)||undefined,
    trackId:Number.isFinite(Number(options.trackId))?Number(options.trackId):undefined,
    wasPlaying:!!options.wasPlaying,
    updatedAt:Math.max(0,number(options.updatedAt,Date.now())),
  };
}

export function refreshNowSession(
  current:DurableNowSession|null,
  media:NowSessionMedia,
  kind:NowSessionKind,
  position=0,
  options:{trackUri?:string;trackId?:number;wasPlaying?:boolean;updatedAt?:number}={},
){
  const next=createNowSession(media,kind,position,options);
  if(current&&current.kind===kind&&sameNowMedia(current.media,media)){
    return {...next,media:{...current.media,...media}};
  }
  return next;
}

export function sanitizeNowSession(value:unknown):DurableNowSession|null{
  if(!value||typeof value!=='object')return null;
  const raw=value as any,media=raw.media;
  if(raw.version!==1||(raw.kind!=='audio'&&raw.kind!=='reader')||!media||typeof media!=='object')return null;
  const source=['local','downloaded','server'].includes(media.source)?media.source:undefined;
  const parsed:NowSessionMedia={
    id:number(media.id),
    title:clean(media.title)||'Untitled',
    author:clean(media.author),
    series:clean(media.series),
    genre:clean(media.genre)||undefined,
    format:clean(media.format),
    space:clean(media.space),
    available:media.available!==false,
    uri:clean(media.uri)||undefined,
    localWorkKey:clean(media.localWorkKey)||undefined,
    serverWorkId:number(media.serverWorkId)>0?number(media.serverWorkId):undefined,
    source,
    originServer:clean(media.originServer)||undefined,
    coverShape:media.coverShape==='square'||media.coverShape==='portrait'?media.coverShape:undefined,
    coverUri:clean(media.coverUri)||undefined,
  };
  if(!parsed.format||(!parsed.uri&&!parsed.localWorkKey&&!parsed.serverWorkId&&!parsed.id))return null;
  return createNowSession(parsed,raw.kind,raw.position,{
    trackUri:clean(raw.trackUri)||undefined,
    trackId:Number.isFinite(Number(raw.trackId))?Number(raw.trackId):undefined,
    wasPlaying:!!raw.wasPlaying,
    updatedAt:number(raw.updatedAt),
  });
}
