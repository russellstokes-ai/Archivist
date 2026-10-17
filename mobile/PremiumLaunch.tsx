import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,AppState,Image,Platform,StyleSheet,View} from 'react-native';
import {Asset} from 'expo-asset';
import {readAsStringAsync} from 'expo-file-system/legacy';
import {WebView} from 'react-native-webview';

const TEAL='#2F8B86';
const MAX_LAUNCH_MS=16500;

// React Navigation/AppState can recreate this route without killing Android.
// One custom animation per process is intentional: warm foregrounding and
// returning from Reader/Library must never replay the splash.
let nativeSplashClaimed=false;
export function claimPremiumColdLaunch(platform:string) {
  if(platform==='web'||nativeSplashClaimed)return false;
  nativeSplashClaimed=true;
  return true;
}

// Presentation-only fit around the owner-approved HTML and WebGL geometry.
// The exact book/page/shine art is unchanged. Centre the book itself rather
// than a book+wordmark stack, with the wordmark below the animation frame.
const fitCss=[
  "html,body,main{background:#2F8B86!important}",
  "main{display:flex!important;align-items:center!important;justify-content:center!important;min-height:100%!important}",
  ".brand{position:relative!important;display:block!important;transform:none!important;width:var(--archivist-stage)!important;height:var(--archivist-stage)!important}",
  ":root{--archivist-stage:min(62vw,35vh,310px)}",
  "#stage{width:var(--archivist-stage)!important;height:var(--archivist-stage)!important}",
  "#wordmark{position:absolute!important;left:0!important;top:100%!important;width:var(--archivist-stage)!important;margin:-7px 0 0!important}",
  "#restart{display:none!important}",
].join('');
export function preparePremiumHtml(source:string):string {
  if(!source.includes('</head>')||!source.includes('ARCHIVIST_MOTION'))throw Error('Invalid premium splash source');
  return source.replace('</head>','<style id="archivist-native-fit">'+fitCss+'</style></head>');
}

// The bridge *never* interprets a static WebGL failure poster as successful
// animation playback. Native errors remain diagnostic but do not block launch.
const bootstrap=[
  "(() => {",
  "  const send = value => window.ReactNativeWebView?.postMessage?.(value);",
  "  if (window.__archivistNativeStarted) return true;",
  "  window.__archivistNativeStarted = true;",
  "  const reduced = __REDUCE__;",
  "  window.__archivistReduce = reduced;",
  "  const motion = window.ARCHIVIST_MOTION;",
  "  const art = document.getElementById('art');",
  "  if (!motion || !art) { send('failed:missing-motion'); return true; }",
  "  if (!Number.isFinite(motion.duration) || motion.duration < 5.9) { send('failed:webgl-unavailable'); return true; }",
  "  let ended = false;",
  "  const complete = () => { if (ended) return; ended = true; send('complete'); };",
  "  art.addEventListener('archivist:splash-complete', () => {",
  "    send('final-frame');",
  "    setTimeout(complete, reduced ? 250 : 1450);",
  "  }, {once: true});",
  "  let checks = 0;",
  "  const start = () => {",
  "    if (ended) return;",
  "    if (motion.assetsReady !== true) {",
  "      if (++checks > 140) { send('failed:art-timeout'); ended = true; return; }",
  "      setTimeout(start, 45);",
  "      return;",
  "    }",
  "    send('art-ready');",
  "    try {",
  "      if (reduced) { motion.finish(); setTimeout(complete, 250); }",
  "      else { motion.play(); send('playing'); }",
  "    } catch (_) { send('failed:play-error'); ended = true; }",
  "  };",
  "  start();",
  "})(); true;",
].join('\n');
export const startScript=(reduce:boolean)=>bootstrap.replace(/__REDUCE__/g,reduce?'true':'false');

export default function PremiumLaunch({children}:{children:React.ReactNode}) {
  const [visible,setVisible]=useState(()=>claimPremiumColdLaunch(Platform.OS));
  const [html,setHtml]=useState<string>();
  const [reduce,setReduce]=useState<boolean>();
  const web=useRef<WebView>(null);
  const injected=useRef(false);
  const completed=useRef(false);
  const complete=useCallback(()=>{
    if(completed.current)return;
    completed.current=true;
    setVisible(false);
  },[]);
  const failure=useCallback((reason:string)=>{
    if(!completed.current)console.warn('Archivist premium launch fallback:',reason);
    complete();
  },[complete]);

  useEffect(()=>{
    if(!visible)return;
    let alive=true;
    const timeout=setTimeout(()=>failure('launch-deadline'),MAX_LAUNCH_MS);
    const subscription=AppState.addEventListener('change',state=>{
      if(state==='background')complete();
    });
    const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',enabled=>{
      if(enabled)complete();
    });
    void Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      Asset.fromModule(require('./assets/splash/archivist-premium-shine.html')).downloadAsync(),
    ]).then(async ([reduced,asset])=>{
      if(!asset.localUri)throw Error('asset-not-local');
      const content=await readAsStringAsync(asset.localUri);
      if(alive&&!completed.current){setReduce(reduced);setHtml(preparePremiumHtml(content));}
    }).catch(error=>failure('asset-load:'+String(error instanceof Error?error.message:error).slice(0,80)));
    return()=>{
      alive=false;clearTimeout(timeout);subscription.remove();motion.remove();
    };
  },[complete,failure,visible]);

  return <View style={styles.root}>
    {children}
    {visible?<View style={styles.overlay} accessibilityLabel="Opening Archivist" accessibilityViewIsModal>
      <Image source={require('./assets/splash-icon.png')} resizeMode="contain" style={styles.fallback}/>
      {html&&reduce!==undefined?<WebView
        ref={web}
        style={styles.web}
        source={{html}}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={request=>request.url==='about:blank'||request.url.startsWith('data:text/html')}
        onLoad={()=>{
          if(injected.current)return;
          injected.current=true;
          web.current?.injectJavaScript(startScript(reduce));
        }}
        onMessage={event=>{
          const message=event.nativeEvent.data;
          if(message==='complete')complete();
          else if(message.startsWith('failed:'))failure(message);
        }}
        onError={()=>failure('webview-load')}
        onHttpError={()=>failure('webview-http')}
        onRenderProcessGone={()=>failure('webview-renderer')}
        onContentProcessDidTerminate={()=>failure('webview-process')}
        javaScriptEnabled
        androidLayerType="hardware"
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
      />:null}
    </View>:null}
  </View>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:TEAL},
  overlay:{...StyleSheet.absoluteFillObject,backgroundColor:TEAL,alignItems:'center',justifyContent:'center',zIndex:2000},
  fallback:{width:124,height:124,maxWidth:'35%',maxHeight:'25%'},
  web:{...StyleSheet.absoluteFillObject,backgroundColor:TEAL},
});
