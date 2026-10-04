export type AtlasTransform = {x:number;y:number;scale:number};
export type AtlasPoint = {x:number;y:number};
export type AtlasPlotNode = AtlasPoint & {id:string;kind:string;label:string};
export const ATLAS_MIN_SCALE=.08;
export const ATLAS_MAX_SCALE=3.5;
export const atlasScale=(value:number)=>Math.max(ATLAS_MIN_SCALE,Math.min(ATLAS_MAX_SCALE,Number.isFinite(value)?value:1));

export function atlasFit(nodes:AtlasPoint[],diameter:number):AtlasTransform {
  if(!nodes.length)return {x:diameter/2,y:diameter/2,scale:1};
  const cx=(Math.min(...nodes.map(n=>n.x))+Math.max(...nodes.map(n=>n.x)))/2;
  const cy=(Math.min(...nodes.map(n=>n.y))+Math.max(...nodes.map(n=>n.y)))/2;
  const radius=Math.max(1,...nodes.map(n=>Math.hypot(n.x-cx,n.y-cy)));
  const scale=atlasScale(Math.max(1,diameter/2-32)/radius);
  return {x:diameter/2-cx*scale,y:diameter/2-cy*scale,scale};
}

/** Preserve the world point beneath the fingers, including moving pinch centroids. */
export function atlasZoomAt(base:AtlasTransform,start:AtlasPoint,current:AtlasPoint,scale:number):AtlasTransform {
  const next=atlasScale(scale),ratio=next/base.scale;
  return {x:current.x-(start.x-base.x)*ratio,y:current.y-(start.y-base.y)*ratio,scale:next};
}

export function atlasConstrain(transform:AtlasTransform,nodes:AtlasPoint[],diameter:number):AtlasTransform {
  if(!nodes.length)return transform;
  const margin=Math.min(48,diameter/4),scale=atlasScale(transform.scale);
  const minX=Math.min(...nodes.map(n=>n.x))*scale,maxX=Math.max(...nodes.map(n=>n.x))*scale;
  const minY=Math.min(...nodes.map(n=>n.y))*scale,maxY=Math.max(...nodes.map(n=>n.y))*scale;
  return {scale,x:Math.max(margin-maxX,Math.min(diameter-margin-minX,transform.x)),y:Math.max(margin-maxY,Math.min(diameter-margin-minY,transform.y))};
}

export function atlasNearest(nodes:AtlasPlotNode[],transform:AtlasTransform,point:AtlasPoint,diameter:number,radius=26):string|null {
  if(Math.hypot(point.x-diameter/2,point.y-diameter/2)>diameter/2)return null;
  let nearest:string|null=null,distance=radius;
  for(const node of nodes){
    const x=transform.x+node.x*transform.scale,y=transform.y+node.y*transform.scale;
    if(Math.hypot(x-diameter/2,y-diameter/2)>diameter/2)continue;
    const d=Math.hypot(x-point.x,y-point.y);
    if(d<distance){distance=d;nearest=node.id;}
  }
  return nearest;
}

/** Greedy screen-space labels: selected first, hubs next, then local context. */
export function atlasLabels(nodes:AtlasPlotNode[],transform:AtlasTransform,diameter:number,selected:string,connected:Set<string>):Set<string> {
  const boxes:Array<{x:number;y:number;w:number;h:number}>=[],result=new Set<string>();
  const priority=(n:AtlasPlotNode)=>n.id===selected?0:n.kind==='genre'?1:connected.has(n.id)?2:n.kind==='author'?3:4;
  for(const node of [...nodes].sort((a,b)=>priority(a)-priority(b)||a.id.localeCompare(b.id))){
    if(node.id!==selected&&node.kind!=='genre'&&transform.scale<(connected.has(node.id)?.45:.9))continue;
    const x=transform.x+node.x*transform.scale,y=transform.y+node.y*transform.scale+14;
    const w=Math.min(150,Math.max(60,node.label.length*6.3+16)),h=node.label.length>22?38:24;
    if(x-w/2<0||x+w/2>diameter||y+h>diameter||y<0)continue;
    const box={x:x-w/2,y,w,h};
    if(node.id!==selected&&boxes.some(b=>box.x<b.x+b.w+6&&box.x+box.w+6>b.x&&box.y<b.y+b.h+5&&box.y+box.h+5>b.y))continue;
    boxes.push(box);result.add(node.id);
  }
  return result;
}

export type AtlasSlice={label:string;count:number;color:string};
export function atlasGenrePalette(names:string[],base:(name:string)=>string):Map<string,string>{
  const palette=new Map<string,string>(),used=new Set<string>();
  for(const name of [...new Set(names.map(name=>name.trim()||'Unclassified'))].sort()){
    let color=base(name);
    if(used.has(color)){
      let hash=2166136261;for(const c of name){hash=Math.imul(hash^c.charCodeAt(0),16777619);}
      let hue=(hash>>>0)%360;
      color=`hsl(${hue}, 38%, 61%)`;
      while(used.has(color)){hue=(hue+137.50776405003785)%360;color=`hsl(${hue}, 38%, 61%)`;}
    }
    used.add(color);palette.set(name,color);
  }
  return palette;
}
export function atlasBreakdown<T>(works:T[],label:(work:T)=>string,color:(label:string)=>string):AtlasSlice[]{
  const counts=new Map<string,number>();
  for(const work of works){const name=label(work).trim()||'Not recorded';counts.set(name,(counts.get(name)||0)+1);}
  return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([label,count])=>({label,count,color:color(label)}));
}
export function atlasSummary(items:AtlasSlice[],limit=7):AtlasSlice[]{
  if(items.length<=limit)return items;
  return [...items.slice(0,limit),{label:'Other categories',count:items.slice(limit).reduce((sum,item)=>sum+item.count,0),color:'#98A6B9'}];
}

export function atlasRingSegments(groups:AtlasSlice[][],steps=144){
  const perSector=Math.max(12,Math.floor(steps/3));
  return groups.flatMap((items,sector)=>{
    const total=items.reduce((sum,item)=>sum+Math.max(0,item.count),0);
    return Array.from({length:perSector},(_,index)=>{
      const fraction=(index+.5)/perSector;let cumulative=0;
      const item=items.find(item=>{cumulative+=Math.max(0,item.count)/(total||1);return fraction<=cumulative;});
      return {sector,angle:(-90+sector*120+(index+.5)*120/perSector)*Math.PI/180,color:item?.color,count:total,label:item?.label||'',step:120/perSector};
    });
  });
}
