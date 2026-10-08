// Gate 3/4 integration acceptance: entire CURRENT scanner work pipeline on the
// fixed 227-track / 12-work regression corpus. These are synthetic, read-only
// paths; this test is NOT a physical Fold/SAF run or an accuracy audit of NAS tags.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,f);
const {groupLocalWorks}=require('./localWorks.ts');
const {synchronizeLocalMetadata,synchronizeLocalMetadataCooperative}=require('./metadataSync.ts');
const {acceptBookCandidateForWork,applyManualCluesToWork}=require('./metadataSearchWorkflow.ts');
const {cacheOnlineCoverUris}=require('./onlineCoverCache.ts');
const {cacheRequiredWorkArtwork}=require('./dualCoverPipeline.ts');
const {partitionLocalBooksByPublication,localWorksForReview,retainPublishedSnapshots,
  restorePublishedCatalogue,reconcilePublishedLocalBooks}=require('./publicationPipeline.ts');

const root='content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks';
const tracks=[];
for(let work=0;work<12;work++){
  const count=work<11?19:18;
  for(let chapter=0;chapter<count;chapter++){
    const part=String(chapter+1).padStart(2,'0');
    const stem=part+' - Chapter '+part;
    tracks.push({
      id:30000+work*100+chapter,
      uri:'content://media/document/primary:Audiobooks%2FWriter%20'+work
        +'%2FNovel%20'+work+'%2F'+encodeURIComponent(stem)+'.mp3',
      rootUri:root,space:'Audiobooks',format:'Audio',title:stem,
      author:'',series:'',genre:'',available:true,needsReview:true,
      identificationState:'unresolved',coverShape:'square',
      metadataSource:'path',
      embeddedMetadata:chapter<5?{workTitle:'Novel '+work}:
        chapter<9?{workTitle:'Novel '+work+' (Disc 2)'}:{},
    });
  }
}
assert.equal(tracks.length,227);
assert.deepEqual(groupLocalWorks(tracks).map(w=>w.files).sort((a,b)=>a-b),
  [18,...Array(11).fill(19)]);
assert.equal(localWorksForReview(tracks).filter(w=>w.needsReview).length,12,
  'raw discovery must show 12 review cards, not 227 chapter cards');

