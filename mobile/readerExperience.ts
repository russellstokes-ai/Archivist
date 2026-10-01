export type ReaderAppearance={scale:number;theme:'system'|'paper'|'sepia'|'dark'};
export type ReaderBookmark={id:string;workKey:string;page:number;createdAt:string;label?:string};
export type ReaderAnnotation={id:string;workKey:string;page:number;kind:'highlight'|'note';text:string;note?:string;createdAt:string};

export const defaultReaderAppearance:ReaderAppearance={scale:1,theme:'system'};

export function sanitizeReaderAppearance(value:unknown):ReaderAppearance{
  const raw=(value&&typeof value==='object'?value:{}) as any;
  const scale=Math.max(.78,Math.min(1.5,Number(raw.scale)||1));
  const theme:['system','paper','sepia','dark'][number]=['system','paper','sepia','dark'].includes(raw.theme)?raw.theme:'system';
  return {scale,theme};
}
export function sanitizeReaderBookmarks(value:unknown):ReaderBookmark[]{
  if(!Array.isArray(value))return [];
  return value.flatMap((raw:any)=>raw&&typeof raw==='object'&&String(raw.workKey||'')&&Number.isInteger(Number(raw.page))&&Number(raw.page)>=0?[{
    id:String(raw.id||`bookmark-${Date.now()}`),workKey:String(raw.workKey),page:Number(raw.page),createdAt:String(raw.createdAt||new Date(0).toISOString()),label:raw.label?String(raw.label):undefined,
  }]:[]);
}
export function sanitizeReaderAnnotations(value:unknown):ReaderAnnotation[]{
  if(!Array.isArray(value))return [];
  return value.flatMap((raw:any)=>raw&&typeof raw==='object'&&String(raw.workKey||'')&&Number.isInteger(Number(raw.page))&&Number(raw.page)>=0&&['highlight','note'].includes(raw.kind)&&String(raw.text||'').trim()?[{
    id:String(raw.id||`annotation-${Date.now()}`),workKey:String(raw.workKey),page:Number(raw.page),kind:raw.kind,text:String(raw.text).trim(),note:raw.note?String(raw.note).trim():undefined,createdAt:String(raw.createdAt||new Date(0).toISOString()),
  }]:[]);
}
export function toggleReaderBookmark(bookmarks:ReaderBookmark[],workKey:string,page:number){
  const existing=bookmarks.find(item=>item.workKey===workKey&&item.page===page);
  if(existing)return bookmarks.filter(item=>item.id!==existing.id);
  return [{id:`rb-${Date.now().toString(36)}-${page}`,workKey,page,createdAt:new Date().toISOString()},...bookmarks];
}
export function addReaderAnnotation(annotations:ReaderAnnotation[],input:Omit<ReaderAnnotation,'id'|'createdAt'>){
  const text=input.text.trim();if(!text)return annotations;
  return [{...input,text,note:input.note?.trim()||undefined,id:`ra-${Date.now().toString(36)}-${annotations.length}`,createdAt:new Date().toISOString()},...annotations];
}
export function workReaderBookmarks(bookmarks:ReaderBookmark[],workKey:string){return bookmarks.filter(item=>item.workKey===workKey).sort((a,b)=>a.page-b.page||a.createdAt.localeCompare(b.createdAt));}
export function workReaderAnnotations(annotations:ReaderAnnotation[],workKey:string){return annotations.filter(item=>item.workKey===workKey).sort((a,b)=>a.page-b.page||a.createdAt.localeCompare(b.createdAt));}
