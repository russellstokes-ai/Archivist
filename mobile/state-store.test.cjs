const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');

const originalLoad=Module._load;
const files=new Map();
const dirs=new Set(['file:///docs/']);
const secure=new Map();
const deletedSecure=[];
let delayedValue='',releaseDelayed;
const delayed=new Promise(resolve=>{releaseDelayed=resolve;});
const fsMock={
  documentDirectory:'file:///docs/',
  async getInfoAsync(uri){return {exists:files.has(uri)||dirs.has(uri)};},
  async makeDirectoryAsync(uri){dirs.add(uri);},
  async readAsStringAsync(uri){if(!files.has(uri))throw Error('missing');return files.get(uri);},
  async writeAsStringAsync(uri,value){if(value===delayedValue)await delayed;files.set(uri,value);},
  async copyAsync({from,to}){if(!files.has(from))throw Error('missing');files.set(to,files.get(from));},
  async deleteAsync(uri){files.delete(uri);},
};
const secureMock={
  async getItemAsync(key){return secure.get(key)||null;},
  async setItemAsync(key,value){secure.set(key,value);},
  async deleteItemAsync(key){deletedSecure.push(key);secure.delete(key);},
};
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return fsMock;
  if(request==='expo-secure-store')return secureMock;
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);

const {getPersistedJSON,setPersistedJSON,deletePersistedJSON}=require('./stateStore.ts');

(async()=>{
  const key='archivist.localProgress';
  secure.set(key,JSON.stringify({book:42}));
  const migrated=await getPersistedJSON(key);
  assert.deepEqual(migrated,{book:42});
  assert.equal(secure.has(key),false);
  assert.equal(deletedSecure.includes(key),true);
  assert.equal(files.get('file:///docs/archivist-state/archivist.localProgress.json'),JSON.stringify({book:42}));

  await setPersistedJSON(key,{book:99});
  assert.equal(files.get('file:///docs/archivist-state/archivist.localProgress.json.bak'),JSON.stringify({book:42}));
  assert.deepEqual(await getPersistedJSON(key),{book:99});

  files.set('file:///docs/archivist-state/archivist.localProgress.json','{broken');
  assert.deepEqual(await getPersistedJSON(key),{book:42},'corrupt primary must recover from backup');

  await deletePersistedJSON(key);
  assert.equal(files.has('file:///docs/archivist-state/archivist.localProgress.json'),false);
  assert.equal(files.has('file:///docs/archivist-state/archivist.localProgress.json.bak'),false);

  delayedValue=JSON.stringify({book:100});
  const older=setPersistedJSON(key,{book:100});
  const newer=setPersistedJSON(key,{book:101});
  await new Promise(resolve=>setImmediate(resolve));
  releaseDelayed();
  await Promise.all([older,newer]);
  assert.deepEqual(await getPersistedJSON(key),{book:101},'overlapping writes must preserve the newest state');

  console.log('PASS: growing mobile state migrates from SecureStore, keeps a backup, recovers corruption, serializes overlapping writes and deletes cleanly');
})().catch(e=>{console.error(e);process.exitCode=1;});
