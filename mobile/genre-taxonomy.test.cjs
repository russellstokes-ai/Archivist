const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {canonicalPrimaryGenre,selectPrimaryGenre,genreIsSpecific}=require('./genreTaxonomy.ts');

for(const [input,expected] of [
  ['Sci Fi','Science Fiction'],
  ['Space Opera','Science Fiction'],
  ['FICTION / Science Fiction / Space Opera','Science Fiction'],
  ['Young Adult / Fantasy / Epic','Fantasy'],
  ['FICTION / Historical / General','Historical Fiction'],
  ['Historical Fiction','Historical Fiction'],
  ['BIOGRAPHY & AUTOBIOGRAPHY / Personal Memoirs','Memoir'],
  ['History of medicine',undefined],
  ['Accessible book',undefined],
  ['Internet Archive',undefined],
  ['Subjects of novels',undefined],
  ['FICTION / General','Fiction'],
  ['Comics & Graphic Novels / Superheroes','Graphic Novels'],
]){
 assert.equal(canonicalPrimaryGenre(input),expected,JSON.stringify(input));
}
assert.equal(selectPrimaryGenre(['Fiction','Space opera','Science Fiction','Adventure fiction']),'Science Fiction');
assert.equal(selectPrimaryGenre(['Young adult fiction','Epic fantasy','Fiction']),'Fantasy');
assert.equal(selectPrimaryGenre(['Fiction','Fiction / Mystery & Detective / Historical']),'Mystery');
assert.equal(selectPrimaryGenre(['Accessible book','Protected DAISY','Publication metadata']),undefined,
 'unrelated catalogue subjects must not become an Atlas genre');
assert.equal(genreIsSpecific('Fiction'),false);
assert.equal(genreIsSpecific('Science Fiction'),true);

const {buildAtlasRelationship}=require('./atlas.ts');
const {buildAtlasUniverse}=require('./atlasUniverse.ts');
const exampleWorks=['Sci-Fi','Science Fiction','Space Opera'].map((genre,index)=>({
  key:'genre-work-'+index,title:'Example '+index,author:'Author',series:'',genre,format:'EPUB',space:'Books',source:'local',available:true,
}));
assert.equal(buildAtlasRelationship(exampleWorks,'genre','Science Fiction').workCount,3,
  'Atlas genre focus must include all canonical aliases');
const scene=buildAtlasUniverse(exampleWorks);
assert.equal(scene.nodes.filter(node=>node.kind==='genre').length,1,
  'Atlas should create one Science Fiction constellation, not a constellation per provider spelling');
assert.equal(scene.nodes.find(node=>node.kind==='genre').label,'Science Fiction');

const {lookupOnlineBook,hydrateBookCandidate,shouldLookupBookOnline,mergeOnlineBookCandidate}=require('./onlineBookMetadata.ts');
const completeBase={title:'Dune',author:'Frank Herbert',format:'EPUB',coverUri:'file:///dune.jpg'};
assert.equal(shouldLookupBookOnline({...completeBase,genre:'Fiction'}),true,
 'generic Fiction is insufficient Atlas classification and needs enrichment');
assert.equal(shouldLookupBookOnline({...completeBase,genre:'Space Opera'}),false,
 'known specific genre aliases count as classified');
const confirmedCandidate={provider:'openlibrary',providerId:'/works/OLG1W',fields:{title:'Dune',genre:'Science Fiction'},score:96,confidence:'high',reasons:[],exactIdentifier:true,query:'isbn'};
assert.equal(mergeOnlineBookCandidate({...completeBase,genre:'Fiction',metadataProvenance:{genre:'embedded'}},confirmedCandidate,true).genre,'Science Fiction',
 'a high-confidence specific genre may improve an embedded broad label');
assert.equal(mergeOnlineBookCandidate({...completeBase,genre:'Fiction',metadataProvenance:{genre:'manual'}},confirmedCandidate,true).genre,'Fiction',
 'manual genre edits must remain protected');
(async()=>{
 const calls=[];
 const fetcher=async url=>{
  calls.push(url);
  if(url.includes('/search.json'))return {ok:true,status:200,json:async()=>({docs:[{
    key:'/works/OLG1W',title:'Dune',author_name:['Frank Herbert'],
    subject:['Accessible book','Fiction','Protected DAISY'],isbn:['9780441172719'],
  }]})};
  if(url.includes('/works/OLG1W.json'))return {ok:true,status:200,json:async()=>({
    subjects:['Space Opera','Science Fiction','Politics in fiction'],description:'Desert world',
  })};
  throw new Error('unexpected '+url);
 };
 const result=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',format:'EPUB'},{
  fetcher,ignoreCache:true,interactive:false,
 });
 assert.equal(result.best?.fields.genre,'Science Fiction',
   'detailed Open Library work subjects must supersede generic search subjects');
 assert.ok(calls.some(url=>url.includes('/works/OLG1W.json')),'generic provider subjects must trigger hydration');
 const selected=await hydrateBookCandidate({
  provider:'openlibrary',providerId:'/works/OLG1W',fields:{title:'Dune',genre:'Fiction',description:'Already known'},
  score:95,confidence:'high',reasons:['strong title match','author match'],exactIdentifier:false,query:'Dune'
 },{fetcher});
 assert.equal(selected.fields.genre,'Science Fiction',
   'interactive accepted candidates must enrich generic genre despite existing description');
 console.log('PASS: genre evidence produces stable Atlas families and hydrates generic provider tags');
})().catch(error=>{console.error(error);process.exitCode=1});
