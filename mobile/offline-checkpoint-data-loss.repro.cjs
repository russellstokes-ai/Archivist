// EXPECTED RED against the 2026-10-16 #53/#54 offline helper.
// Standalone manual reproduction for Astra; deliberately NOT *.test.cjs.
// Run after mobile dependencies are installed: cd mobile && node offline-checkpoint-data-loss.repro.cjs
// A passing test must demonstrate the previous user's local bytes are retained
// despite an incompatible checkpoint and failed replacement download.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const originalLoad=Module._load;
const media=new Map();
let attempted=0,deleted=0;
const largeFree=20*1024*1024*1024;
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///docs/',
    makeDirectoryAsync:async()=>undefined,
    getInfoAsync:async uri=>{
      const bytes=media.get(uri);
      return bytes===undefined?{exists:false}:{exists:true,size:bytes.length,isDirectory:false};
    },
    deleteAsync:async uri=>{
      deleted++;
      media.delete(uri);
    },
    createDownloadResumable:()=>{
      return {
        downloadAsync:async()=>{
          attempted++;
          throw Error('simulated network outage before replacement bytes');
        },
        resumeAsync:async()=>{
          attempted++;
          throw Error('simulated network outage during resume');
        },
        pauseAsync:async()=>({resumeData:'mock'}),
      };
    },
    downloadAsync:async()=>{throw Error('unexpected cover request');},
    getFreeDiskStorageAsync:async()=>largeFree,
    getTotalDiskCapacityAsync:async()=>largeFree,
    readDirectoryAsync:async()=>[],
  };
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>{
  const transpiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
  }).outputText;
  module._compile(transpiled,file);
};
const {downloadOfflineWork,offlineKey,offlineDirectory}=require('./offlineLibrary.ts');

(async()=>{
  const session={server:'https://private-library.example',token:'test-token'};
  const work={id:61,title:'Existing personal media',author:'User',series:'',genre:'',format:'Audio',space:'Private'};
  const track={id:55,title:'Original',format:'Audio',edition:9,available:true,
    name:'original.mp3',size:100};
  const dir=offlineDirectory(session.server,work.id);
  const uri=dir+'001-original.mp3';
  const original=Buffer.from('ORIGINAL PERSONAL MEDIA - preserve this exact content even if server copy changed','utf8');
  assert.notEqual(original.length,track.size,'reproducer requires a server-size mismatch');
  media.set(uri,Buffer.from(original));
  const checkpoint={version:1,key:offlineKey(session.server,work.id),
    server:session.server,workId:work.id,title:work.title,directory:dir,
    completedTrackIds:[],updatedAt:new Date().toISOString()};
  const saved=[];
  await assert.rejects(
    downloadOfflineWork(session,work,[track],undefined,{checkpoint,onCheckpoint:cp=>saved.push(cp)}),
    /simulated network outage/,
    'simulate replacement that fails before writing any new media',
  );
  assert.equal(attempted,1,'the replacement attempt must reach the injected failure');
  assert.deepEqual(media.get(uri),original,
    'DATA LOSS: incompatible saved checkpoint deleted the previous local media before replacement completed');
  assert(saved.at(-1),'checkpoint must remain available after failed replacement');
  console.log('PASS: old local media survived incompatible checkpoint, network failure and retry checkpoint retained');
})().catch(err=>{console.error(err);process.exitCode=1;});
