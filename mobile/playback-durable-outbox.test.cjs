const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const original=Module._load;
class RequestError extends Error{constructor(message,status){super(message);this.status=status}}
Module._load=function(name,parent,main){
  if(name==='./connection')return {RequestError};
  return original.call(this,name,parent,main);
};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {Playback}=require('./playback.ts');
(async()=>{
  const points=[],events=[],replayed=[],acked=[];
  let loseNetwork=true,failReceipt=false,remoteRevision=2;
  const api=async(path,method,data)=>{
    if(path==='/api/assets/41/listening')return {
      progressURL:'/api/editions/13/progress',tracks:[{id:41,title:'Part 1',available:true}]
    };
    if(path==='/api/editions/13/progress'&&method!=='PUT')
      return {asset:41,seconds:12,revision:remoteRevision,complete:false};
    if(path==='/api/editions/13/progress'&&method==='PUT'){
      events.push('network-write');
      if(loseNetwork)throw Error('simulated network loss');
      if(data.revision!==remoteRevision)throw new RequestError('stale revision',409);
      remoteRevision++;
      return {...data,revision:remoteRevision};
    }
    throw Error('unexpected '+method+' '+path);
  };
  const audio={load:async()=>{},play(){},pause(){},seek:async()=>{},speed(){}};
  const journal={
    record:async(path,position,revision)=>{
      events.push('durable-record');
      const item={path,position:{...position},baseRevision:revision,sequence:points.length+1};
      points.push(item);return item;
    },
    acknowledge:async item=>{
      events.push('durable-ack');
      if(failReceipt)throw Error('simulated acknowledgment ENOSPC');
      acked.push(item);replayed.push(item.sequence);
    }
  };
  const ctrl=new Playback(api,audio,()=>{},journal);
  await ctrl.open(41);
  ctrl.state.seconds=45;
  await ctrl.save();
  assert.deepEqual(events.slice(-2),['durable-record','network-write'],
    'original playback must persist outbox BEFORE attempting network progress save');
  assert.equal(points.length,1);
  assert.equal(acked.length,0,'network failure cannot delete queued playback position');
  assert.equal(points[0].position.seconds,45);
  assert.equal(points[0].baseRevision,2,'original server revision must be retained');
  loseNetwork=false;
  ctrl.state.seconds=51;
  await ctrl.save();
  assert.deepEqual(events.slice(-3),['durable-record','network-write','durable-ack'],
    'server success must acknowledge only after successful revision-checked PUT');
  assert.equal(acked.length,1);
  assert.equal(points[1].position.seconds,51);

  failReceipt=true;
  ctrl.state.seconds=67;
  await ctrl.save();
  assert.equal(acked.length,1,'receipt failure must preserve pending local journal');
  assert.equal(points.at(-1).position.seconds,67);
  failReceipt=false;
  await ctrl.stop();
  assert(acked.length>1,'subsequent checkpoint should continue after receipt failure');

  const journalFailure={...journal,record:async()=>{throw Error('simulated journal disk full')}};
  let serverWriteCount=0;
  const failClosed=new Playback(async(p,m,d)=>{
    if(m==='PUT')serverWriteCount++;
    return api(p,m,d);
  },audio,()=>{},journalFailure);
  await failClosed.open(41);
  failClosed.state.seconds=101;
  await failClosed.save();
  assert.equal(serverWriteCount,0,'server write must never race ahead of a failed write-ahead journal');
  console.log('PASS: playback writes progress to local durable outbox before server, preserves network failures and only acknowledges successful revisioned saves');
})().catch(e=>{console.error(e);process.exitCode=1});
