const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const vm = require('node:vm');
const JSZip = require('jszip');

const load = Module._load;
let files = new Map();
let extracted=[];
Module._load = function(request, parent, isMain) {
  if (request === 'expo-file-system/legacy') return {
    EncodingType: {Base64: 'base64'},
    readAsStringAsync: async uri => files.get(uri),
    getInfoAsync: async uri => ({exists: files.has(uri), size: files.has(uri) ? Math.ceil(String(files.get(uri)||'').length*3/4) : 0}),
  };
  if (request === 'react-native') return {NativeModules:{ArchivistArchive:{listRarEntries:async()=>['010.jpg','002.jpg','001.jpg','ComicInfo.xml'],readRarEntry:async(uri,name)=>{extracted.push(name);return 'AQID';}}}};
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
  assert(!epub.html.includes('id="readerPrev"'));
  assert(!epub.html.includes('id="readerNext"'));

  zip = new JSZip();
  zip.file('001.jpg', Buffer.from([1, 2, 3]));
  files.set('comic.cbz', await zip.generateAsync({type: 'base64'}));
  const comic = await buildLocalReaderDocument('comic.cbz', 'Comic', 'Comic');
  assert(!comic.html.includes('data:image/jpeg;base64'),'comic HTML must not embed the whole archive');
  assert.equal(comic.pageCount,1);
  assert.equal((await comic.loadPage(0)).base64,'AQID');
  assert(comic.html.includes('reader-page-request'));
  assert(comic.html.includes('__archivistSetComicPage'));
  assert(comic.html.includes('comic-page'));
  assert(comic.html.includes('comic-page active'));
  assert(comic.html.includes('reader-page-sound') || comic.html.includes('archivist-reader-sound'));
  assert(comic.html.includes('pinchStartDistance'));
  assert(comic.html.includes('focusAt'));
  assert(comic.html.includes('lastTapAt') && comic.html.includes('distanceFromLast<=30') && comic.html.includes('suppressClickUntil'),'double-tap touch focus must work reliably in mobile WebViews');
  assert(comic.html.includes("speechFocus?.focus?.(img,x,y,'page-'+page)"),'comic double tap must attempt speech-bubble focus before generic zoom');
  assert(comic.html.includes('turn-next'));
  assert(!comic.html.includes('id="readerSound"'));

  files.set('legacy.cbr','AA==');
  const cbr=await buildLocalReaderDocument('legacy.cbr','Comic','Legacy CBR');
  assert.equal(cbr.pageCount,3);
  assert.deepEqual(extracted,[],'indexing a CBR must not extract its images');
  assert.equal((await cbr.loadPage(0)).base64,'AQID','CBR should use native archive bridge without embedding all pages in WebView');
  assert.deepEqual(extracted,['001.jpg']);
  await cbr.loadPage(1);assert.deepEqual(extracted,['001.jpg','002.jpg'],'natural page order and one-page extraction');

  // Execute the actual generated reader script with Android opaque-origin storage failures.
  const messages=[],timers=new Map(),listeners={};let timerId=0;
  function element(){return {style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(name,fn){this[name]=fn;},setAttribute(){},scrollWidth:400,remove(){},removeAttribute(key){delete this[key];},getBoundingClientRect(){return {left:0,top:0,width:400,height:600};},cloneNode(){const clone=element();clone.src=this.src;return clone;}};}
  const elements={reader:element(),readerHud:element(),readerPosition:element()},img=element();
  const layers=[];
  const document={body:{append(node){layers.push(node);}},getElementById:id=>elements[id],querySelectorAll:selector=>selector==='.comic-page'?[img]:[],documentElement:element(),addEventListener:(name,fn)=>listeners[name]=fn};
  const window={ReactNativeWebView:{postMessage:raw=>messages.push(JSON.parse(raw))},addEventListener:(name,fn)=>listeners[name]=fn};
  const sandbox={document,window,innerWidth:400,matchMedia:()=>({matches:false}),localStorage:{getItem(){throw Error('SecurityError');},setItem(){throw Error('SecurityError');}},requestAnimationFrame:fn=>fn(),setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),addEventListener(){}};
  const scripts=[...cbr.html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  vm.runInNewContext(scripts.at(-1)[1],sandbox);
  assert.equal(messages.find(m=>m.type==='reader-page-request').page,0,'first page must be requested even with blocked storage');
  window.__archivistSetComicPage(0,'image/jpeg','AQID');
  assert.equal(img.src,'data:image/jpeg;base64,AQID');
  // Single-tap chrome waits until double-tap recognition has expired.
  const beforeChrome=messages.filter(m=>m.type==='reader-chrome-toggle').length;
  elements.reader.click({clientX:100,detail:1});
  assert.equal(messages.filter(m=>m.type==='reader-chrome-toggle').length,beforeChrome);
  const singleTap=[...timers.values()].find(timer=>timer.ms===330);assert(singleTap);
  elements.reader.touchstart({touches:[{clientX:100,clientY:100}]});
  assert(![...timers.values()].includes(singleTap),'second touch cancels single-tap chrome before it changes bubble geometry');
  function swipe(from,to){elements.reader.touchstart({touches:[{clientX:from,clientY:100}]});elements.reader.touchmove({touches:[{clientX:to,clientY:105}],preventDefault(){}});assert(layers.at(-1).style.transform.includes('rotateY'),'page follows finger before release');elements.reader.touchend({touches:[],changedTouches:[{clientX:to,clientY:105}],preventDefault(){}});for(const [id,timer] of [...timers])if(timer.ms<1000){timers.delete(id);timer.fn();}}
  swipe(350,50);
  assert.equal(messages.filter(m=>m.type==='reader-position').at(-1).page,1,'left swipe advances');
  window.__archivistSetComicPage(0,'image/jpeg','STALE');assert(!img.src.includes('STALE'),'late page response must not replace current page');
  window.__archivistSetComicPage(1,'image/jpeg','PAGE2');assert(img.src.endsWith('PAGE2'));
  swipe(50,350);assert.equal(messages.filter(m=>m.type==='reader-position').at(-1).page,0,'right swipe goes back');
  listeners.message({data:JSON.stringify({type:'reader-command',command:'appearance',value:{sound:false,theme:'dark'}})});
  assert.equal(document.documentElement.dataset.readerTheme,'dark','settings must apply without storage');

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
  assert.equal((await cbt.loadPage(0)).base64,'AQID','CBT tar archive should decode locally without embedding all pages in WebView');

  const pdf = await buildLocalReaderDocument('file.pdf', 'PDF', 'PDF');
  assert.equal(pdf.uri, 'file.pdf');
  console.log('PASS: local reader EPUB/CBZ paging, focus, pinch, sound, local CBR/CBT archives and PDF passthrough');
})().catch(e => { console.error(e); process.exitCode = 1; });
