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
    this.dirs.set(parent, [...(this.dirs.get(parent) || []), uri]);
    return uri;
  },
  async copyAsync(copy) {
    this.copies.push(copy);
    const source=fileInfo.get(copy.from)||{exists:true,size:1};
    fileInfo.set(copy.to,{...source,exists:true});
  },
  async deleteAsync(uri) { this.deleted.push(uri); },
};
const fileText = new Map();
const fileInfo = new Map();
const fileReads = [];
const infoReads = [];
const localDirs = new Map();
const localCopies = [];
const localDeletes = [];
const localMade = [];
Module._load = function(request, parent, isMain) {
  if (request === 'react-native') return {Platform: {OS: 'android'}};
  if (request === 'expo-file-system/legacy') return {
    EncodingType: {Base64:'base64'},
    StorageAccessFramework: saf,
    async readAsStringAsync(uri) { fileReads.push(uri); return fileText.get(uri) || ''; },
    async readDirectoryAsync(uri) { return localDirs.get(uri) || []; },
    async getInfoAsync(uri) { infoReads.push(uri); return fileInfo.get(uri) || {exists: false, size: 0}; },
    async makeDirectoryAsync(uri) {
      localMade.push(uri);
      if(!localDirs.has(uri))localDirs.set(uri,[]);
      const slash=uri.lastIndexOf('/');
      if(slash>7){
        const parent=uri.slice(0,slash);
        const name=decodeURIComponent(uri.slice(slash+1));
        const entries=localDirs.get(parent)||[];
        if(!entries.includes(name))localDirs.set(parent,[...entries,name]);
      }
    },
    async copyAsync(copy) {
      localCopies.push(copy);
      const source=fileInfo.get(copy.from)||{exists:true,size:1};
      fileInfo.set(copy.to,{...source,exists:true});
    },
    async deleteAsync(uri) {
      localDeletes.push(uri);
      fileInfo.set(uri,{exists:false,size:0});
    },
  };
  return load.call(this, request, parent, isMain);
};

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {applyLocalSortCopies, previewLocalSort, removeLocalFolderSource, removeLocalSortCopies, localFolderName, scanLocalFolders} = require('./localLibrary.ts');
const {applyLocalMetadata, inferLocalBookMetadata, parseLocalSidecar} = require('./libraryIntelligence.ts');

const books = [
  {id: 1, uri: 'content://root/document/primary:Books%2FDune.epub', title: 'Dune', author: 'Frank Herbert', series: 'Dune', format: 'EPUB', space: 'Books', available: true},
  {id: 2, uri: 'content://root/document/primary:Books%2FDune.cbz', title: 'Dune', author: 'Frank Herbert', series: 'Dune', format: 'Comic', space: 'Books', available: true},
  {id: 3, uri: 'content://root/document/primary:Books%2FDune-copy.epub', title: 'Dune', author: 'Frank Herbert', series: 'Dune', format: 'EPUB', space: 'Books', available: true},
];

assert.equal(localFolderName('content://root/tree/primary:Comics/document/primary:Comics'), 'Comics');

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

const qualified = inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FAndy%20Weir%20-%20Project%20Hail%20Mary%20%7BRay%20Porter%7D%20%5BASIN%20B08G9PRS1K%5D.m4b',
  'Audio',
);
assert.equal(qualified.title, 'Project Hail Mary');
assert.equal(qualified.author, 'Andy Weir');
assert.equal(qualified.narrator, 'Ray Porter');
assert.equal(qualified.asin, 'B08G9PRS1K');

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
const genericPart = inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2FPart%2036.mp3',
  'Audio',
);
assert.equal(genericPart.title, 'Dune');
assert.equal(genericPart.author, 'Frank Herbert');
assert.equal(genericPart.needsReview, false);
const genericChapter = inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Saga%2FDune%2FChapter%2001.mp3',
  'Audio',
);
assert.equal(genericChapter.title, 'Dune');
assert.equal(genericChapter.author, 'Frank Herbert');
assert.equal(genericChapter.series, 'Dune Saga');

