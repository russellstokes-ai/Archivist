import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,AppState,Image,Platform,StyleSheet,View} from 'react-native';
import {useVideoPlayer,VideoView} from 'expo-video';

const TEAL='#2F8B86';
const VIDEO=require('./assets/splash/archivist-premium-shine.mp4');
export const PREMIUM_SPLASH_SECONDS=179/24; // 144 3D frames + 35 exact-source shine frames
export const PREMIUM_SPLASH_DEADLINE_MS=13000;

// A React route may mount repeatedly during the *same* Android process.
// Claim custom splash only once, not on app/tab navigation or warm foreground.
let processColdLaunchClaimed=false;
export function claimPremiumColdLaunch(platform:string){
  if(platform==='web'||processColdLaunchClaimed)return false;
  processColdLaunchClaimed=true;
  return true;
}
export function premiumSplashShouldPlay(platform:string,alreadyClaimed:boolean,reduced:boolean){
  return platform!=='web'&&!alreadyClaimed&&!reduced;
}

/** A self-contained, silent, local video; no WebGL, network or WebView required.
 * This is a frame-faithful rendering of the separately preserved approved HTML
 * animation, produced by test14-splash-video-build.yml and SHA-verified there.
 */
function PremiumVideo({onComplete}:{onComplete:()=>void}){
  const started=useRef(false);
  const lastProgress=useRef({seconds:0,at:Date.now()});
  const finished=useRef(false);
  const done=useCallback((reason:string)=>{
    if(finished.current)return;
    finished.current=true;
    if(reason!=='end')console.warn('Archivist premium startup:',reason);
    onComplete();
  },[onComplete]);
  const player=useVideoPlayer(VIDEO,p=>{
    p.loop=false;
    p.muted=true;
    p.volume=0;
    p.staysActiveInBackground=false;
    p.timeUpdateEventInterval=0.5;
  });

  useEffect(()=>{
    const start=()=>{
      if(started.current||finished.current)return;
      started.current=true;
      lastProgress.current={seconds:0,at:Date.now()};
      try{player.play();}catch{done('native-play-error');}
    };
    // Register completion before starting; never treat merely loading the media
    // as successful playback (Test 13's static first-frame failure).
    const end=player.addListener('playToEnd',()=>done('end'));
    const status=player.addListener('statusChange',({status,error})=>{
      if(status==='readyToPlay')start();
      if(status==='error')done('native-decode-error:'+String(error?.message||'unknown').slice(0,80));
    });
    const progress=player.addListener('timeUpdate',({currentTime})=>{
      if(Number.isFinite(currentTime)&&currentTime>lastProgress.current.seconds+0.02)
        lastProgress.current={seconds:currentTime,at:Date.now()};
    });
    if(player.status==='readyToPlay')start();

    const timeout=setTimeout(()=>done('native-startup-deadline'),PREMIUM_SPLASH_DEADLINE_MS);
    const stall=setInterval(()=>{
      if(started.current&&!finished.current&&Date.now()-lastProgress.current.at>4500)
        done('native-video-stalled');
    },1000);
    return ()=>{
      clearTimeout(timeout);clearInterval(stall);
      end.remove();status.remove();progress.remove();
      try{player.pause();}catch{}
    };
  },[done,player]);

  return <VideoView
    testID="archivist-premium-video"
    player={player}
    nativeControls={false}
    contentFit="contain"
    surfaceType="textureView"
    useExoShutter={false}
    allowsPictureInPicture={false}
    style={styles.video}
    accessible={false}
  />;
}

export default function PremiumLaunch({children}:{children:React.ReactNode}){
  const [visible,setVisible]=useState(()=>claimPremiumColdLaunch(Platform.OS));
  const [reduced,setReduced]=useState<boolean|null>(null);
  const completed=useRef(false);
  const complete=useCallback(()=>{
    if(completed.current)return;
    completed.current=true;
    setVisible(false);
  },[]);
  useEffect(()=>{
    if(!visible)return;
    let active=true;
    const check=setTimeout(complete,PREMIUM_SPLASH_DEADLINE_MS+700);
    const background=AppState.addEventListener('change',state=>{
      if(state==='background'||state==='inactive')complete();
    });
    const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',enabled=>{
      if(enabled)complete();
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(value=>{if(active)setReduced(value);})
      .catch(()=>{if(active)setReduced(false);});
    return ()=>{
      active=false;clearTimeout(check);background.remove();motion.remove();
    };
  },[complete,visible]);

  return <View style={styles.root}>
    {children}
    {visible?<View style={styles.overlay}
      accessibilityLabel="Opening Archivist" accessibilityViewIsModal>
      {reduced===false?<PremiumVideo onComplete={complete}/>:null}
      {reduced===true?
        <Image source={require('./assets/splash-icon.png')}
          resizeMode="contain" style={styles.reducedIcon}/>:null}
    </View>:null}
  </View>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:TEAL},
  overlay:{...StyleSheet.absoluteFillObject,backgroundColor:TEAL,
    alignItems:'center',justifyContent:'center',zIndex:2000},
  video:{...StyleSheet.absoluteFillObject,backgroundColor:TEAL},
  reducedIcon:{width:112,height:112,maxWidth:'30%',maxHeight:'20%'},
});
