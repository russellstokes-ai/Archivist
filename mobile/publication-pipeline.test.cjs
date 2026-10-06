const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {assessLocalWorkForPublication,partitionLocalBooksByPublication,isVerifiedLocalArtworkUri}=require('./publicationPipeline.ts');
const {groupLocalWorks}=require('./localWorks.ts');

function audio(id,uri,extra={}){
  return {
    id,uri,title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',
    format:'Audio',space:'Audiobooks',available:true,coverShape:'square',needsReview:false,
    libraryCoverUri:'file:///covers/dune-library.jpg',
    livingBookCoverUri:'file:///covers/dune-jacket.jpg',
    ...extra,
  };
}

assert.equal(isVerifiedLocalArtworkUri('file:///covers/a.jpg'),true);
assert.equal(isVerifiedLocalArtworkUri('content://media/cover'),true);
assert.equal(isVerifiedLocalArtworkUri('https://covers.example/a.jpg'),false);

const ready=groupLocalWorks([
  audio(1,'content://root/document/primary:Audiobooks%2FDune%2F01.mp3'),
  audio(2,'content://root/document/primary:Audiobooks%2FDune%2F02.mp3'),
])[0];
const assessment=assessLocalWorkForPublication(ready);
assert.equal(assessment.ready,true);
assert.deepEqual(assessment.blockers,[]);

const remote=groupLocalWorks([
  audio(3,'content://root/document/primary:Audiobooks%2FRemote%2F01.mp3',{
    title:'Remote',libraryCoverUri:'https://covers.example/library.jpg',livingBookCoverUri:'https://covers.example/jacket.jpg',
  }),
])[0];
assert.equal(assessLocalWorkForPublication(remote).ready,false);
assert.ok(assessLocalWorkForPublication(remote).blockers.includes('remote-library-cover'));
assert.ok(assessLocalWorkForPublication(remote).blockers.includes('remote-living-book-cover'));

const review=groupLocalWorks([
  audio(4,'content://root/document/primary:Audiobooks%2FReview%2F01.mp3',{title:'',author:'',needsReview:true,libraryCoverUri:undefined,livingBookCoverUri:undefined}),
])[0];
const reviewAssessment=assessLocalWorkForPublication(review);
assert.equal(reviewAssessment.ready,false);
assert.ok(reviewAssessment.blockers.includes('needs-review'));
assert.ok(reviewAssessment.blockers.includes('missing-library-cover'));

const partition=partitionLocalBooksByPublication([
  audio(10,'content://root/document/primary:Audiobooks%2FReady%2F01.mp3',{title:'Ready'}),
  audio(11,'content://root/document/primary:Audiobooks%2FWaiting%2F01.mp3',{title:'Waiting',livingBookCoverUri:undefined}),
]);
assert.equal(partition.published.length,1);
assert.equal(partition.staged.length,1);
assert.equal(partition.published[0].title,'Ready');
assert.equal(partition.staged[0].title,'Waiting');

console.log('PASS: publication gate keeps incomplete works staged until identity and both cached covers are complete');
