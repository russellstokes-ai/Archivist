const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const writes=[],reads=new Map(),deleted=[],made=[];
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'}};
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///app/Documents/',
    async makeDirectoryAsync(uri,options){made.push([uri,options]);},
    async writeAsStringAsync(uri,text){writes.push([uri,text]);reads.set(uri,text);},
    async readAsStringAsync(uri){return reads.get(uri)||'';},
    async getInfoAsync(uri){return {exists:reads.has(uri)};},
    async deleteAsync(uri){deleted.push(uri);reads.delete(uri);},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {buildAndroidAutoLibrary,persistAndroidAutoLibrary,consumeAndroidAutoProgress}=require('./androidAuto.ts');

(async()=>{
  const works=[
    {
      key:'audio-dir:Books:Dune',title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',
      format:'Audio',available:true,readingState:'in-progress',favourite:true,
      tracks:[
        {uri:'content://books/dune/01.mp3',title:'Chapter 1',available:true},
        {uri:'content://books/dune/02.mp3',title:'Chapter 2',available:true},
      ],coverUri:'file:///covers/dune.jpg',
    },
    {
      key:'book:epub',title:'A Book',author:'Writer',series:'',genre:'',format:'EPUB',available:true,
      tracks:[{uri:'file:///book.epub',title:'A Book',available:true}],
    },
    {
      key:'offline:server|12',title:'Foundation',author:'Isaac Asimov',series:'Foundation',genre:'Science Fiction',
      format:'Audio',available:true,readingState:'not-started',favourite:false,
      tracks:[{uri:'file:///offline/foundation.m4b',title:'Foundation',available:true}],
    },
    {
      key:'missing',title:'Unavailable Audio',author:'',series:'',genre:'',format:'Audio',available:false,
      tracks:[{uri:'file:///missing.m4b',title:'Missing',available:false}],
    },
  ];

  const snapshot=buildAndroidAutoLibrary(works,{'audio-dir:Books:Dune':{uri:'content://books/dune/02.mp3',seconds:431.25}});
  assert.equal(snapshot.version,2);
  assert.deepEqual(snapshot.works.map(work=>work.title),['Dune','Foundation']);
  assert.equal(snapshot.works[0].id,'work:audio-dir:Books:Dune');
  assert.equal(snapshot.works[0].key,'audio-dir:Books:Dune');
  assert.equal(snapshot.works[0].readingState,'in-progress');
  assert.equal(snapshot.works[0].favourite,true);
  assert.equal(snapshot.works[0].resumeTrackId,'track:audio-dir:Books:Dune:1');
  assert.equal(snapshot.works[0].resumeSeconds,431.25);
  assert.equal(snapshot.works[0].tracks.length,2);
  assert.equal(snapshot.works[1].tracks[0].uri,'file:///offline/foundation.m4b');
  assert.equal(JSON.stringify(snapshot).includes('token'),false);

  await persistAndroidAutoLibrary(works,{'audio-dir:Books:Dune':{uri:'content://books/dune/02.mp3',seconds:431.25}});
  assert.equal(made.length,1);
  assert.equal(writes[0][0],'file:///app/Documents/android-auto/library.json');
  assert.equal(JSON.parse(writes[0][1]).works[0].resumeSeconds,431.25);

  const progressUri='file:///app/Documents/android-auto/progress.json';
  reads.set(progressUri,JSON.stringify({version:1,workKey:'audio-dir:Books:Dune',trackUri:'content://books/dune/02.mp3',seconds:499.5,complete:false,updatedAt:123}));
  const progress=await consumeAndroidAutoProgress();
  assert.equal(progress.workKey,'audio-dir:Books:Dune');
  assert.equal(progress.seconds,499.5);
  assert.equal(deleted.includes(progressUri),true);

  console.log('PASS: Android Auto library exposes playable audiobooks, resume/favourites state and safe progress handoff');
})().catch(error=>{console.error(error);process.exitCode=1;});
