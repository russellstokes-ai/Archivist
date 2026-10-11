const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/firstLibraryCelebration.ts','utf8');
const transpiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};vm.runInNewContext(transpiled,{module:mod,exports:mod.exports});
const predicate=mod.exports.shouldCelebrateFirstLibrary;
const base={eligible:true,finishedScan:true,onboardingDone:true,hasPublishedLocalWork:true,scanning:false,restoring:false,otherCelebrationActive:false,alreadyClaimed:false};
assert.equal(predicate(base),true);
for(const field of ['eligible','finishedScan','onboardingDone','hasPublishedLocalWork']){
  assert.equal(predicate({...base,[field]:false}),false,field+' required');
}
for(const field of ['scanning','restoring','otherCelebrationActive','alreadyClaimed']){
  assert.equal(predicate({...base,[field]:true}),false,field+' must block');
}
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
assert(app.includes('firstLibraryCelebrationClaimedRef.current=true'));
assert(app.includes("SecureStore.setItemAsync(firstLibraryCelebratedKey,'1')"));
assert(app.includes('hasPublishedLocalWork=sourceWorks.some'));
console.log('first-library-celebration.test.cjs passed');
