const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

let archiveReads=0,audioReads=0,batches=0;
const root='content://root/tree/primary:Library/document/primary:Library';
const epub=root+'%2FWriter%2FSeries%2FBook.epub';
const audio=root+'%2FWriter%2FAudio%20Book.m4b';
const dirs=new Map([[root,[epub,audio]]]);
const info=new Map([
  [epub,{exists:true,size:1024,modificationTime:1}],
  [audio,{exists:true,size:2048,modificationTime:1}],
]);
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'}};
  if(request==='./embeddedMetadata')return {
    async extractEmbeddedMetadata(uri){
      archiveReads++;
      return uri===epub?{title:'Embedded Book',author:'Embedded Writer',series:'Embedded Series'}:{};
    },
  };
  if(request==='./audioMetadata')return {
    async extractAudioMetadata(uri){
      audioReads++;
      return uri===audio?{title:'Embedded Audio',author:'Audio Writer',narrator:'Narrator'}:{};
    },
  };
  if(request==='./coverDiscovery')return {async discoverEmbeddedCover(){return undefined;}};
  if(request==='expo-file-system/legacy')return {
    EncodingType:{Base64:'base64'},
    StorageAccessFramework:{
      async readDirectoryAsync(uri){return dirs.get(uri)||[];},
      async deleteAsync(){},
      async makeDirectoryAsync(){throw new Error('unused');},
      async createFileAsync(){throw new Error('unused');},
      async copyAsync(){},
    },
    async readDirectoryAsync(uri){return dirs.get(uri)||[];},
    async getInfoAsync(uri){return info.get(uri)||{exists:false,size:0};},
    async readAsStringAsync(){return '';},
    async makeDirectoryAsync(){},
    async copyAsync(){},
    async deleteAsync(){},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {scanLocalFolders,enrichLocalEmbeddedMetadata}=require('./localLibrary.ts');

(async()=>{
  const scan=await scanLocalFolders(
    [{id:root,uri:root,name:'Library',status:'Ready',itemCount:0}],
    undefined,
    {},
    [],
    {deferEmbeddedCovers:true,deferEmbeddedMetadata:true},
  );
  assert.equal(scan.books.length,2);
  assert.equal(archiveReads,0,'foreground discovery must not parse EPUB/CBZ archives');
  assert.equal(audioReads,0,'foreground discovery must not parse MP3/M4B tags');

  let timerTicks=0;
  const ticker=setInterval(()=>{timerTicks++;},0);
  const enriched=await enrichLocalEmbeddedMetadata(scan.books,{
    batchSize:1,
    onBatch(){batches++;},
  });
  clearInterval(ticker);

  assert.equal(archiveReads,1);
  assert.equal(audioReads,1);
  assert.ok(batches>=2,'metadata enrichment should publish bounded progress batches');
  assert.ok(timerTicks>0,'metadata enrichment must yield to the event loop between files');
  assert.equal(enriched.books.find(book=>book.uri===epub).title,'Embedded Book');
  assert.equal(enriched.books.find(book=>book.uri===epub).author,'Embedded Writer');
  assert.equal(enriched.books.find(book=>book.uri===audio).title,'Embedded Audio');
  assert.equal(enriched.books.find(book=>book.uri===audio).narrator,'Narrator');

  console.log('PASS: foreground scan defers heavy metadata and background enrichment yields between files');
})().catch(error=>{console.error(error);process.exitCode=1;});
