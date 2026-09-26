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
Module._load = function(request, parent, isMain) {
  if (request === 'react-native') return {Platform: {OS: 'android'}};
  if (request === 'expo-file-system/legacy') return {
    StorageAccessFramework: saf,
    async readAsStringAsync(uri) { return fileText.get(uri) || ''; },
    async getInfoAsync(uri) { return fileInfo.get(uri) || {exists: true, size: (fileText.get(uri) || '').length}; },
  };
  return load.call(this, request, parent, isMain);
};

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {applyLocalSortCopies, previewLocalSort, removeLocalSortCopies, localFolderName, scanLocalFolders} = require('./localLibrary.ts');
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

const uncertain = inferLocalBookMetadata(
  'content://root/document/primary:Downloads%2Fsomething.epub',
  'EPUB',
);
assert.equal(uncertain.title, 'something');
assert.equal(uncertain.needsReview, true);

const opf = parseLocalSidecar(
  '<package><metadata><dc:title>The Dispossessed</dc:title><dc:creator>Ursula K. Le Guin</dc:creator><meta name="calibre:series" content="Hainish Cycle"/></metadata></package>',
  'opf',
);
assert.deepEqual(opf, {title: 'The Dispossessed', author: 'Ursula K. Le Guin', series: 'Hainish Cycle'});
const manual = applyLocalMetadata(uncertain, {title: 'Corrected', author: 'A. Writer', series: ''}, 'manual');
assert.equal(manual.metadataSource, 'manual');
assert.equal(manual.confidence, 'high');
assert.equal(manual.needsReview, false);

const audioPath = inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F01%20-%20Opening.mp3',
  'Audio',
);
assert.equal(audioPath.author, 'Frank Herbert');
assert.equal(audioPath.series, '');
let previews = previewLocalSort(books.slice(0, 2), 'format-author-title');
assert.equal(previews[0].to, 'EPUB/Frank Herbert/Dune/Dune.epub');
assert.equal(previews[1].to, 'Comic/Frank Herbert/Dune/Dune.cbz');
assert.equal(previews.every(item => item.state === 'ready'), true);

previews = previewLocalSort([books[0], {...books[0], id: 4, uri: 'content://root/document/primary:Other%2FDune.epub'}], 'author-title');
assert.equal(previews.every(item => item.state === 'conflict'), true);

(async () => {
  const root = 'content://root/tree/primary:Books/document/primary:Books';
  const file = root + '%2FMystery.epub';
  const sidecar = root + '%2FMystery.opf';
  saf.dirs.set(root, [file, sidecar]);
  fileText.set(sidecar, '<package><metadata><dc:title>The Dispossessed</dc:title><dc:creator>Ursula K. Le Guin</dc:creator></metadata></package>');
  fileInfo.set(sidecar, {exists: true, size: 160});
  let scanned = await scanLocalFolders([{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}]);
  assert.equal(scanned.books.length, 1);
  assert.equal(scanned.books[0].title, 'The Dispossessed');
  assert.equal(scanned.books[0].metadataSource, 'sidecar');
  assert.equal(scanned.books[0].needsReview, false);

  scanned = await scanLocalFolders(
    [{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}],
    undefined,
    {[file]: {title:'My correction',author:'Manual Author',series:'Manual Series'}},
  );
  assert.equal(scanned.books[0].title, 'My correction');
  assert.equal(scanned.books[0].metadataSource, 'manual');
  assert.equal(scanned.books[0].needsReview, false);

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
  const removed = await removeLocalSortCopies({id: '1', createdAt: new Date().toISOString(), copied: result.copied, failed: []});
  assert.equal(removed.copied.length, 1);
  assert.equal(saf.deleted[0], result.copied[0].uri);
  console.log('PASS: local scanner sidecars/manual overrides, metadata inference, sort previews, copy apply and recovery');
})().catch(e => { console.error(e); process.exitCode = 1; });
