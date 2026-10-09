const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const file = __dirname + '/scannerVNext/discovery.ts';
assert.ok(fs.existsSync(file), 'Fresh bounded discovery implementation must exist');
const {discoverSource} = require(file);
const {classifyAsset} = require('./scannerVNext/classify.ts');
const source = {id:'source-a',rootUri:'content://selected-tree',name:'Granted root'};
const asset = (documentId, relativePath, mimeType='') => ({documentId,relativePath,name:relativePath.split('/').pop(),mimeType,size:10,modified:1});

// Losing ambiguous or unsupported files, or equating audio with audiobook, breaks these tests.
const cases = [
  ['track.MP3','audio/mpeg','candidate','audio'],
  ['novel.m4b','audio/mp4','candidate','audio'],
  ['sound.flac','audio/flac','candidate','audio'],
  ['issue.cbr','application/x-rar-compressed','candidate','comic'],
  ['issue.cbz','application/zip','candidate','comic'],
  ['issue.cbt','application/x-tar','candidate','comic'],
  ['book.epub','application/epub+zip','candidate','ebook'],
  ['unknown.pdf','application/pdf','ambiguous','document'],
  ['unknown.zip','application/zip','ambiguous','archive'],
  ['book.mobi','','unsupported','ebook'],
  ['book.azw3','','unsupported','ebook'],
  ['archive.cb7','','unsupported','comic'],
  ['cover.JPG','image/jpeg','candidate','artwork'],
  ['notes.opf','','candidate','sidecar'],
  ['track.mp3','image/jpeg','ambiguous','unknown'],
  ['opaque','audio/mpeg','candidate','audio'],
  ['film.mkv','video/x-matroska','unsupported','unknown'],
];
for(const [name,mimeType,state,kind] of cases) {
  const got=classifyAsset({name,mimeType});
  assert.equal(got.state,state,name); assert.equal(got.kind,kind,name);
  assert.ok(got.reason,name+' requires an explicit reason');
  if(kind==='audio') assert.equal(got.audiobookConfirmed,false);
}
assert.equal(classifyAsset({name:'issue.cbz',mimeType:'application/zip',signature:new Uint8Array([0,0,0,0,0,0,0,0])}).state,'ambiguous');
assert.equal(classifyAsset({name:'issue.cbz',mimeType:'application/zip',signature:new Uint8Array([80,75,3,4])}).state,'candidate');

function store() {
  return {saved:new Map(),checkpoints:[],issues:[],
    async saveSource(){},
    async saveBatch(sourceId,entries,checkpoint) { for(const entry of entries)this.saved.set(sourceId+'|'+entry.documentId,entry);this.checkpoints.push(checkpoint); },
    async saveIssue(sourceId,issue){this.issues.push(issue);}
  };
}
function access(batches) {
  return {async nextBatch(src,cursor,limit,signal){return batches[cursor==null?0:Number(cursor)];}};
}
(async()=>{
  const persisted=store();
  const result=await discoverSource(source,access([
    {entries:[asset('1','Music/one.mp3'),asset('2','Other/file.pdf')],nextCursor:'1'},
    {entries:[asset('3','Other/book.mobi')],nextCursor:null}
  ]),persisted,{maxEntries:100,batchSize:2});
  assert.equal(result.visited,3);assert.equal(result.accounted,3);assert.equal(result.candidates,1);assert.equal(result.ambiguous,1);assert.equal(result.unsupported,1);assert.equal(result.complete,true);
  assert.equal(persisted.saved.size,3);
  const unsafe=store();
  const rejected=await discoverSource(source,access([{entries:[asset('1','../outside.mp3'),asset('2','/outside.mp3'),asset('3','C:\\outside.mp3')],nextCursor:null}]),unsafe,{});
  assert.equal(rejected.rejected,3);assert.equal(rejected.candidates,0);
  assert.ok([...unsafe.saved.values()].every(x=>x.disposition.reason==='outside-selected-root'));
  const duplicates=store();
  const dup=await discoverSource(source,access([{entries:[asset('1','one.mp3'),asset('1','one.mp3')],nextCursor:null}]),duplicates,{});
  assert.equal(dup.accounted,1);assert.equal(dup.duplicateEntries,1);assert.equal(duplicates.saved.size,1);
  const capped=store();
  const cap=await discoverSource(source,access([{entries:[asset('1','one.mp3'),asset('2','two.mp3')],nextCursor:'2'}]),capped,{maxEntries:2,batchSize:2});
  assert.equal(cap.complete,false);assert.equal(cap.reason,'entry-limit');assert.equal(cap.nextCursor,'2');assert.equal(capped.saved.size,2);
  const cancelled=store();const controller=new AbortController();
  const late={async nextBatch(){controller.abort();return {entries:[asset('late','late.mp3')],nextCursor:null};}};
  const cancel=await discoverSource(source,late,cancelled,{signal:controller.signal});
  assert.equal(cancel.reason,'cancelled');assert.equal(cancelled.saved.size,0);
  const loop=await discoverSource(source,access([{entries:[],nextCursor:'0'}]),store(),{});
  assert.equal(loop.reason,'cursor-loop');assert.equal(loop.complete,false);
  const denied=store();
  const failure=await discoverSource(source,{async nextBatch(){throw new Error('permission revoked');}},denied,{});
  assert.equal(failure.reason,'provider-error');assert.equal(denied.issues.length,1);
  const oversized=store();
  const bad=await discoverSource(source,access([{entries:[asset('1','one.mp3'),asset('2','two.mp3')],nextCursor:null}]),oversized,{batchSize:1});
  assert.equal(bad.reason,'invalid-batch');assert.equal(oversized.saved.size,0);
  let largestBatch=0;
  const stressStore=store();const stressStart=Date.now();
  const stress=await discoverSource(source,{async nextBatch(src,cursor,limit){
    largestBatch=Math.max(largestBatch,limit);const start=Number(cursor??0);
    return {entries:Array.from({length:limit},(_,i)=>asset(String(start+i),'stress/'+(start+i)+'.mp3')),nextCursor:String(start+limit)};
  }},stressStore);
  assert.equal(stress.accounted,100000);assert.equal(stress.reason,'entry-limit');assert.equal(stress.nextCursor,'100000');assert.equal(largestBatch,128);
  console.log('PASS: 100,000-entry cap and continuation, max batch '+largestBatch+', '+(Date.now()-stressStart)+'ms');
  console.log('PASS: 17 classification cases; signature mismatch; discovery persistence, scope, duplicates, cap, cancellation, loop, provider failure and batch bounds');
})().catch(error=>{console.error(error);process.exitCode=1;});
