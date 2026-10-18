import React,{useEffect,useRef} from 'react';
import {Animated,Easing,StyleSheet,View} from 'react-native';

/** A quiet specular sweep; earned medals only, paused off-screen/background. */
export function MedalShimmer({earned,reducedMotion,active}:{earned:boolean;reducedMotion:boolean;active:boolean}){
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  progress.setValue(0);
  if(!earned||reducedMotion||!active)return;
  const loop=Animated.loop(Animated.sequence([
   Animated.delay(9000),
   Animated.timing(progress,{toValue:1,duration:1500,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),
   Animated.timing(progress,{toValue:0,duration:0,useNativeDriver:true}),
  ]));
  loop.start();return()=>loop.stop();
 },[earned,reducedMotion,active,progress]);
 if(!earned)return null;
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.clip}>
  <View style={styles.rim}/>
  {!reducedMotion&&active?<Animated.View style={[styles.sweep,{transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[-40,100]})},{rotate:'22deg'}]}]}>
   <View style={styles.core}/>
  </Animated.View>:null}
 </View>;
}
const styles=StyleSheet.create({
 clip:{...StyleSheet.absoluteFillObject,borderRadius:38,overflow:'hidden'},
 rim:{...StyleSheet.absoluteFillObject,borderRadius:38,borderTopWidth:1,borderLeftWidth:1,borderColor:'rgba(255,249,221,.32)'},
 sweep:{position:'absolute',left:0,top:-14,width:24,height:104,backgroundColor:'rgba(255,249,225,.07)'},
 core:{position:'absolute',left:8,top:0,bottom:0,width:8,backgroundColor:'rgba(255,249,225,.10)'},
});
