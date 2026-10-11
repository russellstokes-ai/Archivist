import React,{useEffect,useRef} from 'react';
import {Animated,Text,View} from 'react-native';
import LottieView from 'lottie-react-native';

const AnimatedLottieView=Animated.createAnimatedComponent(LottieView);
export type MotionLoaderVariant='books'|'audio';
export type MotionRewardKind='books'|'badge'|'trophy'|'crown'|'confetti'|'firework';

export function scanMotionVariant(books:ReadonlyArray<{format?:string}>):MotionLoaderVariant{
  const formats=books.map(book=>String(book.format||'').trim().toLowerCase()).filter(Boolean);
  // Until the scanner has classified media, do not claim an audiobook-specific phase.
  return formats.length>0&&formats.every(format=>format==='audio'||format==='audiobook')?'audio':'books';
}

export function achievementMotionKind(id:string,category?:string):MotionRewardKind{
  const value=String(id||'').toLowerCase();
  if(/(^deep-archive$|-(1000|2000|3000|5000|7500|10000|365|500|730)$)/.test(value))return'firework';
  if(/^(streak|daily-spark|days)-/.test(value))return'crown';
  if(/^(first-finish|ten-finished|finished-)/.test(value))return'confetti';
  if(category==='Listening'||/^(listener|audio-start)-/.test(value))return'trophy';
  return'badge';
}
const loaderAssets={
  books:require('./assets/motion/books-stack.json'),
  audio:require('./assets/motion/headphones.json'),
};
const rewardAssets={
  books:require('./assets/motion/books-stack.json'),
  badge:require('./assets/motion/achievement-badge.json'),
  trophy:require('./assets/motion/trophy.json'),
  crown:require('./assets/motion/twinkle-crown.json'),
  confetti:require('./assets/motion/level-confetti.json'),
  firework:require('./assets/motion/firework-burst.json'),
};

function StaticMotionGlyph({label,size,color='#B99A68'}:{label:string;size:number;color?:string}){
  return <View pointerEvents="none" accessible={false} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <Text style={{fontSize:Math.max(16,size*.42),color,fontWeight:'700'}}>{label}</Text>
  </View>;
}

/** Visual only: scan event/cancellation/progress remains owned by canonical scanner. */
export function MotionLoader({variant,reduceMotion,running=true,size=42}:{variant:MotionLoaderVariant;reduceMotion:boolean;running?:boolean;size?:number}){
  if(reduceMotion)return <StaticMotionGlyph label={variant==='audio'?'◉':'▤'} size={size}/>;
  return <View accessible={false} pointerEvents="none" style={{width:size,height:size}}>
    <LottieView source={loaderAssets[variant]} autoPlay loop speed={running?1:0} style={{width:size,height:size}}/>
  </View>;
}

/** Controlled play/pause progress, exactly within the pre-existing pressable/button geometry. */
export function MotionTransport({playing,reduceMotion,inkTone='ivory',size=29}:{playing:boolean;reduceMotion:boolean;inkTone?:'ivory'|'navy';size?:number}){
  const progress=useRef(new Animated.Value(playing?.52:0)).current;
  useEffect(()=>{
    progress.stopAnimation();
    if(reduceMotion){progress.setValue(playing?.52:0);return;}
    Animated.timing(progress,{toValue:playing?.52:0,duration:180,useNativeDriver:false}).start();
    return()=>progress.stopAnimation();
  },[playing,reduceMotion,progress]);
  return <View accessible={false} pointerEvents="none" style={{width:size,height:size}}>
    <AnimatedLottieView source={inkTone==='navy'?require('./assets/motion/play-pause-navy.json'):require('./assets/motion/play-pause-ivory.json')}
      progress={progress} loop={false} style={{width:size,height:size}}/>
  </View>;
}

/** Waveform movement is tied to real playback/ready/app state, not media metadata or a fake volume reading. */
export function MotionWaveform({playing,reduceMotion,running=true,size=32}:{playing:boolean;reduceMotion:boolean;running?:boolean;size?:number}){
  const active=playing&&!reduceMotion&&running;
  if(reduceMotion)return <StaticMotionGlyph label="▥" size={size} color="#47736F"/>;
  return <View accessible={false} pointerEvents="none" style={{width:size,height:size}}>
    <LottieView source={require('./assets/motion/audio-waveform.json')} autoPlay={active} loop={active}
      speed={active?1:0} progress={active?undefined:0} style={{width:size,height:size}}/>
  </View>;
}

export function MotionReward({kind,reduceMotion,size=96}:{kind:MotionRewardKind;reduceMotion:boolean;size?:number}){
  if(reduceMotion)return <StaticMotionGlyph label="✦" size={size}/>;
  return <View accessible={false} pointerEvents="none" style={{width:size,height:size}}>
    <LottieView source={rewardAssets[kind]} autoPlay loop={false} style={{width:size,height:size}}/>
  </View>;
}
