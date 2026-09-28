const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');

const originalLoad=Module._load;
const dirs=new Set(['file:///docs/']);
const files=new Map();
const downloads=[];
let resumeCalls=0;
function bodyFor(url){return url.includes('/cover')?Buffer.alloc(120):Buffer.alloc(url.endsWith('/2')?200:100);}
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///docs/',
    async makeDirectoryAsync(uri){dirs.add(uri);},
    async deleteAsync(uri){for(const key of [...files.keys()])if(key.startsWith(uri))files.delete(key);dirs.delete(uri);},
    async downloadAsync(url,uri,options){
      downloads.push({url,uri,options});
      files.set(uri,bodyFor(url));
      return {uri,status:200,headers:{}};
    },
    createDownloadResumable(url,uri,options,progress,resumeData){
      const run=async(isResume)=>{
        if(isResume)resumeCalls++;
        downloads.push({url,uri,options,resumeData});
        const body=bodyFor(url);
        files.set(uri,body);
        progress?.({totalBytesWritten:body.length,totalBytesExpectedToWrite:body.length});
        return {uri,status:200,headers:{}};
      };
      return {
        downloadAsync:()=>run(false),
        resumeAsync:()=>run(true),
        async pauseAsync(){return {resumeData:'mock-resume'};},
      };
    },
    async getInfoAsync(uri){const body=files.get(uri);return body?{exists:true,size:body.length}:{exists:dirs.has(uri)};},
    async getFreeDiskStorageAsync(){return 8*1024*1024*1024;},
    async getTotalDiskCapacityAsync(){return 16*1024*1024*1024;},
    async readDirectoryAsync(uri){
      const out=new Set();
      for(const dir of dirs){
        if(dir===uri||!dir.startsWith(uri))continue;
        const rest=dir.slice(uri.length).replace(/\/$/,'');
        if(rest&&!rest.includes('/'))out.add(rest);
      }
      return [...out];
    },
  };
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {
  cleanupOfflineStorage,
  downloadOfflineWork,
  inspectOfflineStorage,
  offlineDirectory,
  offlineKey,
  offlineToLocalWork,
  removeOfflineWork,
}=require('./offlineLibrary.ts');

