export type AtlasCount = {name:string;count:number};

export type AtlasKind = 'author'|'series'|'genre'|'format'|'space'|'status';

export type AtlasWorkLike = {
  title:string;
  author:string;
  series:string;
  genre:string;
  format:string;
  space:string;
  available:boolean;
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
};

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

function matches<T extends AtlasWorkLike>(work:T,kind:AtlasKind,value:string) {
  switch(kind) {
    case 'author': return value==='Unknown author' ? !work.author.trim() : work.author===value;
    case 'series': return work.series===value;
    case 'genre': return work.genre===value;
    case 'format': return work.format===value;
    case 'space': return work.space===value;
    case 'status': return value==='Available' ? work.available : value==='Unavailable' ? !work.available : false;
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
    genres:counts(selected.map(work=>work.genre)),
    formats:counts(selected.map(work=>work.format)),
    spaces:counts(selected.map(work=>work.space)),
    availability:counts(selected.map(work=>work.available?'Available':'Unavailable')),
  };
}
