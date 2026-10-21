'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {test}=require('node:test');
const sqlite=require('./test-support/sqlite-port.cjs');
const overlay=path.join(__dirname,'threeFixes/source.cjs');
const effective=fs.existsSync(overlay)?require(overlay).effectiveSource:(_file,source)=>source;
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(effective(f,fs.readFileSync(f,'utf8')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createCatalogueRuntime}=require('./scannerVNext/runtime.ts');
function fixture(count,onArtwork=async()=>{}){
 let sequence=0;
 return {newId:()=>`three-fix-${++sequence}`,ports:{
  access:{async nextBatch(){return {entries:Array.from({length:count},(_,n)=>({documentId:`root/Comic-${n}.cbz`,relativePath:`Comics/Title ${n}/Title ${n}.cbz`,name:`Title ${n}.cbz`,size:100,modified:10})),nextCursor:null};}},
  clues:async(_source,assets)=>({title:assets[0].name,author:'Fixture Writer',genre:'Fantasy'}),
  identityProof:()=>true,
  artwork:async(...args)=>{await onArtwork(...args);return {state:'ready',uri:'file:///private/fixture-cover.png',bytes:100,width:100,height:150};},
  search:{async search(){throw Error('Offline comic scan must not wait for an online provider');}},
 }};
}
const folder={id:'source',uri:'content://fixture/tree/root',name:'Fixture comics',status:'',itemCount:0};
test('effective comic runtime completes and reports real work counts through preparation',async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.three-fix-runtime-')),db=sqlite(path.join(dir,'comics.db'));
 try{
  let covers=0;const f=fixture(65,async()=>{if(++covers===7)throw Error('Unreadable optional artwork');});
  const runtime=await createCatalogueRuntime(db,f.newId,f.ports),events=[];
  const result=await runtime.scan([folder],[],{},{online:false,automatic:false},{progress:p=>events.push({...p})});
  assert.equal(result.books.length,65,'an optional cover failure cannot discard another comic');
  assert.equal(result.truncated,false);assert.equal(covers,65);
  const preparing=events.filter(p=>p.phase==='preparing');
  assert.ok(preparing.some(p=>p.processed>0&&p.processed<p.total),'the real runtime must advance beyond an uncounted 24% event');
  assert.equal(preparing.at(-1).processed,65);assert.equal(preparing.at(-1).total,65);
  assert.ok(preparing.some(p=>p.currentFolder.startsWith('Checking cover artwork')),'expose the operation before waiting for it');
  assert.ok(preparing.some(p=>p.currentFolder.startsWith('Saving publication state')));
  console.log('ThreeFixComicEvidence',JSON.stringify({scope:'real-SQLite/synthetic-source-adapters',works:65,optionalArtworkFailures:1,lastProcessed:preparing.at(-1).processed}));
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('a delayed artwork operation is named before it returns and cancellation cannot publish it',async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.three-fix-runtime-')),db=sqlite(path.join(dir,'cancel.db'));
 let release;
 try{
  let entered;const started=new Promise(r=>{entered=r;});
  const f=fixture(1,async()=>{entered();await new Promise(r=>{release=r;});});
  const runtime=await createCatalogueRuntime(db,f.newId,f.ports),events=[],controller=new AbortController();
  const pending=runtime.scan([folder],[],{},{online:false,automatic:false},{signal:controller.signal,progress:p=>events.push({...p})});
  // Attach a rejection handler before delivering the abort.
  const checked=pending.then(()=>{throw Error('Cancelled comic scan completed');},e=>e);
  await started;
  const observed=events.at(-1);
  controller.abort();release();
  const error=await checked;assert.match(String(error),/cancel/i);
  assert.ok(observed.currentFolder.startsWith('Checking cover artwork'),'the actual pending operation must be visible even when it never reported completion');
  const published=await db.getFirstAsync('SELECT COUNT(*) AS count FROM scanner_vnext_published');assert.equal(published.count,0);
 }finally{release?.();await db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
