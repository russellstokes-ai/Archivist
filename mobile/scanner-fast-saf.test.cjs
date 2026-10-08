const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const root='content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks';
const dirs=new Map();
let fastQueries=0,fileStatCalls=0,legacyReads=0,metadataPayloadReads=0;
const tree=[];
for(let b=0;b<12;b++){
  const dir=root+'%2FNovel%20'+b;
  tree.push({uri:dir,name:'Novel '+b,isDirectory:true});
  const entries=[];
  const count=b<11?19:18;
  for(let chapter=0;chapter<count;chapter++){
    entries.push({uri:dir+'%2F'+encodeURIComponent(String(chapter+1).padStart(2,'0')+' - Chapter '+(chapter+1))+'.mp3',
      name:(chapter+1)+' - Chapter '+(chapter+1)+'.mp3',
      isDirectory:false,size:1024+chapter,modified:1700000000});
  }
  dirs.set(dir,entries);
}
dirs.set(root,tree);
const realLoad=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'},NativeModules:{ArchivistArchive:{
    async listLibraryDirectory(_root,parentUri){fastQueries++;return dirs.get(parentUri)||[]},
    cancelLibraryDirectoryRead(){},
  }}};
  if(request==='expo-file-system/legacy')return {
    StorageAccessFramework:{async readDirectoryAsync(uri){legacyReads++;return (dirs.get(uri)||[]).map(x=>x.uri)}},
    async readDirectoryAsync(uri){legacyReads++;return (dirs.get(uri)||[]).map(x=>x.uri)},
    async getInfoAsync(){fileStatCalls++;throw new Error('Unexpected per-file stat during fast scan')},
    async readAsStringAsync(){return ''},
  };
  if(request==='./embeddedMetadata')return {async extractEmbeddedMetadata(){metadataPayloadReads++;return {}}};
  if(request==='./audioMetadata')return {async extractAudioMetadata(){metadataPayloadReads++;return {}}};
  if(request==='./coverDiscovery')return {async discoverEmbeddedCover(){return undefined}};
  return realLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);
const {scanLocalFolders}=require('./localLibrary.ts');
const {groupLocalWorks}=require('./localWorks.ts');
(async()=>{
  let tick=0;const heartbeat=setInterval(()=>tick++,0);
  const scan=await scanLocalFolders([{id:root,uri:root,name:'Audiobooks',status:'Ready',itemCount:0}],undefined,{},[],
    {deferEmbeddedCovers:true,deferEmbeddedMetadata:true});
  clearInterval(heartbeat);
  assert.equal(scan.books.length,227,'all physical chapter files must be inventoried');
  assert.equal(groupLocalWorks(scan.books).length,12,'native inventory flows to 12 real work objects');
  assert.equal(fileStatCalls,0,'native projection supplies size/time for every file; do not call getInfoAsync 227 times');
  assert.equal(legacyReads,0,'native provider inventory avoids extra Expo directory reads');
  assert.equal(fastQueries,13,'one DocumentsContract query per folder (one root plus twelve book folders)');
  assert.equal(metadataPayloadReads,0,'initial discovery must not read 227 media payloads');
  assert.ok(tick>0,'yield cooperatively while processing the native inventory');
  console.log('PASS: native directory inventory 227 files, 12 works, 13 queries, zero per-file stats or metadata payload reads');
})().catch(error=>{console.error(error);process.exitCode=1});
