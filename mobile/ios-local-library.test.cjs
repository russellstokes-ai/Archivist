const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const load=Module._load;
const deleted=[];
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'ios'}};
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///app/Documents/',
    StorageAccessFramework:{},
    async deleteAsync(uri,options){deleted.push([uri,options]);},
    async getInfoAsync(){return {exists:false};},
    async readAsStringAsync(){return '';},
    async readDirectoryAsync(){return [];},
    async copyAsync(){},
    async makeDirectoryAsync(){},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {removeLocalFolderSource}=require('./localLibrary.ts');

(async()=>{
  const imported={id:'1',uri:'file:///app/Documents/local-libraries/123-Books',name:'Books',status:'Imported',itemCount:2};
  await removeLocalFolderSource(imported);
  assert.equal(deleted.length,1);
  assert.equal(deleted[0][0],imported.uri);
  assert.equal(deleted[0][1]?.idempotent,true);

  await assert.rejects(
    ()=>removeLocalFolderSource({id:'2',uri:'file:///app/Documents/other/UserFiles',name:'Other',status:'Ready',itemCount:1}),
    /will not delete a folder outside its private imported library/
  );
  assert.equal(deleted.length,1,'Safety rejection must not delete arbitrary app/document paths');
  console.log('PASS: iOS local source removal deletes only Archivist private imports');
})().catch(error=>{console.error(error);process.exitCode=1;});
