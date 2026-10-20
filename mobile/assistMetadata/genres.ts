import {normalizeGenre} from '../scannerVNext/genre';
export const hasGenre=(value?:string)=>!!value&&!!normalizeGenre([{value,source:'provider'}]).label;
// Catalogue category names, not guesses from titles or descriptions.
const aliases:Record<string,string>={'comedy & humour':'Humour/Comedy','comedy & humor':'Humour/Comedy','science fiction & fantasy':'','mystery, thriller & suspense':'','biographies & memoirs':'Biography/Memoir','politics & social sciences':'','education & learning':'Educational/Reference'};
export function catalogueGenre(values:unknown):string|undefined{
 if(!Array.isArray(values))return;
 const labels=values.slice(0,100).filter((v):v is string=>typeof v==='string').map(v=>v.trim().slice(0,512));
 const evidence=labels.map(v=>({value:aliases[v.toLowerCase()]??v,source:'provider' as const}));
 const direct=normalizeGenre(evidence);if(direct.label)return direct.label;
 const content=evidence.filter(e=>normalizeGenre([e]).id!=='children-ya');
 return normalizeGenre(content).label??normalizeGenre(content.map(e=>({...e,value:e.value.replace(/,/g,' / ')}))).label;
}
export function catalogueLadderGenre(value:unknown):string|undefined{
 if(!Array.isArray(value))return;
 const counts=new Map<string,number>();
 for(const item of value.slice(0,16)){
  if(item?.root!=='Genres'||!Array.isArray(item.ladder))continue;
  // Keep the content parent: Adventure beneath Science Fiction is not Travel.
  const genre=item.ladder.slice(0,12).map((node:any)=>catalogueGenre([node?.name])).find(Boolean);
  if(genre)counts.set(genre,(counts.get(genre)||0)+1);
 }
 const ranked=[...counts].sort((a,b)=>b[1]-a[1]);
 return ranked.length&&(!ranked[1]||ranked[0][1]>ranked[1][1])?ranked[0][0]:undefined;
}
