const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');

(async()=>{
  const source=fs.readFileSync(__dirname+'/nowSession.ts','utf8');
  const url='data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64');
  const x=await import(url);

  const local={id:7,title:'Old title',author:'A',series:'S',format:'Audio',space:'Books',available:true,uri:'content://book/01.mp3',localWorkKey:'audio-dir:Books/Book',source:'local'};
  const first=x.createNowSession(local,'audio',125.5,{trackUri:local.uri,wasPlaying:true,updatedAt:10});
  assert.equal(first.position,125.5);
  assert.equal(first.wasPlaying,true);
  assert.equal(first.trackUri,local.uri);

  const renamed={...local,title:'Corrected title',author:'Corrected author'};
  const refreshed=x.refreshNowSession(first,renamed,'audio',131,{trackUri:local.uri,wasPlaying:false,updatedAt:20});
  assert.equal(refreshed.media.title,'Corrected title','metadata refresh should update presentation without replacing identity');
  assert.equal(refreshed.position,131);
  assert.equal(x.sameNowMedia(first.media,refreshed.media),true);

  const next=x.refreshNowSession(refreshed,{...local,uri:'content://other.mp3',localWorkKey:'audio-dir:Books/Other',title:'Other'},'audio',4,{updatedAt:30});
  assert.equal(next.media.title,'Other','opening another work must replace Now');
  assert.equal(next.position,4);

  const serverA={id:11,title:'Server',author:'',series:'',format:'Audio',space:'Main',available:true,serverWorkId:44,source:'server',originServer:'https://home.example/'};
  const serverB={...serverA,id:99,title:'Renamed server title',originServer:'https://HOME.example'};
  assert.equal(x.sameNowMedia(serverA,serverB),true,'server work identity must survive asset and metadata changes');

  const sanitized=x.sanitizeNowSession(JSON.parse(JSON.stringify(first)));
  assert.equal(sanitized.kind,'audio');
  assert.equal(sanitized.position,125.5);
  assert.equal(x.sanitizeNowSession({version:1,kind:'reader',media:{}}),null);

  console.log('PASS: durable Now session preserves stable identity, exact position and replacement semantics');
})().catch(error=>{console.error(error);process.exitCode=1;});
