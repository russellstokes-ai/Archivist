'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=__dirname;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'test-fixtures/assist-pipeline/manifest.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'assistMetadata/formatCapabilities.ts'),'utf8');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const capabilities=require('./assistMetadata/formatCapabilities.ts');
const expected=['epub','pdf','mobi','azw','azw3','fb2','lit','cbz','cbr','cb7','cbt','mp3','m4a','m4b','aac','flac','ogg','opus','wav','wma'];
assert.deepEqual(manifest.formats.map(row=>row.extension),expected,'Manifest covers every T3 extension exactly once and in plan order');
assert.match(source,/export const writableFields/,'The matrix check must bind to the live writer capability declarations');
const rows=[...manifest.formats,...(manifest.additionalFormats||[])];
assert.deepEqual(rows.map(row=>row.extension).sort(),Object.keys(capabilities.writableFields).concat(expected.filter(ext=>!Object.hasOwn(capabilities.writableFields,ext))).sort(),'Manifest maps all planned formats and every extra declared writer format');
const fixtureClaim=(format,capability,label)=>{
 const {status,tests,fixture}=capability;
 if(!/tested/i.test(status))return;
 assert.ok(Array.isArray(tests)&&tests.length,`${format} ${label} claims test coverage but has no test references`);
 assert.ok(typeof fixture==='string'&&fixture.trim(),`${format} ${label} claims test coverage but does not describe its fixture`);
 for(const test of tests)assert.ok(fs.existsSync(path.join(root,test)),`${format} ${label} references missing fixture test ${test}`);
};
for(const row of rows){
 fixtureClaim(row.extension,row.metadataExtraction,'metadata reader/extractor');
 fixtureClaim(row.extension,row.appReading,'app reader');
 fixtureClaim(row.extension,row.embeddedWrite,'embedded writer');
 const declared=capabilities.writableFields[row.extension];
 if(declared?.length){
  assert.match(row.embeddedWrite.status,/^tested\b/i,`${row.extension} is declared writable but its manifest does not make a fixture-backed claim`);
  fixtureClaim(row.extension,row.embeddedWrite,'declared writer');
 }else assert.doesNotMatch(row.embeddedWrite.status,/^tested\b/i,`${row.extension} claims a writer absent from formatCapabilities.ts`);
}
assert.deepEqual(capabilities.fileMetadataFields('ambiguous.zip'),[],'Generic ZIP files cannot receive automatic metadata writes');
console.log('assist-pipeline manifest: PASS');