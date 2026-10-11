import React,{memo,useEffect,useRef} from 'react';
import {Animated,Easing,View} from 'react-native';
import LottieView from 'lottie-react-native';

// Exact source: live-forward-media-source.json.
// UI variant retains the original forward chevrons and frames, removing
// only the asset's redundant circular frame. Rewind mirrors the same asset.
const Forward=Animated.createAnimatedComponent(LottieView);
const Source=require('./assets/motion/live-forward-media-ink.json');

export const SKIP_ICON_MOTION_MS=490;
export type SkipDirection=-1|1;
type Props={direction:SkipDirection;trigger:number;size:number;reduceMotion:boolean};

/** Single, permanently mounted glyph inside the existing Pressable. */
export const LivePlayerSkipIcon=memo(function LivePlayerSkipIcon({direction,trigger,size,reduceMotion}:Props){
  const progress=useRef(new Animated.Value(0)).current;
  const latest=useRef(trigger);
  useEffect(()=>{
    if(latest.current===trigger)return;
    latest.current=trigger;
    progress.stopAnimation();
    if(reduceMotion){progress.setValue(0);return;}
    // The source is a brief forward-travel burst. Never loop or autoplay,
    // and return to the same static chevrons after the one-shot interaction.
    progress.setValue(0);
    const run=Animated.timing(progress,{toValue:0.97,duration:SKIP_ICON_MOTION_MS,easing:Easing.linear,useNativeDriver:false});
    run.start(({finished})=>{if(finished)progress.setValue(0)});
    return()=>run.stop();
  },[trigger,reduceMotion,progress]);

  return <View pointerEvents="none" accessible={false}
    style={{width:size,height:size,alignItems:'center',justifyContent:'center',transform:[{scaleX:direction} ]}}>
    <Forward source={Source} autoPlay={false} loop={false} progress={progress} resizeMode="contain"
      style={{width:size,height:size}}/>
  </View>;
});
