const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'progressReconciliation.ts'),'utf8');
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleExports={};
vm.runInNewContext(transpiled,{exports:moduleExports,module:{exports:moduleExports},URL,Promise,Set,Map,Number,JSON,encodeURIComponent,Error});
const {OfflineProgressOutbox,planProgressReplay,fetchCompleteProgressSnapshot}=moduleExports;

(async()=>{
  const disk=new Map();
  let writes=0;
  const storage={
    read:async key=>disk.get(key)??null,
    write:async(key,value)=>{await Promise.resolve();disk.set(key,value);writes++},
  };
  const a=new OfflineProgressOutbox(storage,'https://library.example',1);
  const b=new OfflineProgressOutbox(storage,'https://library.example',2);
  assert.notEqual(a.key,b.key,'family profiles must never share queued bookmarks');
  const first=await a.record('edition',12,{asset:101,seconds:100,complete:false},2);
  const second=await a.record('edition',12,{asset:101,seconds:200,complete:false},3);
  assert.equal(second.baseRevision,2,'offline writes must retain their original base revision');
  assert.equal((await a.list()).length,1,'coalesced events must not accumulate unbounded duplicates');
  assert.equal(await a.acknowledge('edition',12,first.sequence),false,'stale acknowledgment must not lose newer data');
  assert.equal((await a.list())[0].position.seconds,200);
  assert.equal((await b.list()).length,0,'other profile must not see first profile progress');
  await b.record('listening',5,{asset:5,seconds:20,complete:true},0);
  assert.equal((await b.list()).length,1);
  assert.equal((await a.list()).length,1);
  const recording=new OfflineProgressOutbox(storage,'https://library.example',1);
  assert.equal((await recording.list())[0].position.seconds,200,'journal must survive manager restart');

  // Reconciliation is only safe after every profile-authorised page is read.
  const batch=[
    {kind:'edition',id:12,asset:101,seconds:80,revision:2,complete:false},
    {kind:'listening',id:9,asset:9,seconds:0,revision:1,complete:false},
    {kind:'reading',id:88,part:2,fraction:0.1,revision:1,complete:false},
  ];
  const history=[];
  const loaded=await fetchCompleteProgressSnapshot(async path=>{
    history.push(path);
    const offset=Number(new URL('https://local.test'+path).searchParams.get('offset'));
    return {items:batch.slice(offset,offset+2),hasMore:offset+2<batch.length,
      nextOffset:Math.min(offset+2,batch.length)};
  },2);
  assert.equal(loaded.length,3,'complete paginated snapshot should contain all progress types');
  assert.equal(history.length,2);
  assert.equal(planProgressReplay(await a.list(),loaded,false)[0].action,'upload');
  await assert.rejects(fetchCompleteProgressSnapshot(async()=>({
    items:[batch[0]],hasMore:true,nextOffset:1,
  }),2),/snapshot incomplete/);
  await assert.rejects(fetchCompleteProgressSnapshot(async path=>{
    const offset=Number(new URL('https://local.test'+path).searchParams.get('offset'));
    return offset===0?{items:[batch[0]],hasMore:true,nextOffset:1}
      :{items:[batch[0]],hasMore:false,nextOffset:2};
  },1),/Duplicate server progress/);
  await assert.rejects(fetchCompleteProgressSnapshot(async()=>({
    items:[],hasMore:true,nextOffset:0,
  }),1),/snapshot incomplete/);
  await assert.rejects(fetchCompleteProgressSnapshot(async()=>({
    items:[batch[0]],hasMore:false,nextOffset:999,
  }),1),/snapshot incomplete/);

  const pending=(await a.list());
  assert.throws(()=>planProgressReplay(pending,[batch[0],{...batch[0],revision:99}],false),
    /Duplicate remote progress/,
    'inconsistent remote duplicates must never choose a position silently');

  const remote=(revision,seconds)=>[{kind:'edition',id:12,asset:101,seconds,revision,complete:false}];
  assert.equal(planProgressReplay(pending,remote(2,150),false)[0].action,'upload');
  assert.equal(planProgressReplay(pending,remote(3,180),false)[0].action,'conflict',
    'new server revision must never be silently replaced');
  assert.equal(planProgressReplay(pending,remote(4,200),false)[0].action,'already-synced');
  assert.equal(planProgressReplay(pending,[],true)[0].action,'wait-for-all-pages',
    'missing one paginated response does not mean the bookmark was deleted');
  assert.equal(planProgressReplay(pending,[],false)[0].action,'conflict',
    'server reset or lost bookmark needs explicit recovery');
  const newTrack=await a.record('listening',9,{asset:9,seconds:0,complete:false},0);
  assert.equal(planProgressReplay([newTrack],[],false)[0].action,'upload');
  assert.equal(planProgressReplay([newTrack],[{kind:'listening',id:9,asset:9,seconds:0,complete:false,revision:1}],false)[0].action,'already-synced');

  const rewound=await a.record('reading',88,{part:2,fraction:0.1,complete:false},1);
  assert.equal(planProgressReplay([rewound],[{kind:'reading',id:88,part:11,fraction:0.7,complete:true,revision:7}],false)[0].action,'conflict',
    'cross-device reading rewinds must be offered for reconciliation');
  await assert.rejects(a.record('reading',88,{part:2,fraction:2,complete:false},1),/Invalid offline progress/);
  await assert.rejects(a.record('edition',99,{asset:0,seconds:0,complete:false},0),/Invalid offline progress/);
  await assert.rejects(a.record('listening',9,{asset:10,seconds:5,complete:false},0),/Invalid offline progress/);
  assert.equal(await a.acknowledge('edition',12,second.sequence),true);
  assert.equal((await a.list()).some(x=>x.kind==='edition'),false);
  assert.equal(await a.acknowledge('edition',12,second.sequence),false);

  const badKey='archivist-progress-v1:'+encodeURIComponent('https://library.example')+':30';
  disk.set(badKey,'{corrupt');
  const corrupted=new OfflineProgressOutbox(storage,'https://library.example',30);
  await assert.rejects(corrupted.list(),/journal is damaged/);
  await assert.rejects(corrupted.record('reading',2,{part:0,fraction:0,complete:false},0),/journal is damaged/);
  assert.equal(disk.get(badKey),'{corrupt','bad state must never be overwritten');
  let failWrite=true;
  const flaky={
    read:storage.read,
    write:async(key,value)=>{if(failWrite)throw Error('disk full');await storage.write(key,value)},
  };
  const guarded=new OfflineProgressOutbox(flaky,'https://library.example',31);
  await assert.rejects(guarded.record('reading',1,{part:0,fraction:0,complete:false},0),/disk full/);
  assert.equal((await guarded.list()).length,0,'failed writes must not claim journalled progress');
  failWrite=false;
  const saved=await guarded.record('reading',1,{part:0,fraction:0,complete:false},0);
  failWrite=true;
  await assert.rejects(guarded.acknowledge('reading',1,saved.sequence),/disk full/);
  assert.equal((await guarded.list()).length,1,'failed deletion must retain bookmark');
  assert(writes>=4,'durable backend must receive updates');
  console.log('PASS: offline progress survives restart, preserves rewinds, isolates profiles, detects revision conflicts and never discards unacknowledged positions');
})().catch(e=>{console.error(e);process.exitCode=1});
