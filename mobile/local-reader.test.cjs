const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const JSZip = require('jszip');

const load = Module._load;
let files = new Map();
Module._load = function(request, parent, isMain) {
  if (request === 'expo-file-system/legacy') return {
    EncodingType: {Base64: 'base64'},
    readAsStringAsync: async uri => files.get(uri),
  };
  return load.call(this, request, parent, isMain);
};

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
}).outputText, file);

const {buildLocalReaderDocument} = require('./localReader.ts');

(async () => {
  let zip = new JSZip();
  zip.file('OPS/chapter1.xhtml', '<html><body><h1>Dune</h1><p onclick="bad()">Arrakis</p><script>bad()</script></body></html>');
  files.set('book.epub', await zip.generateAsync({type: 'base64'}));
  const epub = await buildLocalReaderDocument('book.epub', 'EPUB', 'Dune');
  assert(epub.html.includes('Arrakis'));
  assert(!epub.html.includes('bad()'));
  assert(!epub.html.includes('onclick'));
  assert(epub.html.includes('column-width'));
  assert(epub.html.includes('text-focused'));
  assert(epub.html.includes('archivist-reader-text-scale'));
  assert(epub.html.includes('readerPrev'));
  assert(epub.html.includes('readerNext'));

  zip = new JSZip();
  zip.file('001.jpg', Buffer.from([1, 2, 3]));
  files.set('comic.cbz', await zip.generateAsync({type: 'base64'}));
  const comic = await buildLocalReaderDocument('comic.cbz', 'Comic', 'Comic');
  assert(comic.html.includes('data:image/jpeg;base64'));
  assert(comic.html.includes('comic-page'));
  assert(comic.html.includes('comic-page active'));
  assert(comic.html.includes('reader-page-sound') || comic.html.includes('archivist-reader-sound'));
  assert(comic.html.includes('pinchStartDistance'));
  assert(comic.html.includes('focusAt'));
  assert(comic.html.includes('turn-next'));
  assert(comic.html.includes('Sound on'));

  const pdf = await buildLocalReaderDocument('file.pdf', 'PDF', 'PDF');
  assert.equal(pdf.uri, 'file.pdf');
  console.log('PASS: local reader EPUB/comic paging, focus, pinch, sound and PDF passthrough');
})().catch(e => { console.error(e); process.exitCode = 1; });
