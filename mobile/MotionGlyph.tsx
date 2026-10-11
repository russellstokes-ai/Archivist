import React,{useEffect,useMemo,useRef} from 'react';
import {Animated,View} from 'react-native';
import LottieView from 'lottie-react-native';

export type ArchivistMotionName='book-loader'|'books-stack'|'headphones'|'pause-play'|'waveform'|'achievement-badge'|'crown'|'trophy'|'level-up-confetti'|'firework-burst';
const motionSources={
  'book-loader':require('./assets/motion/book-loader.json'),
  'books-stack':require('./assets/motion/books-stack.json'),
  'headphones':require('./assets/motion/headphones.json'),
  'pause-play':require('./assets/motion/pause-play.json'),
  'waveform':require('./assets/motion/waveform.json'),
  'achievement-badge':require('./assets/motion/achievement-badge.json'),
  'crown':require('./assets/motion/crown.json'),
  'trophy':require('./assets/motion/trophy.json'),
  'level-up-confetti':require('./assets/motion/level-up-confetti.json'),
  'firework-burst':require('./assets/motion/firework-burst.json'),
} as const;
export function MotionGlyph({name,size=32,active=true,reduceMotion=false,loop=true}:{
  name:ArchivistMotionName;size?:number;active?:boolean;reduceMotion?:boolean;loop?:boolean;
}){
 const ref=useRef<LottieView>(null);
 useEffect(()=>{
   if(reduceMotion){ref.current?.reset();ref.current?.pause();return;}
   if(active){ref.current?.play();}else{ref.current?.pause();}
 },[active,reduceMotion,name]);
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:size,height:size}}>
   <LottieView key={name} ref={ref} source={motionSources[name]} style={{width:size,height:size}} autoPlay={active&&!reduceMotion} loop={loop&&!reduceMotion}/>
 </View>;
}
const AnimatedLottie=Animated.createAnimatedComponent(LottieView);
export function MotionTransportIcon({playing,reduceMotion=false,size=28,color='#FFFFFF'}:{
 playing:boolean;reduceMotion?:boolean;size?:number;color?:string;
}){
 const progress=useRef(new Animated.Value(playing?0.36:0)).current;
 useEffect(()=>{
   progress.stopAnimation();
   if(reduceMotion){progress.setValue(playing?0.36:0);return;}
   const animation=Animated.timing(progress,{toValue:playing?0.36:0,duration:170,useNativeDriver:false});
   animation.start();
   return()=>animation.stop();
 },[playing,reduceMotion,progress]);
 const colorFilters=useMemo(()=>[
   {keypath:'Play',color},{keypath:'Pause left',color},{keypath:'Pause right',color}
 ],[color]);
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:size,height:size}}>
   <AnimatedLottie source={motionSources['pause-play']} style={{width:size,height:size}}
     colorFilters={colorFilters} autoPlay={false} loop={false} progress={progress}/>
 </View>;
}
