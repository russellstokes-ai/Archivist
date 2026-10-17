// Audit reproductions: asserts current defects, not release acceptance tests.
// Run from repository root. Production sources remain unchanged.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ts=require(root+'/mobile/node_modules/typescript');
function moduleFrom(file,requireStub){const exports={};const code=ts.transpileModule(fs.readFileSync(root+'/mobile/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:requireStub,console,Date,Math,Number,Promise,setTimeout,clearTimeout});return exports;}
(async()=>{
 const {Playback}=moduleFrom('playback.ts',()=>({RequestError:class extends Error{}}));
 const api=async(p,m,data)=>m==='PUT'?{...data,revision:1}:p.endsWith('/listening')?{progressURL:'/api/editions/1/progress',tracks:[{id:1,title:'Short',available:true},{id:2,title:'Long',available:true}]}:{asset:1,seconds:0,revision:1,complete:false};
 const seeks=[];const audio={load:async()=>{},play(){},pause(){},speed(){},seek:async s=>seeks.push(s)};
 const p=new Playback(api,audio,()=>{});await p.open(1);p.update(20,30,false,false);await p.select(1);await p.seek(120);
 assert.equal(seeks.at(-1),120);assert.equal(p.state.duration,0);

 const harness=require(root+'/mobile/test-support/nowResumeHarness.cjs');const {c,result,server,work}=harness();c.offlineWorks={};c.downloadedWorks=[];let release;c.request=()=>new Promise(r=>release=r);
 const resume=c.resumeNowSession(server);await Promise.resolve();await Promise.resolve();assert(release);await c.playLocalWork(work);release([{id:3,available:true,format:'Audio'}]);await resume;
 assert.equal(result.opens.length,0);

 const app=fs.readFileSync(root+'/mobile/App.tsx','utf8');const appTree=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let more;function findMore(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='loadMoreServerWorks')more=n.getText(appTree);ts.forEachChild(n,findMore)}findMore(appTree);
 let finishPage;let displayed=[{id:1,title:'OLD_FILTER'}];const paging={catalogueScopeRef:{current:'old'},session:{server:'https://fixture.invalid'},serverHasMore:true,serverLoadingMore:false,shelfLoading:false,serverWorks:displayed,serverWorksPath:()=>'/api/works',request:()=>new Promise(r=>finishPage=r),normalizeServerWork:x=>x,preferencesFromWorks:()=>({}),setServerLoadingMore(){},setServerWorks:fn=>displayed=fn(displayed),setServerPreferences(){},setServerHasMore(){},setError(){}};
 vm.createContext(paging);vm.runInContext(ts.transpileModule(more,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,paging);
 const pageLoad=paging.loadMoreServerWorks();displayed=[{id:99,title:'NEW_FILTER'}];paging.catalogueScopeRef.current='new';finishPage([{id:2,title:'OLD_FILTER_LATE'}]);await pageLoad;
 assert.equal(displayed.length,1);

 console.log('PASS: playback duration, selection and catalogue isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
