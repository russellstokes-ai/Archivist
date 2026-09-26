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
Module._load = function(request, parent, isMain) {
  if (request === 'react-native') return {Platform: {OS: 'android'}};
  if (request === 'expo-file-system/legacy') return {StorageAccessFramework: saf};
  return load.call(this, request, parent, isMain);
};

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {applyLocalSortCopies, previewLocalSort, removeLocalSortCopies, localFolderName} = require('./localLibrary.ts');
const {inferLocalBookMetadata} = require('./libraryIntelligence.ts');

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
let previews = previewLocalSort(books.slice(0, 2), 'format-author-title');
assert.equal(previews[0].to, 'EPUB/Frank Herbert/Dune/Dune.epub');
assert.equal(previews[1].to, 'Comic/Frank Herbert/Dune/Dune.cbz');
assert.equal(previews.every(item => item.state === 'ready'), true);

previews = previewLocalSort([books[0], {...books[0], id: 4, uri: 'content://root/document/primary:Other%2FDune.epub'}], 'author-title');
assert.equal(previews.every(item => item.state === 'conflict'), true);

(async () => {
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
  console.log('PASS: local folder naming, conservative metadata inference, local sort preview paths/conflicts, copy apply and recovery');
})().catch(e => { console.error(e); process.exitCode = 1; });
