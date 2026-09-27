export type AtlasCount = {name:string;count:number};

export type AtlasWorkLike = {
  title:string;
  author:string;
  series:string;
  format:string;
  space:string;
  available:boolean;
};

export type AtlasRelationship<T extends AtlasWorkLike = AtlasWorkLike> = {
  kind:'author'|'series';
  value:string;
  workCount:number;
  works:T[];
  authors:AtlasCount[];
  series:AtlasCount[];
  formats:AtlasCount[];
  spaces:AtlasCount[];
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

export function buildAtlasRelationship<T extends AtlasWorkLike>(
  works:T[],
  kind:'author'|'series',
  value:string,
):AtlasRelationship<T> {
  const selected=works.filter(work=>{
    if(kind==='author') return value==='Unknown author' ? !work.author.trim() : work.author===value;
    return work.series===value;
  });
  return {
    kind,
    value,
    workCount:selected.length,
    works:selected.slice().sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true})).slice(0,50),
    authors:counts(selected.map(work=>work.author.trim() || 'Unknown author')),
    series:counts(selected.map(work=>work.series)),
    formats:counts(selected.map(work=>work.format)),
    spaces:counts(selected.map(work=>work.space)),
  };
}
