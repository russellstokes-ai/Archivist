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
    async getInfoAsync(uri){const body=files.get(uri);return body?{exists:true,size:body.length,isDirectory:false}:{exists:dirs.has(uri),isDirectory:dirs.has(uri)};},
    async getFreeDiskStorageAsync(){return 8*1024*1024*1024;},
    async getTotalDiskCapacityAsync(){return 16*1024*1024*1024;},
    async readDirectoryAsync(uri){
      const out=new Set();
      for(const dir of dirs){
        if(dir===uri||!dir.startsWith(uri))continue;
        const rest=dir.slice(uri.length).replace(/\/$/,'');
        if(rest&&!rest.includes('/'))out.add(rest);
      }
      for(const key of files.keys()){
        if(!key.startsWith(uri))continue;
        const rest=key.slice(uri.length);
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
  removeOfflineCheckpoint,
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

  // A missing chapter must not erase any intact chapters or the work record.
  files.delete(resumed.tracks[1].uri);
  const incomplete=await cleanupOfflineStorage({[resumed.key]:resumed});
  assert.deepEqual(incomplete.removedWorks,[]);
  assert.deepEqual(incomplete.retained[resumed.key].missingTrackIds,[2]);
  assert(files.has(resumed.tracks[0].uri),'intact chapter must survive cleanup');
  const stillPlayable=offlineToLocalWork(incomplete.retained[resumed.key]);
  assert.equal(stillPlayable.files,1);
  assert.equal(stillPlayable.available,true);
  assert.equal(stillPlayable.tracks[0].uri,resumed.tracks[0].uri);
  files.set(resumed.tracks[1].uri,Buffer.alloc(200));
  const recovered=await cleanupOfflineStorage(incomplete.retained);
  assert.equal(recovered.retained[resumed.key].missingTrackIds,undefined,'restored chapter must become available');

  // #31 integrity regression: an existing file can be damaged without
  // disappearing from the filesystem (truncation or zero-byte corruption).
  // Never silently prioritise that local file over a healthy server copy.
  const {sourceIdentity,dedupeForAll}=require('./librarySources.ts');
  const serverIdentity=sourceIdentity({source:'server',server:session.server,serverWorkId:resumed.workId});
  const offlineIdentity=sourceIdentity({source:'downloaded',server:session.server,serverWorkId:resumed.workId});
  const serverReady={...serverIdentity,available:true};
  const localItem=(work)=>({...offlineIdentity,available:true,localWork:offlineToLocalWork(work)});
  const fullLocal=localItem(recovered.retained[resumed.key]);
  assert.equal(dedupeForAll([serverReady,fullLocal])[0].source,'downloaded',
    'verified complete local work must beat an available server');
  const originalOne=files.get(resumed.tracks[0].uri);
  const originalTwo=files.get(resumed.tracks[1].uri);
  // A partly damaged audiobook should choose the complete server online,
  // but its verified local chapter stays accessible while disconnected.
  files.set(resumed.tracks[0].uri,Buffer.alloc(15));
  const partiallyDamaged=await cleanupOfflineStorage(recovered.retained);
  const partialLocal=localItem(partiallyDamaged.retained[resumed.key]);
  assert.equal(partialLocal.localWork.available,true);
  assert.equal(partialLocal.localWork.offlineIncomplete,true);
  assert.equal(partialLocal.localWork.files,1);
  assert.equal(dedupeForAll([partialLocal,serverReady])[0].source,'server',
    'online complete server should win over damaged partial downloaded work');
  assert.equal(dedupeForAll([{...serverReady,available:false},partialLocal])[0].source,'downloaded',
    'offline partial chapters must still be usable without server');
  files.set(resumed.tracks[1].uri,Buffer.alloc(0));
  const damagedStorage=await inspectOfflineStorage(recovered.retained);
  assert.equal(damagedStorage.missingFiles,2,
    'both truncated and empty tracks must count as unavailable');
  assert.equal(damagedStorage.incompleteWorks,1);
  assert(damagedStorage.actualBytes>=15,'damaged bytes remain accounted for on disk');
  const integrity=await cleanupOfflineStorage(recovered.retained);
  assert.deepEqual(integrity.retained[resumed.key].missingTrackIds,[1,2]);
  assert(files.has(resumed.tracks[0].uri)&&files.has(resumed.tracks[1].uri),
    'validation must not erase potentially recoverable media');
  const invalidLocal=localItem(integrity.retained[resumed.key]);
  assert.equal(invalidLocal.localWork.available,false);
  assert.equal(invalidLocal.localWork.files,0);
  assert.equal(dedupeForAll([serverReady,invalidLocal])[0].source,'server',
    'corrupt downloads must not hide playable online work');
  assert.equal(dedupeForAll([invalidLocal,serverReady])[0].source,'server',
    'server fallback must not depend on source ordering');
  const offlineServer={...serverReady,available:false};
  assert.equal(dedupeForAll([invalidLocal,offlineServer])[0].source,'server',
    'unavailable remote must not be hidden by a falsely playable corrupt download');
  assert.equal(dedupeForAll([invalidLocal,offlineServer])[0].available,false,
    'do not claim a usable file if neither server nor device can play it');
  files.set(resumed.tracks[0].uri,originalOne);
  files.set(resumed.tracks[1].uri,originalTwo);
  const restoredIntegrity=await cleanupOfflineStorage(integrity.retained);
  assert.equal(restoredIntegrity.retained[resumed.key].missingTrackIds,undefined,
    'verified restored file sizes must recover offline availability');
  assert.equal(dedupeForAll([serverReady,localItem(restoredIntegrity.retained[resumed.key])])[0].source,'downloaded',
    'restored downloads must reclaim offline-first priority');

  // Unknown directories containing media may be an interrupted but recoverable
  // offline work. Cleanup must not irreversibly delete those media files.
  dirs.add('file:///docs/archivist-offline/orphan/');
  files.set('file:///docs/archivist-offline/orphan/junk.bin',Buffer.alloc(10));
  dirs.add('file:///docs/archivist-offline/empty-orphan/');
  const cleaned=await cleanupOfflineStorage({[resumed.key]:resumed});
  assert.equal(cleaned.removedWorks.length,0);
  assert.equal(cleaned.removedOrphans,1,'only provably empty orphans may be removed');
  assert(files.has('file:///docs/archivist-offline/orphan/junk.bin'),'orphan files must be kept for possible recovery');

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

  // Discarding an unfinished download must not delete the chapters which
  // were already downloaded or any arbitrary persisted path.
  const abandonDir=offlineDirectory(session.server,65);
  const completedUri=abandonDir+'001-complete.mp3';
  const incompleteUri=abandonDir+'002-partial.mp3';
  files.set(completedUri,Buffer.alloc(100));
  files.set(incompleteUri,Buffer.alloc(30));
  const abandon={version:1,key:offlineKey(session.server,65),server:session.server,workId:65,
    completedTrackIds:[1],current:{trackId:2,uri:incompleteUri,bytesWritten:30},updatedAt:new Date().toISOString()};
  await removeOfflineCheckpoint(abandon);
  assert(files.has(completedUri),'discarding partial chapter must preserve completed chapter');
  assert(!files.has(incompleteUri),'unfinished direct-child track should be discarded');
  await removeOfflineCheckpoint({...abandon,current:{trackId:1,uri:completedUri,bytesWritten:100}});
  assert(files.has(completedUri),'a completed track ID must never be removed by stale checkpoint');
  await removeOfflineCheckpoint({...abandon,current:{trackId:2,uri:protectedUri,bytesWritten:1}});
  assert(files.has(protectedUri),'untrusted checkpoint URI must never permit deleting external files');

  // Repeated download requests must reuse verified files instead of deleting
  // a completed book before its replacement has been downloaded.
  const safeWork={...work,id:60,title:'Already Downloaded'};
  const first=await downloadOfflineWork(session,safeWork,tracks);
  const before=first.tracks.map(t=>files.get(t.uri));
  const downloadCount=downloads.length;
  const second=await downloadOfflineWork(session,safeWork,tracks);
  assert.equal(second.bytes,300);
  assert.equal(downloads.length,downloadCount,'verified completed tracks and cover should not redownload');
  first.tracks.forEach((t,i)=>assert.equal(files.get(t.uri),before[i],'completed track was changed'));
  const oldTrack=files.get(first.tracks[0].uri);
  await assert.rejects(
    downloadOfflineWork(session,safeWork,[tracks[0],{...tracks[1],size:999}]),
    /cannot be safely verified or replaced/,
  );
  assert.equal(files.get(first.tracks[0].uri),oldTrack,'preflight failure must not erase previous work');
  assert(files.has(first.tracks[1].uri),'second completed track must survive failed replacement');

  console.log('PASS: offline downloads recover, retain partial works, protect orphan media, reuse verified downloads and reject destructive redownloads');
})().catch(e=>{console.error(e);process.exitCode=1;});
