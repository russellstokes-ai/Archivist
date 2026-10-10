const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const dirs=new Map();
const info=new Map();
const deleteFailures=new Set();
const copies=[];
const deleted=[];

function addChild(parent,child){
  const items=dirs.get(parent)||[];
  if(!items.includes(child))dirs.set(parent,[...items,child]);
}
function removeChild(child){
  for(const [parent,items] of dirs){
    if(items.includes(child))dirs.set(parent,items.filter(item=>item!==child));
  }
}
function createdUri(parent,name){return parent+'%2F'+encodeURIComponent(name);}

const saf={
  async readDirectoryAsync(uri){return dirs.get(uri)||[];},
  async makeDirectoryAsync(parent,name){
    const uri=createdUri(parent,name);addChild(parent,uri);if(!dirs.has(uri))dirs.set(uri,[]);return uri;
  },
  async createFileAsync(parent,name){
    const uri=createdUri(parent,name);addChild(parent,uri);info.set(uri,{exists:true,size:0});return uri;
  },
  async copyAsync({from,to}){
    copies.push({from,to});
    const source=info.get(from);
    if(!source?.exists)throw new Error('source missing');
    info.set(to,{exists:true,size:source.size});
  },
  async deleteAsync(uri){
    if(deleteFailures.has(uri))throw new Error('simulated delete failure');
    deleted.push(uri);info.set(uri,{exists:false,size:0});removeChild(uri);
  },
};

