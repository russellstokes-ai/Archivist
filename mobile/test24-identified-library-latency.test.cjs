// Test 24 RED: bounded routine provider work; no waiting through 3 x 8s
// queries when the user only requested normal Identify Books & Covers.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,p)=>mod._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText,p);
const {lookupOnlineBook}=require('./onlineBookMetadata.ts');
const {cacheRequiredWorkArtwork}=require('./dualCoverPipeline.ts');
async function run(){
  let fetchCount=0;
  const waitForever=()=>new Promise(()=>{});
  const started=Date.now();
  const result=await lookupOnlineBook({title:'An unknown work',author:'A Person',format:'Audio'},{
    openLibraryEnabled:true,fetcher:()=>{fetchCount++;return waitForever()},
    timeoutMs:3000,overallTimeoutMs:700,cache:{},
  });
  const elapsed=Date.now()-started;
  assert.ok(elapsed<1200,'normal lookup must respect ONE deadline across all queries, elapsed '+elapsed);
  assert.equal(result.status,'offline','slow provider should yield an explicit recoverable offline state');
  assert.ok(fetchCount<=1,'do not launch second/third requests after per-work deadline');
  let calls=0;
  const ops={
    documentDirectory:'file:///private/',
    makeDirectoryAsync:async()=>{},
    getInfoAsync:async()=>({exists:false,size:0}),
    downloadAsync:async()=>{calls++;await new Promise(r=>setTimeout(r,75));return {status:200}},
    deleteAsync:async()=>{},
  };
  const covers=Array.from({length:12},(_,i)=>({
    id:i+1,uri:'content://books/document/primary:Audio%2FNovel%20'+i+'%2F01.mp3',
    title:'Novel '+i,author:'Author '+i,format:'Audio',space:'Audio',available:true,
    coverUri:'file:///art/novel-'+i+'.jpg',
    onlineMetadataMatch:{provider:'openlibrary',coverUri:'https://covers.example/novel-'+i+'.jpg'},
  }));
  const t=Date.now();
  const decorated=await cacheRequiredWorkArtwork(covers,ops,{publicationOnly:true,concurrency:3});
  assert.equal(calls,0,'normal Identify MUST NOT download optional portrait jackets when a usable local cover exists');
  assert.equal(decorated.complete,12,'square covers safely yield lightweight Living Book placeholders');
  assert.ok(Date.now()-t<300,'no per-book online jacket waits when already publishable');
  assert.ok(decorated.books.every(b=>b.libraryCoverUri===b.coverUri),'preserve each proven local library cover');
  console.log('PASS: Test24 short per-work network budget and no optional jacket download block');
}
run().catch(e=>{console.error(e);process.exitCode=1});
