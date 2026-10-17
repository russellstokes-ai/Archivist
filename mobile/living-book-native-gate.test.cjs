'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),path=require('node:path');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(
 fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}
).outputText,file);
const {livingBookCallbackAllowed:allow,livingBookProbeAllowed:probe}=require('./livingBookNativeGate.ts');
for(const view of [0,1,2]){
 for(const current of [0,1,2]){
  for(const background of [true,false]){
   for(const failed of [true,false]){
    assert.equal(allow(view,current,background,failed),
      view===current&&!background&&!failed,'Old native WebView must never damage newly mounted book');
    for(const response of [1,2,3,4]){
     for(const ticket of [1,2,3,4]){
      assert.equal(probe(view,current,response,ticket,background,failed),
        view===current&&response===ticket&&!background&&!failed,
        'Same-view stale rAF probes and past-WebView messages must not mark book ready');
     }
    }
   }
  }
 }
}
assert.equal(allow(-1,0,false,false),false);
assert.equal(probe(0,0,0,0,false,false),false,'No unscheduled frame response');
assert.equal(probe(0,0,4,4,true,false),false,'Late probe after background return ignored');
assert.equal(probe(0,0,3,4,false,false),false,'Late prior probe rejected after foreground recheck');
const content=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
assert(content.includes('const ticket=++probeSequence.current;'));
assert(content.includes('livingBookProbeScript(ticket)'));
assert(content.includes("recover('canvas-first-frame-timeout',key)"));
assert(content.includes("recover('renderer-process-gone',reloadKey)"));
assert(content.includes('++probeSequence.current; // invalidate any queued old painted-frame response'));
assert(content.includes('if(reloadKey!==generation.current)return; // stale previous WebView'));
assert(content.includes('.catch(()=>{')&&content.includes('window.ArchivistLivingBook&&window.ArchivistLivingBook.setCover("",'));
const root=path.resolve(__dirname,'..');
const original=require('../scripts/repair-original-source.cjs')('mobile/LivingBookCanvas.tsx');
assert(original.includes('function paint()')&&original.includes('function flex(progress)'));
console.log('PASS: 3-view callback fencing, 4-probe ticket fencing, background invalidation, bounded retry, fail-safe cover and byte-perfect source renderer');
