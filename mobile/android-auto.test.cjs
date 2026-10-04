const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const Module=require('node:module');

const writes=[];
const made=[];
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'}};
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///app/Documents/',
    async makeDirectoryAsync(uri,options){made.push([uri,options]);},
    async writeAsStringAsync(uri,text){writes.push([uri,text]);},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {buildAndroidAutoLibrary,persistAndroidAutoLibrary}=require('./androidAuto.ts');

(async()=>{
  const works=[
    {
      key:'audio-dir:Books:Dune',
      title:'Dune',
      author:'Frank Herbert',
      series:'Dune',
      format:'Audio',
      available:true,
      tracks:[
        {uri:'content://books/dune/01.mp3',title:'Chapter 1',available:true},
        {uri:'content://books/dune/02.mp3',title:'Chapter 2',available:true},
      ],
      coverUri:'file:///covers/dune.jpg',
    },
    {
      key:'book:epub',
      title:'A Book',
      author:'Writer',
      series:'',
      format:'EPUB',
      available:true,
      tracks:[{uri:'file:///book.epub',title:'A Book',available:true}],
    },
    {
      key:'offline:server|12',
      title:'Foundation',
      author:'Isaac Asimov',
      series:'Foundation',
      format:'Audio',
      available:true,
      tracks:[{uri:'file:///offline/foundation.m4b',title:'Foundation',available:true}],
    },
    {
      key:'missing',
      title:'Unavailable Audio',
      author:'',
      series:'',
      format:'Audio',
      available:false,
      tracks:[{uri:'file:///missing.m4b',title:'Missing',available:false}],
    },
  ];

  const snapshot=buildAndroidAutoLibrary(works);
  assert.equal(snapshot.version,1);
  assert.deepEqual(snapshot.works.map(work=>work.title),['Dune','Foundation']);
  assert.equal(snapshot.works[0].id,'work:audio-dir:Books:Dune');
  assert.equal(snapshot.works[0].tracks.length,2);
  assert.equal(snapshot.works[0].tracks[0].id,'track:audio-dir:Books:Dune:0');
  assert.equal(snapshot.works[1].tracks[0].uri,'file:///offline/foundation.m4b');
  assert.equal(JSON.stringify(snapshot).includes('server|12') ,true);
  assert.equal(JSON.stringify(snapshot).includes('token'),false);

  await persistAndroidAutoLibrary(works);
  assert.equal(made.length,1);
  assert.equal(made[0][0],'file:///app/Documents/android-auto/');
  assert.equal(writes.length,1);
  assert.equal(writes[0][0],'file:///app/Documents/android-auto/library.json');
  const persisted=JSON.parse(writes[0][1]);
  assert.deepEqual(persisted.works.map(work=>work.title),['Dune','Foundation']);

  console.log('PASS: Android Auto catalogue includes only playable on-device audiobooks and contains no server credentials');
})().catch(error=>{console.error(error);process.exitCode=1;});
