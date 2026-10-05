const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

const load = Module._load;
const saf = {
  dirs: new Map(),
  made: [],
  files: [],
  copies: [],
  deleted: [],
  async readDirectoryAsync(uri) { return this.dirs.get(uri) || []; },
  async makeDirectoryAsync(parent, name) {
    const uri = parent + '%2F' + encodeURIComponent(name);
    this.made.push([parent, name, uri]);
    this.dirs.set(parent, [...(this.dirs.get(parent) || []), uri]);
    this.dirs.set(uri, []);
    return uri;
  },
  async createFileAsync(parent, name, mime) {
    const uri = parent + '%2F' + encodeURIComponent(name);
    this.files.push([parent, name, mime, uri]);
    return uri;
  },
  async copyAsync(copy) { this.copies.push(copy); },
  async deleteAsync(uri) { this.deleted.push(uri); },
};
const fileText = new Map();
const fileInfo = new Map();
const fileReads = [];
const infoReads = [];
Module._load = function(request, parent, isMain) {
  if (request === 'react-native') return {Platform: {OS: 'android'}, NativeModules: {}};
  if (request === 'expo-file-system/legacy') return {
    StorageAccessFramework: saf,
    async readAsStringAsync(uri) { fileReads.push(uri); return fileText.get(uri) || ''; },
    async getInfoAsync(uri) { infoReads.push(uri); return fileInfo.get(uri) || {exists: true, size: (fileText.get(uri) || '').length}; },
  };
  return load.call(this, request, parent, isMain);
};

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {removeLocalSortCopies, localAssetSignature, localFolderName, scanLocalFolders} = require('./localLibrary.ts');
const {applyLocalMetadata, inferLocalBookMetadata, parseLocalSidecar} = require('./libraryIntelligence.ts');

const books = [
  {id: 1, uri: 'content://root/document/primary:Books%2FDune.epub', title: 'Dune', author: 'Frank Herbert', series: 'Dune', format: 'EPUB', space: 'Books', available: true},
  {id: 2, uri: 'content://root/document/primary:Books%2FDune.cbz', title: 'Dune', author: 'Frank Herbert', series: 'Dune', format: 'Comic', space: 'Books', available: true},
  {id: 3, uri: 'content://root/document/primary:Books%2FDune-copy.epub', title: 'Dune', author: 'Frank Herbert', series: 'Dune', format: 'EPUB', space: 'Books', available: true},
];

assert.equal(localFolderName('content://root/tree/primary:Comics/document/primary:Comics'), 'Comics');
assert.equal(
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000000,contextSignature:'abc'}),
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000000,contextSignature:'abc'}),
  'unchanged Android document evidence must produce a stable signature',
);
assert.notEqual(
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000000,contextSignature:'abc'}),
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1235,modified:1700000000,contextSignature:'abc'}),
  'size changes must invalidate scan reuse',
);
assert.notEqual(
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000000,contextSignature:'abc'}),
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000001,contextSignature:'abc'}),
  'mtime changes must invalidate scan reuse',
);
assert.notEqual(
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000000,contextSignature:'abc'}),
  localAssetSignature({documentId:'primary:Books/Dune.epub',size:1234,modified:1700000000,contextSignature:'changed-sidecar'}),
  'sidecar/cover context changes must invalidate scan reuse',
);
assert.equal(localAssetSignature({documentId:'x',size:1,modified:0,contextSignature:'none'}),'','providers without mtime must not be treated as safely unchanged');


const hierarchy = inferLocalBookMetadata(
  'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%2FDune%20Messiah.epub',
  'EPUB',
);
assert.equal(hierarchy.title, 'Dune Messiah');
assert.equal(hierarchy.author, 'Frank Herbert');
assert.equal(hierarchy.series, 'Dune');
assert.equal(hierarchy.confidence, 'high');
assert.equal(hierarchy.needsReview, false);
assert.equal(hierarchy.coverShape, 'portrait');

