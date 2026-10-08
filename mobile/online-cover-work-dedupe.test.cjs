const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,path)=>mod._compile(ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,path);
const {cacheOnlineCoverUris}=require('./onlineCoverCache.ts');

async function run(){
  const files=new Map();
  const calls=[];
  const ops={
    documentDirectory:'file:///app/',
    makeDirectoryAsync:async()=>{},
    getInfoAsync:async target=>files.get(target)||{exists:false,size:0},
    downloadAsync:async (remote,target)=>{
      calls.push({remote,target});
      // Force a contested in-flight operation so any concurrently queued
      // chapters cannot both write to the same destination.
      await new Promise(resolve=>setTimeout(resolve,4));
      files.set(target,{exists:true,size:240000});
      return {uri:target,status:200};
    },
    deleteAsync:async target=>{files.delete(target)},
  };
  const remote='https://covers.example/leviathan.jpg';
  const chapters=Array.from({length:66},(_,i)=>({
    uri:'content://audio/Leviathan-Wakes/'+String(i).padStart(3,'0')+'.mp3',
    format:'Audio',coverUri:remote,coverCandidates:[remote],
  }));
  const manual={uri:'content://audio/other.mp3',format:'Audio',coverUri:'file:///manual.png',
    coverCandidates:['file:///manual.png'],onlineMetadataMatch:{coverUri:remote}};
  const initial=await cacheOnlineCoverUris([...chapters,manual],ops,{concurrency:4});
  assert.equal(calls.length,1,'NAS RED: 66 tracks sharing same cover URL must download it once, not 66 times');
  assert.equal(initial.attempted,1,'diagnostic attempted count reflects network jobs, not chapter count');
  assert.equal(initial.cached,1,'diagnostic cached count reflects distinct artwork blobs');
  assert.equal(new Set(initial.books.slice(0,66).map(book=>book.coverUri)).size,1);
  assert.match(initial.books[0].coverUri,/^file:\/\/\/app\/covers\/online\//);
  assert.equal(initial.books.at(-1).coverUri,manual.coverUri,'manual image is never overwritten');
  assert.ok(initial.books.slice(0,66).every(book=>
    book.coverCandidates.includes(remote)&&book.coverCandidates.includes(initial.books[0].coverUri)));
  const second=await cacheOnlineCoverUris(initial.books,ops,{concurrency:4});
  assert.equal(second.attempted,0,'unchanged local work covers must be skipped on repeat scan');
  assert.equal(calls.length,1,'repeat scan never refetches already cached artwork');

  // Two distinct cover references still require two network fetches.
  const two=await cacheOnlineCoverUris([
    {uri:'file://a',coverUri:'https://covers.example/a.jpg'},
    {uri:'file://b',coverUri:'https://covers.example/b.jpg'},
    {uri:'file://c',coverUri:'https://covers.example/a.jpg'},
  ],ops,{concurrency:4});
  assert.equal(two.attempted,2,'distinct remote artwork URLs retain distinct network jobs');
  assert.equal(calls.length,3);
  assert.equal(two.books[0].coverUri,two.books[2].coverUri);
  assert.notEqual(two.books[0].coverUri,two.books[1].coverUri);

  const failures=[];
  const badOps={...ops,downloadAsync:async (src,dst)=>{failures.push(src);throw Error('offline')}};
  const offline=await cacheOnlineCoverUris([
    {uri:'file://d',coverUri:'https://covers.example/missing.jpg'},
    {uri:'file://e',coverUri:'https://covers.example/missing.jpg'},
  ],badOps,{concurrency:3});
  assert.equal(failures.length,1,'failed download attempts must not multiply by chapter');
  assert.equal(offline.cached,0);
  assert.equal(offline.books[0].coverUri,'https://covers.example/missing.jpg',
    'network failure never masquerades as locally cached artwork');
  assert.equal(offline.books[1].coverUri,'https://covers.example/missing.jpg');
  console.log('PASS: 66-file same-cover URL is one bounded cache job; local/manual/remote safety preserved');
}
run().catch(error=>{console.error(error);process.exitCode=1});
