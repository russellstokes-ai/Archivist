const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/localEnrichment.ts','utf8');
const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function groupLocalWorks(books){
  if(!books.length)return [];
  const first=books[0];
  return [{key:'audio:test',title:first.workTitleHint||first.title,author:first.author||'',series:first.series||'',genre:first.genre||'',publishedYear:first.publishedYear,format:first.format,space:first.space,available:true,files:books.length,tracks:books,needsReview:books.some(x=>x.needsReview),reviewReason:'',coverUri:books.find(x=>x.coverUri)?.coverUri,coverShape:first.format==='Audio'?'square':'portrait'}];
}
const mod={exports:{}};
const req=id=>{
  if(id==='./coverCache')return {cachePortraitCover:async()=>{throw Error('inject dependency')}};
  if(id==='./localLibrary')return {extractLocalAudioArtwork:async()=>null};
  if(id==='./localWorks')return {groupLocalWorks};
  if(id==='./metadataLookup')return {lookupBookMetadata:async()=>null};
  return require(id);
};
vm.runInNewContext('(function(require,module,exports){'+out+'\n})(req,module,module.exports)',{req,require:req,module:mod,exports:mod.exports,setTimeout,clearTimeout,Date});
const x=mod.exports;
assert(x.publishableLocalWork({title:'Dune',needsReview:false,coverUri:'cover.jpg'}));
assert(!x.publishableLocalWork({title:'Dune',needsReview:false}));
assert(!x.publishableLocalWork({title:'Untitled',needsReview:false,coverUri:'cover.jpg'}));
(async()=>{
  const books=[1,2].map(id=>({id,uri:'file://track'+id+'.mp3',title:'Chapter '+id,workTitleHint:'Dune',author:'Frank Herbert',series:'',genre:'',format:'Audio',space:'Audiobooks',available:true,coverShape:'square',metadataSource:'embedded',identificationConfidence:'high',needsReview:false,reviewReason:'',trackNumber:id}));
  const result=await x.enrichLocalCatalogue(books,{},undefined,{
    lookup:async()=>({provider:'open-library',providerId:'OL123W',title:'Dune',authors:['Frank Herbert'],publishedYear:1965,genres:['Science Fiction'],coverUri:'https://covers.example/dune.jpg',confidence:.98}),
    extractAudioArtwork:async()=>({uri:'file://square-audio.jpg',mimeType:'image/jpeg',width:1000,height:1000}),
    cachePortrait:async()=>({uri:'file://portrait-book.jpg',width:640,height:1000,aspectRatio:.64}),
    lookupDelayMs:0,
    now:()=>new Date('2026-10-05T20:00:00Z'),
  });
  assert.equal(result.books.length,2);
  for(const book of result.books){
    assert.equal(book.coverUri,'file://square-audio.jpg','edition art stays square audiobook cover');
    assert.equal(book.coverShape,'square');
    assert.equal(book.livingBookCoverUri,'file://portrait-book.jpg','portrait cover is separate Living Book texture');
    assert.equal(book.livingBookCoverSource,'open-library');
    assert.equal(book.needsReview,false);
  }
  const entry=Object.values(result.cache)[0];
  assert.equal(entry.publishReady,true);
  assert.equal(entry.coverUri,'file://square-audio.jpg');
  assert.equal(entry.livingBookCoverUri,'file://portrait-book.jpg');
  console.log('PASS: enrichment keeps audiobook edition art separate from portrait Living Book art and gates publication');
})().catch(e=>{console.error(e);process.exitCode=1});
