'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createMetadataStore}=require('./scannerVNext/fieldEvidence.ts');
const {defaultMetadataSettings}=require('./metadataSettings.ts');
(async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(dir,'runtime.db'));
 try{
  const metadata=await createMetadataStore(db);
  await metadata.ensure({workId:'one',revision:0,fields:{title:'Book',author:'Writer'},manual:{},identityConfirmed:true,partIds:['part']});
  await db.execAsync('CREATE TABLE scanner_vnext_catalogue(work_id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE scanner_vnext_staged(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL)');
  await db.runAsync('INSERT INTO scanner_vnext_catalogue VALUES(?,?)','one',JSON.stringify({source:{rootUri:'content://fixture/tree/library'},entry:{assets:[{relativePath:'book.epub',documentId:'library/book.epub',size:20}]}}));
  const exports=[];let release,started;
  const ready=new Promise(resolve=>started=resolve);
  const id='12345678-1234-1234-1234-123456789abc';
  let failReceipt=false;
  const native={createPortableId:async()=>id,exportRecord:async(root,raw)=>{
   const payload=JSON.parse(raw);exports.push(payload);
   if(exports.length===1){started();await new Promise(resolve=>release=resolve);}
   if(failReceipt){failReceipt=false;throw Error('Receipt interrupted after snapshot reached disk');}
   return JSON.stringify({state:'saved',portableId:payload.portableId||'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',revision:payload.revision});
  }};
  const original=Module._load;
  Module._load=function(name,...args){
   if(name==='react-native')return {NativeModules:{ArchivistMetadata:native}};
   if(name==='expo-secure-store')return {getItemAsync:async()=>null};
   if(name==='expo/fetch')return {fetch:async()=>{throw Error('Unexpected network');}};
   if(name==='expo-file-system')return {};
   if(name==='../scannerVNext/androidRuntime.native')return {createAndroidCatalogueRuntime:async()=>({metadata,refresh:async()=>[],scan:async()=>({books:[{uri:'content://fixture/book.epub',scannerWorkId:'two'}]})})};
   if(name==='../scannerVNext/androidStore.native')return {openScannerDatabase:async()=>db};
   return original.call(this,name,...args);
  };
  let factory;try{factory=require('./assistMetadata/runtime.native.ts').createAndroidCatalogueRuntime;}finally{Module._load=original;}
  const runtime=await factory(async()=>({metadata:defaultMetadataSettings}));
  const first=runtime.savePortable('one');await ready;
  await runtime.metadata.saveManual('one',{publisher:'New publisher'},0);
  const second=runtime.savePortable('one');release();await first;const latest=await second;
  assert.equal(latest.revision,1,'A save during export must wait for the latest revision to be exported');
  assert.equal(exports.at(-1).fields.publisher,'New publisher');
  // Forget the successful receipt to simulate a first-ever export whose reply is lost.
  await db.runAsync('DELETE FROM scanner_vnext_durable_meta WHERE work_id=?','one');
  failReceipt=true;await runtime.savePortable('one');const interrupted=exports.at(-1);
  assert.match(interrupted.portableId||'',/^[a-f0-9-]{36}$/,'Identity must be allocated before native export');
  const restarted=await factory(async()=>({metadata:defaultMetadataSettings}));
  await restarted.savePortable('one');
  assert.equal(exports.at(-1).portableId,interrupted.portableId,'Retry after a lost receipt must reuse the snapshot identity');
  assert.equal((await restarted.durableStatus('one')).state,'saved');
  await metadata.ensure({workId:'two',revision:0,fields:{title:'Filename guess'},manual:{},identityConfirmed:false,partIds:['part2']});
  await db.runAsync('INSERT INTO scanner_vnext_catalogue VALUES(?,?)','two',JSON.stringify({source:{rootUri:'content://fixture/tree/library'},entry:{assets:[{relativePath:'book.epub',documentId:'library/book.epub',size:20}]}}));
  const recoveredId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  native.restoreRecord=async()=>JSON.stringify({record:{schema:1,kind:'archivist-work',portableId:recoveredId,savedAt:1,revision:10,fields:{title:'Recovered',author:'Writer'},manual:{title:true},members:[{path:'book.epub',bytes:20,sha256:'a'.repeat(64)}]}});
  const run=db.runAsync;let interruptRestore=true;
  db.runAsync=async(sql,...args)=>{if(interruptRestore&&sql.includes('INSERT INTO scanner_vnext_durable_meta')&&JSON.parse(args[2]).state==='restored'){interruptRestore=false;throw Error('Interrupted final restore receipt');}return run(sql,...args)};
  await restarted.scan();
  assert.equal((await restarted.metadata.get('two')).fields.title,'Recovered');
  await restarted.savePortable('two');
  assert.equal(exports.at(-1).portableId,recoveredId,'Interrupted restore must not fork a second portable identity');
  const disabled=await factory(async()=>({metadata:{...defaultMetadataSettings,writeMetadataToFiles:false}}));
  const before=exports.length;assert.equal((await disabled.savePortable('two')).state,'disabled');assert.equal(exports.length,before,'Off switch must prevent both embedded writes and snapshot exports');
  await metadata.ensure({workId:'comic',revision:0,fields:{title:'2000 AD Annual 1978',publisher:'IPC',genre:'Science Fiction'},manual:{},identityConfirmed:false,partIds:['comic1']});
  await runtime.metadata.confirmIdentity('comic',0);assert.equal((await runtime.metadata.get('comic')).identityConfirmed,true,'Publisher supports explicit comic identification without invented writer');
  await runtime.metadata.saveManual('comic',{publisher:'Different publisher'},1);assert.equal((await runtime.metadata.get('comic')).identityConfirmed,false,'Changing publisher-only identity requires review');
  console.log('PASS: runtime serializes newer revisions and preserves snapshot identity across interrupted export and runtime restart (native transport simulated)');
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
