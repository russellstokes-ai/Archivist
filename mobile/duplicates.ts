import {LocalBook} from './localLibrary';

export type LocalDuplicateGroup = {
  key:string;
  reason:string;
  items:LocalBook[];
};

function normalized(value:string) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

export function possibleLocalDuplicateGroups(books:LocalBook[]):LocalDuplicateGroup[] {
  const grouped=new Map<string,LocalBook[]>();
  for(const book of books) {
    const title=normalized(book.title);
    if(!title || title==='untitled') continue;
    const key=[title,normalized(book.author),normalized(book.series),normalized(book.format)].join('|');
    const items=grouped.get(key) || [];
    items.push(book);
    grouped.set(key,items);
  }
  return [...grouped.entries()]
    .filter(([,items])=>items.length>1)
    .map(([key,items])=>({
      key,
      reason:'same normalized title, author, series and format; files are not byte-verified on this device',
      items:items.slice().sort((a,b)=>(a.uri||'').localeCompare(b.uri||'',undefined,{numeric:true})),
    }))
    .sort((a,b)=>b.items.length-a.items.length || a.items[0].title.localeCompare(b.items[0].title));
}
