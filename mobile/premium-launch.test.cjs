const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(__dirname+'/PremiumLaunch.tsx','utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const exportsObject={};
vm.runInNewContext(compiled,{exports:exportsObject,require:name=>name==='react-native'?{Platform:{OS:'android'},StyleSheet:{create:x=>x,absoluteFillObject:{}}}:{}});
function probe(reduce,duration=6){
  const sent=[],timers=[],listeners={};let plays=0,finishes=0;
  const motion={duration,assetsReady:true,play:()=>plays++,finish:()=>finishes++};
  const context={window:{ReactNativeWebView:{postMessage:x=>sent.push(x)},ARCHIVIST_MOTION:motion},document:{getElementById:()=>({addEventListener:(name,fn)=>listeners[name]=fn})},setTimeout:(fn,ms)=>timers.push({fn,ms})};
  vm.runInNewContext(exportsObject.startScript(reduce),context);
  return {sent,timers,listeners,get plays(){return plays},get finishes(){return finishes},context};
}
let p=probe(false);assert.equal(p.plays,1);assert.deepEqual(p.sent,[]);p.listeners['archivist:splash-complete']();assert.equal(p.timers[0].ms,1450);p.timers[0].fn();p.timers[0].fn();assert.deepEqual(p.sent,['complete']);
p=probe(true);assert.equal(p.plays,0);assert.equal(p.finishes,1);assert.equal(p.context.window.__archivistReduce,true);assert.equal(p.timers[0].ms,250);p.timers[0].fn();assert.deepEqual(p.sent,['complete']);
p=probe(false,0);assert.equal(p.finishes,1);assert.equal(p.plays,0);
const html=fs.readFileSync(__dirname+'/assets/splash/archivist-premium-shine.html','utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
assert.ok(html.includes('html,body,main{background:#2F8B86!important}.brand{transform:none}'));
assert.ok(html.includes('connect-src \'none\''));
assert.ok(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html));
console.log('PASS: splash completion waits for shine, reduced motion skips animation, fallback completes, embedded scripts parse');
