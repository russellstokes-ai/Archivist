const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict'),Module=require('module');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
(async()=>{
 let reads=0,stats=0;
 const book={id:1,uri:'content://comic',scannerWorkId:'work',format:'Comic'};
 const work={workId:'work',revision:1,fields:{title:'Annual'},manual:{},identityConfirmed:false};
 const db={execAsync:async()=>{},getFirstAsync:async sql=>sql.includes('scanner_vnext_catalogue')?{payload:JSON.stringify({source:{rootUri:'content://root'},entry:{assets:[{relativePath:'Annual.cbr',documentId:'comic'}],issues:[]}})}:null};
 const mocks={
  'react-native':{NativeModules:{ArchivistMetadata:{restoreRecord:()=>{reads++;return new Promise(()=>{})}}}},
  'expo-secure-store':{},'expo/fetch':{},'expo-file-system':{File:class{constructor(){stats++;throw Error('Synchronous document stat forbidden')}},Paths:{}},
  '../scannerVNext/androidRuntime.native':{createAndroidCatalogueRuntime:async()=>({scan:async()=>({books:[book]}),metadata:{}})},
  '../scannerVNext/androidStore.native':{openScannerDatabase:async()=>db},
  '../scannerVNext/metadataWrites':{metadataDatabase:x=>x},
  '../scannerVNext/fieldEvidence':{createSearchCache:async()=>({})},
  './store':{createAssistMetadataStore:async()=>({get:async()=>work})},
  './controller':{createImprovedAssist:async()=>({})},'./providers.native':{},'./writeBack.native':{},
  './review':{currentReview:()=>[]}
 };
 const path=require.resolve('./assistMetadata/runtime.native.ts'),m=new Module(path,module);m.filename=path;m.paths=module.paths;
 const original=m.require.bind(m);m.require=name=>name in mocks?mocks[name]:original(name);
 m._compile(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,path);
 const runtime=await m.exports.createAndroidCatalogueRuntime(async()=>({metadata:{onlineEnabled:false}}));
 let timer;try{
  const result=await Promise.race([runtime.scan([],[],{},{}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Discovery blocked by recovery')),150))]);
  assert.equal(result.books[0].title,'Annual');assert.equal(reads,0);assert.equal(stats,0);
 }finally{clearTimeout(timer)}
 console.log('PASS initial catalogue completes without waiting for comic recovery or synchronous source stat');
})().catch(e=>{console.error(e);process.exitCode=1});
