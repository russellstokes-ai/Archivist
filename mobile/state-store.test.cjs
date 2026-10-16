const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const originalLoad=Module._load;
const files=new Map(),dirs=new Set(['file:///docs/']),secure=new Map(),deletedSecure=[];
let delayNextWrite=false,releaseDelayed,pausedAtWrite=false,failWrite=false;
const delayed=new Promise(resolve=>{releaseDelayed=resolve});
const root='file:///docs/archivist-state/';
const fsMock={
  documentDirectory:'file:///docs/',
  async getInfoAsync(uri){return {exists:files.has(uri)||dirs.has(uri),size:files.get(uri)?.length}},
  async makeDirectoryAsync(uri){dirs.add(uri)},
  async readAsStringAsync(uri){if(!files.has(uri))throw Error('ENOENT');return files.get(uri)},
  async writeAsStringAsync(uri,value){
    if(delayNextWrite){delayNextWrite=false;pausedAtWrite=true;await delayed}
    if(failWrite){files.set(uri,'{torn write');throw Error('ENOSPC simulated')}
    files.set(uri,value)
  },
  async deleteAsync(uri){files.delete(uri)},
};
const secureMock={
  async getItemAsync(key){return secure.get(key)||null},
  async setItemAsync(key,value){secure.set(key,value)},
  async deleteItemAsync(key){deletedSecure.push(key);secure.delete(key)},
};
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return fsMock;
  if(request==='expo-secure-store')return secureMock;
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {getPersistedJSON,setPersistedJSON,setPersistedJSONArrayCooperative,deletePersistedJSON}=require('./stateStore.ts');
const prefix=key=>root+'k'+Buffer.from(key,'utf8').toString('hex');
const activeRecords=key=>[0,1,2].map(i=>prefix(key)+'.s'+i+'.json').filter(x=>files.has(x));
const oldName=key=>root+key+'.json';

(async()=>{
  const key='archivist.localProgress';
  secure.set(key,JSON.stringify({book:42}));
  assert.deepEqual(await getPersistedJSON(key),{book:42},'legacy SecureStore state must migrate');
  assert.equal(secure.has(key),false);
  assert(deletedSecure.includes(key));
  assert.equal(activeRecords(key).length,1);
  assert.deepEqual(await getPersistedJSON(key),{book:42});

  await setPersistedJSON(key,{book:99});
  assert.equal(activeRecords(key).length,2);
  assert.deepEqual(await getPersistedJSON(key),{book:99});

  // If the newest independently written slot is torn, the previous valid
  // generation remains recoverable without touching either scanner or Assist.
  const newest=activeRecords(key).find(uri=>JSON.parse(files.get(uri)).revision===2);
  files.set(newest,'{corrupt newest');
  assert.deepEqual(await getPersistedJSON(key),{book:42});
  await setPersistedJSON(key,{book:101});
  assert.deepEqual(await getPersistedJSON(key),{book:101});

  // Test backwards-compatible legacy primary + backup with only the .bak valid.
  const olderKey='archivist.legacyProgress';
  files.set(oldName(olderKey),'{corrupt old primary');
  files.set(oldName(olderKey)+'.bak',JSON.stringify({chapter:3,seconds:19}));
  assert.deepEqual(await getPersistedJSON(olderKey),{chapter:3,seconds:19});
  failWrite=true;
  await assert.rejects(setPersistedJSON(olderKey,{chapter:4,seconds:20}),/ENOSPC/);
  failWrite=false;
  assert.deepEqual(await getPersistedJSON(olderKey),{chapter:3,seconds:19});
  assert.equal(files.get(oldName(olderKey)+'.bak'),JSON.stringify({chapter:3,seconds:19}));
  await setPersistedJSON(olderKey,{chapter:4,seconds:20});
  assert.deepEqual(await getPersistedJSON(olderKey),{chapter:4,seconds:20});
  assert(files.has(oldName(olderKey)+'.bak'),'original backup must remain available after migration');

  // The three-slot rotation never overwrites the most recent two valid
  // generations, even once storage is full and older slots are reused.
  const hot='archivist.hotPlayback';
  for(let n=1;n<=3;n++)await setPersistedJSON(hot,{seconds:n});
  assert.equal(activeRecords(hot).length,3);
  failWrite=true;
  await assert.rejects(setPersistedJSON(hot,{seconds:4}),/ENOSPC/);
  failWrite=false;
  assert.deepEqual(await getPersistedJSON(hot),{seconds:3});
  await setPersistedJSON(hot,{seconds:5});
  assert.deepEqual(await getPersistedJSON(hot),{seconds:5});

  // Serialized overlapping writes have one deterministic final value.
  const overlap='archivist.concurrent';
  delayNextWrite=true;
  const older=setPersistedJSON(overlap,{book:100});
  const newer=setPersistedJSON(overlap,{book:101});
  for(let i=0;i<12&&!pausedAtWrite;i++)await new Promise(setImmediate);
  assert(pausedAtWrite,'first write was not intercepted');
  releaseDelayed();
  await Promise.all([older,newer]);
  assert.deepEqual(await getPersistedJSON(overlap),{book:101});

  // Collision proof, even when historical characters mapped to the same name.
  const a='archivist/a:b',b='archivist:a/b';
  await setPersistedJSON(a,{id:'A'});
  await setPersistedJSON(b,{id:'B'});
  assert.notEqual(prefix(a),prefix(b));
  assert.deepEqual(await getPersistedJSON(a),{id:'A'});
  assert.deepEqual(await getPersistedJSON(b),{id:'B'});

  // Explicit deletion creates a durable tombstone; it removes legacy bytes,
  // preventing a deleted item from reappearing on restart.
  await deletePersistedJSON(olderKey);
  assert.equal(await getPersistedJSON(olderKey),null);
  assert(!files.has(oldName(olderKey))&&!files.has(oldName(olderKey)+'.bak'));
  assert.equal(activeRecords(olderKey).length,1);

  let ticks=0;
  const ticker=setInterval(()=>{ticks++},0);
  const large=Array.from({length:240},(_,i)=>({id:i,title:'Book '+i,description:'x'.repeat(80)}));
  assert.equal(await setPersistedJSONArrayCooperative('archivist.largeCatalog',large,{batchSize:16}),true);
  clearInterval(ticker);
  assert.deepEqual(await getPersistedJSON('archivist.largeCatalog'),large);
  assert(ticks>0,'cooperative persistence must yield to event loop');

  let count=0;
  assert.equal(await setPersistedJSONArrayCooperative('archivist.cancelledCatalog',large,{
    batchSize:8,shouldContinue:()=>++count<25,
  }),false);
  assert.equal(await getPersistedJSON('archivist.cancelledCatalog'),null);
  await assert.rejects(setPersistedJSON('x'.repeat(200),{}),/longer than/);

  console.log('PASS: v2 three-slot state survives ENOSPC/torn writes, keeps legacy backup, isolates keys, honors tombstones and serialises mobile scanner/player writes');
})().catch(e=>{console.error(e);process.exitCode=1});
