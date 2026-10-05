const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);
const {groupLocalWorks} = require('./localWorks.ts');

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

const flat = groupLocalWorks([
  book(1,'content://root/document/primary:Audiobooks%2FBook%20One.m4b',{title:'Book One'}),
  book(2,'content://root/document/primary:Audiobooks%2FBook%20Two.m4b',{title:'Book Two'}),
]);
assert.equal(flat.length,2);

const rootChapters = groupLocalWorks([
  book(20,'content://root/document/primary:Audiobooks%2FDune%20-%20Chapter%2001.mp3',{title:'Chapter 1'}),
  book(21,'content://root/document/primary:Audiobooks%2FDune%20-%20Chapter%2002.mp3',{title:'Chapter 2'}),
  book(22,'content://root/document/primary:Audiobooks%2FDune%20-%20Chapter%2003.mp3',{title:'Chapter 3'}),
]);
assert.equal(rootChapters.length,1);
assert.equal(rootChapters[0].title,'Dune');
assert.equal(rootChapters[0].files,3);

const conservativeRoot = groupLocalWorks([
  book(30,'content://root/document/primary:Audiobooks%2FBook%201.m4b',{title:'Book 1'}),
  book(31,'content://root/document/primary:Audiobooks%2FBook%202.m4b',{title:'Book 2'}),
]);
assert.equal(conservativeRoot.length,2);

const ebooks = groupLocalWorks([
  {...book(3,'content://root/document/primary:Books%2FAuthor%2FSeries%2FOne.epub'),format:'EPUB',title:'One',coverShape:'portrait'},
  {...book(4,'content://root/document/primary:Books%2FAuthor%2FSeries%2FTwo.epub'),format:'EPUB',title:'Two',coverShape:'portrait'},
]);
assert.equal(ebooks.length,2);

const review = groupLocalWorks([
  book(5,'content://root/document/primary:Audiobooks%2FAuthor%2FBook%2F01.mp3',{needsReview:true,reviewReason:'Check author'}),
  book(6,'content://root/document/primary:Audiobooks%2FAuthor%2FBook%2F02.mp3'),
]);
assert.equal(review[0].needsReview,true);
assert.equal(review[0].reviewReason,'Check author');

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
