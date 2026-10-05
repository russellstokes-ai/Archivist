const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');

require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);
const {groupLocalWorks}=require('./localWorks.ts');

function audio(id,uri,extra={}){
  return {
    id,uri,title:'Track '+id,author:'Author',series:'',genre:'',format:'Audio',
    space:'Audiobooks',available:true,coverShape:'square',identificationConfidence:'high',
    needsReview:false,reviewReason:'',...extra,
  };
}

// Large catalogue: deterministic one-work-per-book behavior beyond the earlier 5k fixture.
const huge=Array.from({length:12000},(_,index)=>({
  id:index+1,
  uri:'content://provider/tree/primary%3ABooks/document/primary%3ABooks%2FAuthor%2FBook%20'+String(index).padStart(5,'0')+'.epub',
  title:'Book '+String(index).padStart(5,'0'),
  author:'Author '+(index%400),
  series:'',
  genre:'',
  format:'EPUB',
  space:'Books',
  available:true,
  coverShape:'portrait',
  coverUri:'content://provider/cover/'+index+'.jpg',
  identificationConfidence:'high',
  needsReview:false,
  reviewReason:'',
  sourceUri:'content://provider/tree/primary%3ABooks',
}));
const hugeWorks=groupLocalWorks(huge);
assert.equal(hugeWorks.length,12000,'12k independent books must remain 12k works');
assert.equal(hugeWorks[0].title,'Book 00000');
assert.equal(hugeWorks[11999].title,'Book 11999');

// 1,000-track audiobook must remain one ordered work.
const thousand=Array.from({length:1000},(_,index)=>audio(
  20000+index,
  'content://provider/tree/primary%3AAudiobooks/document/primary%3AAudiobooks%2FLong%20Book%2FLong%20Book%20-%20Chapter%20'+String(index+1).padStart(4,'0')+'.mp3',
  {title:'Chapter '+(index+1),author:'Long Author',trackNumber:index+1},
));
const thousandWorks=groupLocalWorks(thousand);
assert.equal(thousandWorks.length,1,'1,000-track audiobook must remain one work');
assert.equal(thousandWorks[0].files,1000);
assert.equal(thousandWorks[0].tracks[0].trackNumber,1);
assert.equal(thousandWorks[0].tracks[999].trackNumber,1000);

// Author folder may contain standalone M4Bs plus two separate chapter books.
const mixed=[
  audio(31001,'content://provider/document/primary:Audiobooks%2FFrank%20Herbert%2FGod%20Emperor.m4b',{title:'God Emperor of Dune',author:'Frank Herbert'}),
  audio(31002,'content://provider/document/primary:Audiobooks%2FFrank%20Herbert%2FHeretics.m4b',{title:'Heretics of Dune',author:'Frank Herbert'}),
  audio(31003,'content://provider/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20-%20Chapter%2001.mp3',{title:'Chapter 1',author:'Frank Herbert'}),
  audio(31004,'content://provider/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20-%20Chapter%2002.mp3',{title:'Chapter 2',author:'Frank Herbert'}),
  audio(31005,'content://provider/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Messiah%20-%20Chapter%2001.mp3',{title:'Chapter 1',author:'Frank Herbert'}),
  audio(31006,'content://provider/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Messiah%20-%20Chapter%2002.mp3',{title:'Chapter 2',author:'Frank Herbert'}),
];
const mixedWorks=groupLocalWorks(mixed);
assert.equal(mixedWorks.length,4,'standalone M4Bs and two chapter books in one author folder must remain four works');
assert.deepEqual(mixedWorks.map(work=>work.files),[1,1,2,2]);

// Load the pure Living Book reducer without dragging the playback implementation into the test.
const playerSource=fs.readFileSync(__dirname+'/playerExperience.ts','utf8');
const playerOut=ts.transpileModule(playerSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const playerMod={exports:{}};
const req=id=>id==='./playback'?{}:require(id);
vm.runInNewContext('(function(require,module,exports){'+playerOut+'\n})(req,module,module.exports)',{
  req,require:req,module:playerMod,exports:playerMod.exports,
});
const motionApi=playerMod.exports;
let motion=motionApi.initialLivingBookMotion(false);
motion=motionApi.reduceLivingBookMotion(motion,{type:'play-request'});
motion=motionApi.reduceLivingBookMotion(motion,{type:'open-complete'});
motion=motionApi.reduceLivingBookMotion(motion,{type:'turn-request'});
motion=motionApi.reduceLivingBookMotion(motion,{type:'visibility-change',visible:false});
assert.equal(motion.phase,'turning','leaving Player must not mutate an in-flight page turn');
motion=motionApi.reduceLivingBookMotion(motion,{type:'pause-request'});
assert.equal(motion.phase,'turning');
assert.equal(motion.closeAfterSettle,true);
motion=motionApi.reduceLivingBookMotion(motion,{type:'turn-complete'});
assert.equal(motion.phase,'settling');
motion=motionApi.reduceLivingBookMotion(motion,{type:'settle-complete'});
assert.equal(motion.phase,'closing');

// Cross-module release contracts that protect crash/lifecycle and SAF behavior.
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const stage=fs.readFileSync(__dirname+'/localStageStore.ts','utf8');
const library=fs.readFileSync(__dirname+'/localLibrary.ts','utf8');
const sorter=fs.readFileSync(__dirname+'/localWorkSort.ts','utf8');
const canvas=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const enrichment=fs.readFileSync(__dirname+'/localEnrichment.ts','utf8');
const cover=fs.readFileSync(__dirname+'/coverCache.ts','utf8');

assert(app.includes('const generation=await beginLocalStageScan()'),'scan must start in an isolated staging generation');
assert(app.includes('await stageLocalScanBooks(generation,batch,ordinal)'),'scan batches must persist incrementally before commit');
assert(app.includes('await commitLocalStageScan(generation,options.replaceSources)'),'only a completed scan may publish staged rows');
assert(app.includes('await abandonLocalStageScan(generation)'),'failed/interrupted scan must abandon staged rows');
assert(stage.includes('CREATE TABLE IF NOT EXISTS local_scan_assets'),'staged scans must use a separate crash-safe table');
assert(stage.includes("DELETE FROM local_scan_assets WHERE scan_generation = ?"),'abandoned generations must be removable without touching committed assets');
assert(stage.includes('withExclusiveTransactionAsync'),'staged publication must be transactional');

assert(app.includes("AppState.addEventListener('change'"),'app lifecycle handler is required');
assert(app.includes("if(state!=='active'){void pauseActiveOfflineDownload();void persistLocalPlaybackPosition();}"),'backgrounding must persist playback and pause active downloads');

assert(library.includes('cancelTreeScan: (scanId: string) => Promise<boolean>'),'native discovery must remain cancellable');
assert(sorter.includes('sourceTreeUri:string'),'sorter must retain exact selected SAF tree identity');
assert.equal(library.includes('rootUriFromFileUri'),false,'SAF roots must never be reconstructed from child document URIs');

assert(enrichment.includes('workConcurrency=Math.max(1,Math.min(3'),'metadata workers must remain bounded');
assert(cover.includes('createDownloadResumable'),'cover downloads must remain cancellable');
assert(canvas.includes('createDownloadResumable'),'authenticated Living Book covers must remain cancellable');
assert(canvas.includes('const W=174,H=256,N=64'),'release renderer must remain the corrected 64-strip Canvas implementation');
assert.equal(app.includes('Animated.loop(Animated.sequence(['),false,'release Player must not bypass the Living Book state machine');

console.log('PASS: release hardening covers 12k works, 1k-track audio, crash staging, lifecycle, SAF, network and Living Book state');
