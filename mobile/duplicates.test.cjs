const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {possibleLocalDuplicateGroups,possibleAlternateFormatGroups,possibleDifferentEditionGroups,localRelationClassification}=require('./duplicates.ts');
const base={author:'Frank Herbert',series:'Dune',format:'EPUB',space:'Books',available:true};
const groups=possibleLocalDuplicateGroups([
  {id:1,uri:'content://one',title:'Dune',...base},
  {id:2,uri:'content://two',title:'Dune ',...base},
  {id:3,uri:'content://three',title:'Dune Messiah',...base},
  {id:4,uri:'content://four',title:'Dune',...base,format:'Audio'},
]);
assert.equal(groups.length,1);
assert.equal(groups[0].items.length,2);
assert.match(groups[0].reason,/not byte-verified/);

const unknown=possibleLocalDuplicateGroups([
  {id:1,uri:'a',title:'Untitled',...base},
  {id:2,uri:'b',title:'Untitled',...base},
]);
assert.equal(unknown.length,0);

console.log('PASS: local duplicate candidates are conservative and explicitly unverified');


const ids=possibleLocalDuplicateGroups([
  {id:10,uri:'isbn-a',title:'Different display title',author:'A',series:'',seriesNumber:1,format:'EPUB',isbn:'9780000000001',space:'Books',available:true},
  {id:11,uri:'isbn-b',title:'Another display title',author:'B',series:'Other',seriesNumber:8,format:'EPUB',isbn:'9780000000001',space:'Books',available:true},
]);
assert.equal(ids.length,1);
assert.match(ids[0].reason,/ISBN or ASIN/);

const variants=possibleAlternateFormatGroups([
  {id:20,uri:'v1',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'EPUB',workKey:'dune-work',space:'Books',available:true},
  {id:21,uri:'v2',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'Audio',workKey:'dune-work',space:'Books',available:true},
]);
assert.equal(variants.length,1);
assert.equal(variants[0].items.length,2);
assert.match(variants[0].reason,/alternate/);


const editions=possibleDifferentEditionGroups([
  {id:30,uri:'e1',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'EPUB',workKey:'dune-work',isbn:'9780000000001',space:'Books',available:true},
  {id:31,uri:'e2',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'EPUB',workKey:'dune-work',isbn:'9780000000002',space:'Books',available:true},
  {id:32,uri:'e3',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'Audio',workKey:'dune-work',asin:'B000000003',space:'Books',available:true},
]);
assert.equal(editions.length,1);
assert.equal(editions[0].items.length,2);
assert.match(editions[0].reason,/separate editions/);

const classified=localRelationClassification([
  {id:40,uri:'d1',title:'Book',author:'A',series:'S',seriesNumber:1,format:'EPUB',space:'Books',available:true},
  {id:41,uri:'d2',title:'Book',author:'A',series:'S',seriesNumber:1,format:'EPUB',space:'Books',available:true},
  {id:42,uri:'a1',title:'Book',author:'A',series:'S',seriesNumber:1,format:'Audio',space:'Books',available:true},
]);
assert.equal(classified.duplicates.length,1);
assert.equal(classified.alternateFormats.length,1);
assert.equal(classified.differentEditions.length,0);
console.log('PASS: local duplicate review distinguishes duplicate, alternate format and different edition relationships');
