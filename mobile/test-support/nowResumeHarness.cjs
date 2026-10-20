const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const mobile=path.resolve(__dirname,'..');
const source=fs.readFileSync(mobile+'/App.tsx','utf8');
const tree=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function extract(name){let found;function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text===name)found=n;ts.forEachChild(n,visit)}visit(tree);if(!found)throw Error(name);return found.getText(tree)}
const code=ts.transpileModule(['currentLocalResume','loadLocalWorkTrack','playLocalWork','playBook','resumeNowSession'].map(extract).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
module.exports=function harness(){
 const track={uri:'file:///fixture/chapter.mp3',available:true,format:'Audio',id:3};
 const work={key:'fixture',title:'Fixture',author:'Test',tracks:[track],available:true};
 const result={plays:0,requests:0,opens:[],seeks:[],sessions:[]};let listener;
 const noop=()=>{};
 const c={console,Promise,Math,Number,Error,setTimeout,clearTimeout,
 nowResumeGeneration:{current:0},loadCancel:{current:null},localWorkProgress:{},localProgress:{},trackOrders:{},
 localWorkProgressKey:'fixture-progress',localWorks:[work],localBooks:[track],orderedLocalWork:w=>w,localSpeed:1,audioStatusError:()=>null,
 controller:{state:{seconds:42},stop:async()=>{},open:async(id,opts)=>result.opens.push([id,opts]),seek:async(s)=>result.seeks.push(s),setTrackOrder:noop},
 persistNowSession:async(...v)=>result.sessions.push(v),setPersistedJSON:async()=>{},
 setLiveMode:noop,setError:noop,setActiveLocalWork:noop,setLocalWorkIndex:noop,
 setLocalWorkProgress:fn=>fn({}),setPlaying:noop,setActiveTab:noop,
 playbackWorkKey:()=>'',bookFromNowMedia:m=>m,
 player:{addListener:(_name,cb)=>{listener=cb;return {remove:noop}},replace:()=>queueMicrotask(()=>listener?.({isLoaded:true,duration:100})),
 setActiveForLockScreen:noop,seekTo:async()=>{},setPlaybackRate:noop,play:()=>result.plays++,pause:noop},
 getInfoAsync:async()=>({exists:true,size:100,isDirectory:false}),
 session:{server:'https://fixture.invalid'},serverWorks:[],offlineWorks:{fixture:{server:'https://fixture.invalid',workId:7,tracks:[{...track,size:100,localFormat:'Audio'}]}},
 downloadedWorks:[{...work,originServer:'https://fixture.invalid',originWorkId:7}],
 request:async()=>{result.requests++;return [{id:3,available:true,format:'Audio'}]},
 };
 vm.createContext(c);vm.runInContext(code,c);
 const local={kind:'audio',position:42,wasPlaying:false,media:{source:'local',localWorkKey:'fixture',uri:track.uri},trackUri:track.uri};
 const server={...local,media:{source:'server',serverWorkId:7,originServer:'https://fixture.invalid',id:3,format:'Audio'}};
 return {c,result,track,work,local,server};
};
