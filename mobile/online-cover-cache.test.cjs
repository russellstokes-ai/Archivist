const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {cacheOnlineCoverUris,persistOnlineCover,MAX_ONLINE_COVER_BYTES}=require('./onlineCoverCache.ts');

(async()=>{
  const files=new Map();
  const ops={
    documentDirectory:'file:///app/',
    makeDirectoryAsync:async()=>{},
    downloadAsync:async(uri,target)=>{files.set(target,{exists:true,size:240000});return {uri:target,status:200}},
    getInfoAsync:async uri=>files.get(uri)||{exists:false,size:0},
    deleteAsync:async uri=>{files.delete(uri)},
  };
  const remote='https://covers.example/book?id=1';
  const legacyRemote='https://covers.example/legacy-without-provider.jpg';
  const books=[
    {coverUri:remote,coverCandidates:[remote],onlineMetadataMatch:{coverUri:remote}},
    {coverUri:legacyRemote,coverCandidates:[legacyRemote]},
    {coverUri:'file:///manual.jpg',coverCandidates:['file:///manual.jpg'],onlineMetadataMatch:{coverUri:'https://covers.example/other.jpg'}},
  ];
  const result=await cacheOnlineCoverUris(books,ops,{concurrency:2});
  assert.equal(result.attempted,2);
  assert.equal(result.cached,2);
  assert.match(result.books[0].coverUri,/file:\/\/\/app\/covers\/online\/cover-/);
  assert.match(result.books[1].coverUri,/file:\/\/\/app\/covers\/online\/cover-/,'legacy remote cover must be cached even without provider-match state');
  assert.equal(result.books[2].coverUri,'file:///manual.jpg','manual/local cover must not be replaced');

  const hugeOps={...ops,downloadAsync:async(uri,target)=>{files.set(target,{exists:true,size:MAX_ONLINE_COVER_BYTES+1});return {uri:target,status:200}}};
  const fallback=await persistOnlineCover('https://covers.example/huge.png',hugeOps);
  assert.equal(fallback,'https://covers.example/huge.png','unsafe downloads must fall back to remote URL');
  console.log('PASS: online covers are cached privately, bounded by size, deterministic and never replace manual/local covers');
})().catch(error=>{console.error(error);process.exit(1)});
