import React from 'react';
import {ActivityIndicator,View} from 'react-native';
export type ArchivistMotionKind='book-loader'|'books-stack'|'headphones'|'pause-play'|'audio-waveform'|'trophy'|'twinkle-crown'|'badge'|'level-up-confetti'|'firework-burst';
export type ArchivistMotionProps={kind:ArchivistMotionKind;size?:number;width?:number;height?:number;active?:boolean;reduceMotion?:boolean;playing?:boolean;loop?:boolean;fallback?:React.ReactNode;};
export function ArchivistMotion({size=40,width=size,height=size,active=true,reduceMotion=false,fallback}:ArchivistMotionProps){
  return <View pointerEvents="none" style={{width,height,alignItems:'center',justifyContent:'center'}}>
    {(reduceMotion||!active)?fallback:(fallback||<ActivityIndicator color="#47736F"/>)}
  </View>;
}
