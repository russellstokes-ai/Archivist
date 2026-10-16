// QUARANTINED expected-RED regression; no production stateStore changes.
// This script uses an entirely in-memory Expo FileSystem and tests failure
// recovery without touching actual scanner, Assist, user media or private data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const files=new Map();
const dirs=new Set(['file:///docs/']);
let injectFullDisk=false;
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='expo-secure-store')return {
    async getItemAsync(){return null},
    async setItemAsync(){},
    async deleteItemAsync(){}
  };
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///docs/',
    async getInfoAsync(uri){return {exists:files.has(uri)||dirs.has(uri)}},
    async makeDirectoryAsync(uri){dirs.add(uri)},
    async readAsStringAsync(uri){if(!files.has(uri))throw Error('ENOENT');return files.get(uri)},
    async writeAsStringAsync(uri,value){
      if(injectFullDisk){files.set(uri,'{incomplete');throw Error('ENOSPC simulated')}
      files.set(uri,value);
    },
    async copyAsync({from,to}){if(!files.has(from))throw Error('ENOENT');files.set(to,files.get(from))},
    async deleteAsync(uri){files.delete(uri)},
  };
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(
  ts.transpileModule(fs.readFileSync(file,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText,file
);
const {getPersistedJSON,setPersistedJSON}=require('./stateStore.ts');

(async()=>{
  const failures=[];

  try{
    const key='archivist.bookmarks.recovery';
    const name='file:///docs/archivist-state/archivist.bookmarks.recovery.json';
    const original=JSON.stringify({page:42,notes:'must survive'});
    files.set(name,'{corrupted from earlier interrupted write');
    files.set(name+'.bak',original);
    const recovered=await getPersistedJSON(key);
    assert.deepEqual(recovered,JSON.parse(original));
    injectFullDisk=true;
    await assert.rejects(()=>setPersistedJSON(key,{page:99}),/ENOSPC/);
    injectFullDisk=false;
    // Fail closed: neither a corrupted primary nor a failed new write may
    // destroy the only verified bookmark/state backup.
    assert.equal(files.get(name+'.bak'),original,'last valid backup overwritten by invalid primary');
    assert.deepEqual(await getPersistedJSON(key),JSON.parse(original),
      'failed save lost previously recoverable reading position');
  }catch(error){injectFullDisk=false;failures.push('backup durability: '+error.stack)}

  try{
    // Both are legitimate arbitrary persistence keys but the path sanitiser
    // maps them to the SAME basename. Separate library/profile keys must be
    // independent. Changing filenames requires a collision-safe migration.
    const first='archivist/a:b',second='archivist:a/b';
    await setPersistedJSON(first,{source:'first',position:17});
    await setPersistedJSON(second,{source:'second',position:93});
    assert.deepEqual(await getPersistedJSON(first),{source:'first',position:17},
      'persistence-key filename collision leaked or overwrote another state entry');
    assert.deepEqual(await getPersistedJSON(second),{source:'second',position:93});
  }catch(error){failures.push('key isolation: '+error.stack)}

  if(failures.length){
    for(const failure of failures)console.error(failure);
    console.error('EXPECTED RED: '+failures.length+' independent general state-store integrity failures require crash-safe staged writes and collision-safe backward-compatible migration');
    process.exitCode=1;
    return;
  }
  console.log('PASS: backup survives failed replacement and unrelated keys never alias on disk');
})().catch(e=>{console.error(e);process.exitCode=1});
