import React from 'react';
import {View,useWindowDimensions} from 'react-native';

export function compactHeaderIsWide(width:number,largeText:boolean,fontScale=1){
  return width>=600&&!largeText&&fontScale<=1.2;
}
/** Shelf/Atlas only: keep heading and action in one page section. */
export function CompactPageHeader({header,children,width,largeText,testID}:{header:React.ReactNode;children:React.ReactNode;width:number;largeText:boolean;testID:string}){
  const {fontScale}=useWindowDimensions();
  const wide=compactHeaderIsWide(width,largeText,fontScale);
  return <View testID={testID} style={{flexDirection:wide?'row':'column',alignItems:wide?'flex-end':'stretch',gap:wide?12:4}}>
    <View style={{flex:wide?1:undefined,minWidth:0}}>{header}</View>
    <View style={{alignSelf:'flex-end',minHeight:44,justifyContent:'center',paddingRight:wide?64:0}}>{children}</View>
  </View>;
}
