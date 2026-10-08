import {canonicalPrimaryGenre} from './genreTaxonomy';
export type AtlasUniverseWork = {
  key:string;
  canonicalKey?:string;
  title:string;
  author:string;
  series:string;
  genre:string;
  format:string;
  space:string;
  source:string;
  coverUri?:string;
};

export type AtlasUniverseCollection = {
  id:string;
  name:string;
  canonicalKeys:string[];
};

export type AtlasUniverseAnnotation = {
  workKey:string;
  text:string;
  note?:string;
  kind?:string;
};

export type AtlasUniverseNodeKind = 'genre'|'author'|'series'|'work'|'collection'|'note'|'tag';

export type AtlasUniverseNode = {
  id:string;
  kind:AtlasUniverseNodeKind;
  label:string;
  x:number;
  y:number;
  count:number;
  relationKind?:'author'|'series'|'genre'|'format'|'space';
  relationValue?:string;
  workKey?:string;
  collectionId?:string;
  coverUri?:string;
  source?:string;
  genre?:string;
  subtitle?:string;
};

export type AtlasUniverseEdge = {
  id:string;
  from:string;
  to:string;
  kind:'genre'|'author'|'series'|'collection'|'note'|'tag';
};

export type AtlasUniverse = {
  width:number;
  height:number;
  nodes:AtlasUniverseNode[];
  edges:AtlasUniverseEdge[];
  hiddenWorks:number;
};

const atlasGenre=(value:string)=>canonicalPrimaryGenre(value)||value.trim()||'Unclassified';

const WIDTH=1400;
const HEIGHT=980;
const CX=WIDTH/2;
const CY=HEIGHT/2;

