import {Chapter} from './playback';

export type PlayerBookmark = {
  id:string;
  workKey:string;
  seconds:number;
  label:string;
  createdAt:string;
};

export type PlayerMotionState = 'closed'|'open'|'turning';

export function playerMotionState(input:{playing:boolean;visible:boolean;reduceMotion:boolean}):PlayerMotionState{
  if(!input.visible)return 'closed';
  if(input.reduceMotion)return 'open';
  return input.playing?'turning':'open';
}

export function sanitizeBookmarks(value:unknown):PlayerBookmark[]{
  if(!Array.isArray(value))return [];
  return value.flatMap((raw:any)=>{
    if(!raw||typeof raw!=='object'||!String(raw.id||'').trim()||!String(raw.workKey||'').trim())return [];
    const seconds=Math.max(0,Number(raw.seconds)||0);
    return [{id:String(raw.id),workKey:String(raw.workKey),seconds,label:String(raw.label||'Bookmark').trim()||'Bookmark',createdAt:String(raw.createdAt||new Date(0).toISOString())}];
  }).sort((a,b)=>a.seconds-b.seconds||a.createdAt.localeCompare(b.createdAt));
}

export function addBookmark(items:PlayerBookmark[],input:{workKey:string;seconds:number;label?:string;now?:string}):PlayerBookmark[]{
  const seconds=Math.max(0,Math.round((Number(input.seconds)||0)*10)/10);
  const existing=items.find(item=>item.workKey===input.workKey&&Math.abs(item.seconds-seconds)<1);
  if(existing)return items;
  const createdAt=input.now||new Date().toISOString();
  const id=`bookmark-${input.workKey.replace(/[^a-z0-9]+/gi,'-').slice(0,48)}-${Math.round(seconds*10)}-${createdAt.replace(/[^0-9]/g,'').slice(0,14)}`;
  return sanitizeBookmarks([...items,{id,workKey:input.workKey,seconds,label:String(input.label||'Bookmark').trim()||'Bookmark',createdAt}]);
}

export function removeBookmark(items:PlayerBookmark[],id:string){return items.filter(item=>item.id!==id);}

export type TrackOrderMap = Record<string,string[]>;

export function sanitizeTrackOrders(value:unknown):TrackOrderMap{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const result:TrackOrderMap={};
  for(const [key,raw] of Object.entries(value as Record<string,unknown>)){
    if(!Array.isArray(raw))continue;
    result[String(key)]=[...new Set(raw.map(item=>String(item)).filter(Boolean))];
  }
  return result;
}

export function applyTrackOrder<T>(tracks:T[],saved:string[]|undefined,key:(track:T)=>string):T[]{
  if(!saved?.length)return [...tracks];
  const rank=new Map(saved.map((value,index)=>[value,index]));
  return tracks.map((track,index)=>({track,index,rank:rank.get(key(track))}))
    .sort((a,b)=>{
      const ar=a.rank,br=b.rank;
      if(ar===undefined&&br===undefined)return a.index-b.index;
      if(ar===undefined)return 1;
      if(br===undefined)return -1;
      return ar-br||a.index-b.index;
    }).map(item=>item.track);
}

export function moveTrackOrder<T>(tracks:T[],from:number,direction:-1|1,key:(track:T)=>string):string[]{
  const next=[...tracks];
  const target=from+direction;
  if(from<0||from>=next.length||target<0||target>=next.length)return next.map(key);
  [next[from],next[target]]=[next[target],next[from]];
  return next.map(key);
}

export type ChapterOverrideMap=Record<string,Chapter[]>;

export function sanitizeChapters(value:unknown):Chapter[]{
  if(!Array.isArray(value))return [];
  const chapters=value.flatMap((raw:any)=>{
    if(!raw||typeof raw!=='object')return [];
    const start=Math.max(0,Number(raw.start)||0),end=Math.max(0,Number(raw.end)||0);
    return [{title:String(raw.title||'Chapter').trim()||'Chapter',start,end}];
  }).sort((a,b)=>a.start-b.start);
  return chapters.map((chapter,index)=>({...chapter,end:chapter.end>chapter.start?chapter.end:(chapters[index+1]?.start||chapter.start)}));
}

export function sanitizeChapterOverrides(value:unknown):ChapterOverrideMap{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const result:ChapterOverrideMap={};
  for(const [key,raw] of Object.entries(value as Record<string,unknown>)){
    const chapters=sanitizeChapters(raw);
    if(chapters.length)result[String(key)]=chapters;
  }
  return result;
}

export function renameChapter(chapters:Chapter[],index:number,title:string):Chapter[]{
  const next=chapters.map(item=>({...item}));
  if(!next[index])return next;
  next[index].title=title.trim()||next[index].title;
  return next;
}

export function splitChapter(chapters:Chapter[],index:number,seconds:number):Chapter[]{
  const next=sanitizeChapters(chapters);
  const chapter=next[index];
  if(!chapter)return next;
  const split=Math.max(chapter.start+1,Math.min(chapter.end>chapter.start?chapter.end-1:seconds,seconds));
  if(!Number.isFinite(split)||split<=chapter.start||(chapter.end>chapter.start&&split>=chapter.end))return next;
  const originalEnd=chapter.end;
  next[index]={...chapter,end:split};
  next.splice(index+1,0,{title:`${chapter.title} · Part 2`,start:split,end:originalEnd});
  return next;
}

export function mergeChapter(chapters:Chapter[],index:number):Chapter[]{
  const next=sanitizeChapters(chapters);
  if(index<0||index>=next.length-1)return next;
  next[index]={...next[index],end:next[index+1].end};
  next.splice(index+1,1);
  return next;
}

export function setChapterBoundary(chapters:Chapter[],index:number,start:number):Chapter[]{
  const next=sanitizeChapters(chapters);
  if(index<=0||index>=next.length)return next;
  const previous=next[index-1];
  const current=next[index];
  const upper=current.end>current.start?current.end-1:start;
  const target=Math.max(previous.start+1,Math.min(upper,start));
  previous.end=target;
  current.start=target;
  return next;
}

