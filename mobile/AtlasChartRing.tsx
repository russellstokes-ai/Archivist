import React, {memo, useMemo} from 'react';
import {Animated, View} from 'react-native';
import {atlasRingSegments, AtlasSlice} from './atlasInteraction';

/** Fixed chart sectors. Only the inner constellation is transformed by gestures. */
export const AtlasChartRing=memo(function AtlasChartRing({size,groups,selected,pulse,track,reduceMotion}:{size:number;groups:AtlasSlice[][];selected:number;pulse:Animated.Value;track:string;reduceMotion:boolean}){
  const thickness=22,radius=(size-thickness)/2;
  const segments=useMemo(()=>atlasRingSegments(groups),[groups]);
  return <View pointerEvents="none" accessibilityElementsHidden style={{width:size,height:size}}>
    {segments.map((segment,index)=>{
      const active=segment.sector===selected;
      return <Animated.View key={index} style={{position:'absolute',
        left:size/2+Math.cos(segment.angle)*radius-thickness/2,
        top:size/2+Math.sin(segment.angle)*radius-(Math.PI*radius*segment.step/180)/2,
        width:thickness,height:Math.PI*radius*segment.step/180+1,
        backgroundColor:segment.color||track,
        opacity:active?(reduceMotion?.85:pulse.interpolate({inputRange:[0,.5,1],outputRange:[.64,.9,.64]})):.48,
        transform:[{rotate:segment.angle+'rad'}],
      }}/>;
    })}
  </View>;
});
