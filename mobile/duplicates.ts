import {LocalBook} from './localLibrary';

export type LocalDuplicateGroup = {
  key:string;
  reason:string;
  items:LocalBook[];
};

export type LocalVariantGroup = {
  key:string;
  reason:string;
  items:LocalBook[];
};

function normalized(value:unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function compactId(value:unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
}

function identifierKey(book:LocalBook) {
  const isbn=compactId(book.isbn);
  if(isbn) return 'isbn:'+isbn;
  const asin=compactId(book.asin);
  if(asin) return 'asin:'+asin;
  return '';
}

function fallbackWorkKey(book:LocalBook) {
  return [
    normalized(book.title),
    normalized(book.author),
    normalized(book.series),
    book.seriesNumber === undefined ? '' : String(book.seriesNumber),
  ].join('|');
}

export function possibleLocalDuplicateGroups(books:LocalBook[]):LocalDuplicateGroup[] {
  const grouped=new Map<string,{items:LocalBook[];strong:boolean}>();
  for(const book of books) {
    const title=normalized(book.title);
    if(!title || title==='untitled') continue;

    const strongId=identifierKey(book);
    const format=normalized(book.format);
    const key=strongId
      ? strongId+'|format:'+format
      : fallbackWorkKey(book)+'|format:'+format;

    const current=grouped.get(key) || {items:[],strong:!!strongId};
    current.items.push(book);
    current.strong=current.strong || !!strongId;
    grouped.set(key,current);
  }

  return [...grouped.entries()]
    .filter(([,group])=>group.items.length>1)
    .map(([key,group])=>({
      key,
      reason:group.strong
        ? 'same ISBN or ASIN and format; likely duplicate copies'
        : 'same normalized title, author, series, series number and format; files are not byte-verified on this device',
      items:group.items.slice().sort((a,b)=>(a.uri||'').localeCompare(b.uri||'',undefined,{numeric:true})),
    }))
    .sort((a,b)=>b.items.length-a.items.length || a.items[0].title.localeCompare(b.items[0].title));
}

export function possibleAlternateFormatGroups(books:LocalBook[]):LocalVariantGroup[] {
  const grouped=new Map<string,LocalBook[]>();
  for(const book of books) {
    const title=normalized(book.title);
    if(!title || title==='untitled') continue;
    const key=book.workKey || identifierKey(book) || fallbackWorkKey(book);
    const items=grouped.get(key) || [];
    items.push(book);
    grouped.set(key,items);
  }

  return [...grouped.entries()]
    .filter(([,items])=>items.length>1 && new Set(items.map(item=>normalized(item.format))).size>1)
    .map(([key,items])=>({
      key,
      reason:'same logical work in multiple formats; treat as alternate editions or formats rather than duplicates',
      items:items.slice().sort((a,b)=>a.format.localeCompare(b.format)||a.uri.localeCompare(b.uri,undefined,{numeric:true})),
    }))
    .sort((a,b)=>b.items.length-a.items.length || a.items[0].title.localeCompare(b.items[0].title));
}


export function possibleDifferentEditionGroups(books:LocalBook[]):LocalVariantGroup[] {
  const grouped=new Map<string,LocalBook[]>();
  for(const book of books) {
    const title=normalized(book.title);
    if(!title || title==='untitled') continue;
    const key=book.workKey || fallbackWorkKey(book);
    const items=grouped.get(key) || [];
    items.push(book);
    grouped.set(key,items);
  }

  const out:LocalVariantGroup[]=[];
  for(const [key,items] of grouped.entries()) {
    const byFormat=new Map<string,LocalBook[]>();
    for(const item of items) {
      const format=normalized(item.format);
      const group=byFormat.get(format) || [];
      group.push(item);
      byFormat.set(format,group);
    }
    for(const [format,formatItems] of byFormat.entries()) {
      const identifiers=new Set(formatItems.map(identifierKey).filter(Boolean));
      if(formatItems.length>1 && identifiers.size>1) {
        out.push({
          key:key+'|edition-format:'+format,
          reason:'same logical work and format, but identifiers differ; keep as separate editions rather than treating them as duplicate copies',
          items:formatItems.slice().sort((a,b)=>identifierKey(a).localeCompare(identifierKey(b)) || a.uri.localeCompare(b.uri,undefined,{numeric:true})),
        });
      }
    }
  }
  return out.sort((a,b)=>b.items.length-a.items.length || a.items[0].title.localeCompare(b.items[0].title));
}

export function localRelationClassification(books:LocalBook[]) {
  return {
    duplicates: possibleLocalDuplicateGroups(books),
    alternateFormats: possibleAlternateFormatGroups(books),
    differentEditions: possibleDifferentEditionGroups(books),
  };
}