const dashed = inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%20-%20Dune%20-%2001%20-%20Dune.m4b',
  'Audio',
);
assert.equal(dashed.title, 'Dune');
assert.equal(dashed.author, 'Frank Herbert');
assert.equal(dashed.series, 'Dune');
assert.equal(dashed.confidence, 'high');
assert.equal(dashed.coverShape, 'square');

const messy = inferLocalBookMetadata(
  'content://root/document/primary:Books%2FNeil_Gaiman%20-%20Sandman%20-%2001%20-%20Preludes_%26_Nocturnes%20%5Bebook%5D.epub',
  'EPUB',
);
assert.equal(messy.author, 'Neil Gaiman');
assert.equal(messy.series, 'Sandman');
assert.equal(messy.title, 'Preludes & Nocturnes');
assert.equal(messy.confidence, 'high');
assert.equal(messy.needsReview, false);

const uncertain = inferLocalBookMetadata(
  'content://root/document/primary:Downloads%2Fsomething.epub',
  'EPUB',
);
assert.equal(uncertain.title, 'something');
assert.equal(uncertain.needsReview, true);

const opf = parseLocalSidecar(
  '<package><metadata><dc:title>The Dispossessed</dc:title><dc:creator>Ursula K. Le Guin</dc:creator><dc:subject>Science Fiction</dc:subject><meta name="calibre:series" content="Hainish Cycle"/></metadata></package>',
  'opf',
);
assert.deepEqual(opf, {title: 'The Dispossessed', author: 'Ursula K. Le Guin', series: 'Hainish Cycle', genre: 'Science Fiction'});
const manual = applyLocalMetadata(uncertain, {title: 'Corrected', author: 'A. Writer', series: '', genre: 'Mystery'}, 'manual');
assert.equal(manual.metadataSource, 'manual');
assert.equal(manual.confidence, 'high');
assert.equal(manual.needsReview, false);
assert.equal(manual.genre, 'Mystery');

