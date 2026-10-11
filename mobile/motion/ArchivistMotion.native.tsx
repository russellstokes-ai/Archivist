import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import LottieView from 'lottie-react-native';
import type {ArchivistMotionProps} from './ArchivistMotion';
/** Entirely external to the canonical Living Book and scanner engine. */
const sources={
  'book-loader':require('../assets/motion/book-loader.json'),
  'books-stack':require('../assets/motion/books-stack.json'),
  headphones:require('../assets/motion/headphones.json'),
  'pause-play':require('../assets/motion/pause-play.json'),
  'audio-waveform':require('../assets/motion/audio-waveform.json'),
  trophy:require('../assets/motion/trophy.json'),
  'twinkle-crown':require('../assets/motion/twinkle-crown.json'),
  badge:require('../assets/motion/badge.json'),
  'level-up-confetti':require('../assets/motion/level-up-confetti.json'),
  'firework-burst':require('../assets/motion/firework-burst.json'),
} as const;
export function ArchivistMotion({kind,size=40,width=size,height=size,active=true,reduceMotion=false,playing=false,loop,fallback}:ArchivistMotionProps){
  const animation=useRef<LottieView>(null);
  const previousPlaying=useRef<boolean|null>(null);
  const transport=kind==='pause-play';
  useEffect(()=>{
    if(!transport||!active||reduceMotion){previousPlaying.current=null;return;}
    const next=!!playing;
    if(previousPlaying.current===null){if(next)animation.current?.play(0,90);else animation.current?.reset();}
    else if(previousPlaying.current!==next)animation.current?.play(next?0:90,next?90:179);
    previousPlaying.current=next;
  },[transport,active,reduceMotion,playing,kind]);
  useEffect(()=>()=>{animation.current?.pause();},[]);
  if(reduceMotion||!active)return <View pointerEvents="none" style={{width,height,alignItems:'center',justifyContent:'center'}}>{fallback||null}</View>;
  return <View pointerEvents="none" accessible={false} style={{width,height}}>
    <LottieView ref={animation} source={sources[kind]} style={{width,height}}
      resizeMode="contain" autoPlay={!transport}
      loop={transport?false:(loop??['book-loader','books-stack','headphones','audio-waveform'].includes(kind))}/>
  </View>;
}
