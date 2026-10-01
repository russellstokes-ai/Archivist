const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {buildAtlasRelationship}=require('./atlas.ts');
const {buildAtlasUniverse}=require('./atlasUniverse.ts');
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


const universeWorks=[
  {key:'local:dune',canonicalKey:'dune',title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Ebook',space:'Books',source:'local',coverUri:'file://dune.jpg'},
  {key:'server:messiah',canonicalKey:'messiah',title:'Dune Messiah',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'Audio',space:'Audio',source:'server'},
  {key:'local:foundation',canonicalKey:'foundation',title:'Foundation',author:'Isaac Asimov',series:'Foundation',genre:'Science Fiction',format:'Ebook',space:'Books',source:'local'},
  {key:'local:mystery',canonicalKey:'mystery',title:'Mystery',author:'Anon',series:'',genre:'Mystery',format:'Comic',space:'Comics',source:'local'},
];
const universeCollections=[{id:'favourites',name:'Desert worlds',canonicalKeys:['dune','messiah']}];
const universeAnnotations=[{workKey:'local:dune',text:'Selected passage #courage',note:'Compare ecology #desert',kind:'note'}];
const universeA=buildAtlasUniverse(universeWorks,universeCollections,universeAnnotations,50);
const universeB=buildAtlasUniverse([...universeWorks].reverse(),universeCollections,universeAnnotations,50);
assert.deepEqual(universeA.nodes.map(node=>[node.id,node.x,node.y]),universeB.nodes.map(node=>[node.id,node.x,node.y]));
assert.ok(universeA.nodes.some(node=>node.kind==='genre'&&node.label==='Science Fiction'));
assert.ok(universeA.nodes.some(node=>node.kind==='work'&&node.coverUri==='file://dune.jpg'));
assert.ok(universeA.nodes.some(node=>node.kind==='author'&&node.label==='Frank Herbert'));
assert.ok(universeA.nodes.some(node=>node.kind==='series'&&node.label==='Dune'));
assert.ok(universeA.nodes.some(node=>node.kind==='collection'&&node.label==='Desert worlds'));
assert.ok(universeA.nodes.some(node=>node.kind==='note'));
assert.ok(universeA.nodes.some(node=>node.kind==='tag'&&node.label==='#desert'));
assert.ok(universeA.edges.some(edge=>edge.kind==='collection'));
assert.ok(universeA.edges.some(edge=>edge.kind==='tag'));
const capped=buildAtlasUniverse(Array.from({length:100},(_,i)=>({key:'w'+i,canonicalKey:'w'+i,title:'Work '+i,author:'Author '+(i%9),series:'Series '+(i%8),genre:'Genre '+(i%6),format:'Ebook',space:'Books',source:'local'})),[],[],24);
assert.equal(capped.nodes.filter(node=>node.kind==='work').length,24);
assert.equal(capped.hiddenWorks,76);
console.log('PASS: Atlas universe positions are stable, bounded and connect covers, people, series, collections, notes and tags');
