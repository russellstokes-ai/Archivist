const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');

const originalLoad=Module._load;
const dirs=new Set(['file:///docs/']);
const files=new Map();
const downloads=[];
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///docs/',
    async makeDirectoryAsync(uri){dirs.add(uri);},
    async deleteAsync(uri){for(const key of [...files.keys()])if(key.startsWith(uri))files.delete(key);dirs.delete(uri);},
    async downloadAsync(url,uri,options){
      downloads.push({url,uri,options});
      const body=url.includes('/cover')?Buffer.alloc(120):Buffer.alloc(url.endsWith('/2')?200:100);
      files.set(uri,body);
      return {uri,status:200,headers:{}};
    },
    async getInfoAsync(uri){const body=files.get(uri);return body?{exists:true,size:body.length}:{exists:dirs.has(uri)};},
  };
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {downloadOfflineWork,removeOfflineWork,offlineToLocalWork}=require('./offlineLibrary.ts');

(async()=>{
  const session={server:'http://100.64.0.2:3000',token:'secret'};
  const work={id:42,title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Audio',space:'Audiobooks'};
  const tracks=[
    {id:1,title:'Opening',format:'Audio',edition:7,available:true,name:'01 - Opening.mp3',size:100},
    {id:2,title:'Arrakis',format:'Audio',edition:7,available:true,name:'02 - Arrakis.mp3',size:200},
  ];
  const progress=[];
  const offline=await downloadOfflineWork(session,work,tracks,(written,total)=>progress.push([written,total]));
  assert.equal(offline.tracks.length,2);
  assert.equal(offline.bytes,300);
  assert(offline.tracks[0].uri.endsWith('.mp3'));
  assert.equal(offline.coverUri?.endsWith('cover.jpg'),true);
  assert.deepEqual(progress,[[100,300],[300,300]]);
  assert(downloads.every(item=>item.options.headers.Authorization==='Bearer secret'));

  const local=offlineToLocalWork(offline);
  assert.equal(local.format,'Audio');
  assert.equal(local.files,2);
  assert.equal(local.tracks[1].uri,offline.tracks[1].uri);
  assert.equal(local.genre,'Science Fiction');

  await removeOfflineWork(offline);
  assert.equal(files.size,0);

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:43,format:'Comic'},[
      {id:3,title:'Comic',format:'Comic',edition:8,available:true,name:'issue.cbr',size:100},
    ]),
    /CBZ\/ZIP/,
  );

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:44},[
      {id:4,title:'Huge',format:'Audio',edition:9,available:true,name:'huge.m4b',size:9*1024*1024*1024},
    ]),
    /8 GB/,
  );

  console.log('PASS: offline server works preserve files, auth, progress, covers, cleanup and safety limits');
})().catch(e=>{console.error(e);process.exitCode=1;});
