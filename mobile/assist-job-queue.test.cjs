'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {metadataDatabase}=require('./scannerVNext/metadataWrites.ts');
const {createPopulationQueue}=require('./assistMetadata/jobQueue.ts');
const {populationMessage}=require('./assistMetadata/progress.ts');
assert.equal(populationMessage(true,{}),'');
assert.match(populationMessage(false,{done:2,pending:3}),/paused.*2 of 5/);
assert.match(populationMessage(true,{done:2,retry:1}),/2 of 3.*retry automatically/);
assert.doesNotMatch(populationMessage(true,{done:2,running:1}),/complete/);
assert.match(populationMessage(true,{done:2,'needs-clues':1,blocked:1}),/2 identified; 1 need more clues.*1 could not/);
(async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(dir,'jobs.db')),port=metadataDatabase(db);
 try{
  const queue=await createPopulationQueue(port);
  await queue.enqueue('book',0,'write');const old=await queue.start('book','write');
  await queue.enqueue('book',1,'write');await queue.finish(old,'done');
  assert.equal((await queue.load('book','write')).state,'pending','Late completion cannot finish a newer edit');
  await queue.enqueue('book',0,'write');assert.equal((await queue.load('book','write')).revision,1,'Late enqueue cannot replace a newer edit');
  const current=await queue.start('book','write');await queue.finish(current,'done');
  await queue.enqueue('book',1,'write');assert.equal(await queue.next('write'),null,'Unchanged completed work is not repeated');
  await queue.enqueue('book',1,'write',true);const retried=await queue.start('book','write');await queue.finish(retried,'retry','provider-offline');
  assert.equal(await queue.next('write'),null,'Backoff must prevent a retry loop');assert((await queue.nextWake('write'))>Date.now());
  await queue.enqueue('resume',4,'write');await queue.start('resume','write');
  const restarted=await createPopulationQueue(port);assert.equal((await restarted.next('write')).itemId,'resume','Interrupted work survives runtime restart');
  const resumed=await restarted.start('resume','write');assert.equal(resumed.attempts,2);await restarted.finish(resumed,'blocked','unsupported-format');
  assert.equal(await restarted.start('resume','write'),null,'Unsupported writes do not continuously retry');
  const summary=await restarted.summary('write');assert.equal(summary.blocked,1);assert.equal(summary.retry,1);
  await queue.enqueue('cover',1,'cover');const firstCover=await queue.start('cover','cover');
  await queue.enqueue('cover',1,'cover',true);const replacementCover=await queue.start('cover','cover');
  assert.equal(firstCover.attempts,replacementCover.attempts);
  await queue.finish(firstCover,'done');assert.equal((await queue.load('cover','cover')).state,'running','Same-revision retries cannot be completed by an old attempt');
  await queue.finish(replacementCover,'done');assert.equal((await queue.load('cover','cover')).state,'done');
  console.log('PASS: durable revision-safe jobs, bounded retry, restart recovery and no duplicate completed work');
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
