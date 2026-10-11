import React from 'react';
import {View,Image} from 'react-native';
export type ArchivistMotionName='book-loader'|'books-stack'|'headphones'|'pause-play'|'waveform'|'achievement-badge'|'crown'|'trophy'|'level-up-confetti'|'firework-burst';
export function MotionGlyph({size=32}:{
 name:ArchivistMotionName;size?:number;active?:boolean;reduceMotion?:boolean;loop?:boolean;
}){return <View pointerEvents="none" style={{height:size,width:size,alignItems:'center',justifyContent:'center'}}><Image source={require('./assets/icon.png')} style={{height:size*.78,width:size*.78,borderRadius:4}} resizeMode="contain"/></View>;}
export function MotionTransportIcon({playing,size=28,color='#FFFFFF'}:{playing:boolean;reduceMotion?:boolean;size?:number;color?:string}){
 return <View pointerEvents="none" style={{width:size,height:size,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:size*.13}}>
   {playing?<><View style={{width:size*.17,height:size*.66,borderRadius:2,backgroundColor:color}}/><View style={{width:size*.17,height:size*.66,borderRadius:2,backgroundColor:color}}/></>:
     <View style={{width:0,height:0,borderTopWidth:size*.32,borderBottomWidth:size*.32,borderLeftWidth:size*.55,borderTopColor:'transparent',borderBottomColor:'transparent',borderLeftColor:color,marginLeft:size*.13}}/>}
 </View>;
}
