const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/localEnrichment.ts','utf8');
const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function groupLocalWorks(books){
  const groups=new Map();
  for(const book of books){
    const key=book.format==='Audio'?'audio:'+(book.workTitleHint||book.space||'book'):'asset:'+book.uri;
    const group=groups.get(key)||[];group.push(book);groups.set(key,group);
  }
  return [...groups.entries()].map(([key,tracks])=>{
    const first=tracks[0];
    return {key,title:first.workTitleHint||first.title,author:first.author||'',series:first.series||'',genre:first.genre||'',publishedYear:first.publishedYear,format:first.format,space:first.space,available:true,files:tracks.length,tracks,needsReview:tracks.some(x=>x.needsReview),reviewReason:'',coverUri:tracks.find(x=>x.coverUri)?.coverUri,coverShape:first.format==='Audio'?'square':'portrait'};
  });
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
  let capturedLookup;
  const identifiedBook={
    id:90,
    uri:'file://dune.epub',
    title:'Dune',
    author:'Frank Herbert',
    series:'Dune',
    genre:'Science Fiction',
    publishedYear:1965,
    isbn:'9780441172719',
    identifiers:['9780441172719','urn:custom:dune'],
    format:'EPUB',
    space:'Books',
    available:true,
    coverShape:'portrait',
    metadataSource:'sidecar',
    identificationConfidence:'high',
    needsReview:false,
    reviewReason:'',
  };
  await x.enrichLocalCatalogue([identifiedBook],{},undefined,{
    lookup:async input=>{
      capturedLookup=input;
      return {provider:'open-library',providerId:'OLDUNE',title:'Dune',authors:['Frank Herbert'],isbns:['9780441172719'],coverUri:'https://covers.example/dune.jpg',confidence:1};
    },
    extractAudioArtwork:async()=>null,
    cachePortrait:async()=>({uri:'file://dune-portrait.jpg',width:640,height:1000,aspectRatio:.64}),
    lookupDelayMs:0,
    now:()=>new Date('2026-10-05T20:00:00Z'),
  });
  assert.equal(capturedLookup.isbn,'9780441172719','work ISBN must be passed to online enrichment');
  assert.equal(capturedLookup.identifiers.includes('9780441172719'),true);
  assert.equal(capturedLookup.identifiers.includes('urn:custom:dune'),true);

  const staleBook={
    id:91,
    uri:'file://same.epub',
    title:'Dune Messiah',
    author:'Frank Herbert',
    series:'Dune',
    genre:'Science Fiction',
    publishedYear:1969,
    format:'EPUB',
    space:'Books',
    available:true,
    coverShape:'portrait',
    metadataSource:'path',
    identificationConfidence:'high',
    needsReview:false,
    reviewReason:'',
    assetSignature:'stable-file',
  };
  const staleWork=groupLocalWorks([staleBook])[0];
  const staleFingerprint=x.localWorkFingerprint(staleWork);
  const staleCache={
    [staleFingerprint]:{
      version:2,
      fingerprint:staleFingerprint,
      querySignature:'dune|frank herbert|dune|1965',
      title:'Dune',
      author:'Frank Herbert',
      series:'Dune',
      genre:'Science Fiction',
      publishedYear:1965,
      coverUri:'file://stale-cover.jpg',
      coverShape:'portrait',
      livingBookCoverUri:'file://stale-cover.jpg',
      livingBookCoverSource:'open-library',
      livingBookCoverConfidence:.99,
      metadataProvider:'open-library',
      metadataProviderId:'OLD-DUNE',
      identityReady:true,
      publishReady:true,
      reviewReason:'',
      updatedAt:'2026-10-01T00:00:00.000Z',
    },
    orphan:{
      version:2,
      fingerprint:'orphan',
      querySignature:'orphan',
      title:'Deleted Book',
      author:'Nobody',
      series:'',
      genre:'',
      coverUri:'file://orphan.jpg',
      coverShape:'portrait',
      identityReady:true,
      publishReady:true,
      reviewReason:'',
      updatedAt:'2026-10-01T00:00:00.000Z',
    },
  };
  let staleLookupCalls=0;
  const staleResult=await x.enrichLocalCatalogue([staleBook],staleCache,undefined,{
    lookup:async input=>{
      staleLookupCalls++;
      assert.equal(input.title,'Dune Messiah');
      return {
        provider:'open-library',
        providerId:'DUNE-MESSIAH',
        title:'Dune Messiah',
        authors:['Frank Herbert'],
        publishedYear:1969,
        genres:['Science Fiction'],
        coverUri:'https://covers.example/dune-messiah.jpg',
        confidence:.99,
      };
    },
    extractAudioArtwork:async()=>null,
    cachePortrait:async()=>({uri:'file://dune-messiah.jpg',width:640,height:1000,aspectRatio:.64}),
    lookupDelayMs:0,
    now:()=>new Date('2026-10-05T21:00:00Z'),
  });
  assert.equal(staleLookupCalls,1,'successful cache entries must invalidate when identity evidence changes');
  assert.equal(staleResult.books[0].title,'Dune Messiah');
  assert.equal(staleResult.books[0].coverUri,'file://dune-messiah.jpg');
  assert.equal(Object.prototype.hasOwnProperty.call(staleResult.cache,'orphan'),false,'orphaned enrichment fingerprints must be dropped from the active result cache');

  const firstUnresolved={
    id:92,
    uri:'file://mystery.epub',
    title:'mystery',
    author:'',
    series:'',
    genre:'',
    format:'EPUB',
    space:'Books',
    available:true,
    coverShape:'portrait',
    metadataSource:'path',
    identificationConfidence:'low',
    needsReview:true,
    reviewReason:'Unknown',
    assetSignature:'mystery-v1',
    metadataContextSignature:'ctx-a',
  };
  let weakLookupCalls=0;
  const unresolved=await x.enrichLocalCatalogue([firstUnresolved],{},undefined,{
    lookup:async()=>{weakLookupCalls++;throw Error('weak discoveries must stay in review')},
    extractAudioArtwork:async()=>null,
    cachePortrait:async()=>{throw Error('weak discoveries must not fetch covers')},
    lookupDelayMs:0,
    now:()=>new Date('2026-10-05T21:00:00Z'),
  });
  assert.equal(weakLookupCalls,0,'title-only uncertain discoveries must not trigger automatic online lookup');
  assert.equal(unresolved.books[0].needsReview,true);
  assert.equal(Object.values(unresolved.cache)[0].publishReady,false);

  const isbnUnresolved={...firstUnresolved,id:921,uri:'file://isbn-mystery.epub',isbn:'9780441172719',identifiers:['9780441172719'],assetSignature:'isbn-v1'};
  let isbnLookupCalls=0;
  const isbnResolved=await x.enrichLocalCatalogue([isbnUnresolved],{},undefined,{
    lookup:async input=>{
      isbnLookupCalls++;
      assert.equal(input.isbn,'9780441172719');
      return {
        provider:'open-library',
        providerId:'ISBN-DUNE',
        title:'Dune',
        authors:['Frank Herbert'],
        publishedYear:1965,
        coverUri:'https://covers.example/dune-isbn.jpg',
        confidence:1,
      };
    },
    extractAudioArtwork:async()=>null,
    cachePortrait:async()=>({uri:'file://dune-isbn.jpg',width:640,height:1000,aspectRatio:.64}),
    lookupDelayMs:0,
    now:()=>new Date('2026-10-05T21:05:00Z'),
  });
  assert.equal(isbnLookupCalls,1,'an exact ISBN may resolve an otherwise incomplete work automatically');
  assert.equal(isbnResolved.books[0].title,'Dune');
  assert.equal(isbnResolved.books[0].needsReview,false);
  assert.equal(Object.values(isbnResolved.cache)[0].publishReady,true);

  const sameIdentityA={
    ...staleBook,
    id:93,
    uri:'file://context.epub',
    metadataContextSignature:'ctx-one',
  };
  const sameIdentityB={...sameIdentityA,metadataContextSignature:'ctx-two'};
  assert.notEqual(
    x.localWorkQuerySignature(groupLocalWorks([sameIdentityA])[0]),
    x.localWorkQuerySignature(groupLocalWorks([sameIdentityB])[0]),
    'sidecar/cover context changes must invalidate enrichment even when title and author stay unchanged',
  );

  const concurrentBooks=Array.from({length:6},(_,index)=>({
    id:500+index,
    uri:'file://concurrent-'+index+'.epub',
    title:'Concurrent Book '+index,
    author:'Author '+index,
    series:'',
    genre:'',
    format:'EPUB',
    space:'Books',
    available:true,
    coverShape:'portrait',
    metadataSource:'path',
    identificationConfidence:'high',
    needsReview:false,
    reviewReason:'',
    assetSignature:'concurrent-'+index,
  }));
  let activeCovers=0,maxActiveCovers=0;
  let activeProgress=0,maxActiveProgress=0;
  const concurrentResult=await x.enrichLocalCatalogue(concurrentBooks,{},async()=>{
    activeProgress++;
    maxActiveProgress=Math.max(maxActiveProgress,activeProgress);
    await new Promise(resolve=>setTimeout(resolve,4));
    activeProgress--;
  },{
    lookup:async input=>({
      provider:'open-library',
      providerId:'provider-'+input.title,
      title:input.title,
      authors:[input.author],
      coverUri:'https://covers.example/'+encodeURIComponent(input.title)+'.jpg',
      confidence:.99,
    }),
    extractAudioArtwork:async()=>null,
    cachePortrait:async(key)=>{
      activeCovers++;
      maxActiveCovers=Math.max(maxActiveCovers,activeCovers);
      await new Promise(resolve=>setTimeout(resolve,12));
      activeCovers--;
      return {uri:'file://'+key+'.jpg',width:640,height:1000,aspectRatio:.64};
    },
    lookupDelayMs:0,
    workConcurrency:2,
    now:()=>new Date('2026-10-05T21:10:00Z'),
  });
  assert.equal(concurrentResult.progress.processed,6);
  assert.equal(maxActiveCovers,2,'enrichment must allow bounded parallel work instead of a serial cover queue');
  assert.equal(maxActiveProgress,1,'progress/persistence callbacks must remain serialized even when works finish concurrently');

  const many=Array.from({length:3000},(_,index)=>({
    id:10000+index,
    uri:'file://book-'+index+'.epub',
    title:'Book '+index,
    author:'Author '+index,
    series:'',
    genre:'',
    format:'EPUB',
    space:'Books',
    available:true,
    coverShape:'portrait',
    coverUri:'file://cover-'+index+'.jpg',
    metadataSource:'path',
    identificationConfidence:'high',
    needsReview:false,
    reviewReason:'',
  }));
  let callbacks=0,deltaRows=0,maxDelta=0;
  const large=await x.enrichLocalCatalogue(many,{},async(_progress,delta)=>{
    callbacks++;
    deltaRows+=delta.books.length;
    maxDelta=Math.max(maxDelta,delta.books.length);
  },{
    lookup:async()=>{throw Error('online lookup should not run for complete works')},
    extractAudioArtwork:async()=>null,
    cachePortrait:async()=>{throw Error('cover cache should not run for complete EPUBs')},
    lookupDelayMs:0,
    now:()=>new Date('2026-10-05T20:00:00Z'),
  });
  assert.equal(large.books.length,3000);
  assert.equal(callbacks,3000,'one bounded delta is emitted per work');
  assert.equal(deltaRows,3000,'progress deltas contain changed rows only, not repeated full catalogues');
  assert.equal(maxDelta,1,'independent works never emit the full catalogue');
  console.log('PASS: enrichment stays work-delta based across 3,000 independent works');
})().catch(e=>{console.error(e);process.exitCode=1});
