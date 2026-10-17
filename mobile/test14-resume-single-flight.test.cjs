const assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm'),ts=require('typescript');
const src=fs.readFileSync(__dirname+'/App.tsx','utf8');
const begin=src.indexOf('  function beginNowRestore('),end=src.indexOf('\n  useEffect(()=>{',begin);
assert(begin>=0&&end>begin);
const fragment=src.slice(begin,end);
const compiled=ts.transpileModule(fragment+'\nexports.restore=beginNowRestore;',{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
(async()=>{
 let resumed=[],release=[],errors=[];
 const context={
  exports:{},Promise,Error,String,
  nowRestorePending:{current:null},
  setError:e=>errors.push(e),
  resumeNowSession:async snapshot=>{
    resumed.push(snapshot);
    await new Promise(resolve=>release.push(resolve));
  },
 };
 vm.runInNewContext(compiled,context);
 const invoke=context.exports.restore;
 const snapshot=(time)=>({updatedAt:time,kind:'audio',media:{
  uri:'content://audio/fixture',serverWorkId:null,localWorkKey:'fixture'
 }});
 const first=invoke(snapshot(1)),duplicate=invoke(snapshot(1));
 assert.strictEqual(first,duplicate,'Now effect and tap must reuse the same restoration');
 await Promise.resolve();assert.equal(resumed.length,1,'Identical session restores exactly once');
 const newer=invoke(snapshot(2));assert.notStrictEqual(newer,first,
  'Updated rewind/selection must supersede a pending earlier restore');
 await Promise.resolve();assert.equal(resumed.length,2);
 release.forEach(fn=>fn());
 await Promise.all([first,duplicate,newer]);
 assert.equal(context.nowRestorePending.current,null,'Completed restoration is not retained');
 assert.equal(errors.length,0);

 assert(src.includes('await playBook(lastPlaying,undefined,false)'),
   'Opening Now must restore audio position but NEVER autoplay');
 assert(!src.includes("Button label={'Resume '+lastTitle}"),
   'No confirmation button is required to reopen saved media');
 assert(src.includes('beginNowRestore(nowSessionRef.current)')&&
   src.includes('await beginNowRestore(snapshot)'),'Both recovery paths use single-flight guard');
 assert(src.includes("setLocalReadingProgress(current=>")&&
   src.includes("persistNowSession('reader'"),'Book and comic page persistence remains wired');
 console.log('PASS: no duplicate Now opens, newer session wins, no prompt, no unexpected audible playback, persisted page position retained');
})().catch(e=>{console.error(e);process.exitCode=1;});
