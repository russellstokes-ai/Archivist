import React from 'react';
import {View,Text} from 'react-native';

export const genreColours=['#719fdf','#dfaa69','#a084ce','#67b59d','#dd817b','#99a6b6','#76bdca'];
export function genreColour(name:string){let hash=0;for(const c of name.toLowerCase())hash=(hash*31+c.charCodeAt(0))>>>0;return genreColours[hash%genreColours.length];}
export type ChartItem={label:string;count:number;color:string};

// Small native segments keep the charts available offline on Android and iOS.
export function DataRing({size,items,label,value,ink,muted,track,thickness=12}:{size:number;items:ChartItem[];label?:string;value?:string;ink:string;muted:string;track:string;thickness?:number}){
 const total=items.reduce((n,item)=>n+item.count,0),steps=120,radius=(size-thickness)/2;
 return <View accessible accessibilityLabel={label?`${value||total} ${label}`:undefined} pointerEvents="none" style={{width:size,height:size,opacity:label?1:.45,alignItems:'center',justifyContent:'center'}}>
 {Array.from({length:steps},(_,i)=>{const fraction=(i+.5)/steps;let cumulative=0;const item=items.find(item=>{cumulative+=item.count/(total||1);return fraction<=cumulative});const angle=i/steps*Math.PI*2-Math.PI/2;return <View key={i} style={{position:'absolute',left:size/2+Math.cos(angle)*radius-thickness/2,top:size/2+Math.sin(angle)*radius- Math.PI*radius/steps,width:thickness,height:Math.PI*radius*2/steps+3,backgroundColor:item?.color||track,opacity:1,transform:[{rotate:angle+'rad'}]}}/>})}
 {value!==undefined?<Text style={{color:ink,fontSize:28,fontWeight:'600'}}>{value}</Text>:null}
 {label?<Text style={{color:muted,fontSize:12,textAlign:'center',maxWidth:size*.6}}>{label}</Text>:null}
 </View>;
}
