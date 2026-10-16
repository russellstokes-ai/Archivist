const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const original=Module._load;
const nativeFiles=new Map(),deleted=[];
const uri='file:///test/android-auto/progress.json';
Module._load=function(name,parent,main){
  if(name==='react-native')return {Platform:{OS:'android'}};
  if(name==='expo-file-system/legacy')return {
    documentDirectory:'file:///test/',
    async getInfoAsync(path){return {exists:nativeFiles.has(path),size:nativeFiles.get(path)?.length}},
    async readAsStringAsync(path){if(!nativeFiles.has(path))throw Error('ENOENT');return nativeFiles.get(path)},
    async readDirectoryAsync(){return []},
    async deleteAsync(path){deleted.push(path);nativeFiles.delete(path)},
    async writeAsStringAsync(path,value){nativeFiles.set(path,value)},
    async makeDirectoryAsync(){},
  };
  return original.call(this,name,parent,main);
};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {consumeAndroidAutoProgress,acknowledgeAndroidAutoProgress,sameAndroidAutoProgress}=require('./androidAuto.ts');

(async()=>{
  const event={version:1,workKey:'audio:book:1',trackUri:'file:///book/one.m4b',
    seconds:123.5,complete:false,updatedAt:1111};
  nativeFiles.set(uri,JSON.stringify(event));
  const parsed=await consumeAndroidAutoProgress();
  assert.deepEqual(parsed,event);
  assert.equal(deleted.length,0,'native progress file must NEVER be deleted while unacknowledged');

  let receipt=null,applied=0,failApply=true,failReceipt=false;
  const handlers={
    readReceipt:async()=>receipt,
    persistReceipt:async value=>{if(failReceipt)throw Error('simulated receipt disk full');receipt={...value}},
    apply:async value=>{applied++;if(failApply)throw Error('simulated persisted progress write failure')},
  };
  await assert.rejects(acknowledgeAndroidAutoProgress(event,handlers),/progress write failure/);
  assert.equal(receipt,null,'failed phone progress persistence cannot consume event');
  assert(nativeFiles.has(uri));
  failApply=false;failReceipt=true;
  await assert.rejects(acknowledgeAndroidAutoProgress(event,handlers),/receipt disk full/);
  assert.equal(receipt,null,'failed receipt must leave event eligible for replay');
  failReceipt=false;
  assert.equal(await acknowledgeAndroidAutoProgress(event,handlers),true);
  assert(sameAndroidAutoProgress(event,receipt),'receipt must contain complete event identity');
  assert.equal(await acknowledgeAndroidAutoProgress(event,handlers),false,'same event must not replay after durable acknowledgment');
  assert.equal(applied,3,'replay before acknowledgment must be idempotently possible');
  assert(nativeFiles.has(uri),'native source survives even after receipt; no read/delete race');

  // A newer car event must NOT be removed by acknowledging an older event,
  // including two events written during the same millisecond.
  const next={...event,trackUri:'file:///book/two.m4b',seconds:7,updatedAt:event.updatedAt};
  nativeFiles.set(uri,JSON.stringify(next));
  assert.deepEqual(await consumeAndroidAutoProgress(),next);
  assert(!sameAndroidAutoProgress(next,receipt));
  assert.equal(await acknowledgeAndroidAutoProgress(next,handlers),true);
  assert(sameAndroidAutoProgress(next,receipt));
  assert.equal(deleted.length,0);

  // Invalid/malformed native output is left untouched and NOT acknowledged.
  for(const raw of ['{bad json',JSON.stringify({...next,seconds:Infinity}),
    JSON.stringify({...next,seconds:-1}),JSON.stringify({...next,version:7})]){
    nativeFiles.set(uri,raw);
    assert.equal(await consumeAndroidAutoProgress(),null);
    assert.equal(nativeFiles.get(uri),raw);
  }

  console.log('PASS: Android Auto progress is nondestructive, acknowledged only after durable phone state, replayable after disk failure and race-safe');
})().catch(error=>{console.error(error);process.exitCode=1});
