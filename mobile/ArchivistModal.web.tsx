import React,{useEffect} from 'react';
import {View} from 'react-native';
import {createPortal} from 'react-dom';

// Web overlays must escape the React Native application layout tree.
// A fixed View rendered under a transformed/scaled parent is *not* pinned to
// the visual viewport; Playwright demonstrated Save at y=1895 in an 839px phone.
type ArchivistModalProps=React.PropsWithChildren<{
  visible:boolean;
  onRequestClose?:()=>void;
  animationType?:'none'|'slide'|'fade';
  transparent?:boolean;
  hardwareAccelerated?:boolean;
}>;

const hostStyle={
  position:'fixed',
  top:0,
  left:0,
  width:'100vw',
  height:'100dvh',
  zIndex:10000,
  display:'flex',
  pointerEvents:'box-none',
} as any;

export function ArchivistModal({visible,onRequestClose,children}:ArchivistModalProps){
  useEffect(()=>{
    if(!visible||!onRequestClose)return;
    const target=globalThis as any;
    const onKeyDown=(event:any)=>{if(event?.key==='Escape')onRequestClose();};
    target.addEventListener?.('keydown',onKeyDown);
    return()=>target.removeEventListener?.('keydown',onKeyDown);
  },[visible,onRequestClose]);
  const body=(globalThis as any).document?.body;
  if(!visible||!body)return null;
  return createPortal(<View accessibilityViewIsModal style={hostStyle}>{children}</View>,body);
}
