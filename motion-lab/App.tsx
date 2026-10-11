import React,{useEffect,useState} from 'react';
import {AccessibilityInfo,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View,useColorScheme,useWindowDimensions} from 'react-native';
import LottieView from 'lottie-react-native';
type Asset={name:string;source:React.ComponentProps<typeof LottieView>['source'];loop:boolean;group:string};
const ASSETS:Asset[]=[
  {name:'Books Stack',source:require('../mobile/assets/motion/books-stack.json'),loop:true,group:'Scanning'},
  {name:'Headphones',source:require('../mobile/assets/motion/headphones.json'),loop:true,group:'Scanning'},
  {name:'Play / Pause',source:require('../mobile/assets/motion/play-pause.json'),loop:false,group:'Player'},
  {name:'Audio Waveform',source:require('../mobile/assets/motion/audio-waveform.json'),loop:true,group:'Player'},
  {name:'Trophy',source:require('../mobile/assets/motion/trophy.json'),loop:false,group:'Rewards'},
  {name:'Twinkle Crown',source:require('../mobile/assets/motion/twinkle-crown.json'),loop:false,group:'Rewards'},
  {name:'Achievement Badge',source:require('../mobile/assets/motion/achievement-badge.json'),loop:false,group:'Rewards'},
  {name:'Level-up Confetti',source:require('../mobile/assets/motion/level-confetti.json'),loop:false,group:'Rewards'},
  {name:'Firework Burst',source:require('../mobile/assets/motion/firework-burst.json'),loop:false,group:'Rewards'},
];
export default function App(){
  const [index,setIndex]=useState(0),[replay,setReplay]=useState(0),[manualReduced,setManualReduced]=useState(false);
  const [systemReduced,setSystemReduced]=useState(false),[playing,setPlaying]=useState(true),[light,setLight]=useState(useColorScheme()==='light');
  const {width}=useWindowDimensions(),asset=ASSETS[index],reduceMotion=manualReduced||systemReduced;
  useEffect(()=>{void AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced).catch(()=>undefined);const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduced);return()=>sub.remove();},[]);
  const start=()=>setReplay(v=>v+1);
  return <SafeAreaView style={[s.root,{backgroundColor:light?'#FBFAF7':'#07151C'}]}><ScrollView contentContainerStyle={s.body}>
    <Text style={[s.heading,{color:light?'#102B35':'#F1EAD5'}]}>Archivist Motion Lab</Text>
    <Text style={s.sub}>Isolated previews · no production integration</Text>
    <View style={[s.preview,{backgroundColor:light?'#E8EBE5':'#102B35',minHeight:width>600?320:260}]}>
      {reduceMotion?<Text accessibilityLabel={'Static '+asset.name} style={{color:light?'#102B35':'#F1EAD5',fontSize:18}}>{asset.name}</Text>:
      <LottieView key={index+'-'+replay} source={asset.source} autoPlay loop={asset.loop&&playing} style={{width:width>600?224:192,height:width>600?224:192}}/>}
    </View>
    <Text style={[s.asset,{color:light?'#102B35':'#F1EAD5'}]}>{asset.group} / {asset.name}</Text>
    <View style={s.actions}>
      <Pressable onPress={start} style={s.button} accessibilityRole="button"><Text style={s.buttonText}>Replay</Text></Pressable>
      <Pressable onPress={()=>{setPlaying(v=>!v);start()}} style={s.button} accessibilityRole="button"><Text style={s.buttonText}>{playing?'Pause loop':'Play loop'}</Text></Pressable>
      <Pressable onPress={()=>setLight(v=>!v)} style={s.button} accessibilityRole="button"><Text style={s.buttonText}>{light?'Dark':'Light'} mode</Text></Pressable>
      <Pressable onPress={()=>setManualReduced(v=>!v)} style={s.button} accessibilityRole="button"><Text style={s.buttonText}>{reduceMotion?'Motion on':'Reduced motion'}</Text></Pressable>
    </View>
    {ASSETS.map((a,i)=><Pressable key={a.name} accessibilityRole="button" accessibilityState={{selected:i===index}} onPress={()=>{setIndex(i);setReplay(v=>v+1)}} style={[s.row,i===index&&{borderColor:'#B99A68'}]}><Text style={{color:light?'#102B35':'#F1EAD5'}}>{a.group} · {a.name}</Text></Pressable>)}
    <Text style={s.sub}>Native Android/iOS compatibility, typography, frame pacing and Fold visuals require actual device acceptance.</Text>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1},body:{padding:24,gap:12},heading:{fontSize:24,fontWeight:'700'},sub:{fontSize:12,color:'#83B69D'},preview:{borderRadius:18,alignItems:'center',justifyContent:'center',overflow:'hidden'},asset:{fontSize:17,fontWeight:'700'},actions:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{backgroundColor:'#47736F',paddingVertical:10,paddingHorizontal:12,borderRadius:12},buttonText:{color:'#F1EAD5',fontWeight:'600'},row:{padding:12,borderWidth:1,borderColor:'#36546C',borderRadius:10}});
