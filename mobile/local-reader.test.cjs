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
    getInfoAsync: async uri => ({exists: files.has(uri), size: files.has(uri) ? Math.ceil(String(files.get(uri)||'').length*3/4) : 0}),
  };
  if (request === 'react-native') return {NativeModules:{ArchivistArchive:{readRarImages:async()=>[{name:'001.jpg',mime:'image/jpeg',base64:'AQID'}]}}};
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
  assert(!epub.html.includes('onclick="bad()"'));
  assert(epub.html.includes('column-width'));
  assert(epub.html.includes('text-focused'));
  assert(epub.html.includes('archivist-reader-text-scale'));
  assert(epub.html.includes('complete:page>=count-1'));
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

  files.set('legacy.cbr','AA==');
  const cbr=await buildLocalReaderDocument('legacy.cbr','Comic','Legacy CBR');
  assert(cbr.html.includes('data:image/jpeg;base64,AQID'),'CBR should use native archive bridge');

  function tarEntry(name, bytes){
    const header=Buffer.alloc(512);Buffer.from(name).copy(header,0,0,Math.min(100,name.length));
    Buffer.from('0000644\0').copy(header,100);Buffer.from('0000000\0').copy(header,108);Buffer.from('0000000\0').copy(header,116);
    Buffer.from(bytes.length.toString(8).padStart(11,'0')+'\0').copy(header,124);Buffer.from('00000000000\0').copy(header,136);
    header.fill(32,148,156);header[156]='0'.charCodeAt(0);Buffer.from('ustar\0').copy(header,257);
    let sum=0;for(const b of header)sum+=b;Buffer.from(sum.toString(8).padStart(6,'0')+'\0 ').copy(header,148);
    const pad=Buffer.alloc((512-(bytes.length%512))%512);return Buffer.concat([header,Buffer.from(bytes),pad]);
  }
  const cbtBytes=Buffer.concat([tarEntry('001.jpg',[1,2,3]),Buffer.alloc(1024)]);
  files.set('local.cbt',cbtBytes.toString('base64'));
  const cbt=await buildLocalReaderDocument('local.cbt','Comic','Local CBT');
  assert(cbt.html.includes('data:image/jpeg;base64,AQID'),'CBT tar archive should decode locally');

  const pdf = await buildLocalReaderDocument('file.pdf', 'PDF', 'PDF');
  assert.equal(pdf.uri, 'file.pdf');
  console.log('PASS: local reader EPUB/CBZ paging, focus, pinch, sound, local CBR/CBT archives and PDF passthrough');
})().catch(e => { console.error(e); process.exitCode = 1; });
