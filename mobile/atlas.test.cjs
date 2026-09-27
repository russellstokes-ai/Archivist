const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {buildAtlasRelationship}=require('./atlas.ts');
const works=[
  {title:'Dune',author:'Frank Herbert',series:'Dune',format:'Ebook',space:'Books',available:true},
  {title:'Dune Messiah',author:'Frank Herbert',series:'Dune',format:'Audio',space:'Audio',available:true},
  {title:'Foundation',author:'Isaac Asimov',series:'Foundation',format:'Ebook',space:'Books',available:true},
  {title:'Anonymous',author:'',series:'Misc',format:'Comic',space:'Comics',available:true},
];

let relation=buildAtlasRelationship(works,'author','Frank Herbert');
assert.equal(relation.workCount,2);
assert.deepEqual(relation.series,[{name:'Dune',count:2}]);
assert.equal(relation.formats.length,2);
assert.equal(relation.spaces.length,2);

relation=buildAtlasRelationship(works,'series','Dune');
assert.equal(relation.workCount,2);
assert.deepEqual(relation.authors,[{name:'Frank Herbert',count:2}]);

relation=buildAtlasRelationship(works,'author','Unknown author');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Anonymous');

console.log('PASS: local Atlas relationships are exact and deterministic');
