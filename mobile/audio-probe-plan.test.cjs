const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);
const {fastAudioProbeUris}=require('./audioProbePlan.ts');
const {groupLocalWorks}=require('./localWorks.ts');
function audio(folder,title,i){
  return {id:i,uri:'content://root/document/primary:Audiobooks%2F'+folder+'%2F'+encodeURIComponent(title)+'.mp3',
    title,author:'',series:'',format:'Audio',space:'Audiobooks',available:true,needsReview:true};
}
const books=[];
for(let work=0;work<12;work++)for(let i=0;i<(work<11?19:18);i++){
  books.push(audio('Novel%20'+work,String(i+1).padStart(2,'0')+' - Chapter '+(i+1),work*100+i));
}
assert.equal(books.length,227);
const works=groupLocalWorks(books);
assert.equal(works.length,12);
const sample=fastAudioProbeUris(works);
assert.equal(sample.size,36,'three native metadata probes per 12 strongly grouped 18–19-chapter audiobooks');
const flat=[audio('Mixed', 'A complete standalone title',500),audio('Mixed','Another standalone title',501)];
const ambiguous=fastAudioProbeUris([{format:'Audio',tracks:flat}]);
assert.equal(ambiguous.size,2,'ambiguous directories may never skip distinct standalone assets');
const rootParts=[
  audio('Book%20One','01 - Start',10),
  audio('Book%20One','02 - Middle',11),
  audio('Book%20One','03 - End',12),
];
assert.equal(fastAudioProbeUris([{format:'Audio',tracks:rootParts}]).size,3,
  'small audiobook must inspect all its files when tags are missing');
assert.equal(fastAudioProbeUris([{format:'Audio',tracks:books.slice(0,19).map((x,i)=>i===0?{...x,embeddedMetadata:{workTitle:'Novel 0'}}:x)}]).size,2,
  'cached representative tags are reused and only remaining chosen representatives are probed');
console.log('PASS: large audiobook probes bounded to 3 files per logical work while ambiguous folders retain full inspection');
