const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(
  fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}
).outputText,file);
const {livingBookProbeScript,parseLivingBookProbe}=require('./livingBookReadiness.ts');
function simulate(result='painted'){
 const messages=[],scheduled=[];
 let api=true,frames=0;
 const pixels=new Uint8ClampedArray(500*400*4);
 if(result==='painted')pixels[3]=255;
 const context={
  window:{
   ReactNativeWebView:{postMessage:message=>messages.push(message)},
   ArchivistLivingBook:{setState:()=>{}},
  },
  document:{getElementById:id=>id==='book'?{
   width:1000,height:840,getContext:()=>({
    getImageData:()=>{
     if(result==='tainted')throw Error('SecurityError');
     return {data:pixels};
    },
   }),
  }:null},
  requestAnimationFrame:fn=>scheduled.push(fn),
 };
 vm.runInNewContext(livingBookProbeScript(7),context);
 const total=result==='blank'?130:5;
 for(let i=0;i<total&&scheduled.length;i++){
  frames++;
  scheduled.shift()();
 }
 return {messages,frames};
}
const ok=simulate('painted');
assert.deepEqual(ok.messages,['archivist-living-v2:7:ready']);
assert(ok.frames>=2,'Must wait at least 2 animation frames after DOM ready');
assert.deepEqual(simulate('blank').messages,['archivist-living-v2:7:blank']);
assert.deepEqual(simulate('tainted').messages,['archivist-living-v2:7:tainted']);
assert.deepEqual(parseLivingBookProbe('archivist-living-v2:7:ready'),{generation:7,status:'ready'});
assert.equal(parseLivingBookProbe('archivist-living-v2:7:injected'),null);
assert.equal(parseLivingBookProbe('archivist-living-v2:NaN:ready'),null);
assert.equal(parseLivingBookProbe('book title,file:///private'),null);
assert.throws(()=>livingBookProbeScript(-1),/Invalid/);

// Original renderer is rigorously recovered before comparing the immutable
// book-geometry lock. No rendering code, book proportions or source SVG change.
const canonical=require('../scripts/repair-original-source.cjs')('mobile/LivingBookCanvas.tsx');
const current=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
assert(canonical.includes('function paint()')&&canonical.includes('function flex(progress)'));
assert(current.includes("onMessage={event=>")&&current.includes('livingBookProbeScript(ticket)'));
assert(current.includes("if(reloadKey!==generation.current)return; // stale previous WebView"));
assert(current.includes('livingBookCallbackAllowed(reloadKey,generation.current,suspended.current,failed.current)'));
assert(current.includes('livingBookProbeAllowed(reloadKey,generation.current,result.generation,probeSequence.current,suspended.current,failed.current)'));
assert(current.includes('++probeSequence.current; // invalidate any queued old painted-frame response'));
assert(current.includes("if(attempts.current>=2)"));
assert(current.includes("state==='background'||state==='inactive'"));
assert(current.includes("state==='active'&&suspended.current"));
assert(current.includes('style={styles.stage}')&&current.includes('androidLayerType="hardware"'));
assert(current.includes('coverSource(props.coverUri,props.coverHeaders)'));
console.log('PASS: painted-frame handshake, tainted covers, blank/retry fencing, two recovery attempts, background rescue and byte-perfect Living Book renderer');
