// Test 23 RED/green gate: device-shaped, conflicting tag data, not hand-picked
// perfect album values. No private filename or absolute storage path is used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);
const {audioWorkGroupKeys,synchronizeLocalMetadata}=require('./metadataSync.ts');
const {groupLocalWorks}=require('./localWorks.ts');
const {localWorksForReview}=require('./publicationPipeline.ts');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const root='content://com.android.externalstorage.documents/tree/primary%3AAudioBooks/document/primary%3AAudioBooks';
function audio(book,part,album,base='Writer/'){
  const folder='primary:AudioBooks/'+base+book;
  const stem=String(part).padStart(2,'0')+' - Chapter '+String(part).padStart(2,'0');
  return {
    uri:'content://com.android.externalstorage.documents/document/'+encodeURIComponent(folder+'/'+stem+'.mp3'),
    rootUri:root,space:'AudioBooks',format:'Audio',title:stem,
    author:'',series:'',available:true,needsReview:true,coverShape:'square',
    fileSize:4*1024*1024,
    workKey:'inferred-file:'+book+':'+part,
    embeddedMetadata:album?{workTitle:album,trackNumber:part}:{},
  };
}
// The real-world regression class is chapter metadata that says Track/Chapter/Disc,
// plus an album showing a true book title, plus untouched/missing album tags.
// These MUST not become dozens of "books" just because a chapter carries bad tags.
const corpus=[];
for(let work=0;work<12;work++){
  const title='Novel '+String(work).padStart(2,'0');
  const total=work===11?18:19;
  for(let chapter=1;chapter<=total;chapter++){
    const album=chapter<=3?title:chapter<=6?title+' (Disc 2)'
      :chapter<=10?'Chapter '+String(chapter).padStart(2,'0')
      :chapter<=12?'Disc '+(chapter<=11?2:3)
      :chapter<=14?'':title;
    corpus.push(audio(title,chapter,album));
  }
}
assert.equal(corpus.length,227);
assert.equal(groupLocalWorks(corpus).length,12,
  'RED: chapter/disc metadata must not split 227 files into false book identities');
assert.equal(groupLocalWorks(synchronizeLocalMetadata(corpus).books).length,12,
  'RED: identity must stay stable after metadata sync');
assert.equal(localWorksForReview(corpus).filter(x=>x.needsReview).length,12,
  'RED: work-level Needs Attention, not 85+ chapter-level cards');
assert.equal(new Set([...audioWorkGroupKeys(corpus).values()]).size,12);
// Negative gate: distinct ALBUMS in one mixed folder must not combine.
const mixed=[
  audio('Mixed',1,'Dune',''),audio('Mixed',2,'Dune',''),
  audio('Mixed',3,'Project Hail Mary',''),audio('Mixed',4,'Project Hail Mary',''),
];
assert.deepEqual(groupLocalWorks(mixed).map(x=>x.files).sort((a,b)=>a-b),[2,2],
  'never merge two true books just to reduce review counts');
// Stage 2 must enrich already-found books while respecting provider caches.
// A normal explicit Identify button is NOT an explicit force-refresh of existing matches.
assert.match(app,/await enrichPublishedLocalLibrary\(staged,generation,true,false\)/,
  'routine Identify uses configured providers while respecting cached results');
console.log('PASS: Test23 chapter-like tags, distinct album boundary, 227/12 work counts and cached identify');
