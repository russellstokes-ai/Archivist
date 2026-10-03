const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);
const {bulkOverrideForBook,sequentialSeriesNumbers}=require('./bulkMetadata.ts');

const book={id:1,uri:'u',title:'Old',author:'Variant Author',series:'Saga',seriesNumber:4,genre:'Fantasy',publishedYear:2020,narrator:'Reader',publisher:'Pub',isbn:'123',asin:'A1',language:'en',description:'Desc',coverUri:'cover',format:'EPUB',space:'Books',available:true};
const override=bulkOverrideForBook(book,'Canonical title',{author:'Canonical Author',series:'New Saga'},2);
assert.equal(override.title,'Canonical title');
assert.equal(override.author,'Canonical Author');
assert.equal(override.series,'New Saga');
assert.equal(override.seriesNumber,2);
assert.equal(override.genre,'Fantasy');
assert.equal(override.publisher,'Pub');
assert.equal(override.isbn,'123');
assert.equal(override.coverUri,'cover');

const preserved=bulkOverrideForBook(book,'Old',{},undefined);
assert.equal(preserved.author,'Variant Author');
assert.equal(preserved.seriesNumber,4);
assert.equal(preserved.narrator,'Reader');

assert.deepEqual(sequentialSeriesNumbers(['a','b','c'],0.5),[
  {item:'a',seriesNumber:0.5},
  {item:'b',seriesNumber:1.5},
  {item:'c',seriesNumber:2.5},
]);
console.log('PASS: bulk metadata preserves untouched fields and sequences selected works');
