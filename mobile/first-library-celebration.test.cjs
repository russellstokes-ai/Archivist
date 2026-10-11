const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,path)=>mod._compile(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,path);
const {shouldCelebrateFirstLibrary:can}=require('./firstLibraryCelebration.ts');
const ready={observedEmptyScan:true,eligible:true,scanRunning:false,prepared:true,catalogueReady:true,restoring:false,publishedWorks:1,alreadyClaiming:false,anotherCelebrationActive:false};
assert.equal(can(ready),true);
for(const [key,value] of Object.entries({observedEmptyScan:false,eligible:false,scanRunning:true,prepared:false,catalogueReady:false,restoring:true,publishedWorks:0,alreadyClaiming:true,anotherCelebrationActive:true})){
  assert.equal(can({...ready,[key]:value}),false,'must not show celebration if '+key+'='+value);
}
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
assert.match(app,/firstEmptyScanObserved\.current=true/,'only original empty local library scans qualify');
assert.match(app,/track as ScannerBook\)\.scannerPublished/,'published works, not raw files, qualify');
assert.ok(app.includes("SecureStore.setItemAsync(firstLibraryCelebratedKey,'1')"),'save idempotence flag before showing');
assert.ok(app.includes('firstLibraryCelebrationClaiming.current=true'),'prevent duplicate in-flight writes');
assert.ok(app.includes('setCelebrating(true)'),'explicitly show the celebration');
assert.ok(app.includes('setTimeout(()=>setCelebrating(false),3200)'),'completion overlay must disappear');
console.log('First-library one-time celebration gates passed');
