const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);

const {
  normalizeServerWork,
  normalizeLibrarySummary,
  normalizeAtlasRelationship,
  buildLegacyAtlasRelationship,
}=require('./serverCompatibility.ts');

const oldWork={
  id:1,title:'Dune',author:'Frank Herbert',series:'Dune',
  format:'Ebook',space:'Books',editions:1,files:1,available:true,
};
assert.equal(normalizeServerWork(oldWork).genre,'');

const oldSummary={
  total:1,
  formats:[{name:'Ebook',count:1}],
  spaces:[{name:'Books',count:1}],
  authors:[{name:'Frank Herbert',count:1}],
  unknownAuthors:0,
  needsReview:0,
  series:[{name:'Dune',count:1}],
  availability:[{name:'Available',count:1}],
};
const summary=normalizeLibrarySummary(oldSummary);
assert.deepEqual(summary.genres,[]);
assert.deepEqual(summary.formats,[{name:'Ebook',count:1}]);

const oldRelation={
  kind:'author',
  value:'Frank Herbert',
  workCount:1,
  works:[oldWork],
  authors:[{name:'Frank Herbert',count:1}],
  series:[{name:'Dune',count:1}],
  formats:[{name:'Ebook',count:1}],
  spaces:[{name:'Books',count:1}],
};
const relation=normalizeAtlasRelationship(oldRelation);
assert.deepEqual(relation.genres,[]);
assert.deepEqual(relation.availability,[]);
assert.equal(relation.works[0].genre,'');

const legacy=buildLegacyAtlasRelationship([
  oldWork,
  {...oldWork,id:2,title:'Dune Messiah',format:'Audio'},
  {...oldWork,id:3,title:'Foundation',author:'Isaac Asimov',series:'Foundation',space:'SciFi'},
],'format','Audio');
assert.equal(legacy.workCount,1);
assert.equal(legacy.works[0].title,'Dune Messiah');
assert.deepEqual(legacy.genres,[]);
assert.deepEqual(legacy.availability,[{name:'Available',count:1}]);

console.log('PASS: new mobile builds tolerate older server payloads and unsupported Atlas dimensions');
