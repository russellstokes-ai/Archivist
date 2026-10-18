const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict'),Module=require('module');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const source='content://fixture/book.cbz',data=new Map([[source,new Uint8Array([1,2,3])]]);let shared,corrupt=false,writes=[];
class File{constructor(...parts){this.uri=parts.join('/')}get exists(){return data.has(this.uri)}get size(){return data.get(this.uri)?.length||0}async bytes(){return data.get(this.uri)}create(){data.set(this.uri,new Uint8Array())}write(bytes){writes.push(this.uri);data.set(this.uri,corrupt?new Uint8Array([0]):bytes)}delete(){data.delete(this.uri)}}
const load=Module._load;Module._load=function(id,...args){if(id==='expo-file-system')return {File,Paths:{cache:'file:///cache'}};if(id==='expo-sharing')return {isAvailableAsync:async()=>true,shareAsync:async uri=>{shared=uri}};if(id==='./embeddedCopy')return {createEmbeddedCopy:async()=>new Uint8Array([4,5,6])};return load.call(this,id,...args)};
const {exportMetadataCopy}=require('./assistMetadata/exportCopy.native.ts');Module._load=load;
(async()=>{
 await exportMetadataCopy(source,'cbz',{});assert.deepEqual(data.get(shared),new Uint8Array([4,5,6]),'Receiver must still read the exported file after chooser returns');assert.deepEqual(data.get(source),new Uint8Array([1,2,3]));assert(!writes.includes(source));
 shared=null;corrupt=true;await assert.rejects(exportMetadataCopy(source,'cbz',{}),/verification/);assert.equal(shared,null);assert.equal(data.has(writes.at(-1)),false,'Failed verified copy is cleaned up');assert.deepEqual(data.get(source),new Uint8Array([1,2,3]));
 console.log('PASS: receiver can read after chooser returns, failed copies are removed, original is never written');
})().catch(e=>{console.error(e);process.exitCode=1});
