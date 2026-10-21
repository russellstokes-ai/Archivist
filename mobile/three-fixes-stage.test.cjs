const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const {test}=require('node:test');
function loader(mocks={}){
 const cache=new Map();
 function load(file){
  file=path.resolve(__dirname,file);if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(js,{exports,require:name=>{
   if(name in mocks)return mocks[name];
   if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.ts'));
   throw Error('Unexpected dependency '+name);
  },setTimeout,clearTimeout,setInterval,clearInterval,AbortController,console,Date,Promise},{filename:file});
  return exports;
 }
 return load;
}
function fakeStage({onInsert=()=>{},enqueue=fn=>fn()}={}){
 let committed=['previous library'],pending=null,commits=0,rollbacks=0,insertCalls=0;
 const insert=async(uri,payload,ordinal)=>{pending.push(uri);await onInsert(pending.length,{uri,payload,ordinal});};
 const db={execAsync:async()=>{},withExclusiveTransactionAsync:async fn=>{
  pending=committed.slice();
  const tx={runAsync:async(sql,...params)=>{
   if(sql.startsWith('DELETE'))pending=[];
   else if(sql.includes('INSERT INTO local_assets')){
    insertCalls++;assert.ok(params.length<=320,'bounded native parameter batch');
    for(let i=0;i<params.length;i+=5)await insert(params[i],params[i+2],params[i+3]);
   }else throw Error('Unexpected SQL '+sql);
  },prepareAsync:async()=>({
   executeAsync:async row=>{insertCalls++;await insert(row.$uri,row.$payload,row.$ordinal);},finalizeAsync:async()=>{}
  })};
  try{await fn(tx);committed=pending;commits++;}catch(e){rollbacks++;throw e;}finally{pending=null;}
 }};
 const api=loader({'expo-sqlite':{openDatabaseAsync:async()=>db},'./scannerVNext/metadataWrites':{metadataWrite:enqueue}})('localStageStore.native.ts');
 return {api,state:()=>({committed,commits,rollbacks,insertCalls})};
}
const books=n=>Array.from({length:n},(_,id)=>({id:id+1,uri:'content://test/comic-'+id,rootUri:'content://test',title:'Comic '+id}));
test('cancelled queued replacement never deletes the completed library',async()=>{
 let resume;let current=true;
 const {api,state}=fakeStage({enqueue:fn=>new Promise((resolve,reject)=>{resume=()=>Promise.resolve().then(fn).then(resolve,reject);})});
 const pending=api.replaceLocalStageBooks(books(3),{shouldContinue:()=>current});
 await new Promise(r=>setImmediate(r));current=false;resume();
 await assert.rejects(pending,/cancel/i);assert.deepEqual(state().committed,['previous library']);assert.equal(state().commits,0);
});
test('cancellation during a large save rolls back the entire replacement',async()=>{
 let current=true;
 const {api,state}=fakeStage({onInsert:n=>{if(n===2)current=false;}});
 await assert.rejects(api.replaceLocalStageBooks(books(100),{shouldContinue:()=>current}),/cancel/i);
 assert.deepEqual(state().committed,['previous library']);assert.equal(state().commits,0);assert.equal(state().rollbacks,1);
});
test('successful save reports real rows and only then committed completion',async()=>{
 const events=[];const {api,state}=fakeStage();
 await api.replaceLocalStageBooks(books(129),{onProgress:event=>events.push({...event})});
 assert.equal(state().committed.length,129);assert.equal(state().commits,1);
 assert.ok(events.some(e=>e.stage==='waiting'));
 assert.ok(events.some(e=>e.stage==='saving'&&e.processed>0&&e.processed<129));
 assert.equal(events.at(-1).stage,'committed');assert.equal(events.at(-1).processed,129);assert.equal(events.at(-1).total,129);
});
test('catalogue saving uses bounded batches rather than one native call per book',async()=>{
 const {api,state}=fakeStage();await api.replaceLocalStageBooks(books(1000));
 assert.equal(state().committed.length,1000);assert.ok(state().insertCalls<=20,'1000 rows should need at most 20 native inserts, not 1000');
});
test('failed row rolls back rather than publishing a partial library',async()=>{
 const {api,state}=fakeStage({onInsert:n=>{if(n===2)throw Error('Disk full');}});
 await assert.rejects(api.replaceLocalStageBooks(books(10)),/Disk full/);
 assert.deepEqual(state().committed,['previous library']);assert.equal(state().commits,0);
});
test('manual metadata and original ordinals survive the bulk-save path',async()=>{
 const rows=[];const {api}=fakeStage({onInsert:(_n,row)=>rows.push(row)});
 const input=books(3);input[0].metadataSource='manual';input[0].title='My corrected title';input[1].uri='';
 await api.replaceLocalStageBooks(input);
 assert.deepEqual(rows.map(r=>r.ordinal),[0,2]);assert.deepEqual(JSON.parse(rows[0].payload),input[0]);assert.deepEqual(JSON.parse(rows[1].payload),input[2]);
});
test('empty completed scan can atomically clear the stage',async()=>{
 const {api,state}=fakeStage();await api.replaceLocalStageBooks([]);
 assert.deepEqual(state().committed,[]);assert.equal(state().commits,1);
});
test('a pending native write retains queue ownership until it actually settles',async()=>{
 const {createWriteQueue}=loader()('scannerVNext/metadataWrites.ts');const write=createWriteQueue();
 let release;const seen=[];
 const first=write(()=>new Promise(resolve=>{release=()=>{seen.push('first');resolve();};}));
 const second=write(async()=>{seen.push('second');});
 await new Promise(r=>setImmediate(r));assert.deepEqual(seen,[]);release();await Promise.all([first,second]);assert.deepEqual(seen,['first','second']);
});
