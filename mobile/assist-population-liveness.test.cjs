const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {boundedIdentification}=require('./assistMetadata/identificationDeadline.ts');
const {populationMeter}=require('./assistMetadata/progress.ts');
(async()=>{
 const owner=new AbortController();let release;
 await assert.rejects(boundedIdentification(()=>new Promise(r=>release=r),owner,20),/deadline/);
 assert(owner.signal.aborted,'A timed-out lookup must cancel its provider and native work');
 release('late');
 const cancelled=new AbortController();
 const pending=boundedIdentification(()=>new Promise(()=>{}),cancelled,1000);
 cancelled.abort();await assert.rejects(pending,/cancelled/);
 assert.equal(await boundedIdentification(async()=>42,new AbortController(),1000),42);
 assert.deepEqual(populationMeter({done:2,'needs-clues':1,blocked:1,retry:2,pending:3,running:1}),{total:10,processed:4,identified:2,unresolved:2,retrying:2,waiting:6,percent:40,complete:false});
 assert.equal(populationMeter({}).complete,false);
 assert.equal(populationMeter({'needs-clues':3}).percent,100,'Unmatched items still count as processed');
 console.log('PASS: stalled identification releases the lane, cancellation settles, progress distinguishes matches from processed work');
})().catch(e=>{console.error(e);process.exitCode=1;});
