import React,{memo,useMemo} from 'react';
import {Animated,View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {atlasRingSegments,AtlasSlice} from './atlasInteraction';
/** One continuous arc per published category; empty categories have no arc. */
export const AtlasChartRing=memo(function AtlasChartRing({size,groups,selected,pulse,reduceMotion}:{size:number;groups:AtlasSlice[][];selected:number;pulse:Animated.Value;track:string;reduceMotion:boolean}){
 const thickness=22,radius=(size-thickness)/2,centre=size/2;
 const segments=useMemo(()=>atlasRingSegments(groups),[groups]);
 const path=(start:number,step:number)=>{
  const a=start*Math.PI/180,b=(start+step)*Math.PI/180;
  return 'M '+(centre+radius*Math.cos(a))+' '+(centre+radius*Math.sin(a))+' A '+radius+' '+radius+' 0 0 1 '+(centre+radius*Math.cos(b))+' '+(centre+radius*Math.sin(b));
 };
 return <View pointerEvents="none" accessibilityElementsHidden style={{width:size,height:size}}>
  {groups.map((_,sector)=><Animated.View key={sector} style={{position:'absolute',width:size,height:size,opacity:sector===selected?(reduceMotion?.85:pulse.interpolate({inputRange:[0,.5,1],outputRange:[.64,.9,.64]})):.48}}>
   <Svg width={size} height={size}>{segments.filter(s=>s.sector===sector).map(s=><Path key={s.label} d={path(s.start,s.step)} stroke={s.color} strokeWidth={thickness} fill="none" strokeLinecap="butt"/>)}</Svg>
  </Animated.View>)}
 </View>;
});
