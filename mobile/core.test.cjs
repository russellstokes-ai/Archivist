const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {validateServer,readerNavigationAllowed,RequestError,request}=require('./connection.ts');
const {Playback}=require('./playback.ts');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
  assert.equal(validateServer(' https://books.example/ '),'https://books.example');
  for(const url of ['http://192.168.1.2:5056','https://books.example/api/hassio_ingress/key','https://user:pass@books.example','file:///tmp/book','https://books.example/?token=secret'])assert.throws(()=>validateServer(url));
  assert.equal(validateServer('http://10.0.2.2:5056',true),'http://10.0.2.2:5056');
  assert(readerNavigationAllowed('https://books.example/reader.html?asset=1','https://books.example'));
  assert(!readerNavigationAllowed('https://evil.example/','https://books.example'));
  const oldFetch=global.fetch;
  global.fetch=async()=>new Response('<html>wrong app</html>',{headers:{'Content-Type':'text/html'}});
  await assert.rejects(request({server:'https://books.example',token:'key'},'/api/me'),/Archivist API/);
  global.fetch=oldFetch;
  let p={asset:1,seconds:42,revision:0,complete:false},conflict=false;const writes=[],calls=[];
  const api=async(path,method,data)=>{
    if(path.endsWith('/listening'))return {tracks:[{id:1,title:'1',available:true},{id:2,title:'2',available:true}],progressURL:'/api/editions/1/progress'};
    if(method==='PUT') {if(conflict)throw new RequestError('Conflict',409);assert.equal(data.revision,p.revision);p={...data,revision:p.revision+1};writes.push({...p});}
    return {...p};
  };
  const c=new Playback(api,{load:async(t,s)=>calls.push(['load',t.id,s]),play:()=>calls.push(['play']),pause:()=>calls.push(['pause']),seek:async(s)=>calls.push(['seek',s]),speed:r=>calls.push(['speed',r]),sleep:s=>calls.push(['sleep',s])},()=>{});
  await c.open(1);assert.deepEqual(calls[1],['load',1,42]);
  c.update(50,100,true,false);await c.save();assert.equal(p.seconds,50);
  await c.seek(20);assert.equal(p.seconds,20);
  c.setSpeed(1.5);assert.equal(c.state.speed,1.5);c.setSpeed(999);assert.equal(c.state.speed,1.5);
  c.sleep(15);assert(c.state.sleepAt>Date.now());c.state.sleepAt=Date.now()-1;c.tick();assert.equal(c.state.playing,false);assert.equal(c.state.sleepAt,null);
  c.update(100,100,false,true);await tick();assert.equal(c.state.index,0);c.toggle();
  c.update(100,100,false,true);await tick();await tick();assert.equal(c.state.index,1);
  c.update(100,100,false,true);await tick();await tick();assert(c.state.completed);assert(p.complete);
  await c.open(1);assert.equal(c.state.index,0);assert.equal(c.state.seconds,0);
  c.update(10,100,true,false);conflict=true;await c.save();assert.equal(c.state.playing,false);const count=writes.length;await c.save();assert.equal(writes.length,count);
  conflict=false;await c.open(1);c.update(11,100,true,false);await Promise.all([c.save(),c.save()]);assert.equal(p.seconds,11);
  await c.stop();assert.equal(c.state.tracks.length,0);
  console.log('PASS: connection validation, reader navigation, server errors, resume, rewind, ordered saves, speed, sleep, advance, completion and conflict protection');
})().catch(e=>{console.error(e);process.exitCode=1;});
