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

const singleDigitRootChapters = groupLocalWorks([
  book(23,'content://root/document/primary:Music%2FSlayer%20-%201.mp3',{title:'Part 1'}),
  book(24,'content://root/document/primary:Music%2FSlayer%20-%202.mp3',{title:'Part 2'}),
  book(25,'content://root/document/primary:Music%2FSlayer%20-%203.mp3',{title:'Part 3'}),
]);
assert.equal(singleDigitRootChapters.length,1,'single-digit root chapter suffixes must group into one audiobook');
assert.equal(singleDigitRootChapters[0].title,'Slayer');
assert.equal(singleDigitRootChapters[0].files,3);

const conservativeRoot = groupLocalWorks([
  book(30,'content://root/document/primary:Audiobooks%2FBook%201.m4b',{title:'Book 1'}),
  book(31,'content://root/document/primary:Audiobooks%2FBook%202.m4b',{title:'Book 2'}),
]);
assert.equal(conservativeRoot.length,2);

const metadataGrouped = groupLocalWorks([
  book(40,'content://root/document/primary:Audiobooks%2Fx01.mp3',{title:'Opening',author:'Ursula Le Guin',workTitleHint:'A Wizard of Earthsea',trackNumber:1}),
  book(41,'content://root/document/primary:Audiobooks%2Fx02.mp3',{title:'The School',author:'Ursula Le Guin',workTitleHint:'A Wizard of Earthsea',trackNumber:2}),
]);
assert.equal(metadataGrouped.length,1);
assert.equal(metadataGrouped[0].title,'A Wizard of Earthsea');
assert.equal(metadataGrouped[0].files,2);
assert.equal(metadataGrouped[0].tracks[0].id,40);


