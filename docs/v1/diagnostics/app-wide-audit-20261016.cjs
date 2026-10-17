// Audit reproductions: asserts current defects, not release acceptance tests.
// Run from repository root. Production sources remain unchanged.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
const ts=require(root+'/mobile/node_modules/typescript');
function moduleFrom(file,requireStub){const exports={};const code=ts.transpileModule(fs.readFileSync(root+'/mobile/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:requireStub,console,Date,Math,Number,Promise,setTimeout,clearTimeout});return exports;}
(async()=>{
 const {Playback}=moduleFrom('playback.ts',()=>({RequestError:class extends Error{}}));
 const api=async(p,m,data)=>m==='PUT'?{...data,revision:1}:p.endsWith('/listening')?{progressURL:'/api/editions/1/progress',tracks:[{id:1,title:'Short',available:true},{id:2,title:'Long',available:true}]}:{asset:1,seconds:0,revision:1,complete:false};
 const seeks=[];const audio={load:async()=>{},play(){},pause(){},speed(){},seek:async s=>seeks.push(s)};
 const p=new Playback(api,audio,()=>{});await p.open(1);p.update(20,30,false,false);await p.select(1);await p.seek(120);
 assert.equal(seeks.at(-1),30);assert.equal(p.state.duration,30);
 console.log('CONFIRMED A1: new-track seek(120) clamps to previous track duration 30 before first native status');
 const harness=require(root+'/mobile/test-support/nowResumeHarness.cjs');const {c,result,server,work}=harness();c.offlineWorks={};c.downloadedWorks=[];let release;c.request=()=>new Promise(r=>release=r);
 const resume=c.resumeNowSession(server);await Promise.resolve();await Promise.resolve();assert(release);await c.playLocalWork(work);release([{id:3,available:true,format:'Audio'}]);await resume;
 assert.equal(result.opens.length,1);
 console.log('CONFIRMED A2: delayed old server restoration reopens after a newer explicit local Play');
 const files={};for(let i=0;i<81;i++){const name='chapter-'+i+'.xhtml';files[name]={name,dir:false,async:async()=>'<p>CHAPTER_MARK_'+i+'_END</p>'};}
 const xml='<package><manifest><item id="c1" href="chapter-1.xhtml"/><item id="c0" href="chapter-0.xhtml"/></manifest><spine><itemref idref="c1"/><itemref idref="c0"/></spine></package>';
 files['book.opf']={name:'book.opf',dir:false,async:async()=>xml};
 const reader=moduleFrom('localReader.ts',name=>name==='./nativeZip'?{openNativeZip:async()=>({files,dispose:async()=>{}})}:name==='./speechFocus'?{speechFocusBrowserSource:()=>''}:name==='jszip'?{}:name==='expo-file-system/legacy'?{EncodingType:{Base64:'base64'}}:{});
 const document=await reader.buildLocalReaderDocument('file:///test.epub','EPUB','Fixture',0);
 assert(document.html.indexOf('CHAPTER_MARK_0_END')<document.html.indexOf('CHAPTER_MARK_1_END'));
 assert(!document.html.includes('CHAPTER_MARK_80_END'));
 console.log('CONFIRMED A3: EPUB ignores OPF spine order and silently omits chapter 81');
 const source=fs.readFileSync(root+'/mobile/localReader.ts','utf8');const tree=ts.createSourceFile('reader.ts',source,ts.ScriptTarget.Latest,true);let sanitizer;function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='sanitizeEpubHtml')sanitizer=n.getText(tree);ts.forEachChild(n,visit)}visit(tree);
 const context={};vm.createContext(context);vm.runInContext(ts.transpileModule(sanitizer,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
 const unsafe=context.sanitizeEpubHtml('<img src=x onerror=alert(1)><iframe src=https://example.invalid></iframe>');
 assert(unsafe.includes('onerror=alert(1)'));assert(unsafe.includes('<iframe'));
 console.log('CONFIRMED A4: EPUB sanitizer retains unquoted executable event attribute and iframe; native exploitability not tested');
 const app=fs.readFileSync(root+'/mobile/App.tsx','utf8');const appTree=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let more;function findMore(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='loadMoreServerWorks')more=n.getText(appTree);ts.forEachChild(n,findMore)}findMore(appTree);
 let finishPage;let displayed=[{id:1,title:'OLD_FILTER'}];const paging={session:{server:'https://fixture.invalid'},serverHasMore:true,serverLoadingMore:false,shelfLoading:false,serverWorks:displayed,serverWorksPath:()=>'/api/works',request:()=>new Promise(r=>finishPage=r),normalizeServerWork:x=>x,preferencesFromWorks:()=>({}),setServerLoadingMore(){},setServerWorks:fn=>displayed=fn(displayed),setServerPreferences(){},setServerHasMore(){},setError(){}};
 vm.createContext(paging);vm.runInContext(ts.transpileModule(more,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,paging);
 const pageLoad=paging.loadMoreServerWorks();displayed=[{id:99,title:'NEW_FILTER'}];finishPage([{id:2,title:'OLD_FILTER_LATE'}]);await pageLoad;
 assert.equal(displayed[1].title,'OLD_FILTER_LATE');
 console.log('CONFIRMED A6: delayed old pagination appends results into a newer filtered catalogue');
 const pdf=fs.readFileSync(root+'/mobile/LocalPdfReader.tsx','utf8');const move=pdf.slice(pdf.indexOf('  const move='),pdf.indexOf('  return <View'));
 assert(move.includes('Animated.sequence'));assert(!move.includes('reduceMotion'));
 console.log('CONFIRMED A5: PDF page-turn animation ignores reduceMotion prop');
})().catch(e=>{console.error(e);process.exitCode=1});
