const fs=require('fs'),ts=require('typescript'),Module=require('module'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
let calls=[],deleted=[],fail=false;const original=Module._load;
Module._load=function(name,...args){if(name==='react-native')return {NativeModules:{ArchivistFileMetadata:{prepareAudio:async(...a)=>{calls.push(['prepare',...a]);return {updated:'file:///cache/new'}},replaceVerified:async(...a)=>{calls.push(['replace',...a]);if(fail)throw Error('Source changed');return 'written'}}}};if(name==='expo-file-system')return {File:class{constructor(uri){this.uri=uri;this.exists=true}delete(){deleted.push(this.uri)}},Paths:{}};return original.call(this,name,...args)};
const {writeMetadataFile}=require('./assistMetadata/writeBack.native.ts');Module._load=original;
const plan={version:1,itemId:'book',revision:1,multipart:true,file:{root:'tree',uri:'content://book',path:'book.m4b',original:'file:///cache/snapshot.m4b',fingerprint:'a'.repeat(64),fields:{}},operations:[{field:'title',newValue:'Book',observation:'evidence:1'}]};
(async()=>{
 assert.equal(await writeMetadataFile(plan),'written');
 assert.deepEqual(calls[0],['prepare',plan.file.original,plan.file.fingerprint,'m4b','{"title":"Book"}',true]);
 assert.deepEqual(calls[1],['replace','tree','content://book',plan.file.original,'file:///cache/new','{"title":"Book"}']);
 assert.deepEqual(deleted,['file:///cache/new'],'The snapshot belongs to the plan owner and is reused, not copied or deleted');
 fail=true;await assert.rejects(writeMetadataFile(plan),/Source changed/);assert.equal(deleted.length,2,'Failed replacement must clean its prepared output');
 const count=calls.length;assert.equal(await writeMetadataFile({...plan,operations:[]}),'unchanged');assert.equal(calls.length,count,'Empty plans perform no file I/O');
 await assert.rejects(writeMetadataFile({...plan,operations:[{field:'coverUri',newValue:'https://example.org/cover',observation:'evidence:2'}]}),/Invalid metadata operation/);
 console.log('PASS: audio reuses verified snapshot, preserves ownership, fails closed and cleans output without rewriting empty plans');
})().catch(e=>{console.error(e);process.exitCode=1});
