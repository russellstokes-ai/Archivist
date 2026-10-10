const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createCatalogueRuntime,projectScannerWorks}=require('./scannerVNext/runtime.ts');
const {createBookProviders}=require('./scannerVNext/providers.ts');
const {rankCandidates,RequestQueue}=require('./scannerVNext/search.ts');
const {atlasBreakdown,atlasRingSegments}=require('./atlasInteraction.ts');
const {buildAtlasUniverse}=require('./atlasUniverse.ts');
(async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(dir,'atlas.db'));
 try{
  let id=0;
  // Synthetic provider response exercises the actual parser, store, publication and chart pipeline.
  const provider=createBookProviders({openLibrary:true,googleBooks:false},async()=>({docs:[{key:'/works/OL123W',title:'Fixture Novel',author_name:['Fixture Writer'],subject:['Fantasy','Juvenile fiction'],first_publish_year:1937}],numFound:1}),new RequestQueue())[0];
  const runtime=await createCatalogueRuntime(db,()=>`atlas-${++id}`,{
   access:{async nextBatch(){return {entries:[1,2,3].map(n=>({documentId:`root/Novel/part${n}`,relativePath:`Novel/Chapter ${n}.mp3`,name:`Chapter ${n}.mp3`,size:100,modified:1})),nextCursor:null};}},
   clues:async()=>({title:'Fixture Novel',author:'Fixture Writer'}),
   artwork:async()=>({state:'ready',uri:'file:///fixture/cover.png',bytes:100,width:100,height:150}),
   search:{async search(work){const result=await provider.search(work.fields,0);return {state:'review',candidates:rankCandidates(work.fields,result.candidates),issues:[],requests:1,cacheHit:false,nextPages:{}};}}
  });
  const scanned=await runtime.scan([{id:'source',uri:'content://fixture/tree/root',name:'Fixture',status:'',itemCount:0}],[],{},{online:false,automatic:false});
  const workId=scanned.books[0].scannerWorkId;
  assert.equal((await (await runtime.assist.search(workId,{online:true,automatic:true})).completion).state,'accepted');
  const rows=await runtime.refresh(workId),works=projectScannerWorks(rows,()=>[]);
  assert.equal(rows.length,3);assert.equal(works.length,1,'Charts count a book once, not its chapters');
  assert.equal(works[0].genre,'Fantasy');assert.equal(works[0].publishedYear,1937);assert.equal(rows[0].scannerPublished,true);
  const groups=[atlasBreakdown(works,w=>w.format,()=> 'blue'),atlasBreakdown(works,w=>w.publishedYear?String(w.publishedYear):'Not recorded',()=> 'gold'),atlasBreakdown(works,w=>w.genre,()=> 'green')];
  assert.deepEqual(groups.map(g=>g.map(x=>[x.label,x.count])),[[['Audio',1]],[['1937',1]],[['Fantasy',1]]]);
  const segments=atlasRingSegments(groups);for(let sector=0;sector<3;sector++){const arc=segments.filter(x=>x.sector===sector);assert.equal(arc.length,48);assert(arc.every(x=>x.count===1&&x.label===groups[sector][0].label));}
  const graph=buildAtlasUniverse(works);assert(graph.nodes.some(n=>n.kind==='genre'&&n.label==='Fantasy'));assert.equal(graph.nodes.filter(n=>n.kind==='work').length,1);assert(graph.edges.length>0);
  const saved=await runtime.save(workId,{genre:'History',publishedYear:'1954'},{online:true,automatic:true});await saved.completion;
  const edited=projectScannerWorks(await runtime.refresh(workId),()=>[]);assert.equal(edited[0].genre,'History');assert.equal(edited[0].publishedYear,1954,'Assist preserves a manual year');
  assert(buildAtlasUniverse(edited).nodes.some(n=>n.kind==='genre'&&n.label==='History'));
  assert.equal(atlasBreakdown(edited,w=>String(w.publishedYear),()=> 'gold')[0].label,'1954');
  console.log('PASS: provider -> saved metadata -> published grouped work -> all 3 Atlas charts and constellation; manual genre/year preserved');
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