let previews = previewLocalSort(books.slice(0, 2), 'format-author-title');
assert.equal(previews[0].to, 'EPUB/Frank Herbert/Dune/Dune.epub');
assert.equal(previews[1].to, 'Comic/Frank Herbert/Dune/Dune.cbz');
assert.equal(previews.every(item => item.state === 'ready'), true);

previews = previewLocalSort([books[0], {...books[0], id: 4, uri: 'content://root/document/primary:Other%2FDune.epub'}], 'author-title');
assert.equal(previews.every(item => item.state === 'conflict'), true);

previews = previewLocalSort([{...books[0], needsReview: true}], 'author-title');
assert.equal(previews[0].state, 'review');

(async () => {
  const root = 'content://root/tree/primary:Books/document/primary:Books';
  const file = root + '%2FMystery.epub';
  const sidecar = root + '%2FMystery.opf';
  const cover = root + '%2FMystery.jpg';
  const genericCover = root + '%2Fcover.jpg';
  const frontCover = root + '%2Ffront.jpg';
  saf.dirs.set(root, [file, sidecar, cover, genericCover, frontCover]);
  fileText.set(sidecar, '<package><metadata><dc:title>The Dispossessed</dc:title><dc:creator>Ursula K. Le Guin</dc:creator><dc:subject>Science Fiction</dc:subject></metadata></package>');
  fileInfo.set(sidecar, {exists: true, size: 160});
  let scanned = await scanLocalFolders([{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}]);
  assert.equal(scanned.books.length, 1);
  assert.equal(scanned.books[0].title, 'The Dispossessed');
  assert.equal(scanned.books[0].metadataSource, 'sidecar');
  assert.equal(scanned.books[0].genre, 'Science Fiction');
  assert.equal(scanned.books[0].needsReview, false);
  assert.equal(scanned.books[0].coverUri, cover);
  assert.deepEqual(scanned.books[0].coverCandidates, [cover, genericCover, frontCover]);

  scanned = await scanLocalFolders(
    [{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}],
    undefined,
    {[file]: {title:'My correction',author:'Manual Author',series:'Manual Series',genre:'Fantasy',publishedYear:2001,coverUri:'content://manual/MyCover.jpg'}},
  );
  assert.equal(scanned.books[0].title, 'My correction');
  assert.equal(scanned.books[0].metadataSource, 'manual');
  assert.equal(scanned.books[0].genre, 'Fantasy');
  assert.equal(scanned.books[0].needsReview, false);
  assert.equal(scanned.books[0].publishedYear, 2001);
  assert.equal(scanned.books[0].coverUri, 'content://manual/MyCover.jpg');
  assert.deepEqual(scanned.books[0].coverCandidates, [cover, genericCover, frontCover]);

  const dottedRoot='content://root/tree/primary:Books/document/primary:Books2';
  const dottedAuthor=dottedRoot+'%2FJ.R.R.%20Tolkien';
  const dottedBook=dottedAuthor+'%2FThe%20Hobbit.epub';
  saf.dirs.set(dottedRoot,[dottedAuthor]);
  saf.dirs.set(dottedAuthor,[dottedBook]);
  const dottedScan=await scanLocalFolders([{id:dottedRoot,uri:dottedRoot,name:'Books2',status:'Ready',itemCount:0}]);
  assert.equal(dottedScan.books.length,1);
  assert.equal(dottedScan.books[0].title,'The Hobbit');

  // Discovery matches the local reader: CBZ, CBR and CBT all enter the library.
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
  assert.equal(infoReads.includes(hugeBook),true);
  assert.equal(fileReads.includes(hugeBook),false);

  // Deeply nested libraries have no arbitrary folder-depth limit.
  const deepRoot='content://root/tree/primary:Books/document/primary:Deep';
  let deepParent=deepRoot;
  for(let depth=1;depth<=30;depth++){
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

  // App-private file:// libraries use the same scanner and organisation engine.
  // This is the persistent half of the iOS import path after the system picker copy completes.
  const iosRoot='file:///app/Documents/local-libraries/123-Books';
  const iosAuthor=iosRoot+'/Frank%20Herbert';
  const iosBook=iosAuthor+'/Dune.epub';
  localDirs.set(iosRoot,['Frank Herbert']);
  localDirs.set(iosAuthor,['Dune.epub']);
  fileInfo.set(iosBook,{exists:true,size:2048,modificationTime:123});
  const iosScan=await scanLocalFolders([{id:iosRoot,uri:iosRoot,name:'Books',status:'Imported',itemCount:1}]);
  assert.equal(iosScan.books.length,1);
  assert.equal(iosScan.books[0].title,'Dune');
  assert.equal(iosScan.books[0].rootUri,iosRoot);
  assert.equal(iosScan.books[0].uri,iosBook);

  const iosPreview=previewLocalSort([{...iosScan.books[0],author:'Frank Herbert',needsReview:false}],'author-title');
  assert.equal(iosPreview[0].rootUri,iosRoot);
  assert.equal(iosPreview[0].state,'ready');
  const iosApply=await applyLocalSortCopies(iosPreview);
  assert.equal(iosApply.copied.length,1);
  assert.equal(iosApply.failed.length,0);
  assert.equal(localCopies.length,1);
  assert.equal(localCopies[0].from,iosBook);
  assert.match(localCopies[0].to,/file:\/\/\/app\/Documents\/local-libraries\/123-Books\/Frank%20Herbert\/Dune\/Dune\.epub$/);
  const iosRemoved=await removeLocalSortCopies({id:'ios',createdAt:new Date().toISOString(),copied:iosApply.copied,failed:[]});
  assert.equal(iosRemoved.copied.length,1);
  assert.equal(localDeletes[0],iosApply.copied[0].uri);

  previews = previewLocalSort([books[0]], 'author-series-title');
  saf.dirs.set(previews[0].rootUri, []);
  const result = await applyLocalSortCopies(previews);
  assert.equal(result.copied.length, 1);
  assert.equal(result.failed.length, 0);
  assert.equal(saf.made.map(item => item[1]).join('/'), 'Frank Herbert/Dune/Dune');
  assert.equal(saf.files[0][1], 'Dune');
  assert.equal(saf.files[0][2], 'application/epub+zip');
  assert.equal(saf.copies[0].from, books[0].uri);
  assert.equal(saf.copies[0].to, saf.files[0][3]);

  const collisionResult = await applyLocalSortCopies(previews);
  assert.equal(collisionResult.copied.length, 0);
  assert.match(collisionResult.failed[0].error, /Destination already exists/);

  const checkpointRoot='content://root/tree/primary:Sort2/document/primary:Sort2';
  const checkpointBook={...books[0],id:77,uri:'content://root/document/primary:Source%2FCheckpoint.epub',title:'Checkpoint'};
  const checkpointPreview=previewLocalSort([checkpointBook],'author-title').map(item=>({...item,rootUri:checkpointRoot}));
  saf.dirs.set(checkpointRoot,[]);
  let checkpointCalls=0;
  const checkpointResult=await applyLocalSortCopies(checkpointPreview,async partial=>{
    checkpointCalls+=1;
    assert.equal(partial.copied.length,1,'sort checkpoint durability');
  });
  assert.equal(checkpointResult.copied.length,1);
  assert.equal(checkpointCalls,1);

  const beforeSourceRemovalDeletes=saf.deleted.length;
  await removeLocalFolderSource({id:root,uri:root,name:'Books',status:'Ready',itemCount:1});
  assert.equal(saf.deleted.length,beforeSourceRemovalDeletes,'Android source removal must never delete the linked user folder');

  const removed = await removeLocalSortCopies({id: '1', createdAt: new Date().toISOString(), copied: result.copied, failed: []});
  assert.equal(removed.copied.length, 1);
  assert.equal(saf.deleted[0], result.copied[0].uri);
  console.log('PASS: local scanner handles Android SAF and app-private iOS libraries, messy names, comics, deep folders, huge files, bounded sidecars, metadata caching, sort previews and recovery');
})().catch(e => { console.error(e); process.exitCode = 1; });

assert.equal(parseLocalSidecar('<metadata><dc:date>1998-06-01</dc:date></metadata>','opf').publishedYear,1998);
assert.equal(parseLocalSidecar('<metadata><year>unknown</year></metadata>','nfo').publishedYear,undefined);
