'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {test}=require('node:test');
const sqlite=require('./test-support/sqlite-port.cjs');
const {effectiveSource}=require('./threeFixes/source.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(effectiveSource(f,fs.readFileSync(f,'utf8')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createCatalogueRuntime}=require('./scannerVNext/runtime.ts');
const folder={id:'source',uri:'content://fixture/tree/root',name:'Fixture comics',status:'',itemCount:0};
const ready={state:'ready',uri:'file:///private/fixture-cover.png',bytes:100,width:100,height:150};
function fixture(artwork){let sequence=0;return {newId:()=>`stalled-${++sequence}`,ports:{
 access:{async nextBatch(){return {entries:Array.from({length:3},(_,n)=>({documentId:`root/Comic-${n}.cbz`,relativePath:`Comics/Title ${n}/Title ${n}.cbz`,name:`Title ${n}.cbz`,size:100,modified:10})),nextCursor:null};}},
 clues:async(_source,assets)=>({title:assets[0].name,author:'Fixture Writer',genre:'Fantasy'}),identityProof:()=>true,
 artwork,search:{async search(){throw Error('Offline preparation must not wait for providers');}}
}};}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('a never-settling optional artwork read cannot hold comic preparation indefinitely or spawn replacement reads',async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.three-fix-stall-')),db=sqlite(path.join(dir,'comics.db'));
 let release,pending,timer,calls=0;
 try{
  const f=fixture(async()=>{calls++;if(calls===1)await new Promise(resolve=>{release=resolve;});return ready;});
  const runtime=await createCatalogueRuntime(db,f.newId,f.ports),events=[];
  pending=runtime.scan([folder],[],{},{online:false,automatic:false},{progress:p=>events.push({...p})});
  const result=await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Comic preparation is still waiting on unresponsive optional artwork after eight seconds')),8000);})]);
  assert.equal(result.books.length,3);assert.equal(result.truncated,false);
  assert.equal(calls,1,'a quarantined native request must retain its worker slot');
  assert.ok(result.books.every(book=>book.needsReview&&!book.scannerPublished),'timeouts cannot invent ready artwork or publish unreviewed comics');
  assert.equal(events.at(-1).processed,3);assert.equal(events.at(-1).total,3);
  release();await delay(10);
  let row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM scanner_vnext_published');assert.equal(row.count,0,'late artwork completion cannot publish a stale result');
  await runtime.refresh(result.books[1].scannerWorkId);
  row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM scanner_vnext_published');assert.equal(row.count,1,'explicit retry can recover after the original worker really settled');assert.equal(calls,2);
  console.log('ThreeFixStallEvidence: 3 comics retained, 1 stalled read quarantined, zero late publications, explicit retry recovered');
 }finally{clearTimeout(timer);release?.();await pending?.catch(()=>undefined);await db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('cancelling an unresponsive artwork read ends preparation but retains its quarantine until actual settlement',async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.three-fix-cancel-')),db=sqlite(path.join(dir,'comics.db'));
 let release,pending,timer,calls=0;
 try{
  let entered;const started=new Promise(resolve=>{entered=resolve;});
  const f=fixture(async()=>{calls++;entered();await new Promise(resolve=>{release=resolve;});return ready;});
  const runtime=await createCatalogueRuntime(db,f.newId,f.ports),controller=new AbortController();
  pending=runtime.scan([folder],[],{},{online:false,automatic:false},{signal:controller.signal});
  const rejected=assert.rejects(pending,/cancel/i);
  await started;controller.abort();
  await Promise.race([rejected,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Cancellation remained blocked on optional artwork')),1000);})]);
  const retry=await runtime.scan([folder],[],{},{online:false,automatic:false});
  assert.equal(retry.books.length,3);assert.equal(calls,1,'restart cannot grow an unbounded set of abandoned native reads');
  const row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM scanner_vnext_published');assert.equal(row.count,0);
 }finally{clearTimeout(timer);release?.();await pending?.catch(()=>undefined);await db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
