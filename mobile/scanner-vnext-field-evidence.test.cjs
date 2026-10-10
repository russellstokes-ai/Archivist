const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createMetadataStore,createSearchCache}=require('./scannerVNext/fieldEvidence.ts');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),file=path.join(tmp,'metadata.db');let db=sqlite(file);
 try{
  await db.execAsync("CREATE TABLE legacy_manual(value TEXT); INSERT INTO legacy_manual VALUES('protected');");let store=await createMetadataStore(db);
  await store.ensure({workId:'work',partIds:['a','b'],fields:{title:'Path title'},revision:0,manual:{},identityConfirmed:false});
  let saved=await store.saveManual('work',{title:'Generated Novel',author:'Fixture Author',genre:'Fantasy'},0);assert.equal(saved.revision,1);assert.equal(saved.manual.title,true);
  const candidate={provider:'open-library',id:'candidate',fields:{title:'Generated Novel',author:'Fixture Author',genre:'Science Fiction',series:'Fixture Saga'},identifiers:[]};
  let accepted=await store.accept('work',candidate,1);assert.equal(accepted.fields.genre,'Fantasy');assert.equal(accepted.fields.series,'Fixture Saga');assert.deepEqual(accepted.partIds,['a','b']);assert.equal(accepted.identityConfirmed,true);
  await assert.rejects(()=>store.accept('work',candidate,1),/Stale/);
  saved=await store.saveManual('work',{author:'Corrected Author'},2);await assert.rejects(()=>store.accept('work',candidate,3),/conflict/i);assert.equal((await store.get('work')).fields.author,'Corrected Author');
  const cancelled=new AbortController();cancelled.abort();await assert.rejects(()=>store.saveManual('work',{genre:'Horror'},3,cancelled.signal),/cancel/i);assert.equal((await store.get('work')).fields.genre,'Fantasy');
  const cache=await createSearchCache(db);await cache.save('query',{expires:100,value:{state:'no-match',candidates:[],requests:1,cacheHit:false,issues:[],nextPages:{}}});assert.equal((await cache.load('query')).value.state,'no-match');
  await db.close();db=sqlite(file);store=await createMetadataStore(db);assert.equal((await store.get('work')).manual.genre,true);assert.equal((await store.get('work')).fields.author,'Corrected Author');assert.equal((await db.getFirstAsync('SELECT value FROM legacy_manual')).value,'protected');assert.equal((await (await createSearchCache(db)).load('query')).expires,100);
  const cleared=await store.saveManual('work',{author:''},3);assert.equal(cleared.fields.author,'');assert.equal(cleared.manual.author,false);assert.equal(cleared.identityConfirmed,false);
  const recovered=await store.accept('work',candidate,4);assert.equal(recovered.fields.author,'Fixture Author');
  await store.ensure({workId:'placeholder',partIds:['p'],fields:{title:'Generated Novel',author:'Fixture Author',genre:'Unknown'},revision:0,manual:{},identityConfirmed:false});
  assert.equal((await store.accept('placeholder',candidate,0)).fields.genre,'Science Fiction','Provider genre replaces an unprotected placeholder');
  console.log('PASS: real SQLite manual field protections, explicit missing-field recovery, accepted work membership, stale/cancelled rejection, durable cache and legacy preservation');
 }finally{await db.close();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