function hash(value:string) {
  let h=2166136261;
  for(let i=0;i<value.length;i++) {
    h^=value.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function jitter(seed:string,min:number,max:number) {
  const t=(hash(seed)%10000)/9999;
  return min+(max-min)*t;
}

function counts(values:string[]) {
  const map=new Map<string,number>();
  for(const raw of values) {
    const value=(raw||'').trim();
    if(value)map.set(value,(map.get(value)||0)+1);
  }
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}

function centroid(nodes:AtlasUniverseNode[]) {
  if(!nodes.length)return {x:CX,y:CY};
  return {
    x:nodes.reduce((sum,node)=>sum+node.x,0)/nodes.length,
    y:nodes.reduce((sum,node)=>sum+node.y,0)/nodes.length,
  };
}

function tagValues(annotation:AtlasUniverseAnnotation) {
  const text=[annotation.text,annotation.note||''].join(' ');
  const tags=new Set<string>();
  for(const match of text.matchAll(/(^|\s)#([\p{L}\p{N}_-]{2,40})/gu))tags.add(match[2].toLowerCase());
  return [...tags];
}

export function buildAtlasUniverse(
  inputWorks:AtlasUniverseWork[],
  collections:AtlasUniverseCollection[]=[],
  annotations:AtlasUniverseAnnotation[]=[],
  maxWorks=120,
  priorityKeys:string[]=[],
):AtlasUniverse {
  const works=[...inputWorks].sort((a,b)=>(a.canonicalKey||a.key).localeCompare(b.canonicalKey||b.key)||a.title.localeCompare(b.title));
  if(!works.length)return {width:WIDTH,height:HEIGHT,nodes:[],edges:[],hiddenWorks:0};
  const genreCounts=counts(works.map(work=>atlasGenre(work.genre)));
  const genreTop=genreCounts.slice(0,24);
  const overflowGenres=genreCounts.slice(24);
  const priority=new Set(priorityKeys);
  const allowedGenres=new Set(genreTop.map(([name])=>name));
  const workScore=(work:AtlasUniverseWork)=>hash((work.canonicalKey||work.key)+'|'+work.title);
  const visibleWorks=works
    .map(work=>({work,score:workScore(work)}))
    .sort((a,b)=>Number(priority.has(b.work.key)||priority.has(b.work.canonicalKey||''))-Number(priority.has(a.work.key)||priority.has(a.work.canonicalKey||''))||a.score-b.score)
    .slice(0,Math.max(12,maxWorks))
    .map(item=>item.work);

  const nodes:AtlasUniverseNode[]=[];
  const edges:AtlasUniverseEdge[]=[];
  const byId=new Map<string,AtlasUniverseNode>();
  const edgeIds=new Set<string>();
  const add=(node:AtlasUniverseNode)=>{if(!byId.has(node.id)){byId.set(node.id,node);nodes.push(node);}return byId.get(node.id)!;};
  const edge=(from:string,to:string,kind:AtlasUniverseEdge['kind'])=>{
    if(from===to)return;
    const id=[kind,from,to].join('|');
    if(edgeIds.has(id))return;
    edgeIds.add(id); edges.push({id,from,to,kind});
  };

  const genres=genreTop.length?[...genreTop,...(overflowGenres.length?[['Other genres',overflowGenres.reduce((sum,item)=>sum+item[1],0)] as [string,number]]:[])]:[['Library',visibleWorks.length] as [string,number]];
  genres.forEach(([name,count],index)=>{
    const angle=-Math.PI/2+(Math.PI*2*index/Math.max(1,genres.length));
    const radius=genres.length<=3?235:305+jitter('genre:'+name,-28,28);
    add({id:'genre:'+name,kind:'genre',label:name,x:CX+Math.cos(angle)*radius,y:CY+Math.sin(angle)*radius,count,relationKind:name==='Other genres'?undefined:'genre',relationValue:name==='Unclassified'?'':name,subtitle:count+' works'});
  });

  const genreNodeFor=(work:AtlasUniverseWork)=>{
    const raw=atlasGenre(work.genre);
    const name=allowedGenres.has(raw)?raw:'Other genres';
    return byId.get('genre:'+name)!;
  };

  for(const work of visibleWorks) {
    const hub=genreNodeFor(work);
    const seed=(work.canonicalKey||work.key)+'|'+work.title;
    const angle=jitter(seed+':angle',0,Math.PI*2);
    const radius=jitter(seed+':radius',76,164);
    const id='work:'+(work.canonicalKey||work.key);
    const node=add({
      id,kind:'work',label:work.title,x:hub.x+Math.cos(angle)*radius,y:hub.y+Math.sin(angle)*radius,
      count:1,workKey:work.key,coverUri:work.coverUri,source:work.source,genre:atlasGenre(work.genre),
      subtitle:[work.author,work.series,work.format].filter(Boolean).slice(0,2).join(' · '),
    });
    edge(hub.id,node.id,'genre');
  }

  const workNodeByIdentity=(work:AtlasUniverseWork)=>byId.get('work:'+(work.canonicalKey||work.key));
  const authorCounts=counts(works.map(work=>work.author)).filter(([author])=>visibleWorks.some(work=>work.author===author));
  for(const [author,count] of authorCounts) {
    const related=visibleWorks.filter(work=>work.author===author).map(workNodeByIdentity).filter(Boolean) as AtlasUniverseNode[];
    const c=centroid(related);
    const angle=jitter('author:'+author,0,Math.PI*2);
    const node=add({id:'author:'+author,kind:'author',label:author,x:c.x+Math.cos(angle)*58,y:c.y+Math.sin(angle)*58,count,relationKind:'author',relationValue:author,subtitle:count+' works'});
    for(const target of related)edge(node.id,target.id,'author');
  }

  const seriesCounts=counts(works.map(work=>work.series)).filter(([series])=>visibleWorks.some(work=>work.series===series));
  for(const [series,count] of seriesCounts) {
    const related=visibleWorks.filter(work=>work.series===series).map(workNodeByIdentity).filter(Boolean) as AtlasUniverseNode[];
    const c=centroid(related);
    const angle=jitter('series:'+series,0,Math.PI*2);
    const node=add({id:'series:'+series,kind:'series',label:series,x:c.x+Math.cos(angle)*78,y:c.y+Math.sin(angle)*78,count,relationKind:'series',relationValue:series,subtitle:count+' works'});
    for(const target of related)edge(node.id,target.id,'series');
  }

  collections.slice(0,10).forEach((collection,index)=>{
    const angle=-Math.PI/2+(Math.PI*2*(index+0.5)/Math.max(1,Math.min(10,collections.length)));
    const node=add({id:'collection:'+collection.id,kind:'collection',label:collection.name,x:CX+Math.cos(angle)*430,y:CY+Math.sin(angle)*430,count:collection.canonicalKeys.length,collectionId:collection.id,subtitle:collection.canonicalKeys.length+' saved'});
    const keys=new Set(collection.canonicalKeys);
    for(const work of visibleWorks) {
      if(!keys.has(work.canonicalKey||work.key))continue;
      const target=workNodeByIdentity(work); if(target)edge(node.id,target.id,'collection');
    }
  });

  const annotationsByWork=new Map<string,AtlasUniverseAnnotation[]>();
  for(const annotation of annotations) {
    const list=annotationsByWork.get(annotation.workKey)||[];
    list.push(annotation); annotationsByWork.set(annotation.workKey,list);
  }
  let noteIndex=0;
  for(const work of visibleWorks) {
    if(noteIndex>=20)break;
    const related=annotationsByWork.get(work.key)||annotationsByWork.get(work.canonicalKey||'')||[];
    if(!related.length)continue;
    const target=workNodeByIdentity(work); if(!target)continue;
    const note=related.find(item=>item.note?.trim())||related[0];
    const angle=jitter('note:'+(work.canonicalKey||work.key),0,Math.PI*2);
    const node=add({
      id:'note:'+(work.canonicalKey||work.key),kind:'note',
      label:(note.note||note.text||'Note').trim().slice(0,42),
      x:target.x+Math.cos(angle)*48,y:target.y+Math.sin(angle)*48,
      count:related.length,workKey:work.key,subtitle:related.length+' annotation'+(related.length===1?'':'s'),
    });
    edge(node.id,target.id,'note');
    noteIndex++;
  }

  const tagMap=new Map<string,Set<string>>();
  for(const annotation of annotations) {
    for(const tag of tagValues(annotation)) {
      const set=tagMap.get(tag)||new Set<string>(); set.add(annotation.workKey); tagMap.set(tag,set);
    }
  }
  [...tagMap.entries()].sort((a,b)=>b[1].size-a[1].size||a[0].localeCompare(b[0])).slice(0,12).forEach(([tag,keys],index)=>{
    const angle=-Math.PI/2+(Math.PI*2*(index+0.25)/Math.max(1,Math.min(12,tagMap.size)));
    const node=add({id:'tag:'+tag,kind:'tag',label:'#'+tag,x:CX+Math.cos(angle)*385,y:CY+Math.sin(angle)*385,count:keys.size,subtitle:keys.size+' linked'});
    for(const work of visibleWorks) {
      if(!keys.has(work.key)&&!keys.has(work.canonicalKey||''))continue;
      const target=workNodeByIdentity(work); if(target)edge(node.id,target.id,'tag');
    }
  });

  return {width:WIDTH,height:HEIGHT,nodes,edges,hiddenWorks:Math.max(0,works.length-visibleWorks.length)};
}

