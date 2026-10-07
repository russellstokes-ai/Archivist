const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);
const {groupLocalWorks,groupLogicalLocalWorks,logicalSeriesGroups} = require('./localWorks.ts');

function book(id, uri, extra={}) {
  return {
    id,
    uri,
    title: 'Track '+id,
    author: 'Frank Herbert',
    series: '',
    format: 'Audio',
    space: 'Audiobooks',
    available: true,
    coverShape: 'square',
    ...extra,
  };
}

const grouped = groupLocalWorks([
  book(2,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F10%20-%20End.mp3',{coverUri:'content://root/Dune.jpg'}),
  book(1,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F02%20-%20Start.mp3'),
]);
assert.equal(grouped.length,1);
assert.equal(grouped[0].title,'Dune');
assert.equal(grouped[0].author,'Frank Herbert');
assert.equal(grouped[0].files,2);
assert.equal(grouped[0].tracks[0].id,1);
assert.equal(grouped[0].coverUri,'content://root/Dune.jpg');

const propertyOrdered=groupLocalWorks([
  book(61,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2Fz-last.mp3',{title:'Chapter B',embeddedMetadata:{workTitle:'Dune',trackNumber:2}}),
  book(60,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2Fa-first.mp3',{title:'Chapter A',embeddedMetadata:{workTitle:'Dune',trackNumber:1}}),
]);
assert.equal(propertyOrdered.length,1);
assert.deepEqual(propertyOrdered[0].tracks.map(item=>item.id),[60,61],'embedded track numbers must order the parts without changing work metadata');

const manuallyNamed = groupLocalWorks([
  book(11,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F01%20-%20Opening.mp3',{title:'Dune (Author Cut)',metadataSource:'manual'}),
  book(12,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F02%20-%20Arrakis.mp3',{title:'Dune (Author Cut)',metadataSource:'manual'}),
]);
assert.equal(manuallyNamed.length,1);
assert.equal(manuallyNamed[0].title,'Dune (Author Cut)');

const nestedStandalone = groupLocalWorks([
  book(20,'content://root/document/primary:Audiobooks%2FCraig%20Alanson%2FColumbus%20Day.m4b',{title:'Columbus Day'}),
  book(21,'content://root/document/primary:Audiobooks%2FCraig%20Alanson%2FSpecOps.m4b',{title:'SpecOps'}),
]);
assert.equal(nestedStandalone.length,2,'separate named audiobooks in one author folder must never be merged');

const numberedParts = groupLocalWorks([
  book(30,'content://root/document/primary:Audiobooks%2FCraig%20Alanson%2FBlack%20Ops%2F01%20-%20Opening.mp3',{title:'Opening',metadataSource:'embedded',metadataProvenance:{title:'embedded'},metadataFieldConfidence:{title:'high'}}),
  book(31,'content://root/document/primary:Audiobooks%2FCraig%20Alanson%2FBlack%20Ops%2F02%20-%20Trouble.mp3',{title:'Trouble',metadataSource:'embedded',metadataProvenance:{title:'embedded'},metadataFieldConfidence:{title:'high'}}),
]);
assert.equal(numberedParts.length,1,'numbered chapter files inside one book folder must remain one audiobook');
assert.equal(numberedParts[0].title,'Black Ops');
assert.equal(numberedParts[0].author,'Craig Alanson');

const rootMultipart = groupLocalWorks([
  book(40,'content://root/document/primary:Audiobooks%2FDune%20-%20Part%2001.mp3',{title:'Opening',author:'Frank Herbert',embeddedMetadata:{workTitle:'Dune'}}),
  book(41,'content://root/document/primary:Audiobooks%2FDune%20-%20Part%2002.mp3',{title:'Arrakis',author:'Frank Herbert',embeddedMetadata:{workTitle:'Dune'}}),
  book(42,'content://root/document/primary:Audiobooks%2FProject%20Hail%20Mary%20-%20Part%2001.mp3',{title:'Opening',author:'Andy Weir',embeddedMetadata:{workTitle:'Project Hail Mary'}}),
  book(43,'content://root/document/primary:Audiobooks%2FProject%20Hail%20Mary%20-%20Part%2002.mp3',{title:'First Contact',author:'Andy Weir',embeddedMetadata:{workTitle:'Project Hail Mary'}}),
]);
assert.equal(rootMultipart.length,2,'two multi-file audiobooks mixed in the library root must become two logical works');
assert.deepEqual(rootMultipart.map(item=>item.files).sort(),[2,2]);

const flat = groupLocalWorks([
  book(1,'content://root/document/primary:Audiobooks%2FBook%20One.m4b',{title:'Book One'}),
  book(2,'content://root/document/primary:Audiobooks%2FBook%20Two.m4b',{title:'Book Two'}),
]);
assert.equal(flat.length,2);

const ebooks = groupLocalWorks([
  {...book(3,'content://root/document/primary:Books%2FAuthor%2FSeries%2FOne.epub'),format:'EPUB',title:'One',coverShape:'portrait'},
  {...book(4,'content://root/document/primary:Books%2FAuthor%2FSeries%2FTwo.epub'),format:'EPUB',title:'Two',coverShape:'portrait'},
]);
assert.equal(ebooks.length,2);

const review = groupLocalWorks([
  book(5,'content://root/document/primary:Audiobooks%2FAuthor%2FBook%2F01.mp3',{title:'Dune',needsReview:true,reviewReason:'Check author'}),
  book(6,'content://root/document/primary:Audiobooks%2FAuthor%2FBook%2F02.mp3',{title:'Dune'}),
]);
assert.equal(review[0].needsReview,false,'resolved work identity should not inherit a stale per-track review flag');

const conflictReview=groupLocalWorks([
  book(7,'content://root/document/primary:Audiobooks%2FAuthor%2FBook%2F01.mp3',{metadataConflicts:[{field:'author'}],reviewReason:'Conflicting metadata needs review.'}),
  book(8,'content://root/document/primary:Audiobooks%2FAuthor%2FBook%2F02.mp3'),
]);
assert.equal(conflictReview[0].needsReview,true,'important metadata conflicts must still surface at work level');
assert.equal(conflictReview[0].reviewReason,'Conflicting metadata needs review.');

const hugeAudiobook=groupLocalWorks(Array.from({length:1000},(_,index)=>
  book(index+5000,'content://root/document/primary:Audiobooks%2FLong%20Book%2F'+String(index+1).padStart(4,'0')+'%20-%20Chapter.mp3',{
    title:'Chapter '+String(index+1),
    author:'Long Author',
  })
));
assert.equal(hugeAudiobook.length,1);
assert.equal(hugeAudiobook[0].files,1000);
assert.equal(hugeAudiobook[0].tracks[0].id,5000);
assert.equal(hugeAudiobook[0].tracks[999].id,5999);

const large=Array.from({length:5000},(_,index)=>({
  ...book(index+10000,'content://root/document/primary:Books%2FAuthor%2FBook%20'+String(index).padStart(5,'0')+'.epub',{
    title:'Book '+String(index).padStart(5,'0'),
    format:'EPUB',
    coverShape:'portrait',
  }),
}));
const largeGrouped=groupLocalWorks(large);
assert.equal(largeGrouped.length,5000);
assert.equal(largeGrouped[0].title,'Book 00000');
assert.equal(largeGrouped[4999].title,'Book 04999');

console.log('PASS: conservative local work grouping handles a 5,000-work shelf with deterministic ordering');


const logical=groupLogicalLocalWorks([
  {...book(100,'content://root/document/primary:Books%2FFrank%20Herbert%2FDune.epub',{title:'Dune',format:'EPUB',series:'Dune',seriesNumber:1,coverShape:'portrait'}),workKey:'dune-1',editionKey:'dune-1|epub'},
  {...book(101,'content://root/document/primary:Books%2FFrank%20Herbert%2FDune.pdf',{title:'Dune',format:'PDF',series:'Dune',seriesNumber:1,coverShape:'portrait'}),workKey:'dune-1',editionKey:'dune-1|pdf'},
  {...book(102,'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%20Messiah.epub',{title:'Dune Messiah',format:'EPUB',series:'Dune',seriesNumber:2,coverShape:'portrait'}),workKey:'dune-2',editionKey:'dune-2|epub'},
]);
assert.equal(logical.length,2,'logical format grouping');
assert.equal(logical.find(item=>item.title==='Dune').formats.join(','),'EPUB,PDF');
assert.deepEqual(logicalSeriesGroups(logical.flatMap(item=>item.items))[0].works.map(item=>item.seriesNumber),[1,2]);
