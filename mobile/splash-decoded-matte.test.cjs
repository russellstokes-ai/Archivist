const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const source=fs.readFileSync(__dirname+'/PremiumLaunch.tsx','utf8')+'\nexport {PremiumVideo};';
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
async function scenario(results,unmount=false){
 const cleanups=[],timers=[],colors=[];let calls=0,resolve;
 const react={createElement:(type,props)=>({type,props}),useRef:current=>({current}),useCallback:f=>f,useEffect:f=>{const c=f();if(c)cleanups.push(c);}};
 const exports={};vm.runInNewContext(compiled,{exports,console,Date,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},require:n=>n==='react'?{...react,default:react}:n==='react-native'?{Platform:{OS:'android'},StyleSheet:{create:x=>x,absoluteFillObject:{}},NativeModules:{ArchivistSplash:{sampleMatte:()=>{calls++;return unmount?new Promise(r=>resolve=r):Promise.resolve(results.shift());}}}}:n==='expo-video'?{VideoView:'Video',useVideoPlayer:()=>({status:'loading',addListener:()=>({remove(){}}),pause(){}})}:{}});
 const view=exports.PremiumVideo({onComplete(){},onMatte:c=>colors.push(c),matte:'#2E8986'});
 view.props.onFirstFrameRender();view.props.onFirstFrameRender();
 if(unmount){cleanups.forEach(f=>f());resolve('#287E86');}
 for(let i=0;i<10;i++){await new Promise(r=>setImmediate(r));if(timers.length)timers.shift()();}
 return {calls,colors};
}
(async()=>{
 assert.deepEqual(await scenario(['#287E86']),{calls:1,colors:['#287E86']},'Use actual device colour; duplicate frame events do not duplicate readbacks');
 assert.deepEqual(await scenario([null,null,'#287E86']),{calls:3,colors:['#287E86']},'First frame may not be ready; retry is bounded');
 assert.deepEqual(await scenario([null,null,null,null,null]),{calls:4,colors:[]},'Decode failure cannot poll forever or block startup');
 assert.deepEqual(await scenario([],true),{calls:1,colors:[]},'Unmounted splash must ignore stale native result');
 const native=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistSplashModule.kt','utf8');
 assert(native.includes('getBitmap(16, 16)')&&native.includes('bitmap.recycle()'),'Readback is tiny and released');
 assert(native.includes('archivist-premium-video')&&native.includes('react_test_id'),'Only the splash surface may be sampled');
 assert(source.includes('backgroundColor:matte')&&source.includes('contentFit="contain"'),'Match both surrounding matte and video without cropping');
 console.log('PASS: device-decoded splash matte, bounded retry, duplicate and stale callback protection');
})().catch(e=>{console.error(e);process.exit(1)});
