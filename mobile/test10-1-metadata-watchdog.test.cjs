const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const never=()=>new Promise(()=>{});
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'},NativeModules:{}};
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///app/Documents/',
    StorageAccessFramework:{
      async readDirectoryAsync(){return [];},
      async makeDirectoryAsync(){return '';},
      async createFileAsync(){return '';},
      async copyAsync(){},
      async deleteAsync(){},
    },
    async getInfoAsync(){return {exists:true,size:1024,modificationTime:1};},
    async readAsStringAsync(){return '';},
    async readDirectoryAsync(){return [];},
    async copyAsync(){},
    async deleteAsync(){},
    async makeDirectoryAsync(){},
  };
  if(request==='./libraryIntelligence')return {
    applyLocalMetadata:x=>x,
    applyResolvedLocalMetadata:(base)=>base,
    decodedPathParts:uri=>String(uri).split('/'),
    inferLocalBookMetadata:()=>({}),
    isGenericMediaTitle:()=>false,
    parseLocalSidecar:()=>({}),
    logicalWorkKey:book=>'work:'+book.title,
    editionKey:book=>'edition:'+book.title,
    sanitizeDiscoveredMetadata:fields=>fields||{},
  };
  if(request==='./metadataResolution')return {resolveMetadataCandidates:()=>({provenance:{},confidence:{},conflicts:[]})};
  if(request==='./embeddedMetadata')return {extractEmbeddedMetadata:never};
  if(request==='./audioMetadata')return {extractAudioMetadata:never};
  if(request==='./coverDiscovery')return {discoverEmbeddedCover:never};
  if(request==='./onlineBookMetadata')return {lookupOnlineBook:async()=>({}),mergeOnlineBookCandidate:x=>x,shouldLookupBookOnline:()=>false};
  if(request==='./onlineComicMetadata')return {lookupOnlineComic:async()=>({}),mergeOnlineComicCandidate:x=>x,shouldLookupComicOnline:()=>false};
  if(request==='./metadataSync')return {
    audioWorkGroupKeys:()=>new Map(),
    canonicalMetadataForBooks:()=>({provenance:{}}),
    synchronizeLocalMetadataCooperative:async books=>({books}),
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {enrichLocalEmbeddedMetadata,enrichLocalBookCovers}=require('./localLibrary.ts');

const books=Array.from({length:1000},(_,index)=>({
  id:index+1,
  uri:'content://library/Book-'+(index+1)+'.epub',
  title:'Book '+(index+1),
  author:'Author',
  series:'',
  genre:'',
  format:'EPUB',
  space:'Library',
  available:true,
  needsReview:false,
  fileSize:1024,
}));

(async()=>{
  let ticks=0;
  const ticker=setInterval(()=>{ticks++;},1);
  const progress=[];
  const started=Date.now();
  const embedded=await enrichLocalEmbeddedMetadata(books,{
    refreshMetadata:true,
    itemTimeoutMs:30,
    maxConsecutiveTimeouts:1,
    batchSize:4,
    onBatch:(_items,state)=>progress.push({...state}),
  });
  const elapsed=Date.now()-started;
  clearInterval(ticker);

  assert.equal(embedded.timedOut,1,'a hung embedded parser must be cut off by the item watchdog');
  assert.equal(embedded.skipped,999,'after the timeout threshold the remaining heavy local reads must be skipped for this refresh');
  assert.equal(embedded.processed,1000,'stage progress must advance to its terminal state rather than remain at 28%');
  assert.ok(elapsed<1000,'a hung first parser must not pin a large library refresh');
  assert.ok(ticks>0,'watchdog path must yield to the event loop');
  assert.equal(progress.at(-1).processed,1000);
  assert.match(progress.find(item=>item.current)?.current||'',/Book 1|Skipped remaining/);

  const coverProgress=[];
  const coverStarted=Date.now();
  const covers=await enrichLocalBookCovers(books,{
    itemTimeoutMs:30,
    maxConsecutiveTimeouts:1,
    batchSize:4,
    onBatch:(_items,state)=>coverProgress.push({...state}),
  });
  assert.equal(covers.timedOut,1,'a hung cover extractor must also be cut off');
  assert.equal(covers.skipped,999,'cover recovery must fail forward instead of moving the freeze to the next stage');
  assert.ok(Date.now()-coverStarted<1000);
  assert.ok(coverProgress.some(item=>/Skipped remaining cover reads/.test(item.current||'')));

  console.log('PASS: Test 10.1 metadata and cover watchdogs fail forward on a 1,000-item library instead of freezing');
})().catch(error=>{console.error(error);process.exitCode=1;});
