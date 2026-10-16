// Copy-on-write offline media durability: no file that might be referenced
// by a published manifest is ever a download destination or cleanup target.
// This uses a throw-injectable, exact byte-model of the Expo legacy filesystem.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const originalLoad=Module._load;
const files=new Map(),dirs=new Set(['file:///docs/']);
const downloads=[];
let offlineMode=false,failMove=false,gatedDownload=null,moveCalls=0,denyFinalStatFor=null;
let resumeCalls=0;
const mediaFor=url=>url.includes('/cover')?Buffer.from('cover'):Buffer.from('THIS IS VERIFIED REPLACEMENT MEDIA').subarray(0,29);
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {
    documentDirectory:'file:///docs/',
    async makeDirectoryAsync(uri){dirs.add(uri)},
    async getInfoAsync(uri){
      if(denyFinalStatFor && uri.startsWith(denyFinalStatFor) && !uri.includes('.archivist-partial-'))
        throw Error('simulated filesystem permission failure while statting final media');
      const data=files.get(uri);
      return data===undefined?{exists:dirs.has(uri),isDirectory:dirs.has(uri)}
        :{exists:true,isDirectory:false,size:data.length};
    },
    async getFreeDiskStorageAsync(){return 12*1024*1024*1024},
    async getTotalDiskCapacityAsync(){return 16*1024*1024*1024},
    async copyAsync({from,to}){
      if(files.has(to)||!files.has(from))throw Error('unsafe copy');
      files.set(to,Buffer.from(files.get(from)));
    },
    async moveAsync({from,to}){
      moveCalls++;
      if(failMove)throw Error('simulated disk full during stage promotion');
      if(files.has(to)||!files.has(from))throw Error('unsafe overwrite during stage promotion');
      files.set(to,files.get(from));files.delete(from);
    },
    async deleteAsync(uri){
      for(const path of [...files.keys()])if(path===uri||path.startsWith(uri.endsWith('/')?uri:uri+'/'))files.delete(path);
      dirs.delete(uri);
    },
    async readDirectoryAsync(uri){return [...files.keys()].filter(x=>x.startsWith(uri)).map(x=>x.slice(uri.length))},
    async downloadAsync(url,uri,opts){
      if(url.includes('/api/assets/'))throw Error('media download bypassed safe resumable API');
      files.set(uri,mediaFor(url));return {status:200,uri,headers:{}};
    },
    createDownloadResumable(url,uri,opts,progress,resumeData){
      const run=async resumed=>{
        downloads.push({url,uri,opts,wasResume:resumed});
        if(resumed)resumeCalls++;
        assert(uri.includes('.archivist-partial-'),'media bytes must only be written to a staging URI');
        if(gatedDownload){
          const gate=gatedDownload;
          if(gate.pauseScenario){
            files.set(uri,mediaFor(url).subarray(0,7));
            progress?.({totalBytesWritten:7,totalBytesExpectedToWrite:mediaFor(url).length});
            await gate.promise;
            return null;
          }
          await gate.promise;
        }
        if(offlineMode)throw Error('simulated network failure before destination receives media');
        const bytes=mediaFor(url);
        files.set(uri,bytes);
        progress?.({totalBytesWritten:bytes.length,totalBytesExpectedToWrite:bytes.length});
        return {status:200,uri,headers:{}};
      };
      return {downloadAsync:()=>run(false),resumeAsync:()=>run(true),pauseAsync:async()=>({resumeData:'mock-resume'})};
    }
  };
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);
const {downloadOfflineWork,offlineKey,offlineDirectory,removeOfflineCheckpoint,pauseActiveOfflineDownload}=require('./offlineLibrary.ts');
const server='https://private-test.local',session={server,token:'dummy-no-real-credentials'};
const work=id=>({id,title:'Durable audiobook',author:'Archivist QA',series:'',genre:'',space:'Test',format:'Audio'});
const media=mediaFor('https://test/api/assets/1');
const track={id:1,title:'Chapter 1',format:'Audio',edition:2,available:true,name:'Chapter 1.m4b',size:media.length};
const checkpoint=id=>({version:1,key:offlineKey(server,id),server,workId:id,title:'Durable audiobook',
  directory:offlineDirectory(server,id),completedTrackIds:[],updatedAt:new Date().toISOString()});
const byId=id=>offlineDirectory(server,id)+'001-Chapter_1.m4b';
async function rejected(promise,pattern){await assert.rejects(promise,pattern)}

