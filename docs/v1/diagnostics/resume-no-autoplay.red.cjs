// Intentionally RED diagnostic; do not add to the passing mobile suite until
// the owner approves the narrow App.tsx logic repair. Executes actual functions.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
const ts=require(root+'/mobile/node_modules/typescript');
const source=fs.readFileSync(root+'/mobile/App.tsx','utf8');
const tree=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function extract(name){
  let found;
  function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text===name)found=n;ts.forEachChild(n,visit);}
  visit(tree);assert(found,'Missing actual production function '+name);
  return found.getText(tree);
}
const track={uri:'content://fixture/chapter.mp3',available:true,format:'Audio'};
const work={key:'fixture',title:'Fixture',author:'Test',tracks:[track]};
let listener,plays=0;
let serverRequests=0;
const noop=()=>{};
const context={console,Promise,Math,Error,setTimeout,clearTimeout,
  nowResumeGeneration:{current:0},loadCancel:{current:null},localWorkProgress:{},
  localWorkProgressKey:'fixture-progress',localWorks:[work],localBooks:[track],
  orderedLocalWork:w=>w,localSpeed:1,audioStatusError:()=>null,
  controller:{stop:async()=>{}},persistNowSession:async()=>{},setPersistedJSON:async()=>{},
  setLiveMode:noop,setError:noop,setActiveLocalWork:noop,setLocalWorkIndex:noop,
  setLocalWorkProgress:fn=>fn({}),setPlaying:noop,setActiveTab:noop,
  player:{addListener:(_name,cb)=>{listener=cb;return {remove:noop};},
    replace:()=>queueMicrotask(()=>listener({isLoaded:true,duration:100})),
    setActiveForLockScreen:noop,seekTo:async()=>{},setPlaybackRate:noop,play:()=>plays++},
};
vm.createContext(context);
const code=ts.transpileModule(['currentLocalResume','loadLocalWorkTrack','resumeNowSession'].map(extract).join('\n'),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInContext(code,context);
(async()=>{
  // The App's Now-entry effect calls this same function automatically.
  assert(source.includes('void resumeNowSession(nowSessionRef.current)'));
  if(process.argv.includes('--offline-first')){
    Object.assign(context,{
      session:{server:'https://fixture.invalid'},serverWorks:[],
      offlineWorks:{fixture:{server:'https://fixture.invalid',workId:7,
        tracks:[{id:3,uri:track.uri,localFormat:'Audio'}]}},
      downloadedWorks:[{...work,originServer:'https://fixture.invalid',originWorkId:7}],
      request:async()=>{serverRequests++;throw Error('Offline fixture');},
    });
    await context.resumeNowSession({kind:'audio',position:42,wasPlaying:false,
      media:{source:'server',serverWorkId:7,originServer:'https://fixture.invalid',id:3,format:'Audio'}});
    assert.equal(serverRequests,0,'OFFLINE COPY MUST WIN: actual Now resume requested server before available download');
    return;
  }
  await context.resumeNowSession({kind:'audio',position:42,wasPlaying:false,
    media:{source:'local',localWorkKey:'fixture',uri:track.uri},trackUri:track.uri});
  assert.equal(plays,0,'RESTORE MUST REMAIN PAUSED: actual Now resume path called player.play()');
})().catch(e=>{console.error(e);process.exitCode=1;});
