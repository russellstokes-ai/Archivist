import React,{memo,useEffect,useRef} from 'react';
import {View} from 'react-native';
import LottieView from 'lottie-react-native';

const TEAL=require('./assets/motion/mini-audio-waveform-teal.json');
const IVORY=require('./assets/motion/mini-audio-waveform-ivory.json');

/**
 * Audio-state detail; never a progress indicator or independent playback driver.
 * The 20dp square is smaller than the existing mini-player controls.
 * Keep one native animation instance mounted while Play/Pause changes.
 */
export const MINI_WAVEFORM_SIZE=20;

export const MiniAudioWaveform=memo(function MiniAudioWaveform({
  playing,active,reducedMotion,tone,
}:{
  playing:boolean;
  active:boolean;
  reducedMotion:boolean;
  tone:'teal'|'ivory';
}){
  const animation=useRef<LottieView>(null);

  useEffect(()=>{
    if(reducedMotion){
      animation.current?.pause();
      animation.current?.reset();
      return;
    }
    if(playing&&active){
      animation.current?.play();
    }else{
      // Pause holds the last drawn frame, including when app is backgrounded.
      // Never leave a looping animation running during paused playback.
      animation.current?.pause();
    }
    return ()=>{animation.current?.pause();};
  },[playing,active,reducedMotion]);

  return <View pointerEvents="none" accessible={false}
    style={{height:MINI_WAVEFORM_SIZE,width:MINI_WAVEFORM_SIZE,flexShrink:0,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
    <LottieView ref={animation} source={tone==='ivory'?IVORY:TEAL}
      autoPlay={false} loop={true} resizeMode="contain"
      style={{width:MINI_WAVEFORM_SIZE,height:MINI_WAVEFORM_SIZE}}/>
  </View>;
});