const authorFolderStandalone = groupLocalWorks([
  book(100,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune.m4b',{title:'Dune'}),
  book(101,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Messiah.m4b',{title:'Dune Messiah'}),
  book(102,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FChildren%20of%20Dune.m4b',{title:'Children of Dune'}),
]);
assert.equal(authorFolderStandalone.length,3,'an author folder containing standalone M4Bs must not collapse into one work');
assert.deepEqual(authorFolderStandalone.map(work=>work.title),['Dune','Dune Messiah','Children of Dune']);

const mixedChapterBooks = groupLocalWorks([
  book(110,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20-%20Chapter%2001.mp3',{title:'Chapter 1'}),
  book(111,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20-%20Chapter%2002.mp3',{title:'Chapter 2'}),
  book(112,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Messiah%20-%20Chapter%2001.mp3',{title:'Chapter 1'}),
  book(113,'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Messiah%20-%20Chapter%2002.mp3',{title:'Chapter 2'}),
]);
assert.equal(mixedChapterBooks.length,2,'two chapter-pattern books in one author folder must form two works');
assert.equal(mixedChapterBooks[0].title,'Dune');
assert.equal(mixedChapterBooks[0].files,2);
assert.equal(mixedChapterBooks[1].title,'Dune Messiah');
assert.equal(mixedChapterBooks[1].files,2);

const embeddedAlbumsSameFolder = groupLocalWorks([
  book(120,'content://root/document/primary:Audiobooks%2FUrsula%20Le%20Guin%2Fx01.mp3',{title:'Opening',author:'Ursula Le Guin',workTitleHint:'A Wizard of Earthsea',trackNumber:1,metadataSource:'embedded'}),
  book(121,'content://root/document/primary:Audiobooks%2FUrsula%20Le%20Guin%2Fx02.mp3',{title:'School',author:'Ursula Le Guin',workTitleHint:'A Wizard of Earthsea',trackNumber:2,metadataSource:'embedded'}),
  book(122,'content://root/document/primary:Audiobooks%2FUrsula%20Le%20Guin%2Fy01.mp3',{title:'Shadow',author:'Ursula Le Guin',workTitleHint:'The Tombs of Atuan',trackNumber:1,metadataSource:'embedded'}),
  book(123,'content://root/document/primary:Audiobooks%2FUrsula%20Le%20Guin%2Fy02.mp3',{title:'Labyrinth',author:'Ursula Le Guin',workTitleHint:'The Tombs of Atuan',trackNumber:2,metadataSource:'embedded'}),
]);
assert.equal(embeddedAlbumsSameFolder.length,2,'embedded album/work identity must split different books in the same folder');
assert.equal(embeddedAlbumsSameFolder[0].title,'A Wizard of Earthsea');
assert.equal(embeddedAlbumsSameFolder[1].title,'The Tombs of Atuan');

const multiDiscEmbedded = groupLocalWorks([
  book(130,'content://root/document/primary:Audiobooks%2FDune%2FDisc%201%2F01.mp3',{title:'Opening',workTitleHint:'Dune',trackNumber:1,discNumber:1,metadataSource:'embedded'}),
  book(131,'content://root/document/primary:Audiobooks%2FDune%2FDisc%201%2F02.mp3',{title:'Arrakis',workTitleHint:'Dune',trackNumber:2,discNumber:1,metadataSource:'embedded'}),
  book(132,'content://root/document/primary:Audiobooks%2FDune%2FDisc%202%2F01.mp3',{title:'Desert',workTitleHint:'Dune',trackNumber:1,discNumber:2,metadataSource:'embedded'}),
]);
assert.equal(multiDiscEmbedded.length,1,'Disc 1 / Disc 2 subfolders with the same embedded work must merge');
assert.equal(multiDiscEmbedded[0].title,'Dune');
assert.equal(multiDiscEmbedded[0].files,3);
assert.deepEqual(multiDiscEmbedded[0].tracks.map(track=>track.id),[130,131,132]);

const sidecarChapters = groupLocalWorks([
  book(140,'content://root/document/primary:Audiobooks%2FThe%20Left%20Hand%20of%20Darkness%2F01%20-%20Winter.mp3',{
    title:'The Left Hand of Darkness',author:'Ursula Le Guin',metadataSource:'sidecar',trackNumber:1,
  }),
  book(141,'content://root/document/primary:Audiobooks%2FThe%20Left%20Hand%20of%20Darkness%2F02%20-%20Karhide.mp3',{
    title:'The Left Hand of Darkness',author:'Ursula Le Guin',metadataSource:'sidecar',trackNumber:2,
  }),
]);
assert.equal(sidecarChapters.length,1,'shared trusted sidecar identity must group chapter assets');
assert.equal(sidecarChapters[0].title,'The Left Hand of Darkness');

const nestedAmbiguousBooks = groupLocalWorks([
  book(150,'content://root/document/primary:Audiobooks%2FSeries%2FBook%201.m4b',{title:'Book 1',series:'Series'}),
  book(151,'content://root/document/primary:Audiobooks%2FSeries%2FBook%202.m4b',{title:'Book 2',series:'Series'}),
]);
assert.equal(nestedAmbiguousBooks.length,2,'ambiguous numbered standalone books in a series folder must remain separate');


const standaloneTracksInSeriesFolder = groupLocalWorks([
  book(155,'content://root/document/primary:Audiobooks%2FDune%20Series%2FDune.m4b',{title:'Dune',series:'Dune',trackNumber:1}),
  book(156,'content://root/document/primary:Audiobooks%2FDune%20Series%2FDune%20Messiah.m4b',{title:'Dune Messiah',series:'Dune',trackNumber:1}),
  book(157,'content://root/document/primary:Audiobooks%2FDune%20Series%2FChildren%20of%20Dune.m4b',{title:'Children of Dune',series:'Dune',trackNumber:1}),
]);
assert.equal(standaloneTracksInSeriesFolder.length,3,'track tags alone must not merge standalone M4B books');

const numberedFolderChapters = groupLocalWorks([
  book(160,'content://root/document/primary:Audiobooks%2FDune%2F001%20-%20Opening.mp3',{title:'Opening'}),
  book(161,'content://root/document/primary:Audiobooks%2FDune%2F002%20-%20Arrakis.mp3',{title:'Arrakis'}),
  book(162,'content://root/document/primary:Audiobooks%2FDune%2F003%20-%20Desert.mp3',{title:'Desert'}),
]);
assert.equal(numberedFolderChapters.length,1,'strong numeric chapter evidence inside a book folder must still group');
assert.equal(numberedFolderChapters[0].title,'Dune');
assert.equal(numberedFolderChapters[0].files,3);

const isolatedSameAlbumDifferentFolders = groupLocalWorks([
  book(170,'content://root/document/primary:Audiobooks%2FCopy%20A%2F01.mp3',{title:'One',workTitleHint:'Dune',trackNumber:1,metadataSource:'embedded'}),
  book(171,'content://root/document/primary:Audiobooks%2FCopy%20B%2F01.mp3',{title:'One',workTitleHint:'Dune',trackNumber:1,metadataSource:'embedded'}),
]);
assert.equal(isolatedSameAlbumDifferentFolders.length,2,'duplicate copies in distinct ordinary folders must not be merged merely because embedded album names match');

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
