import React,{useEffect} from 'react';
import {Modal,Platform,View} from 'react-native';

type ArchivistModalProps=React.PropsWithChildren<{
  visible:boolean;
  onRequestClose?:()=>void;
  animationType?:'none'|'slide'|'fade';
  transparent?:boolean;
  hardwareAccelerated?:boolean;
}>;

const webModalHostStyle={
  position:'fixed',
  top:0,
  right:0,
  bottom:0,
  left:0,
  zIndex:10000,
  display:'flex',
} as any;

export function ArchivistModal({
  visible,
  onRequestClose,
  animationType='none',
  transparent=true,
  hardwareAccelerated=false,
  children,
}:ArchivistModalProps){
  useEffect(()=>{
    if(Platform.OS!=='web'||!visible||!onRequestClose)return;
    const target=globalThis as any;
    const onKeyDown=(event:any)=>{if(event?.key==='Escape')onRequestClose();};
    target.addEventListener?.('keydown',onKeyDown);
    return()=>target.removeEventListener?.('keydown',onKeyDown);
  },[visible,onRequestClose]);

  if(!visible)return null;
  if(Platform.OS==='web'){
    return <View accessibilityViewIsModal style={webModalHostStyle}>{children}</View>;
  }
  return <Modal
    visible
    transparent={transparent}
    animationType={animationType}
    hardwareAccelerated={hardwareAccelerated}
    onRequestClose={onRequestClose}>
    {children}
  </Modal>;
}
