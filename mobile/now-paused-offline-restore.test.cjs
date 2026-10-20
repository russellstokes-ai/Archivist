const assert=require('node:assert/strict'),harness=require('./test-support/nowResumeHarness.cjs');
(async()=>{
 {const {c,result,local,work}=harness();await c.resumeNowSession(local);assert.equal(result.plays,0,'restoring local paused audio must not start playback');assert.equal(result.sessions.at(-1)[3].wasPlaying,false);await c.loadLocalWorkTrack(work,0,42);assert.equal(result.plays,1,'explicit Play unchanged');}
 {const {c,result,server}=harness();await c.resumeNowSession(server);assert.equal(result.requests,0,'verified downloaded copy must precede network');assert.equal(result.plays,0);}
 for(const stat of [{exists:false},{exists:true,size:0},{exists:true,size:99},{exists:true,size:100,isDirectory:true}]){
  const {c,result,server}=harness();c.getInfoAsync=async()=>stat;await c.resumeNowSession(server);assert.equal(result.requests,1,'unusable local copy must fall back');assert.equal(result.opens[0][1].autoplay,false,'server fallback must stay paused');
 }
 {const {c,result,server}=harness();c.getInfoAsync=async()=>{throw Error('access denied')};await c.resumeNowSession(server);assert.equal(result.requests,1);assert.equal(result.plays,0);}
 {const {c,result,server}=harness();c.session={server:'https://other.invalid'};c.getInfoAsync=async()=>({exists:false});await c.resumeNowSession(server);assert.equal(result.requests,0,'never query wrong account');}
 {const {c,result,server}=harness();c.getInfoAsync=async()=>{c.nowResumeGeneration.current++;return {exists:true,size:100}};await c.resumeNowSession(server);assert.equal(result.requests,0,'superseded inspection must not initiate remote load');assert.equal(result.plays,0);assert.equal(result.sessions.length,0);}
 {const {c,work,local,track}=harness();c.localWorkProgress.fixture={uri:track.uri,seconds:90};assert.equal(c.currentLocalResume(work,local).seconds,42,'deliberate rewind must not be replaced by maximum');}
 {const {c,result,server}=harness();c.getInfoAsync=async()=>({exists:false});await c.resumeNowSession({...server,position:0});assert.equal(result.opens[0][1].resumeSeconds,0,'server restore honours rewind to zero within the guarded load');}
 {const {c,result,server}=harness();await c.resumeNowSession({...server,trackId:999,media:{...server.media,id:999}});assert.equal(result.requests,1,'missing saved chapter must not silently open another downloaded chapter');assert.equal(result.sessions.length,0);}
 console.log('PASS: actual App restore intent, download integrity/fallback, account/generation isolation and rewind');
})().catch(e=>{console.error(e);process.exitCode=1});
