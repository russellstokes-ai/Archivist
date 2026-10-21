import React,{useEffect,useState} from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {ProfilePhotoDraft} from './profilePhotoCommit';

type Props={draft:ProfilePhotoDraft;saving:boolean;error:string;reduceMotion:boolean;onUse:()=>void;onCancel:()=>void;palette:{background:string;ink:string;muted:string;accent:string;line:string;danger:string}};
export function ProfilePhotoPreview({draft,saving,error,reduceMotion,onUse,onCancel,palette:p}:Props){
  const {width,height,fontScale}=useWindowDimensions();
  const [ready,setReady]=useState(false),[decodeError,setDecodeError]=useState('');
  useEffect(()=>{setReady(false);setDecodeError('');},[draft.uri]);
  const size=Math.max(120,Math.min(320,width-48,height-260));
  const cancel=()=>{if(!saving)onCancel();};
  const use=()=>{if(ready&&!saving&&!decodeError)onUse();};
  return <Modal visible animationType={reduceMotion?'none':'slide'} presentationStyle="fullScreen" onRequestClose={cancel}>
    <SafeAreaView edges={['top','right','bottom','left']} style={{flex:1,backgroundColor:p.background}}>
      <ScrollView style={{flex:1}} contentContainerStyle={{flexGrow:1,padding:24,gap:20}}>
        <View>
          <Text accessibilityRole="header" style={{fontSize:24,fontWeight:'700',color:p.ink}}>Profile photo</Text>
          <Text style={{fontSize:15,lineHeight:22,color:p.muted,marginTop:8}}>This is how your photo will appear. It changes only when you choose Use photo.</Text>
        </View>
        <View style={{flexGrow:1,alignItems:'center',justifyContent:'center',gap:16}}>
          <View style={{width:size,height:size,borderRadius:size/2,overflow:'hidden',borderWidth:2,borderColor:p.accent}}>
            <Image accessibilityLabel="Selected profile photo preview" source={{uri:draft.uri}} resizeMode="cover" style={{width:size,height:size}} onLoad={()=>{setReady(true);setDecodeError('');}} onError={()=>{setReady(false);setDecodeError('This image could not be opened. Cancel and choose another photo.');}}/>
          </View>
          {!ready&&!decodeError?<Text accessibilityLiveRegion="polite" style={{color:p.muted}}>Loading preview…</Text>:null}
          {error||decodeError?<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{color:p.danger,fontSize:15,lineHeight:22,textAlign:'center'}}>{error||decodeError}</Text>:null}
        </View>
      </ScrollView>
      <View style={{flexDirection:fontScale>1.5?'column':'row',gap:12,paddingHorizontal:24,paddingTop:12,paddingBottom:16,borderTopWidth:1,borderTopColor:p.line}}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel photo change" accessibilityState={{disabled:saving}} disabled={saving} onPress={cancel} style={({pressed})=>({flex:fontScale>1.5?undefined:1,minHeight:48,paddingHorizontal:12,paddingVertical:14,borderRadius:12,borderWidth:1,borderColor:p.line,alignItems:'center',justifyContent:'center',opacity:saving?0.5:pressed?0.75:1})}>
          <Text style={{color:p.ink,fontSize:16,fontWeight:'600'}}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={saving?'Saving profile photo':'Use photo'} accessibilityState={{disabled:saving||!ready,busy:saving}} disabled={saving||!ready} onPress={use} style={({pressed})=>({flex:fontScale>1.5?undefined:1,minHeight:48,paddingHorizontal:12,paddingVertical:14,borderRadius:12,backgroundColor:p.accent,alignItems:'center',justifyContent:'center',opacity:saving||!ready?0.5:pressed?0.75:1})}>
          <Text style={{color:p.background,fontSize:16,fontWeight:'700'}}>{saving?'Saving…':'Use photo'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  </Modal>;
}
