const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function load(path,dependency){
  let source=fs.readFileSync(__dirname+'/'+path,'utf8');
  if(dependency)source=source.replace("'./connection'",JSON.stringify(dependency));
  return 'data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64');
}
(async()=>{
  const {PlayerSeekQueue,PLAYER_SKIP,seekTarget}=await import(await load('playerTransport.ts'));
  assert.deepEqual(PLAYER_SKIP,{small:{seconds:15,pages:3},large:{seconds:30,pages:6}});
  assert.equal(seekTarget(-10,100),0);assert.equal(seekTarget(150,100),100);
  assert.equal(seekTarget(NaN,100),0);assert.equal(seekTarget(20,NaN),0);
  const queue=new PlayerSeekQueue(),calls=[],saved=[],errors=[];
  let release,current=true;
  const request={key:'a',current:40,duration:200,delta:15,isCurrent:()=>current,
    seek:seconds=>{calls.push(seconds);return new Promise(resolve=>{release=resolve;});},
    persist:async seconds=>{saved.push(seconds);},onError:error=>errors.push(error)};
  assert.equal(queue.request(request),55);
  assert.equal(queue.request(request),70);
  assert.equal(queue.request({...request,delta:30}),100);
  assert.deepEqual(calls,[55]);release();await tick();assert.deepEqual(calls,[55,100]);
  release();await tick();assert.deepEqual(saved,[100]);
  assert.equal(queue.request({...request,current:190,delta:30}),200);release();await tick();
  assert.equal(queue.request({...request,current:200,delta:30}),null);
  assert.equal(queue.request({...request,duration:0}),null);
  queue.request(request);current=false;queue.reset('b');release();await tick();
  assert.deepEqual(saved,[100,200]);
  current=true;
  queue.request({...request,seek:async()=>{throw Error('seek failed');}});await tick();
  assert.equal(errors.length,1);assert.deepEqual(saved,[100,200]);
  assert.equal(queue.request({...request,current:10,delta:-15}),0);release();await tick();
  assert.equal(saved.at(-1),0);
  const {Playback}=await import(await load('playback.ts',await load('connection.ts')));
  let failSeek=false,resolveSeek;const writes=[];
  const api=async(path,method,data)=>{
    if(path.endsWith('/listening'))return {tracks:[{id:1,title:'Test',available:true}],progressURL:'/api/assets/1/progress'};
    if(method==='PUT'){writes.push(data);return {...data,revision:1};}
    return {asset:1,seconds:10,revision:0,complete:false};
  };
  const player=new Playback(api,{load:async()=>{},play(){},pause(){},speed(){},
    seek:()=>failSeek?Promise.reject(Error('native failed')):new Promise(resolve=>{resolveSeek=resolve;})},()=>{});
  await player.open(1);player.update(10,100,false,false);
  assert.equal(await player.seek(NaN),false);
  const seek=player.seek(80);resolveSeek();assert.equal(await seek,true);
  assert.equal(player.state.seconds,80);assert.equal(writes.at(-1).seconds,80);
  failSeek=true;assert.equal(await player.seek(20),false);assert.equal(player.state.seconds,80);
  failSeek=false;const stale=player.seek(30);await player.stop();resolveSeek();
  assert.equal(await stale,false);assert.equal(player.state.tracks.length,0);
  console.log('Player transport: rapid taps, bounds, failed seeks, persistence and stale-track guards passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