(async()=>{
  const session={server:'http://100.64.0.2:3000',token:'secret'};
  const work={id:42,title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Audio',space:'Audiobooks'};
  const tracks=[
    {id:1,title:'Opening',format:'Audio',edition:7,available:true,name:'01 - Opening.mp3',size:100},
    {id:2,title:'Arrakis',format:'Audio',edition:7,available:true,name:'02 - Arrakis.mp3',size:200},
  ];
  const progress=[],checkpoints=[];
  const offline=await downloadOfflineWork(
    session,work,tracks,
    (written,total)=>progress.push([written,total]),
    {onCheckpoint:checkpoint=>checkpoints.push(checkpoint)},
  );
  assert.equal(offline.tracks.length,2);
  assert.equal(offline.bytes,300);
  assert(offline.tracks[0].uri.endsWith('.mp3'));
  assert.equal(offline.coverUri?.endsWith('cover.jpg'),true);
  assert(progress.some(([written,total])=>written===300&&total===300));
  assert.equal(checkpoints.at(-1),null);
  assert(downloads.every(item=>item.options.headers.Authorization==='Bearer secret'));

  const local=offlineToLocalWork(offline);
  assert.equal(local.format,'Audio');
  assert.equal(local.files,2);
  assert.equal(local.tracks[1].uri,offline.tracks[1].uri);
  assert.equal(local.genre,'Science Fiction');

  const storage=await inspectOfflineStorage({[offline.key]:offline});
  assert.equal(storage.items,1);
  assert.equal(storage.missingFiles,0);
  assert(storage.actualBytes>=300);
  assert.equal(storage.freeBytes,8*1024*1024*1024);

  await removeOfflineWork(offline);
  assert.equal(files.size,0);

  // Resume a work with track 1 already complete and track 2 carrying native resume data.
  const resumeWork={...work,id:47,title:'Resume Me'};
  const resumeDir=offlineDirectory(session.server,resumeWork.id);
  await Module._load('expo-file-system/legacy').makeDirectoryAsync(resumeDir);
  files.set(resumeDir+'001-01_-_Opening.mp3',Buffer.alloc(100));
  files.set(resumeDir+'002-02_-_Arrakis.mp3',Buffer.alloc(50));
  const checkpoint={
    version:1,
    key:offlineKey(session.server,resumeWork.id),
    server:session.server,
    workId:resumeWork.id,
    title:resumeWork.title,
    directory:resumeDir,
    completedTrackIds:[1],
    current:{trackId:2,uri:resumeDir+'002-02_-_Arrakis.mp3',resumeData:'saved-resume',bytesWritten:50},
    updatedAt:new Date().toISOString(),
  };
  const resumed=await downloadOfflineWork(session,resumeWork,tracks,undefined,{checkpoint});
  assert.equal(resumed.bytes,300);
  assert.equal(resumeCalls,1);

  // A stale resume token without its partial file must restart cleanly rather than loop forever.
  const missingPartialWork={...work,id:49,title:'Missing Partial'};
  const missingDir=offlineDirectory(session.server,missingPartialWork.id);
  await Module._load('expo-file-system/legacy').makeDirectoryAsync(missingDir);
  files.set(missingDir+'001-01_-_Opening.mp3',Buffer.alloc(100));
  const missingCheckpoint={
    version:1,
    key:offlineKey(session.server,missingPartialWork.id),
    server:session.server,
    workId:missingPartialWork.id,
    title:missingPartialWork.title,
    directory:'file:///docs/evil-claimed-path/',
    completedTrackIds:[1],
    current:{trackId:2,uri:missingDir+'002-02_-_Arrakis.mp3',resumeData:'stale-resume',bytesWritten:50},
    updatedAt:new Date().toISOString(),
  };
  const resumesBefore=resumeCalls;
  const restarted=await downloadOfflineWork(session,missingPartialWork,tracks,undefined,{checkpoint:missingCheckpoint});
  assert.equal(restarted.bytes,300);
  assert.equal(resumeCalls,resumesBefore,'missing partial file must restart instead of resuming stale native data');

  // Persisted URIs are metadata, never deletion authorities.
  const protectedUri='file:///docs/keep/secret.bin';
  files.set(protectedUri,Buffer.from('keep'));
  await removeOfflineWork({...restarted,tracks:[{...restarted.tracks[0],uri:protectedUri}]});
  assert.equal(files.has(protectedUri),true,'removeOfflineWork must only delete the derived Archivist work directory');

  dirs.add('file:///docs/archivist-offline/orphan/');
  files.set('file:///docs/archivist-offline/orphan/junk.bin',Buffer.alloc(10));
  const cleaned=await cleanupOfflineStorage({[resumed.key]:resumed});
  assert.equal(cleaned.removedWorks.length,0);
  assert(cleaned.removedOrphans>=1);

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:43,format:'Comic'},[
      {id:3,title:'Comic',format:'Comic',edition:8,available:true,name:'issue.cbr',size:100},
    ]),
    /CBR\/RAR comics are not supported.*CBZ\/ZIP/,
  );

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:48,format:'Comic'},[
      {id:8,title:'Tar comic',format:'Comic',edition:8,available:true,name:'issue.cbt',size:100},
    ]),
    /CBT comics can be read from the Archivist server.*CBZ\/ZIP/,
  );

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:45,format:'Comic'},[
      {id:5,title:'Old server comic',format:'Comic',edition:8,available:true,size:100},
    ]),
    /Update your Archivist server/,
  );

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:46,format:'Ebook'},[
      {id:6,title:'Large EPUB',format:'Ebook',edition:8,available:true,name:'large.epub',size:300*1024*1024},
    ]),
    /256 MB/,
  );

  await assert.rejects(
    downloadOfflineWork(session,{...work,id:44},[
      {id:4,title:'Huge',format:'Audio',edition:9,available:true,name:'huge.m4b',size:9*1024*1024*1024},
    ]),
    /8 GB/,
  );

  console.log('PASS: offline server works resume/restart safely, derive deletion paths, report storage, clean orphans, preserve auth/covers and enforce safety limits');
})().catch(e=>{console.error(e);process.exitCode=1;});
