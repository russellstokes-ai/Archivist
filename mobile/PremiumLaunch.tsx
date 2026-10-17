import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, AppState, Image, Platform, StyleSheet, View} from 'react-native';
import {Asset} from 'expo-asset';
import {readAsStringAsync} from 'expo-file-system/legacy';
import {WebView} from 'react-native-webview';

const TEAL = '#2F8B86';
// Keep the supplied 6s motion and its final 1.3s shine intact. Completion
// originates in the page, with a hard native deadline if WebGL cannot finish.
export const startScript = (reduce: boolean) => `
(() => {
 window.__archivistReduce = ${reduce};
 const send = value => window.ReactNativeWebView.postMessage(value);
 const motion = window.ARCHIVIST_MOTION;
 if (!motion) { send('failed'); return; }
 let done = false;
 const finish = () => { if (!done) { done = true; send('complete'); } };
 const settle = () => setTimeout(finish, ${reduce ? 250 : 1450});
 document.getElementById('art').addEventListener('archivist:splash-complete', settle, {once:true});
 if (${reduce} || motion.duration === 0) {
   const ready = () => {
     if (motion.assetsReady) { motion.finish(); settle(); }
     else setTimeout(ready, 40);
   };
   ready();
 } else motion.play();
})(); true;`;

export default function PremiumLaunch({children}: {children: React.ReactNode}) {
  const [visible, setVisible] = useState(Platform.OS !== 'web');
  const [html, setHtml] = useState<string>();
  const [reduce, setReduce] = useState<boolean>();
  const web = useRef<WebView>(null);
  const complete = useCallback(() => setVisible(false), []);
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    const timeout = setTimeout(complete, 12000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') complete();
    });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      if (enabled) complete();
    });
    void Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      Asset.fromModule(require('./assets/splash/archivist-premium-shine.html')).downloadAsync(),
    ]).then(async ([reduced, asset]) => {
      const uri = asset.localUri;
      if (!uri) throw new Error('Splash asset unavailable');
      const content = await readAsStringAsync(uri);
      if (alive) { setReduce(reduced); setHtml(content); }
    }).catch(complete);
    return () => { alive = false; clearTimeout(timeout); subscription.remove(); motion.remove(); };
  }, [complete, visible]);

  return <View style={styles.root}>
    {children}
    {visible ? <View style={styles.overlay} accessibilityLabel="Opening Archivist" accessibilityViewIsModal>
      <Image source={require('./assets/splash-icon.png')} resizeMode="contain" style={styles.fallback}/>
      {html && reduce !== undefined ? <WebView
        ref={web}
        style={styles.web}
        source={{html}}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('data:text/html')}
        onLoad={() => web.current?.injectJavaScript(startScript(reduce))}
        onMessage={event => { if (event.nativeEvent.data === 'complete' || event.nativeEvent.data === 'failed') complete(); }}
        onError={complete}
        onHttpError={complete}
        onRenderProcessGone={complete}
        onContentProcessDidTerminate={complete}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
      /> : null}
    </View> : null}
  </View>;
}
const styles = StyleSheet.create({
  root: {flex:1, backgroundColor:TEAL},
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor:TEAL, alignItems:'center', justifyContent:'center', zIndex:2000},
  fallback: {width:'72%', height:'50%'},
  web: {...StyleSheet.absoluteFillObject, backgroundColor:TEAL},
});
