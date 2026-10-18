const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'PremiumLaunch.tsx'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,
}}).outputText;
const exposed={};
vm.runInNewContext(compiled,{
  exports:exposed,
  require:name=>name==='react-native'
    ?{Platform:{OS:'android'},StyleSheet:{create:x=>x,absoluteFillObject:{}}}:{},
});
const {claimPremiumColdLaunch,premiumSplashShouldPlay,PREMIUM_SPLASH_SECONDS,
  PREMIUM_SPLASH_DEADLINE_MS}=exposed;

assert.equal(premiumSplashShouldPlay('android',false,false),true);
assert.equal(premiumSplashShouldPlay('ios',false,false),true);
assert.equal(premiumSplashShouldPlay('android',true,false),false);
assert.equal(premiumSplashShouldPlay('android',false,true),false);
assert.equal(premiumSplashShouldPlay('web',false,false),false);
assert.equal(claimPremiumColdLaunch('web'),false);
assert.equal(claimPremiumColdLaunch('android'),true);
assert.equal(claimPremiumColdLaunch('android'),false);
assert.equal(claimPremiumColdLaunch('ios'),false,'warm resume and remount never replay');

const videoPath=path.join(__dirname,'assets/splash/archivist-premium-shine.mp4');
const video=fs.readFileSync(videoPath);
const hq=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/v1/SPLASH_HQ_REPAIR_2026-10-17.json'),'utf8'));
assert.equal(hq.previousVideoSha256,'413d0c275e8cc42d99e7f95c446458b9f3e3be2be5a5934c5e2c1ad3dfc70818');
assert.equal(hq.viewport,'960x1600');assert.equal(hq.release_approved,false);assert.equal(hq.installed_apk_approved,false);
assert.equal(crypto.createHash('sha256').update(video).digest('hex'),
  hq.videoSha256,
  'Approved 179-frame animated video must be byte-exact; do not substitute a still');
assert(video.length>150000&&video.length<15000000,'bounded, bundled native video');
assert.equal(video.toString('ascii',4,8),'ftyp','MP4 container is present');
assert(video.includes(Buffer.from('moov'))&&video.includes(Buffer.from('mdat')),
  'Video includes both actual frame data and a seekable metadata atom');

const provenance=JSON.parse(fs.readFileSync(
  path.join(__dirname,'../docs/v1/TEST14_SPLASH_VIDEO_PROVENANCE_2026-10-17.json'),'utf8'));
assert.equal(provenance.bookFrames,144);
assert.equal(provenance.shineFrames,35);
assert.equal(provenance.fps,24);
assert.equal(provenance.durationSeconds,179/24);
assert.equal(provenance.htmlSha256,crypto.createHash('sha256').update(
  fs.readFileSync(path.join(__dirname,'assets/splash/archivist-premium-shine.html'))
).digest('hex'),'Original approved animation must remain untouched');
assert.equal(PREMIUM_SPLASH_SECONDS,179/24);
assert(PREMIUM_SPLASH_DEADLINE_MS>10000&&PREMIUM_SPLASH_DEADLINE_MS<18000);
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json')));
assert.equal(pkg.dependencies['expo-video'],'~55.0.21','SDK55 native video engine must be pinned');
assert(source.includes("require('./assets/splash/archivist-premium-shine.mp4')"));
assert(source.includes("import {useVideoPlayer,VideoView} from 'expo-video'"));
assert(!source.includes('<WebView')&&!source.includes('readAsStringAsync')&&!source.includes('ARCHIVIST_MOTION'),
  'Native splash must NEVER depend on Android WebView/WebGL or a 6MB string read');
assert(source.includes("player.addListener('playToEnd'")&&source.includes("player.addListener('statusChange'")&&
  source.includes("player.addListener('timeUpdate'"),'Native player needs end, error, frame progress evidence');
assert(source.includes("if(status==='readyToPlay')start()") &&
  source.includes("if(status==='error')done("),'Cannot count loading-only as animation success');
assert(source.includes("done('native-video-stalled')"),'No perpetual static frame on decoder stall');
assert(source.includes("state==='background'||state==='inactive'"),'Background cancels pending splash');
assert(source.includes('nativeControls={false}')&&source.includes('contentFit="contain"')&&
  source.includes('surfaceType="textureView"'), 'No controls, clipping, stretching or overlay artifacts');
assert(source.includes('p.muted=true')&&source.includes('p.volume=0')&&
  source.includes('p.staysActiveInBackground=false'),'Startup must never steal audiobook sound in background');
assert(source.includes("backgroundColor:TEAL") && source.includes("zIndex:2000"));
assert(source.includes('width:112,height:112')&& !source.includes("width:'72%'"),
  'No giant fallback A');
console.log('PASS: exact 179-frame native splash, no WebGL, original master art, bounded startup, no warm replay, reduced motion and native accessibility');
