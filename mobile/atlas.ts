import {canonicalPrimaryGenre} from './genreTaxonomy';
export type AtlasCount = {name:string;count:number};

export type AtlasKind = 'author'|'series'|'genre'|'format'|'space'|'status'|'reading'|'rating'|'favourite';

export type AtlasWorkLike = {
  title:string;
  author:string;
  series:string;
  genre:string;
  format:string;
  space:string;
  available:boolean;
  readingState?:'not-started'|'in-progress'|'finished';
  rating?:number;
  favourite?:boolean;
};

export type AtlasRelationship<T extends AtlasWorkLike = AtlasWorkLike> = {
  kind:AtlasKind;
  value:string;
  workCount:number;
  works:T[];
  authors:AtlasCount[];
  series:AtlasCount[];
  genres:AtlasCount[];
  formats:AtlasCount[];
  spaces:AtlasCount[];
  availability:AtlasCount[];
  reading:AtlasCount[];
  ratings:AtlasCount[];
  favourites:AtlasCount[];
};

const atlasGenre=(value:string)=>canonicalPrimaryGenre(value)||value.trim()||'Unclassified';

function counts(values:string[]):AtlasCount[] {
  const totals=new Map<string,number>();
  for(const value of values.map(value=>value.trim()).filter(Boolean)) {
    totals.set(value,(totals.get(value)||0)+1);
  }
  return [...totals.entries()]
    .map(([name,count])=>({name,count}))
    .sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name))
    .slice(0,20);
}

function ratingLabel(value:number) {
  const labels=['Unrated','½★','1★','1½★','2★','2½★','3★','3½★','4★','4½★','5★'];
  return labels[Math.max(0,Math.min(10,Math.round(value||0)))];
}

function matches<T extends AtlasWorkLike>(work:T,kind:AtlasKind,value:string) {
  switch(kind) {
    case 'author': return value==='Unknown author' ? !work.author.trim() : work.author===value;
    case 'series': return work.series===value;
    case 'genre': return atlasGenre(work.genre)===atlasGenre(value);
    case 'format': return work.format===value;
    case 'space': return work.space===value;
    case 'status': return value==='Available' ? work.available : value==='Unavailable' ? !work.available : false;
    case 'reading': {
      const state=work.readingState || 'not-started';
      return value==='Finished' ? state==='finished' : value==='In progress' ? state==='in-progress' : value==='Not started' ? state==='not-started' : false;
    }
    case 'rating': return ratingLabel(work.rating||0)===value;
    case 'favourite': return value==='Favourites' && !!work.favourite;
  }
}

export function buildAtlasRelationship<T extends AtlasWorkLike>(
  works:T[],
  kind:AtlasKind,
  value:string,
):AtlasRelationship<T> {
  const selected=works.filter(work=>matches(work,kind,value));
  return {
    kind,
    value,
    workCount:selected.length,
    works:selected.slice().sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true})).slice(0,50),
    authors:counts(selected.map(work=>work.author.trim() || 'Unknown author')),
    series:counts(selected.map(work=>work.series)),
    genres:counts(selected.map(work=>work.genre.trim()?atlasGenre(work.genre):'')),
    formats:counts(selected.map(work=>work.format)),
    spaces:counts(selected.map(work=>work.space)),
    availability:counts(selected.map(work=>work.available?'Available':'Unavailable')),
    reading:counts(selected.map(work=>work.readingState==='finished'?'Finished':work.readingState==='in-progress'?'In progress':'Not started')),
    ratings:counts(selected.map(work=>ratingLabel(work.rating||0))),
    favourites:selected.some(work=>work.favourite)?[{name:'Favourites',count:selected.filter(work=>work.favourite).length}]:[],
  };
}
