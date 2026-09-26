require('tsx/cjs');
const assert = require('node:assert/strict');
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

console.log('PASS: conservative local work grouping and natural audiobook track ordering');
