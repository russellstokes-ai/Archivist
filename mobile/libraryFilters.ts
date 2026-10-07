export type LibraryFormatFamily=''|'books'|'comics'|'audio'|'pdf';
export type LibraryAvailability='all'|'available'|'unavailable';

export type FilterablePublishedWork={
  canonicalKey:string;
  title:string;
  author?:string;
  series?:string;
  genre?:string;
  format:string;
  space?:string;
  readingState?:string;
  rating?:number;
  favourite?:boolean;
  available:boolean;
};

export type PublishedLibraryFilters={
  query?:string;
  space?:string;
  format?:string;
  formatFamily?:LibraryFormatFamily;
  author?:string;
  series?:string;
  genre?:string;
  readingState?:string;
  rating?:number;
  favouriteOnly?:boolean;
  unknownAuthorOnly?:boolean;
  availability?:LibraryAvailability;
  collectionKeys?:Set<string>|null;
  metadataGap?:string;
  matchesMetadataGap?:(work:FilterablePublishedWork,gap:string)=>boolean;
};

function text(value:unknown){return String(value??'');}

export function libraryFormatFamilyMatches(format:string,family:LibraryFormatFamily=''){
  if(!family)return true;
  const value=text(format).trim().toLowerCase();
  if(family==='books')return value==='epub'||value==='ebook'||value==='book';
  if(family==='comics')return value==='comic'||value==='cbz'||value==='cbr'||value==='cbt';
  if(family==='audio')return value==='audio'||value==='audiobook';
  return value==='pdf';
}

export function publishedWorkMatchesFilters<T extends FilterablePublishedWork>(work:T,filters:PublishedLibraryFilters={}){
  if(filters.collectionKeys&&!filters.collectionKeys.has(work.canonicalKey))return false;
  if(filters.space&&work.space!==filters.space)return false;
  if(filters.metadataGap&&filters.matchesMetadataGap&&!filters.matchesMetadataGap(work,filters.metadataGap))return false;
  if(!libraryFormatFamilyMatches(work.format,filters.formatFamily||''))return false;
  if(filters.format&&work.format!==filters.format)return false;
  if(filters.author&&work.author!==filters.author)return false;
  if(filters.series&&work.series!==filters.series)return false;
  if(filters.genre&&work.genre!==filters.genre)return false;
  if(filters.unknownAuthorOnly&&!!text(work.author).trim())return false;
  if(filters.readingState&&work.readingState!==filters.readingState)return false;
  if((filters.rating||0)>0&&(work.rating||0)!==filters.rating)return false;
  if(filters.favouriteOnly&&!work.favourite)return false;
  const availability=filters.availability||'all';
  if(availability==='available'&&!work.available)return false;
  if(availability==='unavailable'&&work.available)return false;
  const q=text(filters.query).trim().toLowerCase();
  if(q){
    const searchable=[work.title,work.author,work.series,work.genre,work.format,work.space].map(value=>text(value).toLowerCase());
    if(!searchable.some(value=>value.includes(q)))return false;
  }
  return true;
}

export function filterPublishedWorks<T extends FilterablePublishedWork>(works:T[],filters:PublishedLibraryFilters={}){
  return works.filter(work=>publishedWorkMatchesFilters(work,filters));
}
