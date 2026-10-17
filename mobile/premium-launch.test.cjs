const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync(__dirname+'/PremiumLaunch.tsx','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const exported={};
vm.runInNewContext(compiled,{
  exports:exported,
  require:name=>name==='react-native'?
    {Platform:{OS:'android'},StyleSheet:{create:x=>x,absoluteFillObject:{}}}:{},
});
function probe(reduce,duration=6,ready=true) {
  const sent=[],timers=[],listeners={};let plays=0,finishes=0;
  const motion={duration,assetsReady:ready,play:()=>plays++,finish:()=>finishes++};
  const context={
    window:{ReactNativeWebView:{postMessage:x=>sent.push(x)},ARCHIVIST_MOTION:motion},
    document:{getElementById:()=>({addEventListener:(name,fn)=>listeners[name]=fn})},
    setTimeout:(fn,ms)=>timers.push({fn,ms}),
  };
  vm.runInNewContext(exported.startScript(reduce),context);
  return {sent,timers,listeners,motion,get plays(){return plays},
    get finishes(){return finishes},context};
}

// A normal cold start drives the real HTML bridge; it MUST send playing,
// observe the completed WebGL frame, and finish only after the 1.45s shine.
let p=probe(false);
assert.equal(p.plays,1);
assert.deepEqual(p.sent,['art-ready','playing']);
p.listeners['archivist:splash-complete']();
assert.equal(p.timers[0].ms,1450);
assert.deepEqual(p.sent,['art-ready','playing','final-frame']);
p.timers[0].fn();p.timers[0].fn();
assert.deepEqual(p.sent,['art-ready','playing','final-frame','complete']);

// Reduced motion has a deliberate final-frame route, not unexpected playback.
p=probe(true);
assert.equal(p.plays,0);assert.equal(p.finishes,1);
assert.equal(p.context.window.__archivistReduce,true);
assert.equal(p.timers[0].ms,250);p.timers[0].fn();
assert.deepEqual(p.sent,['art-ready','complete']);

// The old Android/WebGL static-icon fallback was misclassified as success.
// A real 6-second animation unavailable on device must be surfaced honestly.
p=probe(false,0);
assert.equal(p.plays,0);assert.equal(p.finishes,0);
assert.deepEqual(p.sent,['failed:webgl-unavailable']);

// Never spin forever if 6MB of original texture assets cannot initialize.
p=probe(false,6,false);
for(let i=0;i<145 && p.timers.length;i++)p.timers.shift().fn();
assert.deepEqual(p.sent,['failed:art-timeout']);

// No custom splash on route remount, ordinary Android warm foregrounding or web.
assert.equal(exported.claimPremiumColdLaunch('web'),false);
assert.equal(exported.claimPremiumColdLaunch('android'),true);
assert.equal(exported.claimPremiumColdLaunch('android'),false);
assert.equal(exported.claimPremiumColdLaunch('ios'),false);

const original=fs.readFileSync(__dirname+'/assets/splash/archivist-premium-shine.html','utf8');
const fitted=exported.preparePremiumHtml(original);
assert.equal((fitted.match(/id="archivist-native-fit"/g)||[]).length,1);
assert.ok(fitted.includes('--archivist-stage:min(62vw,35vh,310px)'));
assert.ok(fitted.includes('#wordmark{position:absolute'));
assert.equal(fitted.replace(/<style id="archivist-native-fit">[\s\S]*?<\/style>/,''),original,
  'Approved HTML renderer/assets/shine must remain byte-for-byte unchanged');
assert.throws(()=>exported.preparePremiumHtml('<html></html>'),/Invalid premium/);
for(const match of original.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
assert.ok(original.includes('html,body,main{background:#2F8B86!important}.brand{transform:none}'));
assert.ok(original.includes("connect-src 'none'"));
assert.ok(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(original));
assert.ok(source.includes('androidLayerType="hardware"'));
assert.ok(source.includes('onRenderProcessGone'));
assert.ok(source.includes("if(state==='background')complete()"));
assert.ok(source.includes('fallback:{width:124,height:124'));
console.log('PASS: cold-only premium launch, bounded WebGL fallback, actual 6s completion, reduced motion, no HTML art mutation, Fold-safe centering');
