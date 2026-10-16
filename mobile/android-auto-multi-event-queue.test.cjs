const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const native=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt','utf8');
const original=Module._load,files=new Map(),deleted=[];
const root='file:///test/android-auto/',queue=root+'pending/';
let failDelete=false,failListing=false;
Module._load=function(name,parent,main){
  if(name==='react-native')return {Platform:{OS:'android'}};
  if(name==='expo-file-system/legacy')return {
    documentDirectory:'file:///test/',
    async getInfoAsync(path){
      if(path===queue)return {exists:[...files.keys()].some(p=>p.startsWith(queue)),isDirectory:true};
      return {exists:files.has(path),size:files.get(path)?.length};
    },
    async readAsStringAsync(path){if(!files.has(path))throw Error('ENOENT');return files.get(path)},
    async readDirectoryAsync(uri){
      if(uri!==queue)throw Error('Unexpected folder '+uri);
      if(failListing)throw Error('EACCES: queue is temporarily unreadable');
      return [...files.keys()].filter(p=>p.startsWith(uri)).map(p=>p.slice(uri.length));
    },
    async deleteAsync(uri){if(failDelete)throw Error('simulated deletion failure');
      deleted.push(uri);files.delete(uri);},
    async makeDirectoryAsync(){},
    async writeAsStringAsync(path,value){files.set(path,value)},
  };
  return original.call(this,name,parent,main);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {consumeAndroidAutoProgress,acknowledgeAndroidAutoProgress,sameAndroidAutoProgress}=require('./androidAuto.ts');
const eventId=(time,index,hex)=>'event-'+time+'-'+index+'-'+hex.repeat(32)+'.json';
const e1=eventId('1760640000001','000001','a'),e2=eventId('1760640000002','000002','b');
const event=(id,track,seconds)=>({version:1,workKey:'audio:book',trackUri:'file:///media/'+track,
  seconds,complete:false,updatedAt:1760640000010,eventId:id});
const older=event(e1,'first.m4b',215),newer=event(e2,'second.m4b',12);
(async()=>{
  // Native service MUST durably journal outgoing chapter transitions, while
  // preserving the compatibility latest-position progress.json AtomicFile.
  assert(native.includes('File(dir, "pending")'),'Native queued transition folder is missing');
  assert(native.includes('AtomicFile(File(pendingDir, eventId))'),'Transitions require separate atomic files');
  assert(native.includes('.put("eventId", eventId)'),'Native event identity must be embedded and validated');
  assert(native.includes('journalTransition'),'Only chapter transitions should generate queue records');
  files.set(queue+e2,JSON.stringify(newer));
  files.set(queue+e1,JSON.stringify(older)); // intentionally out-of-order disk listing
  files.set(root+'progress.json',JSON.stringify({...newer,trackUri:'file:///media/third.m4b',seconds:19,updatedAt:1760640000030,eventId:undefined}));

  // A transient inaccessible queue cannot be considered empty. Otherwise a
  // newer latest-progress slot overtakes unacknowledged outgoing chapters.
  failListing=true;
  assert.equal(await consumeAndroidAutoProgress(),null,
    'Unreadable pending directory must fail closed, not skip queued chapters');
  assert(files.has(queue+e1)&&files.has(queue+e2),
    'Directory-read failure cannot discard durable transition records');
  failListing=false;
  const unknown=queue+'event-corrupted.json';
  files.set(unknown,'{broken');
  assert.equal(await consumeAndroidAutoProgress(),null,
    'Unknown journal event filenames must not be silently skipped in favour of later progress');
  files.delete(unknown);

  let pending=await consumeAndroidAutoProgress();
  assert.deepEqual(pending,older,'Oldest journalled chapter must be applied first');
  let receipt=null,applies=[],failPersist=true;
  const handlers={
    readReceipt:async()=>receipt,
    persistReceipt:async point=>{
      if(failPersist)throw Error('simulated phone ENOSPC before receipt');
      receipt={...point};
    },
    apply:async point=>{applies.push(point)},
  };
  await assert.rejects(acknowledgeAndroidAutoProgress(pending,handlers),/ENOSPC/);
  assert(files.has(queue+e1),'Failed receipt must not remove native event');
  assert(files.has(queue+e2),'Future chapter events must survive failed older receipt');
  failPersist=false;
  assert.equal(await acknowledgeAndroidAutoProgress(pending,handlers),true);
  assert(!files.has(queue+e1),'Only successfully acknowledged event may be removed');
  assert(files.has(queue+e2),'Newer native event must not be deleted by older ack');
  pending=await consumeAndroidAutoProgress();
  assert.deepEqual(pending,newer,'Next distinct track must remain queued and ordered');
  failDelete=true;
  await assert.rejects(acknowledgeAndroidAutoProgress(pending,handlers),/simulated deletion failure/);
  assert(sameAndroidAutoProgress(receipt,newer),'Receipt should be committed even when cleanup fails');
  assert(files.has(queue+e2),'Cleanup failure must retain replayable event');
  failDelete=false;
  assert.equal(await acknowledgeAndroidAutoProgress(pending,handlers),false,'Receipt replay is idempotent');
  assert(!files.has(queue+e2),'Retry must clean the already durably acknowledged event');
  pending=await consumeAndroidAutoProgress();
  assert.equal(pending.trackUri,'file:///media/third.m4b','Latest position follows journalled transitions');
  // Compatibility: old installs without any pending/ directory can still
  // retrieve the single latest-position file when listing ENOENTs.
  failListing=true;
  const legacy=await consumeAndroidAutoProgress();
  assert.equal(legacy?.trackUri,'file:///media/third.m4b',
    'nonexistent pending directory must retain old single-position compatibility');
  failListing=false;
  assert.equal(pending.eventId,undefined);
  await acknowledgeAndroidAutoProgress(pending,handlers);
  assert(files.has(root+'progress.json'),'Never delete latest canonical AtomicFile');

  // Untrusted path components are never deletion authority.
  const bad={...older,eventId:'../../important'};
  await assert.rejects(acknowledgeAndroidAutoProgress(bad,handlers),/invalid queued event identity/);
  assert(deleted.every(p=>p.startsWith(queue)&&/\/event-\d{13}-\d{6}-[a-f0-9]{32}\.json$/.test(p)));
  console.log('PASS: Android Auto transition queue preserves two fast chapters, fail/retry receipts, exact-file acknowledgement and latest progress');
})().catch(e=>{console.error(e);process.exitCode=1});