const audioPath = inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F01%20-%20Opening.mp3',
  'Audio',
);
assert.equal(audioPath.author, 'Frank Herbert');
assert.equal(audioPath.series, '');
(async () => {
  const root = 'content://root/tree/primary:Books/document/primary:Books';
  const file = root + '%2FMystery.epub';
  const sidecar = root + '%2FMystery.opf';
  const cover = root + '%2FMystery.jpg';
  saf.dirs.set(root, [file, sidecar, cover]);
  fileText.set(sidecar, '<package><metadata><dc:title>The Dispossessed</dc:title><dc:creator>Ursula K. Le Guin</dc:creator><dc:subject>Science Fiction</dc:subject></metadata></package>');
  fileInfo.set(sidecar, {exists: true, size: 160});
  let scanned = await scanLocalFolders([{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}]);
  assert.equal(scanned.books.length, 1);
  assert.equal(scanned.books[0].title, 'The Dispossessed');
  assert.equal(scanned.books[0].metadataSource, 'sidecar');
  assert.equal(scanned.books[0].genre, 'Science Fiction');
  assert.equal(scanned.books[0].needsReview, false);
  assert.equal(scanned.books[0].coverUri, cover);
  assert.equal(scanned.books[0].sourceUri,root,'fallback scanner must persist the exact selected source tree URI');

  scanned = await scanLocalFolders(
    [{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}],
    undefined,
    {[file]: {title:'My correction',author:'Manual Author',series:'Manual Series',genre:'Fantasy'}},
  );
  assert.equal(scanned.books[0].title, 'My correction');
  assert.equal(scanned.books[0].metadataSource, 'manual');
  assert.equal(scanned.books[0].genre, 'Fantasy');
  assert.equal(scanned.books[0].needsReview, false);

  const dottedRoot='content://root/tree/primary:Books/document/primary:Books2';
  const dottedAuthor=dottedRoot+'%2FJ.R.R.%20Tolkien';
  const dottedBook=dottedAuthor+'%2FThe%20Hobbit.epub';
  saf.dirs.set(dottedRoot,[dottedAuthor]);
  saf.dirs.set(dottedAuthor,[dottedBook]);
  const dottedScan=await scanLocalFolders([{id:dottedRoot,uri:dottedRoot,name:'Books2',status:'Ready',itemCount:0}]);
  assert.equal(dottedScan.books.length,1);
  assert.equal(dottedScan.books[0].title,'The Hobbit');

  // Local reader support now includes CBZ/CBR/CBT, so scanner parity must
  // expose all three rather than silently dropping archives the reader can open.
  const comicRoot='content://root/tree/primary:Comics/document/primary:Comics';
  const cbz=comicRoot+'%2FSupported.cbz';
  const cbr=comicRoot+'%2FSupported.cbr';
  const cbt=comicRoot+'%2FSupported.cbt';
  saf.dirs.set(comicRoot,[cbz,cbr,cbt]);
  const comicScan=await scanLocalFolders([{id:comicRoot,uri:comicRoot,name:'Comics',status:'Ready',itemCount:0}]);
  assert.equal(comicScan.books.length,3);
  assert.deepEqual(comicScan.books.map(item=>item.uri),[cbz,cbr,cbt]);
  assert.equal(comicScan.books.every(item=>item.format==='Comic'),true);

  // Multi-track audiobooks may use one book-level OPF/cover. Parse that OPF once,
  // then reuse it for every track instead of doing repeated I/O.
  const audioRoot='content://root/tree/primary:Audiobooks/document/primary:Audiobooks%2FDune';
  const track1=audioRoot+'%2F01%20-%20Opening.mp3';
  const track2=audioRoot+'%2F02%20-%20Arrakis.mp3';
  const audioOpf=audioRoot+'%2Fmetadata.opf';
  const audioCover=audioRoot+'%2Fcover.jpg';
  saf.dirs.set(audioRoot,[track1,track2,audioOpf,audioCover]);
  fileText.set(audioOpf,'<package><metadata><dc:title>Dune</dc:title><dc:creator>Frank Herbert</dc:creator><dc:subject>Science Fiction</dc:subject><meta name="calibre:series" content="Dune"/></metadata></package>');
  fileInfo.set(audioOpf,{exists:true,size:220});
  const audioScan=await scanLocalFolders([{id:audioRoot,uri:audioRoot,name:'Audiobooks',status:'Ready',itemCount:0}]);
  assert.equal(audioScan.books.length,2);
  assert.equal(audioScan.review,0);
  assert.equal(audioScan.books.every(item=>item.metadataSource==='sidecar'),true);
  assert.equal(audioScan.books.every(item=>item.author==='Frank Herbert'),true);
  assert.equal(audioScan.books.every(item=>item.genre==='Science Fiction'),true);
  assert.equal(audioScan.books.every(item=>item.coverUri===audioCover),true);
  assert.equal(fileReads.filter(uri=>uri===audioOpf).length,1);
  assert.equal(infoReads.filter(uri=>uri===audioOpf).length,1);

  // Discovery must stay metadata-only even when the media file itself is huge.
  const hugeRoot='content://root/tree/primary:Books/document/primary:Huge';
  const hugeBook=hugeRoot+'%2FReference.epub';
  saf.dirs.set(hugeRoot,[hugeBook]);
  fileInfo.set(hugeBook,{exists:true,size:8*1024*1024*1024});
  const hugeScan=await scanLocalFolders([{id:hugeRoot,uri:hugeRoot,name:'Huge',status:'Ready',itemCount:0}]);
  assert.equal(hugeScan.books.length,1);
  assert.equal(infoReads.includes(hugeBook),false);
  assert.equal(fileReads.includes(hugeBook),false);

  // A valid media file at the maximum supported recursion depth is still found.
  const deepRoot='content://root/tree/primary:Books/document/primary:Deep';
  let deepParent=deepRoot;
  for(let depth=1;depth<=8;depth++){
    const child=deepParent+'%2FLevel'+depth;
    saf.dirs.set(deepParent,[child]);
    deepParent=child;
  }
  const deepBook=deepParent+'%2FDeep%20Book.epub';
  saf.dirs.set(deepParent,[deepBook]);
  const deepScan=await scanLocalFolders([{id:deepRoot,uri:deepRoot,name:'Deep',status:'Ready',itemCount:0}]);
  assert.equal(deepScan.books.length,1);
  assert.equal(deepScan.books[0].title,'Deep Book');

  // Malformed and oversized sidecars are enrichment failures only; media remains usable.
  const brokenRoot='content://root/tree/primary:Books/document/primary:Broken';
  const brokenBook=brokenRoot+'%2FUnknown.epub';
  const brokenSidecar=brokenRoot+'%2FUnknown.opf';
  saf.dirs.set(brokenRoot,[brokenBook,brokenSidecar]);
  fileText.set(brokenSidecar,'<package><metadata><dc:title>');
  fileInfo.set(brokenSidecar,{exists:true,size:31});
  const brokenScan=await scanLocalFolders([{id:brokenRoot,uri:brokenRoot,name:'Broken',status:'Ready',itemCount:0}]);
  assert.equal(brokenScan.books.length,1);
  assert.equal(brokenScan.books[0].title,'Unknown');
  assert.equal(brokenScan.books[0].needsReview,true);

  const oversizedRoot='content://root/tree/primary:Books/document/primary:Oversized';
  const oversizedBook=oversizedRoot+'%2FOriginal.epub';
  const oversizedSidecar=oversizedRoot+'%2FOriginal.opf';
  saf.dirs.set(oversizedRoot,[oversizedBook,oversizedSidecar]);
  fileText.set(oversizedSidecar,'<package><metadata><dc:title>Should Not Be Read</dc:title><dc:creator>Someone</dc:creator></metadata></package>');
  fileInfo.set(oversizedSidecar,{exists:true,size:3*1024*1024});
  const oversizedScan=await scanLocalFolders([{id:oversizedRoot,uri:oversizedRoot,name:'Oversized',status:'Ready',itemCount:0}]);
  assert.equal(oversizedScan.books.length,1);
  assert.equal(oversizedScan.books[0].title,'Original');
  assert.equal(fileReads.includes(oversizedSidecar),false);

  const copiedHistoryUri='content://com.android.externalstorage.documents/tree/primary%3ABooks/document/primary%3ABooks%2FOrganised%2FDune.epub';
  const removed = await removeLocalSortCopies({
    id:'1',
    createdAt:new Date().toISOString(),
    copied:[{id:'work:dune:asset:1',title:'Dune',uri:copiedHistoryUri}],
    failed:[],
  });
  assert.equal(removed.copied.length,1);
  assert.equal(saf.deleted[0],copiedHistoryUri);
  console.log('PASS: local scanner handles messy names, CBZ/CBR/CBT, deep folders, huge files, bounded sidecars, explicit source trees and recovery');
})().catch(e => { console.error(e); process.exitCode = 1; });

assert.equal(parseLocalSidecar('<metadata><dc:date>1998-06-01</dc:date></metadata>','opf').publishedYear,1998);
const identifierSidecar=parseLocalSidecar(
  '<package><metadata><dc:title>Dune</dc:title><dc:creator>Frank Herbert</dc:creator><dc:publisher>Ace</dc:publisher><dc:identifier>urn:isbn:9780441172719</dc:identifier><dc:identifier>uuid:ignore-me</dc:identifier><meta name="calibre:series" content="Dune"/><meta name="calibre:series_index" content="1"/></metadata></package>',
  'opf',
);
assert.equal(identifierSidecar.isbn,'9780441172719');
assert.equal(identifierSidecar.identifiers.includes('9780441172719'),true);
assert.equal(identifierSidecar.identifiers.includes('uuid:ignore-me'),true);
assert.equal(identifierSidecar.publisher,'Ace');
assert.equal(identifierSidecar.series,'Dune');
assert.equal(identifierSidecar.seriesIndex,1);
assert.equal(parseLocalSidecar('<metadata><year>unknown</year></metadata>','nfo').publishedYear,undefined);
