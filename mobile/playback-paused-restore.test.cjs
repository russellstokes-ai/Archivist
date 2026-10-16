const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const original=Module._load;
Module._load=function(name,parent,main){if(name==='./connection')return {RequestError:class extends Error{}};return original.call(this,name,parent,main)};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {Playback}=require('./playback.ts');
(async()=>{
 let plays=0,loaded=-1;
 const api=async(p,m,data)=>m==='PUT'?{...data,revision:2}:p.endsWith('/listening')?
  {progressURL:'/api/editions/1/progress',tracks:[{id:1,title:'One',available:true}]}:
  {asset:1,seconds:42,revision:1,complete:false};
 const audio={load:async(_t,s)=>{loaded=s},play:()=>plays++,pause(){},seek:async()=>{},speed(){}};
 const c=new Playback(api,audio,()=>{});
 await c.open(1,{autoplay:false});
 assert.equal(loaded,42);assert.equal(plays,0,'restoration must not emit even a brief play command');assert.equal(c.state.playing,false);
 c.toggle();assert.equal(plays,1,'explicit Play starts restored item');
 await c.open(1);assert.equal(plays,2,'existing explicit open keeps autoplay');
 console.log('PASS: paused server restore, saved position and explicit Play');
})().catch(e=>{console.error(e);process.exitCode=1});

(async()=>{
 const loads=[];
 const api=async(p,m,data)=>m==='PUT'?{...data,revision:2}:p.endsWith('/listening')?
 {progressURL:'/api/editions/1/progress',tracks:[{id:1,title:'One',available:true},{id:2,title:'Two',available:true}]}:
 {asset:2,seconds:90,revision:1,complete:false};
 const audio={load:async(t,s)=>loads.push([t.id,s]),play(){},pause(){},seek:async()=>{},speed(){}};
 const c=new Playback(api,audio,()=>{});
 await c.open(1,{autoplay:false,resumeSeconds:12});
 assert.deepEqual(loads,[[1,12]],'explicit restore position belongs to requested chapter, not server checkpoint chapter');
 assert.equal(c.state.seconds,12);
 console.log('PASS: requested chapter and rewind restored atomically');
})().catch(e=>{console.error(e);process.exitCode=1});

(async()=>{
 let releaseFirst;const first=new Promise(resolve=>releaseFirst=resolve);let entered;const loading=new Promise(resolve=>entered=resolve);
 const api=async(p,m,data)=>m==='PUT'?{...data,revision:2}:p.endsWith('/listening')?
 {progressURL:'/api/editions/1/progress',tracks:[{id:1,title:'One',available:true},{id:2,title:'Two',available:true}]}:
 {asset:1,seconds:90,revision:1,complete:false};
 let plays=0;const c=new Playback(api,{load:async(t)=>{if(t.id===1){entered();await first}},play:()=>plays++,pause(){},seek:async()=>{},speed(){}},()=>{});
 const old=c.open(1,{autoplay:false,resumeSeconds:12});await loading;
 await c.open(2,{autoplay:false,resumeSeconds:8});releaseFirst();await old;
 assert.equal(c.state.tracks[c.state.index].id,2,'late old load must not overwrite newly selected chapter');
 assert.equal(c.state.seconds,8);assert.equal(plays,0);
 console.log('PASS: rapid restore switch rejects stale load completion');
})().catch(e=>{console.error(e);process.exitCode=1});
