// Gate 3/4 RED: publishing a verified work requires local LIBRARY artwork,
// not a second downloaded portrait texture. The locked Living Book renderer
// already supports a book-jacket fallback for square audiobook covers.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,path)=>mod._compile(ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,path);
const {
  assessLocalWorkForPublication,partitionLocalBooksByPublication,localWorksForReview,
  retainPublishedSnapshots,restorePublishedCatalogue,reconcilePublishedLocalBooks,
}=require('./publicationPipeline.ts');
const {groupLocalWorks}=require('./localWorks.ts');
const {resolveLivingBookCover}=require('./livingBookCover.ts');

const uri='content://root/document/primary:Audiobooks%2FDune%2F01.mp3';
function audio(overrides={}){
  return {id:1,uri,title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',
    format:'Audio',space:'Audiobooks',available:true,coverShape:'square',needsReview:false,
    identificationState:'accepted',libraryCoverUri:'file:///covers/dune-square.jpg',
    coverUri:'file:///covers/dune-square.jpg',livingBookCoverUri:undefined,
    ...overrides};
}
function outcome(books){return partitionLocalBooksByPublication(books);}

// Library artwork available; no separately cached Living Book portrait.
const onlySquare=[audio()];
const squareWork=groupLocalWorks(onlySquare)[0];
const squareAssessment=assessLocalWorkForPublication(squareWork);
assert.equal(squareAssessment.ready,true,
  'RED: valid local Library cover must publish without a distinct Living Book cover');
assert.deepEqual(squareAssessment.blockers,[]);
assert.equal(outcome(onlySquare).published.length,1);
assert.equal(localWorksForReview(onlySquare)[0].needsReview,false);
const jacket=resolveLivingBookCover({
  format:'Audio',editionCoverUri:squareAssessment.libraryCoverUri,
  editionCoverShape:'square',livingBookCoverUri:onlySquare[0].livingBookCoverUri,
});
assert.equal(jacket.kind,'jacket','the player uses its existing generated jacket fallback');
assert.equal(jacket.uri,onlySquare[0].libraryCoverUri);

// A remote-only portrait suggestion must not veto a local square library cover.
const remotePortrait=[audio({livingBookCoverUri:'https://external.example/portrait.jpg'})];
assert.equal(outcome(remotePortrait).published.length,1,
  'RED: portrait download failure cannot remove a correctly identified work');
assert.equal(outcome(remotePortrait).staged.length,0);

// Non-audio EPUB and comic covers are also independently publishable.
for(const format of ['EPUB','CBZ','CBR','PDF']){
  const book=audio({uri:'content://root/'+format.toLowerCase(),format,
    coverShape:'portrait',title:'An Identified Work',livingBookCoverUri:undefined});
  assert.equal(outcome([book]).published.length,1,
    'RED: '+format+' does not require an extra Living Book texture');
}

// A remote-only library cover, unidentified work and clue-only edit remain blocked.
const remoteLibrary=[audio({libraryCoverUri:'https://external.example/cover.jpg',
  coverUri:'https://external.example/cover.jpg'})];
assert.equal(outcome(remoteLibrary).published.length,0,'remote Library cover must be locally cached');
assert.equal(localWorksForReview(remoteLibrary)[0].needsReview,true);
assert.match(localWorksForReview(remoteLibrary)[0].reviewReason,/cover/i);
const missingArtwork=[audio({coverUri:undefined,libraryCoverUri:undefined})];
assert.equal(outcome(missingArtwork).published.length,0);
const savedClues=[audio({identificationState:'clues-saved'})];
assert.equal(outcome(savedClues).published.length,0,'saving metadata clues must not imply approval');
const ambiguous=[audio({uri:'content://root/document/primary:Audiobooks%2FChapter%2001.mp3',
  title:'Chapter 01',author:'',needsReview:true,identificationState:'unresolved'})];
assert.equal(outcome(ambiguous).published.length,0,'ambiguous chapter identity must remain staged');

// On failed updated artwork, keep last ready edition and an attention item.
const prev=[audio({livingBookCoverUri:'file:///covers/dune-portrait.jpg'})];
const failedRefresh=[audio({coverUri:undefined,libraryCoverUri:undefined,
  livingBookCoverUri:undefined})];
const mixed=reconcilePublishedLocalBooks(prev,failedRefresh);
assert.equal(mixed.published.length,1);
assert.equal(mixed.staged.length,1);
const persisted=retainPublishedSnapshots(failedRefresh,prev);
assert.equal(restorePublishedCatalogue(JSON.parse(JSON.stringify(persisted))).length,1,
  'restart preserves the last good publication after a failed update');
// A successfully published cover-only work should remain published after restart.
const initial=retainPublishedSnapshots(onlySquare,[]);
assert.equal(restorePublishedCatalogue(JSON.parse(JSON.stringify(initial))).length,1,
  'RED: local square cover publication must survive a catalogue restore');
console.log('PASS: local Library covers publish without optional Living Book portrait; integrity and restart preserved');