(async()=>{
  let books=synchronizeLocalMetadata(tracks).books;
  let works=groupLocalWorks(books);
  assert.equal(works.length,12,'post-metadata grouping cannot explode into 227 items');
  let urls=[];
  // Ten accepted online works, one with a local user-picked cover, and two
  // incomplete cases: an accepted remote cover that fails to cache; another
  // work containing manual clues but no accepted match.
  for(let w=0;w<12;w++){
    const work=works.find(item=>item.title==='Novel '+w);
    assert.ok(work,'work identity must remain recoverable: '+w);
    const uris=work.tracks.map(item=>item.uri);
    if(w===11){
      books=applyManualCluesToWork(books,uris,{title:'Novel 11',author:'Writer 11'});
      continue;
    }
    const remote='https://covers.example/novel-'+w+'.jpg';
    const candidate={
      provider:'openlibrary',providerId:'/works/novel-'+w,
      fields:{title:'Novel '+w,author:'Writer '+w,genre:'Science Fiction'},
      coverUri:remote,score:96,confidence:'high',exactIdentifier:false,
      reasons:[],query:'Novel '+w,
    };
    books=acceptBookCandidateForWork(books,uris,candidate);
    if(w===9){
      // The user has chosen a local cover. A provider's cover must not replace it.
      books=books.map(item=>uris.includes(item.uri)?{
        ...item,coverUri:'file:///manual/novel-9.jpg',
        libraryCoverUri:'file:///manual/novel-9.jpg',
        manualOverride:{coverUri:'file:///manual/novel-9.jpg'},
      }:item);
    }
    else urls.push(remote);
  }
  assert.equal(groupLocalWorks(books).length,12,'candidate acceptance must not split or overmerge works');
  const files=new Map();
  const downloads=[];
  const ops={
    documentDirectory:'file:///app/',
    makeDirectoryAsync:async()=>{},
    getInfoAsync:async path=>files.get(path)||{exists:false,size:0},
    deleteAsync:async path=>{files.delete(path);},
    downloadAsync:async (url,target)=>{
      downloads.push(url);
      if(url.includes('novel-10'))throw Error('offline');
      files.set(target,{exists:true,size:220000});
      return {uri:target,status:200};
    },
  };
  const cached=await cacheOnlineCoverUris(books,ops,{concurrency:4});
  assert.equal(cached.attempted,10,'cover attempts must be distinct accepted work URLs, not chapter count');
  assert.equal(downloads.length,10,'ten provider covers must be downloaded at most once each');
  assert.equal(cached.cached,9,'the failed provider must not masquerade as a local cached cover');
  books=cached.books;
  const art=await cacheRequiredWorkArtwork(books,ops);
  books=art.books;
  assert.equal(groupLocalWorks(books).length,12,'artwork reconciliation preserves logical works');
  assert.equal(art.works,12,'cover pipeline is driven by WORKS, not 227 physical tracks');
  const partition=partitionLocalBooksByPublication(books);
  const publishedWorks=groupLocalWorks(partition.published);
  const stagedWorks=groupLocalWorks(partition.staged);
  assert.equal(publishedWorks.length,10,
    'ten correctly identified works with local art publish without optional portrait image');
  assert.equal(stagedWorks.length,2,
    'failed-artwork accepted work and clues-only work remain staged');
  assert.equal(partition.published.length,190,
    '190 chapter files from ten works are published (not 190 work cards)');
  assert.equal(partition.staged.length,37,'37 physical chapters from two works remain staged');
  assert.ok(stagedWorks.some(w=>w.title==='Novel 10'));
  assert.ok(stagedWorks.some(w=>w.title==='Novel 11'));
  const attention=localWorksForReview(books).filter(w=>w.needsReview);
  assert.equal(attention.length,2,'Needs Attention contains two WORK cards, never 37 file cards');
  assert.ok(attention.some(w=>w.title==='Novel 10'&&/cover/i.test(w.reviewReason)));
  assert.ok(attention.some(w=>w.title==='Novel 11'&&/review/i.test(w.reviewReason)));
  const acceptedManual=groupLocalWorks(partition.published).find(w=>w.title==='Novel 9');
  assert.ok(acceptedManual);
  assert.equal(acceptedManual.libraryCoverUri,'file:///manual/novel-9.jpg');
  assert.equal(acceptedManual.tracks.length,19);
  assert.equal(books.length,227,'all original physical files are preserved after enrichment');
  assert.equal(new Set(books.map(b=>b.uri)).size,227,'no duplicates or dropped tracks');

  // Persistence and rescans must not silently remove already published works.
  const durablyStaged=JSON.parse(JSON.stringify(retainPublishedSnapshots(books,[])));
  const restored=restorePublishedCatalogue(durablyStaged);
  assert.equal(groupLocalWorks(restored).length,10,'restart restores ten published works');
  const offlineAgain=await cacheOnlineCoverUris(durablyStaged,ops,{concurrency:4});
  assert.equal(offlineAgain.attempted,1,'rescan retries only the one work with failed remote cover');
  const dropped=durablyStaged.map(item=>item.uri.includes('Novel%200%2F')?
    {...item,libraryCoverUri:undefined,coverUri:undefined,livingBookCoverUri:undefined}:item);
  const retained=retainPublishedSnapshots(dropped,durablyStaged);
  assert.equal(groupLocalWorks(restorePublishedCatalogue(retained)).length,10,
    'failed update must keep last known-good work visible across restart');
  const reconciled=reconcilePublishedLocalBooks(restored,dropped);
  assert.equal(groupLocalWorks(reconciled.published).length,10);
  assert.equal(groupLocalWorks(reconciled.staged).length,3);
  console.log('PASS: 227 chapter assets -> 12 stable works, 10 published, 2 attention, durable/manual/offline safe');
})().catch(error=>{console.error(error);process.exitCode=1;});
