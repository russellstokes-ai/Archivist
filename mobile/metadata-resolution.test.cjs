const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);
const {resolveMetadataCandidates,metadataNeedsReview}=require('./metadataResolution.ts');

let result=resolveMetadataCandidates([
  {source:'path',confidence:'high',fields:{title:'Dune',author:'Frank Herbert',series:'Dune'}},
  {source:'sidecar',confidence:'high',fields:{title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,isbn:'9780441172719'}},
]);
assert.equal(result.fields.isbn,'9780441172719');
assert.equal(result.provenance.isbn,'sidecar');
assert.equal(result.fields.seriesNumber,1);
assert.equal(result.conflicts.length,0);
assert.equal(metadataNeedsReview(result),false);

result=resolveMetadataCandidates([
  {source:'path',confidence:'high',fields:{title:'Dune',author:'Frank Herbert'}},
  {source:'online',confidence:'high',fields:{title:'Dune',author:'F. Herbert'}},
  {source:'manual',confidence:'high',fields:{author:'Frank Herbert'}},
]);
assert.equal(result.fields.author,'Frank Herbert');
assert.equal(result.provenance.author,'manual');

result=resolveMetadataCandidates([
  {source:'embedded',confidence:'high',fields:{title:'Correct title',author:'Author'}},
  {source:'sidecar',confidence:'high',fields:{title:'Conflicting title',author:'Author'}},
]);
assert.equal(result.fields.title,'Correct title');
assert.equal(result.conflicts[0].field,'title');
assert.equal(metadataNeedsReview(result),true);

console.log('PASS: metadata resolution preserves manual edits, merges evidence and flags close conflicts');
