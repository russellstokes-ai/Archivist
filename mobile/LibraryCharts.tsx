import React from 'react';
import {View,Text} from 'react-native';

export const genreColours=[
  '#5F8FE3', // archivist blue
  '#E3A15B', // amber
  '#8C68D8', // violet
  '#69B99B', // mint
  '#E2736B', // coral
  '#98A6B9', // steel
  '#62AFC1', // cyan
  '#C9829D', // rose
  '#B68B62', // bronze
  '#778BC2', // periwinkle
  '#7BA8A1', // sea glass
  '#B97978', // muted red
  '#A78BC7', // lavender
  '#6D9FC0', // slate blue
  '#C79B67', // ochre
  '#82A979', // sage green
];

const canonicalGenreColours:Record<string,string>={
  fantasy:'#5F8FE3',
  adventure:'#E3A15B',
  classics:'#8C68D8',
  classic:'#8C68D8',
  'sci-fi':'#69B99B',
  'science fiction':'#69B99B',
  thriller:'#E2736B',
  mystery:'#C9829D',
  crime:'#B97978',
  romance:'#C9829D',
  'non-fiction':'#98A6B9',
  nonfiction:'#98A6B9',
  history:'#B68B62',
  historical:'#B68B62',
  biography:'#7BA8A1',
  memoir:'#7BA8A1',
  science:'#62AFC1',
  technology:'#6D9FC0',
  horror:'#B97978',
  poetry:'#A78BC7',
  'young adult':'#778BC2',
  comics:'#C79B67',
  comic:'#C79B67',
  'graphic novel':'#C79B67',
  literary:'#778BC2',
  'literary fiction':'#778BC2',
  philosophy:'#82A979',
};

export function genreColour(name:string){
  const normalized=name.trim().toLowerCase();
  if(canonicalGenreColours[normalized])return canonicalGenreColours[normalized];
  let hash=0;
  for(const c of normalized)hash=(hash*31+c.charCodeAt(0))>>>0;
  return genreColours[hash%genreColours.length];
}
export type ChartItem={label:string;count:number;color:string};

// Small native segments keep the charts available offline on Android and iOS.
export function DataRing({size,items,label,value,ink,muted,track,thickness=12,opacity}:{size:number;items:ChartItem[];label?:string;value?:string;ink:string;muted:string;track:string;thickness?:number;opacity?:number}){
 const total=items.reduce((n,item)=>n+item.count,0),steps=120,radius=(size-thickness)/2;
 return <View accessible accessibilityLabel={label?`${value||total} ${label}`:undefined} pointerEvents="none" style={{width:size,height:size,opacity:opacity??(label?1:.45),alignItems:'center',justifyContent:'center'}}>
 {Array.from({length:steps},(_,i)=>{const fraction=(i+.5)/steps;let cumulative=0;const item=items.find(item=>{cumulative+=item.count/(total||1);return fraction<=cumulative});const angle=i/steps*Math.PI*2-Math.PI/2;return <View key={i} style={{position:'absolute',left:size/2+Math.cos(angle)*radius-thickness/2,top:size/2+Math.sin(angle)*radius- Math.PI*radius/steps,width:thickness,height:Math.PI*radius*2/steps+3,backgroundColor:item?.color||track,opacity:1,transform:[{rotate:angle+'rad'}]}}/>})}
 {value!==undefined?<Text style={{color:ink,fontSize:28,fontWeight:'600'}}>{value}</Text>:null}
 {label?<Text style={{color:muted,fontSize:12,textAlign:'center',maxWidth:size*.6}}>{label}</Text>:null}
 </View>;
}
