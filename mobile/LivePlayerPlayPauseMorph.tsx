import React,{memo,useLayoutEffect,useRef} from 'react';
import {Animated,View} from 'react-native';
import type {ReactNode} from 'react';
import LottieView from 'lottie-react-native';

// Original (unchanged) 67-frame asset is in live-play-pause-lottiefiles.json.
// Frames 0–33 are Play → Pause; 33–67 are a different return path.
// Rewind the exact first morph for Pause → Play. End at 33, never reach 67.
export const PAUSE_HOLD_FRAME=33;
export const SOURCE_FRAME_COUNT=67;
export const PAUSE_HOLD_PROGRESS=PAUSE_HOLD_FRAME/SOURCE_FRAME_COUNT;
export const PLAY_PAUSE_MORPH_MS=260;
export const PLAY_PAUSE_ART_SIZE=66;
// Measured from both untouched 1500px Lottie vector outlines, frames 0 and 33.
// A single +10dp offset was visibly off-centre in BOTH states. The two endpoints
// have different bounding centres, so interpolate art registration in lockstep
// with the original morph; do not change the 80dp control or source art.
export const PLAY_PAUSE_VISIBLE_OFFSET_X_PLAY=1.95;
export const PLAY_PAUSE_VISIBLE_OFFSET_X_PAUSE=3.28;
export const PLAY_PAUSE_VISIBLE_OFFSET_Y=3.29;

const MotionView=Animated.createAnimatedComponent(LottieView);
const IVORY=require('./assets/motion/live-play-pause-ivory.json');
const NAVY=require('./assets/motion/live-play-pause-navy.json');

type Props={
  playing:boolean;
  active?:boolean;
  reducedMotion:boolean;
  inkTone:'ivory'|'navy';
  fallback:ReactNode;
};

/**
 * Existing transport button owns touch and accessibility.
 * This renders exactly ONE glyph: the original source-derived icon, not
 * a nested button, duplicated icon or surrounding decorative ring.
 */
export const LivePlayerPlayPauseMorph=memo(function LivePlayerPlayPauseMorph({
  playing,active=true,reducedMotion,inkTone,fallback,
}:Props){
  const progress=useRef(new Animated.Value(playing?PAUSE_HOLD_PROGRESS:0)).current;
  const previous=useRef(playing);

  useLayoutEffect(()=>{
    const target=playing?PAUSE_HOLD_PROGRESS:0;
    if(reducedMotion||!active){
      progress.stopAnimation();
      progress.setValue(target);
      previous.current=playing;
      return;
    }
    if(previous.current===playing)return;
    previous.current=playing;
    // Native view is never remounted: reverse the same interpolation when
    // tapped again, including if a prior transition is still underway.
    const transition=Animated.timing(progress,{
      toValue:target,
      duration:PLAY_PAUSE_MORPH_MS,
      easing:undefined,
      useNativeDriver:false,
    });
    transition.start();
    return()=>transition.stop();
  },[playing,active,reducedMotion,progress]);

  const artOffsetX=progress.interpolate({
    inputRange:[0,PAUSE_HOLD_PROGRESS],
    outputRange:[PLAY_PAUSE_VISIBLE_OFFSET_X_PLAY,PLAY_PAUSE_VISIBLE_OFFSET_X_PAUSE],
    extrapolate:'clamp',
  });

  if(reducedMotion)return <View pointerEvents="none" accessible={false}
      style={{width:PLAY_PAUSE_ART_SIZE,height:PLAY_PAUSE_ART_SIZE,alignItems:'center',justifyContent:'center'}}>
      {fallback}
    </View>;

  return <View pointerEvents="none" accessible={false}
      style={{width:PLAY_PAUSE_ART_SIZE,height:PLAY_PAUSE_ART_SIZE,alignItems:'center',justifyContent:'center'}}>
      <MotionView
        source={inkTone==='navy'?NAVY:IVORY}
        autoPlay={false}
        loop={false}
        progress={progress}
        resizeMode="contain"
        style={{width:PLAY_PAUSE_ART_SIZE,height:PLAY_PAUSE_ART_SIZE,transform:[{translateX:artOffsetX},{translateY:PLAY_PAUSE_VISIBLE_OFFSET_Y}]}}
      />
    </View>;
});
