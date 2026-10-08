const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const values=new Map();
let nativeCalls=0;
const storage={
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key),
};
const previousSession=globalThis.sessionStorage;
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:storage});

const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'web'}};
  if(request==='expo-secure-store')return {
    getItemAsync(){nativeCalls++;throw new Error('native SecureStore must not run on web')},
    setItemAsync(){nativeCalls++;throw new Error('native SecureStore must not run on web')},
    deleteItemAsync(){nativeCalls++;throw new Error('native SecureStore must not run on web')},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

(async()=>{
  const {secureGetItemAsync,secureSetItemAsync,secureDeleteItemAsync}=require('./secureStorage.ts');
  assert.equal(await secureGetItemAsync('theme'),null);
  await secureSetItemAsync('theme','dark');
  assert.equal(await secureGetItemAsync('theme'),'dark');
  await secureDeleteItemAsync('theme');
  assert.equal(await secureGetItemAsync('theme'),null);
  assert.equal(nativeCalls,0,'web storage must never touch the unavailable native SecureStore bridge');
  console.log('PASS: secure storage avoids native SecureStore on web');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{
  Module._load=load;
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:previousSession});
});