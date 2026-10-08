// Scale gate: deterministic NAS-SIZED synthetic workload (NOT raw private
// filenames, NOT byte-content/metadata accuracy, NOT a Fold benchmark).
// Real inventory sizes observed: 1,821 audio files and 4,664 comic archives.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,f);
const {groupLocalWorks}=require('./localWorks.ts');
const {synchronizeLocalMetadata}=require('./metadataSync.ts');
const {partitionLocalBooksByPublication}=require('./publicationPipeline.ts');

let serial=0;
function audio(parent,name,title,extra={}){
  serial+=1;
  const relative=parent+'/'+name;
  return {id:serial,uri:'content://nas/document/primary:Audiobooks%2F'+relative.split('/').map(encodeURIComponent).join('%2F'),
    rootUri:'content://nas/tree/primary%3AAudiobooks/document/primary%3AAudiobooks',
    space:'Audiobooks',format:'Audio',title,author:'',series:'',genre:'',
    available:true,needsReview:true,identificationState:'unresolved',coverShape:'square',...extra};
}
const tracks=[];
for(let w=0;w<40;w++){
  const folder='Synthetic Writer '+w+'/Synthetic Book '+w;
  for(let chapter=0;chapter<40;chapter++){
    const part=String(chapter+1).padStart(2,'0');
    tracks.push(audio(folder,part+' - Chapter '+part+'.mp3','Chapter '+part,{
      embeddedMetadata:chapter===0?{workTitle:'Synthetic Book '+w}:{},
      fileSize:11*1024*1024,
    }));
  }
}
for(let w=0;w<39;w++){
  const volume=String(w+1).padStart(2,'0');
  tracks.push(audio('Synthetic Writer/Discworld',volume+'. Standalone Novel '+volume+'.mp3',
    'Discworld',{fileSize:(100+(w%8)*20)*1024*1024}));
}
for(let w=0;w<7;w++){
  const folder='Course Collection/Course '+w;
  for(let chapter=0;chapter<26;chapter++){
    const part=String(chapter+1).padStart(2,'0');
    tracks.push(audio(folder,part+' Track '+part+'.mp3','Track '+part,{
      fileSize:12*1024*1024,
    }));
  }
}
assert.equal(tracks.length,1821,'audio corpus must match real NAS audio-file count');

const comics=Array.from({length:4664},(_,issue)=>{
  const folder='Comic collection '+(issue%272);
  return {id:20000+issue,
    uri:'content://nas/document/primary:Comics%2F'+encodeURIComponent(folder)+'%2F'
      +encodeURIComponent('Comic edition '+String(issue).padStart(4,'0')+'.cbz'),
    rootUri:'content://nas/tree/primary%3AComics/document/primary%3AComics',
    space:'Comics',format:'Comic',title:'Comic edition '+issue,author:'',series:'',
    available:true,needsReview:true,identificationState:'unresolved',coverShape:'portrait',
  };
});
const files=[...tracks,...comics];
assert.equal(files.length,6485);
const t0=performance.now();
const audioWorks=groupLocalWorks(tracks);
const t1=performance.now();
assert.equal(audioWorks.length,86,
 '40 multipart audiobooks + 39 independent long MP3 novels + 7 multipart courses');
assert.equal(audioWorks.filter(w=>w.files===1).length,39);
assert.deepEqual(audioWorks.map(w=>w.files).filter(n=>n>1).sort((a,b)=>a-b),
  [...Array(7).fill(26),...Array(40).fill(40)]);
const synced=synchronizeLocalMetadata(tracks).books;
const t2=performance.now();
assert.equal(groupLocalWorks(synced).length,86,'work identity remains stable after metadata sync');
const grouped=groupLocalWorks(files);
const t3=performance.now();
assert.equal(grouped.length,4750,'6485 assets represent 86 audiobook works and 4664 individual comics');
const partition=partitionLocalBooksByPublication(files);
const t4=performance.now();
assert.equal(partition.published.length,0,'unidentified library must not publish without covers');
assert.equal(partition.staged.length,6485,'every physical file must remain accounted for');
assert.equal(partition.assessments.size,4750,'attention/pub decisions must be one per logical work');
const memoryMb=Math.round(process.memoryUsage().heapUsed/1048576);
const timing={
  audioGroupingMs:Math.round(t1-t0),
  audioSyncMs:Math.round(t2-t1),
  mixedGroupingMs:Math.round(t3-t2),
  mixedPublicationMs:Math.round(t4-t3),
  totalMs:Math.round(t4-t0),
  memoryMb,
};
console.log('NAS-SIZED SYNTHETIC BASELINE '+JSON.stringify(timing));
assert.ok(timing.totalMs<30000,
  'runaway JS grouping/publication regression: 6485-asset synthetic baseline exceeds 30 seconds on CI');
assert.ok(memoryMb<650,
  'runaway scanner grouping memory regression (CI process heap >650 MB)');
console.log('PASS: 1821 audio + 4664 comic assets remain 4750 works with bounded JS baseline');
