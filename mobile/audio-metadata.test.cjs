const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {EncodingType:{Base64:'base64'},async readAsStringAsync(){return ''}};
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);
const {parseID3v2Base64,parseID3v1Base64}=require('./audioMetadata.ts');

function syncsafe(n){return [(n>>21)&127,(n>>14)&127,(n>>7)&127,n&127]}
function textFrame(id,value){
  const data=Buffer.concat([Buffer.from([3]),Buffer.from(value,'utf8')]);
  const size=Buffer.alloc(4);size.writeUInt32BE(data.length);
  return Buffer.concat([Buffer.from(id),size,Buffer.from([0,0]),data]);
}
function userFrame(description,value){
  const data=Buffer.concat([Buffer.from([3]),Buffer.from(description),Buffer.from([0]),Buffer.from(value)]);
  const size=Buffer.alloc(4);size.writeUInt32BE(data.length);
  return Buffer.concat([Buffer.from('TXXX'),size,Buffer.from([0,0]),data]);
}
const frames=Buffer.concat([
  textFrame('TIT2','Dune'),
  textFrame('TPE1','Frank Herbert'),
  textFrame('TDRC','1965'),
  textFrame('TPUB','Chilton'),
  userFrame('Narrator','Simon Vance'),
  userFrame('Series','Dune'),
  userFrame('Series Number','1'),
  userFrame('ASIN','B000000001'),
]);
const tag=Buffer.concat([Buffer.from('ID3'),Buffer.from([3,0,0,...syncsafe(frames.length)]),frames]);
const fields=parseID3v2Base64(tag.toString('base64'));
assert.equal(fields.title,'Dune');
assert.equal(fields.author,'Frank Herbert');
assert.equal(fields.publishedYear,1965);
assert.equal(fields.publisher,'Chilton');
assert.equal(fields.narrator,'Simon Vance');
assert.equal(fields.series,'Dune');
assert.equal(fields.seriesNumber,1);
assert.equal(fields.asin,'B000000001');

const partFrames=Buffer.concat([
  textFrame('TIT2','Part 36'),
  textFrame('TALB','Dune'),
  textFrame('TPE1','Frank Herbert'),
]);
const partTag=Buffer.concat([Buffer.from('ID3'),Buffer.from([3,0,0,...syncsafe(partFrames.length)]),partFrames]);
const partFields=parseID3v2Base64(partTag.toString('base64'));
assert.equal(partFields.title,'Dune');
assert.equal(partFields.author,'Frank Herbert');

const id3v1=Buffer.alloc(128);id3v1.write('TAG',0);id3v1.write('Foundation',3);id3v1.write('Isaac Asimov',33);id3v1.write('1951',93);
const old=parseID3v1Base64(id3v1.toString('base64'));
assert.equal(old.title,'Foundation');assert.equal(old.author,'Isaac Asimov');assert.equal(old.publishedYear,1951);
console.log('PASS: bounded ID3 parsing extracts audiobook identity and narrator metadata');
