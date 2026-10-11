import React from 'react';
import {Text,View} from 'react-native';
import LottieView from 'lottie-react-native';

export type BookLoaderSize='inline'|'compact'|'standard'|'reader'|'startup';

// 300px source canvas contains generous transparent margins. Keep the supplied
// artwork and timings exactly intact, but magnify its on-screen pixels 1.35x.
// The container dimensions remain explicit: no surprise player/control reflow.
const SIZE:Record<BookLoaderSize,number>={
  inline:52,
  compact:64,
  standard:76,
  reader:144,
  startup:96,
};
export const BOOK_LOADER_ARTWORK_SCALE=1.35;

/** Visual loading status only: never owns cancellation, scan state or progress. */
export function ArchivistBookLoader({
  label,
  size='standard',
  reduceMotion=false,
}:{
  label:string;
  size?:BookLoaderSize;
  reduceMotion?:boolean;
}){
  const containerSize=SIZE[size];
  const artworkSize=Math.round(containerSize*BOOK_LOADER_ARTWORK_SCALE);
  return <View accessibilityRole="progressbar" accessibilityLabel={label}
    accessibilityState={{busy:true}} pointerEvents="none"
    style={{width:containerSize,height:containerSize,alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
    {reduceMotion
      ? <Text accessible={false} style={{fontSize:Math.round(containerSize*.52),color:'#C6A374',lineHeight:containerSize,textAlign:'center'}}>▤</Text>
      : <LottieView source={require('./assets/motion/book-loader.json')} autoPlay loop
          style={{width:artworkSize,height:artworkSize,flexShrink:0}}/>}
  </View>;
}
