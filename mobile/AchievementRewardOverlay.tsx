import React,{memo,useEffect,useRef,useState} from 'react';
import {Animated,Easing,StyleSheet,Text,View} from 'react-native';
import LottieView from 'lottie-react-native';
import {type RewardPresentation,REWARD_FADE_MS,rewardPresentationMs} from './rewardMotion';

const SOURCES={
  'books-stack':require('./assets/motion/rewards/books-stack-original.json'),
  headphones:require('./assets/motion/rewards/headphones-original.json'),
  trophy:require('./assets/motion/rewards/trophy-original.json'),
  crown:require('./assets/motion/rewards/crown-original.json'),
  badge:require('./assets/motion/rewards/badge-gold-variant.json'),
  'level-confetti':require('./assets/motion/rewards/level-confetti-original.json'),
} as const;
const CONFETTI=require('./assets/motion/rewards/level-confetti-original.json');
const FIREWORK=require('./assets/motion/rewards/firework-original.json');

/* Per-source optical compensation, not a change to native Lottie playback. */
export const REWARD_OPTICAL_SCALE={
  'books-stack':1.08,
  headphones:1.13,
  trophy:1.08,
  crown:1.06,
  badge:1.08,
  'level-confetti':1.06,
  firework:1.08,
} as const;

type Props={
  event:RewardPresentation|null;
  eventKey:string|null;
  folded:boolean;
  reducedMotion:boolean;
  paper:string;
  ink:string;
  muted:string;
};

export const AchievementRewardOverlay=memo(function AchievementRewardOverlay(props:Props){
  const {eventKey}=props;
  return <RewardInstance key={eventKey||'none'} {...props}/>;
});

function RewardInstance({
  event,eventKey,folded,reducedMotion,paper,ink,muted,
}:Props){
  const opacity=useRef(new Animated.Value(0)).current;
  const [mainFinished,setMainFinished]=useState(false);
  const [confettiVisible,setConfettiVisible]=useState(true);
  const [fireworkVisible,setFireworkVisible]=useState(true);

  useEffect(()=>{
    if(!event||!eventKey){
      opacity.stopAnimation();opacity.setValue(0);
      setMainFinished(false);
      return;
    }
    setMainFinished(false);setConfettiVisible(true);setFireworkVisible(true);
    opacity.stopAnimation();
    opacity.setValue(reducedMotion?1:0);
    if(!reducedMotion){
      Animated.timing(opacity,{toValue:1,duration:160,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
    }
    const ms=rewardPresentationMs(event.kind);
    const timer=setTimeout(()=>{
      if(reducedMotion){opacity.setValue(0);return;}
      Animated.timing(opacity,{toValue:0,duration:REWARD_FADE_MS,easing:Easing.inOut(Easing.quad),useNativeDriver:true}).start();
    },ms-REWARD_FADE_MS);
    return()=>{clearTimeout(timer);opacity.stopAnimation();};
  },[eventKey,event?.kind,reducedMotion,opacity]);

  if(!event||!eventKey)return null;
  const size=event.major?(folded?144:136):(folded?112:96);
  const scale=REWARD_OPTICAL_SCALE[event.kind];

  return <View pointerEvents="none" accessibilityLiveRegion="polite"
    style={[StyleSheet.absoluteFill,{zIndex:51,alignItems:'center',justifyContent:'center'}]}>
    <Animated.View style={{
      opacity,backgroundColor:paper,borderColor:'#B99A68',borderWidth:1,
      borderRadius:20,width:'86%',maxWidth:400,paddingHorizontal:24,paddingTop:18,paddingBottom:24,
      alignItems:'center',shadowColor:'#000',shadowOpacity:.18,shadowRadius:14,elevation:8,
    }}>
      <Text style={{color:'#B99A68',fontSize:10.5,letterSpacing:1.7,fontWeight:'700',marginBottom:5}}>
        {event.levelConfetti?'LEVEL UP':event.major?'MILESTONE UNLOCKED':'ACHIEVEMENT UNLOCKED'}
      </Text>
      <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
        <LottieView
          source={SOURCES[event.kind]}
          autoPlay={!reducedMotion}
          loop={false}
          speed={1}
          progress={reducedMotion?0.96:mainFinished?0.999:undefined}
          onAnimationFinish={(cancelled)=>{if(!cancelled)setMainFinished(true)}}
          resizeMode="contain"
          style={{width:size,height:size,transform:[{scale}]}}
        />
        {event.levelConfetti&&confettiVisible&&!reducedMotion?
          <LottieView source={CONFETTI} autoPlay loop={false} speed={1}
            onAnimationFinish={()=>setConfettiVisible(false)}
            style={{position:'absolute',width:size*1.46,height:size*1.46,transform:[{scale:REWARD_OPTICAL_SCALE['level-confetti']}]}}/>
          :null}
        {event.firework&&fireworkVisible&&!reducedMotion?
          <LottieView source={FIREWORK} autoPlay loop={false} speed={1}
            onAnimationFinish={()=>setFireworkVisible(false)}
            style={{position:'absolute',width:size*1.6,height:size*1.6,transform:[{scale:REWARD_OPTICAL_SCALE.firework}]}}/>
          :null}
      </View>
      <Text style={{fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:30,textAlign:'center',color:ink,marginTop:4}}>
        {event.title}
      </Text>
      <Text style={{fontSize:12.5,lineHeight:18,textAlign:'center',color:muted,marginTop:5}}>
        {event.description}
      </Text>
    </Animated.View>
  </View>;
}
