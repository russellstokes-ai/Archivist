const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {cacheRequiredWorkArtwork}=require('./dualCoverPipeline.ts');
const {partitionLocalBooksByPublication}=require('./publicationPipeline.ts');
const {resolveLivingBookCover}=require('./livingBookCover.ts');

function book(id,uri,extra={}){
  return {id,uri,title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Audio',space:'Audio',available:true,coverShape:'square',needsReview:false,...extra};
}
(async()=>{
  const files=new Map();
  const ops={
    documentDirectory:'file:///app/',
    makeDirectoryAsync:async()=>{},
    downloadAsync:async(uri,target)=>{files.set(target,{exists:true,size:320000});return {uri:target,status:200}},
    getInfoAsync:async uri=>files.get(uri)||{exists:false,size:0},
    deleteAsync:async uri=>{files.delete(uri)},
  };
  const input=[
    book(1,'content://root/document/primary:Audio%2FDune%2F01.mp3',{
      coverUri:'file:///covers/square-dune.jpg',
      onlineMetadataMatch:{provider:'openlibrary',coverUri:'https://covers.example/dune-portrait.jpg'},
    }),
    book(2,'content://root/document/primary:Audio%2FDune%2F02.mp3',{
      coverUri:'file:///covers/square-dune.jpg',
      onlineMetadataMatch:{provider:'openlibrary',coverUri:'https://covers.example/dune-portrait.jpg'},
    }),
  ];
  const result=await cacheRequiredWorkArtwork(input,ops);
  assert.equal(result.complete,1);
  assert.equal(result.attemptedDownloads,1,'provider jacket is downloaded once per work');
  assert.equal(result.books[0].libraryCoverUri,'file:///covers/square-dune.jpg');
  assert.match(result.books[0].livingBookCoverUri,/file:\/\/\/app\/covers\/online\//);
  assert.equal(partitionLocalBooksByPublication(result.books).published.length,2);

  const legacyUpgrade=await cacheRequiredWorkArtwork([
    book(9,'content://root/document/primary:Audio%2FLegacy%2F01.mp3',{
      title:'Legacy',coverUri:'file:///covers/legacy-square.jpg',
      libraryCoverUri:'file:///covers/legacy-square.jpg',
      livingBookCoverUri:'file:///covers/legacy-square.jpg',
      livingBookCoverConfidence:0.45,
      onlineMetadataMatch:{provider:'openlibrary',coverUri:'https://covers.example/legacy-portrait.jpg'},
    }),
  ],ops);
  assert.equal(legacyUpgrade.books[0].libraryCoverUri,'file:///covers/legacy-square.jpg');
  assert.notEqual(legacyUpgrade.books[0].livingBookCoverUri,'file:///covers/legacy-square.jpg','provider portrait must upgrade the migration-only square Living Book fallback');
  assert.match(legacyUpgrade.books[0].livingBookCoverUri,/covers\/online/);

  const failedOps={...ops,downloadAsync:async()=>{throw new Error('offline')}};
  const failed=await cacheRequiredWorkArtwork([
    book(3,'content://root/document/primary:Audio%2FFail%2F01.mp3',{
      title:'Fail',coverUri:'file:///covers/square.jpg',
      onlineMetadataMatch:{provider:'openlibrary',coverUri:'https://covers.example/fail.jpg'},
    }),
  ],failedOps);
  assert.equal(failed.books[0].livingBookCoverUri,'file:///covers/square.jpg','valid local audiobook art must provide a temporary Living Book jacket when provider art is unavailable');
  assert.equal(failed.books[0].livingBookCoverConfidence,0.45);
  assert.equal(failed.books[0].livingBookCoverSource,'jacket',
    'a cached square audiobook cover reused for Living Book is a JACKET, never a verified portrait');
  const resolvedFallback=resolveLivingBookCover({
    format:'Audio',editionCoverUri:failed.books[0].libraryCoverUri,editionCoverShape:'square',
    livingBookCoverUri:failed.books[0].livingBookCoverUri,
    livingBookCoverSource:failed.books[0].livingBookCoverSource,
    livingBookCoverConfidence:failed.books[0].livingBookCoverConfidence,
  });
  assert.equal(resolvedFallback.kind,'jacket','the renderer must not stretch square cover art into portrait');

  const mixedEvidence=await cacheRequiredWorkArtwork([
    book(60,'content://root/document/primary:Audio%2FMixed%2F01.mp3',{
      title:'Mixed',libraryCoverUri:'https://bad.example/unavailable.jpg',
      coverUri:'https://bad.example/unavailable.jpg',
    }),
    book(61,'content://root/document/primary:Audio%2FMixed%2F02.mp3',{
      title:'Mixed',coverUri:'file:///covers/verified-local.jpg',
    }),
  ],failedOps);
  assert.equal(mixedEvidence.attemptedDownloads,0);
  assert.equal(mixedEvidence.books[0].libraryCoverUri,'file:///covers/verified-local.jpg',
    'local cover found on another track must outrank remote first-track Library URL');
  assert.equal(mixedEvidence.books[1].libraryCoverUri,'file:///covers/verified-local.jpg');
  assert.equal(partitionLocalBooksByPublication(mixedEvidence.books).published.length,2,
    'one locally usable work-level cover must publish both tracks');
  assert.equal(partitionLocalBooksByPublication(failed.books).published.length,1,'identified audiobook with valid local artwork must not be hidden by portrait-jacket availability');

  const ebook=[book(4,'content://root/document/primary:Books%2FDune.epub',{format:'EPUB',coverShape:'portrait',coverUri:'file:///covers/dune.jpg'})];
  const ebookResult=await cacheRequiredWorkArtwork(ebook,ops);
  assert.equal(ebookResult.books[0].libraryCoverUri,'file:///covers/dune.jpg');
  assert.equal(ebookResult.books[0].livingBookCoverUri,'file:///covers/dune.jpg');
  console.log('PASS: both artwork slots are cached automatically and gate publication');
})().catch(error=>{console.error(error);process.exit(1)});