(async()=>{
  // A published media file is never deleted during a failed newer download.
  const id=751,oldPath=byId(id),original=Buffer.from('ORIGINAL PUBLISHED USER MEDIA - preserve bytes exactly');
  files.set(oldPath,original);
  const saved=[];
  offlineMode=true;
  await rejected(downloadOfflineWork(session,work(id),[track],undefined,{
    checkpoint:checkpoint(id),onCheckpoint:next=>saved.push(next),
  }),/simulated network failure/);
  assert.deepEqual(files.get(oldPath),original,'network failure must never delete prior original media');
  assert.equal(downloads.length,1);
  assert.notEqual(downloads[0].uri,oldPath,'network request must not target published media');
  const failed=saved.at(-1);
  assert(failed?.current?.uri.includes('.archivist-partial-'));
  assert.notEqual(failed.current.targetUri,oldPath,'mismatched old file needs immutable alternate publication');

  // Recover from the persisted checkpoint, promote a new version, retain old.
  offlineMode=false;
  const newCopy=await downloadOfflineWork(session,work(id),[track],undefined,{checkpoint:failed});
  assert.deepEqual(files.get(oldPath),original,'success must not overwrite prior published media either');
  assert.equal(files.get(newCopy.tracks[0].uri).toString(),media.toString());
  assert.notEqual(newCopy.tracks[0].uri,oldPath,'fresh verified media must publish to versioned URI');
  assert(newCopy.tracks[0].uri.endsWith('.m4b'),'replacement extension must remain reader-compatible');
  assert(!newCopy.tracks[0].uri.includes('.archivist-partial-'),'reader cannot see download stage');

  // Promotion failure leaves prior media and source stage; never advertises a
  // newly completed work in a checkpoint or publishes a corrupted partial.
  const mid=752,midPath=byId(mid),priorMedia=Buffer.from('older user media, retain exactly');
  files.set(midPath,priorMedia);
  const failures=[];
  failMove=true;
  await rejected(downloadOfflineWork(session,work(mid),[track],undefined,{
    checkpoint:checkpoint(mid),onCheckpoint:cp=>failures.push(cp),
  }),/simulated disk full/);
  assert.deepEqual(files.get(midPath),priorMedia);
  assert(failures.at(-1)?.current?.uri.includes('.archivist-partial-'));
  assert(files.has(failures.at(-1).current.uri),'staged media must remain recoverable on failed promotion');
  failMove=false;
  const recovered=await downloadOfflineWork(session,work(mid),[track],undefined,{checkpoint:failures.at(-1)});
  assert.equal(files.get(recovered.tracks[0].uri).toString(),media.toString());
  assert.deepEqual(files.get(midPath),priorMedia);

  // A hostile/corrupted persisted checkpoint is not permission to delete
  // another folder's contents or write to an arbitrary URI.
  const protectedUri='file:///docs/protected/private-notes.dat';
  files.set(protectedUri,Buffer.from('must survive'));
  const poisoned={...checkpoint(753),current:{trackId:1,uri:protectedUri,targetUri:protectedUri,resumeData:'unsafe',
    bytesWritten:11,expectedSize:11}};
  const proof=await downloadOfflineWork(session,work(753),[track],undefined,{checkpoint:poisoned});
  assert.equal(proof.tracks.length,1);
  assert.equal(files.get(protectedUri).toString(),'must survive');
  await removeOfflineCheckpoint(poisoned);
  assert(files.has(protectedUri),'untrusted URI must not be treated as deletion authority');

  // Within a process, two simultaneous downloads of one work must not
  // write to the same journal/target. Other works can continue.
  let unblock;
  gatedDownload={promise:new Promise(resolve=>{unblock=resolve})};
  const active=downloadOfflineWork(session,work(754),[track]);
  for(let i=0;i<12 && !downloads.some(d=>d.url.endsWith('/1')&&d.uri.includes('-754/'));i++)
    await new Promise(setImmediate);
  await rejected(downloadOfflineWork(session,work(754),[track]),/already downloading/);
  gatedDownload=null;unblock();
  const finished=await active;
  assert.equal(finished.tracks.length,1);
  assert(moveCalls>=4,'staging must publish verified chapters');

  // Native resumable pause must retain the private stage and its own resume
  // token; resuming may never overwrite the original final destination.
  const pauseWork=757;
  let releasePause;
  gatedDownload={pauseScenario:true,promise:new Promise(resolve=>{releasePause=resolve})};
  const partials=[];
  const pending=downloadOfflineWork(session,work(pauseWork),[track],undefined,{
    onCheckpoint:cp=>partials.push(cp),
  });
  for(let i=0;i<15&&!downloads.some(d=>d.uri.includes('-757/'));i++)
    await new Promise(setImmediate);
  assert.equal(await pauseActiveOfflineDownload(),true,'active task must expose a safe pause');
  gatedDownload=null;releasePause();
  await assert.rejects(pending,error=>error?.name==='OfflineDownloadPausedError');
  const partial=partials.at(-1);
  assert.equal(partial.current.resumeData,'mock-resume');
  assert.equal(files.get(partial.current.uri).length,7);
  const resumedBefore=resumeCalls;
  const resumed=await downloadOfflineWork(session,work(pauseWork),[track],undefined,{checkpoint:partial});
  assert.equal(resumeCalls,resumedBefore+1,'matching private stage may safely use native resume token');
  assert.equal(files.get(resumed.tracks[0].uri).toString(),media.toString());

  // Filesystem errors must never be interpreted as proof that a destination
  // is absent; the helper must preserve the checkpoint and stage, not move.
  const uncertain=758, uncertainCheckpoints=[];
  denyFinalStatFor=offlineDirectory(server,uncertain);
  await assert.rejects(
    downloadOfflineWork(session,work(uncertain),[track],undefined,{
      onCheckpoint:cp=>uncertainCheckpoints.push(cp),
    }),
    /simulated filesystem permission failure/,
  );
  assert(uncertainCheckpoints.at(-1)?.current?.uri.includes('.archivist-partial-'));
  assert.equal(files.has(byId(uncertain)),false);
  denyFinalStatFor=null;
  const recoveredAfterStat=await downloadOfflineWork(session,work(uncertain),[track],undefined,{
    checkpoint:uncertainCheckpoints.at(-1),
  });
  assert.equal(files.get(recoveredAfterStat.tracks[0].uri).toString(),media.toString());

  console.log('PASS: offline media copy-on-write, failed-network/move/stat recovery, native pause/resume, hostile checkpoint isolation and concurrency');
})().catch(error=>{console.error(error);process.exitCode=1});
