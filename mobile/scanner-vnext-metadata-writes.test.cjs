const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createWriteQueue,metadataDatabase}=require('./scannerVNext/metadataWrites.ts');
const {createMetadataStore}=require('./scannerVNext/fieldEvidence.ts');
(async()=>{
 const pauses=[],queue=createWriteQueue(async ms=>{pauses.push(ms);});let active=0,max=0;
 await Promise.all(Array.from({length:8},()=>queue(async()=>{max=Math.max(max,++active);await Promise.resolve();active--;})));assert.equal(max,1);
 let attempts=0;await queue(async()=>{if(++attempts<3)throw Error('database is locked');});assert.equal(attempts,3);assert.equal(pauses.length,2);
 attempts=0;await assert.rejects(queue(async()=>{attempts++;throw Error('SQLITE_BUSY: database is locked');}),/locked/);assert.equal(attempts,5,'Busy retries must be bounded');
 attempts=0;await assert.rejects(queue(async()=>{attempts++;throw Error('disk full');}),/disk full/);assert.equal(attempts,1,'Never retry unrelated failures');
 assert.equal(await queue(async()=>42),42,'One failed write must not poison later saves');
 const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(dir,'retry.db'));
 try{
  let locks=0;
  const fault={...db,withExclusiveTransactionAsync:action=>db.withExclusiveTransactionAsync(async tx=>{await action(tx);if(locks>0){locks--;throw Error('database is locked');}})};
  const store=await createMetadataStore(metadataDatabase(fault));
  await store.ensure({workId:'book',revision:0,fields:{title:'A book'},manual:{},identityConfirmed:false,partIds:['a']});locks=2;
  const saved=await store.saveManual('book',{author:'My author',genre:'Fantasy'},0);
  assert.equal(saved.revision,1);const stored=await store.get('book');assert.equal(stored.revision,1);assert.equal(stored.fields.author,'My author');assert.equal(stored.manual.genre,true);
  await assert.rejects(store.saveManual('book',{title:'Stale'},0),/Stale/);assert.equal((await store.get('book')).fields.title,'A book');
  console.log('PASS: serialized writes, bounded BUSY retries, rollback without double revisions, manual preservation and stale protection');
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