const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'},NativeModules:{}};
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///app/Documents/',
    StorageAccessFramework:saf,
    async getInfoAsync(uri){return info.get(uri)||{exists:false,size:0};},
    async copyAsync({from,to}){return saf.copyAsync({from,to});},
    async deleteAsync(uri){return saf.deleteAsync(uri);},
    async makeDirectoryAsync(uri){if(!dirs.has(uri))dirs.set(uri,[]);},
    async readDirectoryAsync(uri){return dirs.get(uri)||[];},
    async readAsStringAsync(){return '';},
  };
  if(request==='./libraryIntelligence')return {
    applyLocalMetadata:x=>x,applyResolvedLocalMetadata:x=>x,decodedPathParts:()=>[],
    inferLocalBookMetadata:()=>({}),isGenericMediaTitle:()=>false,parseLocalSidecar:()=>({}),
    logicalWorkKey:()=>'',editionKey:()=>'',sanitizeDiscoveredMetadata:x=>x,
  };
  if(request==='./metadataResolution')return {resolveMetadataCandidates:()=>({})};
  if(request==='./embeddedMetadata')return {extractEmbeddedMetadata:async()=>({})};
  if(request==='./audioMetadata')return {extractAudioMetadata:async()=>({})};
  if(request==='./coverDiscovery')return {discoverEmbeddedCover:async()=>undefined};
  if(request==='./onlineBookMetadata')return {lookupOnlineBook:async()=>({}),mergeOnlineBookCandidate:x=>x,shouldLookupBookOnline:()=>false};
  if(request==='./onlineComicMetadata')return {lookupOnlineComic:async()=>({}),mergeOnlineComicCandidate:x=>x,shouldLookupComicOnline:()=>false};
  if(request==='./metadataSync')return {
    audioWorkGroupKeys:()=>new Map(),canonicalMetadataForBooks:()=>({provenance:{}}),
    synchronizeLocalMetadataCooperative:async books=>({books}),
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {applyLocalSort,previewLocalSortToRoot,previewLocalSortSafely,recoverLocalSortOperation}=require('./localLibrary.ts');

(async()=>{
  const sourceRoot='content://source/root';
  const targetRoot='content://target/root';
  const source=createdUri(sourceRoot,'Book.epub');
  dirs.set(sourceRoot,[source]);dirs.set(targetRoot,[]);
  info.set(source,{exists:true,size:4096});

  const book={id:1,uri:source,rootUri:sourceRoot,title:'Book',author:'Writer',series:'',genre:'',format:'EPUB',space:'Books',available:true,needsReview:false};
  const preview=previewLocalSortToRoot([book],'author-title',targetRoot)[0];
  assert.equal(preview.sourceRootUri,sourceRoot,'cross-storage preview must preserve the original root');
  assert.equal(preview.rootUri,targetRoot,'destination root must remain separate');
  assert.equal(preview.sourceRelativePath,'Book.epub');
  assert.equal(preview.state,'ready');

  const checkpoints=[];
  const moved=await applyLocalSort([preview],'move',partial=>checkpoints.push(JSON.parse(JSON.stringify(partial))));
  assert.equal(moved.failed.length,0);
  assert.equal(moved.copied.length,1);
  assert.equal(checkpoints.length,2,'move must checkpoint after verified copy and again after source deletion');
  assert.equal(checkpoints[0].copied[0].sourceRemoved,false,'first durable checkpoint must precede destructive deletion');
  assert.equal(checkpoints[1].copied[0].sourceRemoved,true,'second checkpoint must confirm the source was removed');
  assert.equal(info.get(source).exists,false,'Move must actually remove the original after verification');
  const organised=moved.copied[0].uri;
  assert.equal(info.get(organised).exists,true,'verified destination must remain after Move');
  assert.equal(info.get(organised).size,4096);

  // Simulate process death after source deletion but before the post-delete
  // checkpoint was persisted: recovery only has the verified-copy checkpoint.
  const staleHistory={id:'crash-window',createdAt:new Date().toISOString(),mode:'move',copied:checkpoints[0].copied,failed:[],complete:false};
  const recovered=await recoverLocalSortOperation(staleHistory);
  assert.equal(recovered.failed.length,0,'interrupted move must be recoverable');
  assert.equal(recovered.copied.length,1);
  const restoredSource=recovered.copied[0].sourceUri;
  assert.equal(recovered.copied[0].sourceRootUri,sourceRoot,'recovery must preserve the original storage root');
  assert.equal(recovered.copied[0].sourceRelativePath,'Book.epub','recovery must preserve the original relative filename');
  assert.equal(info.get(restoredSource)?.exists,true,'recovery must recreate and verify an original source file');
  assert.equal(info.get(restoredSource)?.size,4096);
  assert.equal(info.get(organised).exists,false,'recovery must remove the organised copy only after the original verifies');

  // A delete failure must never turn Move into data loss. Keep both verified
  // files and surface the item for review.
  const source2=createdUri(sourceRoot,'Second.epub');
  addChild(sourceRoot,source2);info.set(source2,{exists:true,size:2048});
  const preview2=previewLocalSortToRoot([{...book,id:2,uri:source2,title:'Second'}],'author-title',targetRoot)[0];
  deleteFailures.add(source2);
  const failedMove=await applyLocalSort([preview2],'move');
  assert.equal(failedMove.failed.length,1);
  assert.match(failedMove.failed[0].error,/original could not be removed safely/i);
  assert.equal(info.get(source2).exists,true,'failed source deletion must leave the original untouched');
  assert.equal(info.get(failedMove.copied[0].uri).exists,true,'verified destination is retained as the safety copy');
  assert.equal(failedMove.copied[0].sourceRemoved,false);

  const read=saf.readDirectoryAsync;let stalledCalls=0;saf.readDirectoryAsync=()=>{stalledCalls++;return new Promise(()=>{});};
  const pending=await previewLocalSortSafely([book,{...book,id:2,uri:source+'2',title:'Another'}],'author-title',targetRoot);
  assert.ok(pending.every(item=>item.state==='review'));assert.equal(stalledCalls,1,'A stalled provider must not receive more preview reads');saf.readDirectoryAsync=read;
  console.log('PASS: verified moves, interrupted recovery and bounded destination preview');
})().catch(error=>{console.error(error);process.exitCode=1;});
