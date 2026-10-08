const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {assessLocalWorkForPublication,partitionLocalBooksByPublication,reconcilePublishedLocalBooks,migrateLegacyPublishedArtwork,isVerifiedLocalArtworkUri}=require('./publicationPipeline.ts');
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

const trustedTitleMissingAuthor=groupLocalWorks([
  audio(40,'content://root/document/primary:Audiobooks%2FDune%2F01.mp3',{
    author:'',needsReview:true,reviewReason:'Title or author still needs review.',
    identificationConfidence:'low',
    metadataProvenance:{title:'path'},
    metadataFieldConfidence:{title:'medium'},
  }),
])[0];
const trustedAssessment=assessLocalWorkForPublication(trustedTitleMissingAuthor);
assert.equal(trustedAssessment.ready,true,'medium-confidence title plus verified artwork should publish while author enrichment remains incomplete');
assert.equal(trustedAssessment.blockers.includes('missing-author'),false);

const ambiguousMissingAuthor=groupLocalWorks([
  audio(41,'content://root/document/primary:Audiobooks%2FChapter%2001.mp3',{
    title:'Chapter 01',author:'',needsReview:true,
    metadataProvenance:{title:'path'},metadataFieldConfidence:{title:'low'},
  }),
])[0];
const ambiguousAssessment=assessLocalWorkForPublication(ambiguousMissingAuthor);
assert.equal(ambiguousAssessment.ready,false,'generic/low-confidence identity must stay staged');
assert.ok(ambiguousAssessment.blockers.includes('needs-review'));
assert.ok(ambiguousAssessment.blockers.includes('missing-author'));

const remote=groupLocalWorks([
  audio(3,'content://root/document/primary:Audiobooks%2FRemote%2F01.mp3',{
    title:'Remote',libraryCoverUri:'https://covers.example/library.jpg',livingBookCoverUri:'https://covers.example/jacket.jpg',
  }),
])[0];
assert.equal(assessLocalWorkForPublication(remote).ready,false);
assert.ok(assessLocalWorkForPublication(remote).blockers.includes('remote-library-cover'));
assert.equal(assessLocalWorkForPublication(remote).blockers.includes('remote-living-book-cover'),false,'a remote optional portrait is not a catalogue blocker; a remote Library cover still is');

const review=groupLocalWorks([
  audio(4,'content://root/document/primary:Audiobooks%2FReview%2F01.mp3',{title:'',author:'',needsReview:true,libraryCoverUri:undefined,livingBookCoverUri:undefined}),
])[0];
const reviewAssessment=assessLocalWorkForPublication(review);
assert.equal(reviewAssessment.ready,false);
assert.ok(reviewAssessment.blockers.includes('missing-library-cover'),'folder identity alone cannot bypass required artwork');
assert.ok(reviewAssessment.blockers.includes('missing-library-cover'));

const partition=partitionLocalBooksByPublication([
  audio(10,'content://root/document/primary:Audiobooks%2FReady%2F01.mp3',{title:'Ready'}),
  audio(11,'content://root/document/primary:Audiobooks%2FWaiting%2F01.mp3',{title:'Waiting',libraryCoverUri:undefined,coverUri:undefined,livingBookCoverUri:undefined}),
]);
assert.equal(partition.published.length,1);
assert.equal(partition.staged.length,1);
assert.equal(partition.published[0].title,'Ready');
assert.equal(partition.staged[0].title,'Waiting');

const previous=[audio(20,'content://root/document/primary:Audiobooks%2FExisting%2F01.mp3',{title:'Existing'})];
const replacement=[audio(20,'content://root/document/primary:Audiobooks%2FExisting%2F01.mp3',{title:'Existing revised',libraryCoverUri:undefined,coverUri:undefined,livingBookCoverUri:undefined})];
const reconciled=reconcilePublishedLocalBooks(previous,replacement);
assert.equal(reconciled.published.length,1,'last verified publication remains while replacement is incomplete');
assert.equal(reconciled.published[0].title,'Existing');

const legacy=migrateLegacyPublishedArtwork([
  audio(30,'content://root/document/primary:Audiobooks%2FLegacy%2F01.mp3',{
    title:'Legacy',coverUri:'file:///covers/legacy-square.jpg',
    libraryCoverUri:undefined,livingBookCoverUri:undefined,
  }),
]);
assert.equal(legacy[0].libraryCoverUri,'file:///covers/legacy-square.jpg');
assert.equal(legacy[0].livingBookCoverUri,'file:///covers/legacy-square.jpg');
assert.equal(legacy[0].livingBookCoverConfidence,0.45);
assert.equal(partitionLocalBooksByPublication(legacy).published.length,1,'accepted Test 13 books must remain visible after schema upgrade');

const unresolvedLegacy=migrateLegacyPublishedArtwork([
  audio(31,'content://root/document/primary:Audiobooks%2FReview%2F01.mp3',{
    title:'Review',needsReview:true,coverUri:'file:///covers/review.jpg',
    libraryCoverUri:undefined,livingBookCoverUri:undefined,
  }),
]);
assert.equal(unresolvedLegacy[0].livingBookCoverUri,undefined,'unresolved legacy items must not be grandfathered into publication');

console.log('PASS: publication gate publishes trusted title-only identity gaps while keeping ambiguous works staged');

const incomplete=audio(50,'file:///Books/Dune/01.mp3',{author:'',needsReview:true,metadataProvenance:{title:'path'},metadataFieldConfidence:{title:'medium'}});
const weak=audio(51,'file:///Books/Dune/02.mp3',{title:'Chapter 02',author:'',needsReview:true});
const coherent=groupLocalWorks([incomplete,weak])[0];
assert.equal(assessLocalWorkForPublication(coherent).ready,true,'weak chapter does not poison a known work');
const optionalConflict={...incomplete,metadataConflicts:[{field:'series',chosen:'Dune',alternatives:[{value:'Dune saga',source:'path',score:80}]}]};
assert.equal(assessLocalWorkForPublication(groupLocalWorks([optionalConflict])[0]).ready,true,'optional series conflict does not hide identified work');
const identityConflict={...incomplete,metadataConflicts:[{field:'author',chosen:'Frank Herbert',alternatives:[{value:'Other author',source:'embedded',score:110}]}]};
assert.equal(assessLocalWorkForPublication(groupLocalWorks([identityConflict])[0]).ready,false,'actual author conflict remains staged');
const genericWithAuthor=audio(55,'file:///Books/Unknown/01.mp3',{title:'Chapter 01',author:'An Author',needsReview:true});
assert.equal(assessLocalWorkForPublication({...groupLocalWorks([genericWithAuthor])[0],title:'Chapter 01'}).ready,false,'author alone cannot publish a chapter identity');
