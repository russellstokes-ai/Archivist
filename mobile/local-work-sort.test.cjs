const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const load=Module._load;
const saf={
  dirs:new Map(),
  made:[],
  files:[],
  copies:[],
  deleted:[],
  failCopyAt:0,
  async readDirectoryAsync(uri){return this.dirs.get(uri)||[];},
  async makeDirectoryAsync(parent,name){
    const uri=parent+'%2F'+encodeURIComponent(name);
    this.made.push([parent,name,uri]);
    this.dirs.set(parent,[...(this.dirs.get(parent)||[]),uri]);
    this.dirs.set(uri,[]);
    return uri;
  },
  async createFileAsync(parent,name,mime){
    const uri=parent+'%2F'+encodeURIComponent(name);
    this.files.push([parent,name,mime,uri]);
    return uri;
  },
  async copyAsync(copy){
    this.copies.push(copy);
    if(this.failCopyAt&&this.copies.length===this.failCopyAt)throw Error('simulated copy failure');
  },
  async deleteAsync(uri){this.deleted.push(uri);},
};
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {StorageAccessFramework:saf};
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {previewLocalWorkSort,applyLocalWorkSortCopies,sortableLocalWork}=require('./localWorkSort.ts');

const root='content://com.android.externalstorage.documents/tree/primary%3AAudiobooks';
function track(id,name,extra={}){
  return {
    id,
    uri:root+'/document/primary%3AAudiobooks%2F'+encodeURIComponent(name),
    title:name.replace(/\.[^.]+$/,''),
    author:'Frank Herbert',
    series:'Dune',
    genre:'Science Fiction',
    format:'Audio',
    space:'Audiobooks',
    available:true,
    identificationConfidence:'high',
    needsReview:false,
    coverShape:'square',
    coverUri:'file://dune.jpg',
    sourceUri:root,
    ...extra,
  };
}
function work(tracks,extra={}){
  return {
    key:'audio:dune',
    source:'local',
    title:'Dune',
    author:'Frank Herbert',
    series:'Dune',
    genre:'Science Fiction',
    publishedYear:1965,
    format:'Audio',
    space:'Audiobooks',
    available:true,
    files:tracks.length,
    tracks,
    needsReview:false,
    reviewReason:'',
    coverUri:'file://dune.jpg',
    coverShape:'square',
    ...extra,
  };
}

const complete=work([track(1,'Dune - Chapter 01.mp3'),track(2,'Dune - Chapter 02.mp3')]);
assert.equal(sortableLocalWork(complete),true);
let previews=previewLocalWorkSort([complete],'author-series-title');
assert.equal(previews.length,1);
assert.equal(previews[0].state,'ready');
assert.equal(previews[0].files,2);
assert.equal(previews[0].to,'Frank Herbert/Dune/Dune');
assert.equal(previews[0].members.length,2);
assert.equal(previews[0].members[0].rootUri,root,'sorter must use the selected SAF source URI directly');
assert.equal(previews[0].members[0].relativePath,'Frank Herbert/Dune/Dune/Dune - Chapter 01.mp3');

const unresolved=work([
  track(3,'Unknown 01.mp3',{identificationConfidence:'medium',needsReview:true}),
  track(4,'Unknown 02.mp3',{identificationConfidence:'medium'}),
],{key:'audio:unknown',title:'Unknown',needsReview:true,reviewReason:'Check title',coverUri:undefined});
previews=previewLocalWorkSort([unresolved],'author-title');
assert.equal(previews[0].state,'review');
assert.match(previews[0].reason,/Metadata review|required|resolution/i);

const medium=work([track(5,'Dune.m4b',{identificationConfidence:'medium'})],{key:'audio:medium'});
previews=previewLocalWorkSort([medium],'author-title');
assert.equal(previews[0].state,'review');
assert.match(previews[0].reason,/high-confidence/i);

const manyTracks=Array.from({length:36},(_,index)=>track(
  100+index,
  'Dune - Chapter '+String(index+1).padStart(2,'0')+'.mp3',
  {trackNumber:index+1},
));
previews=previewLocalWorkSort([work(manyTracks)],'author-title');
assert.equal(previews.length,1,'36 audiobook tracks must produce one work preview');
assert.equal(previews[0].files,36);
assert.equal(previews[0].members.length,36);
assert.equal(new Set(previews[0].members.map(member=>member.to.split('/').slice(0,-1).join('/'))).size,1,'all audiobook tracks must share one resolved work directory');
assert.equal(previews[0].members.every(member=>member.to.startsWith('Frank Herbert/Dune/')),true);

const discTracks=[
  track(200,'Disc 1/01.mp3',{discNumber:1}),
  track(201,'Disc 2/01.mp3',{discNumber:2}),
];
previews=previewLocalWorkSort([work(discTracks)],'author-title');
assert.equal(previews[0].state,'ready');
assert.equal(previews[0].members[0].relativePath,'Frank Herbert/Dune/Disc 1/01.mp3');
assert.equal(previews[0].members[1].relativePath,'Frank Herbert/Dune/Disc 2/01.mp3');

const duplicateA=work([track(300,'Dune.m4b')],{key:'copy:a'});
const duplicateB=work([track(301,'Dune.m4b',{uri:root+'/document/primary%3AAudiobooks%2FOther%2FDune.m4b'})],{key:'copy:b'});
previews=previewLocalWorkSort([duplicateA,duplicateB],'author-title');
assert.equal(previews.every(preview=>preview.state==='conflict'),true,'two works targeting the same final file must both be blocked');

(async()=>{
  saf.dirs.set(root,[]);
  const ready=previewLocalWorkSort([complete],'author-title');
  const result=await applyLocalWorkSortCopies(ready);
  assert.equal(result.failed.length,0);
  assert.equal(result.copied.length,2);
  assert.equal(saf.copies.length,2);
  assert.equal(saf.copies.every(copy=>copy.from.includes('Dune%20-%20Chapter')),true);

  saf.dirs.clear();saf.made=[];saf.files=[];saf.copies=[];saf.deleted=[];saf.failCopyAt=3;
  saf.dirs.set(root,[]);
  const rollbackWork=work([
    track(400,'Dune - Chapter 01.mp3'),
    track(401,'Dune - Chapter 02.mp3'),
    track(402,'Dune - Chapter 03.mp3'),
    track(403,'Dune - Chapter 04.mp3'),
  ],{key:'rollback'});
  const rollbackPreview=previewLocalWorkSort([rollbackWork],'author-title');
  const failed=await applyLocalWorkSortCopies(rollbackPreview);
  assert.equal(failed.copied.length,0,'a failed work must not report partial successful copies');
  assert.equal(failed.failed.length,1);
  assert.equal(saf.deleted.length,3,'all destination files created before or during a work failure must be rolled back');

  const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
  assert.equal(app.includes('previewLocalSort(localBooks'),false,'App must not use the legacy asset-level sorter');
  assert(app.includes('previewLocalWorkSort(allPhoneWorks'),'App must preview grouped local works');
  assert(app.includes('applyLocalWorkSortCopies(ready)'),'App must apply work-level sort transactions');

  console.log('PASS: local sorter operates only on resolved works and rolls back partial audiobook copies');
})().catch(error=>{console.error(error);process.exitCode=1});
