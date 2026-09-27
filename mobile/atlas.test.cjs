const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {buildAtlasRelationship}=require('./atlas.ts');
const works=[
  {title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Ebook',space:'Books',available:true,readingState:'finished',rating:10,favourite:true},
  {title:'Dune Messiah',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Audio',space:'Audio',available:true,readingState:'in-progress',rating:9,favourite:false},
  {title:'Foundation',author:'Isaac Asimov',series:'Foundation',genre:'Science Fiction',format:'Ebook',space:'Books',available:true,readingState:'not-started',rating:8,favourite:false},
  {title:'Anonymous',author:'',series:'Misc',genre:'Mystery',format:'Comic',space:'Comics',available:false,readingState:'not-started',rating:0,favourite:false},
];

let relation=buildAtlasRelationship(works,'author','Frank Herbert');
assert.equal(relation.workCount,2);
assert.deepEqual(relation.series,[{name:'Dune',count:2}]);
assert.equal(relation.formats.length,2);
assert.equal(relation.spaces.length,2);
assert.deepEqual(relation.genres,[{name:'Science Fiction',count:2}]);

relation=buildAtlasRelationship(works,'series','Dune');
assert.equal(relation.workCount,2);
assert.deepEqual(relation.authors,[{name:'Frank Herbert',count:2}]);

relation=buildAtlasRelationship(works,'genre','Science Fiction');
assert.equal(relation.workCount,3);

relation=buildAtlasRelationship(works,'space','Books');
assert.equal(relation.workCount,2);

relation=buildAtlasRelationship(works,'format','Comic');
assert.equal(relation.workCount,1);

relation=buildAtlasRelationship(works,'status','Unavailable');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Anonymous');

relation=buildAtlasRelationship(works,'reading','Finished');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Dune');

relation=buildAtlasRelationship(works,'reading','In progress');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Dune Messiah');

relation=buildAtlasRelationship(works,'reading','Not started');
assert.equal(relation.workCount,2);

relation=buildAtlasRelationship(works,'rating','5★');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Dune');

relation=buildAtlasRelationship(works,'rating','4½★');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Dune Messiah');

relation=buildAtlasRelationship(works,'favourite','Favourites');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Dune');

relation=buildAtlasRelationship(works,'author','Unknown author');
assert.equal(relation.workCount,1);
assert.equal(relation.works[0].title,'Anonymous');

console.log('PASS: local Atlas library, reading-state, rating and favourite relationships are exact and deterministic');
