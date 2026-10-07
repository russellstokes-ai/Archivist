const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const original=Module._load;
let calls=0,fallback=0;
const failure=Object.assign(Error('deadline'),{code:'operation-timeout'});
Module._load=function(name,parent,isMain){
 if(name==='react-native')return {Platform:{OS:'android'},NativeModules:{ArchivistArchive:{readAudioMetadataWindows:async()=>{calls++;throw failure}}}};
 if(name==='expo-file-system/legacy')return {EncodingType:{Base64:'base64'},readAsStringAsync:async()=>{fallback++;return ''}};
 return original.call(this,name,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {extractAudioMetadata}=require('./audioMetadata.ts');
(async()=>{
 await assert.rejects(extractAudioMetadata('content://stalled','mp3',{}, {fast:true}),error=>error.code==='operation-timeout');
 assert.equal(calls,1);assert.equal(fallback,0,'native timeout must never launch an uncancellable Expo fallback');
 assert.deepEqual(await extractAudioMetadata('content://other','ogg',{}, {fast:true}),{});
 assert.equal(calls,1,'unsupported formats must not be opened');
 console.log('PASS: bounded audio native timeout propagates and never falls back to uncancellable reads');
})().catch(error=>{console.error(error);process.exitCode=1});
