const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {deriveLibraryRelations,createLibraryRelationsStore}=require('./assistMetadata/libraryRelations.ts');
class MemoryDb{
 constructor(){this.fingerprints=new Map();this.relations=new Map();}
 async execAsync(){}
 async runAsync(sql,...p){
  if(sql.startsWith('INSERT INTO scanner_vnext_content_fingerprints'))this.fingerprints.set(p[0],{assetId:p[0],sha256:p[1],size:p[2],container:p[3],modified:p[4]??undefined});
  else if(sql==='DELETE FROM scanner_vnext_library_relations')this.relations.clear();
  else if(sql.startsWith('INSERT INTO scanner_vnext_library_relations'))this.relations.set(p[0],{key:p[0],kind:p[1],leftWorkId:p[2],rightWorkId:p[3],leftEditionId:p[4],rightEditionId:p[5],leftAssetId:p[6]??undefined,rightAssetId:p[7]??undefined,evidence:JSON.parse(p[8])});
  else throw Error('Unexpected SQL mutation: '+sql);
 }
 async getFirstAsync(sql){
  if(sql.includes('scanner_vnext_content_fingerprints'))return {rows:JSON.stringify([...this.fingerprints.values()])};
  if(sql.includes('scanner_vnext_library_relations'))return {rows:JSON.stringify([...this.relations.values()])};
  throw Error('Unexpected SQL query: '+sql);
 }
 async withExclusiveTransactionAsync(action){await action(this);}
}
const identified=(id,fields,provider='google-books',candidateId='edition',rung='R1',conflicts=[])=>({work:{workId:id,revision:1,fields,identityConfirmed:true,identification:{rung,provider,candidateId,conflicts}},editionId:'edition-'+id,members:[{assetId:'asset-'+id,container:id==='audio'?'m4b':'epub',size:42,modified:100}]});
(async()=>{
 const epub=identified('epub',{title:'Same title',author:'Author',isbn:'9780000000001'});
 const audio=identified('audio',{title:'Different title',author:'Other',isbn:'9780000000001'});
 const olA=identified('ol-a',{title:'Work A',author:'A',isbn:'9781111111111'},'open-library','/works/OL123W','R2');
 const olB=identified('ol-b',{title:'Completely different',author:'B',isbn:'9782222222222'},'open-library','/works/OL123W','R2');
 const lookalike=identified('lookalike',{title:'Work A',author:'A'},'google-books','g','R2');
 const conflicted=identified('conflicted',{title:'Work A',author:'A'},'open-library','/works/OL123W','R2',['author']);
 const pure=deriveLibraryRelations([epub,audio,olA,olB,lookalike,conflicted],[
  {assetId:'asset-epub',sha256:'a'.repeat(64),size:42,container:'epub',modified:100},
  {assetId:'asset-audio',sha256:'a'.repeat(64),size:42,container:'m4b',modified:100},
 ]);
 assert.ok(pure.some(x=>x.kind==='work'&&x.leftWorkId==='audio'&&x.rightWorkId==='epub'));
 assert.ok(pure.some(x=>x.kind==='work'&&x.leftWorkId==='ol-a'&&x.rightWorkId==='ol-b'));
 assert.ok(!pure.some(x=>x.leftWorkId==='lookalike'||x.rightWorkId==='lookalike'));
 assert.ok(!pure.some(x=>x.leftWorkId==='conflicted'||x.rightWorkId==='conflicted'));
 assert.ok(!pure.some(x=>x.kind==='duplicate'&&x.leftAssetId==='asset-epub'&&x.rightAssetId==='asset-audio'),'same bytes in different containers are not exact duplicates');
 const dupe1=identified('dupe1',{title:'Unrelated one',author:'A'},'open-library','/works/OL200W','R2');
 const dupe2=identified('dupe2',{title:'Unrelated two',author:'B'},'open-library','/works/OL201W','R2');
 dupe1.members[0]={assetId:'dup-a',container:'cbz',size:42,modified:100};dupe2.members[0]={assetId:'dup-b',container:'cbz',size:42,modified:100};
 const exact=[{assetId:'dup-a',sha256:'b'.repeat(64),size:42,container:'cbz',modified:100},{assetId:'dup-b',sha256:'b'.repeat(64),size:42,container:'cbz',modified:100}];
 assert.ok(deriveLibraryRelations([dupe1,dupe2],exact).some(x=>x.kind==='duplicate'));
 assert.equal(deriveLibraryRelations([dupe1,dupe2],exact.map(x=>({...x,size:43}))).filter(x=>x.kind==='duplicate').length,0);
 assert.equal(deriveLibraryRelations([dupe1,dupe2],exact.map(x=>({...x,container:'pdf'}))).filter(x=>x.kind==='duplicate').length,0);
 const db=new MemoryDb(),store=await createLibraryRelationsStore(db);
 for(const f of exact)await store.captureFingerprint(f);
 const saved=await store.refresh([dupe1,dupe2]);
 assert.equal(saved.filter(x=>x.kind==='duplicate').length,1);
 assert.equal((await store.list()).filter(x=>x.kind==='duplicate').length,1);
 await store.refresh([dupe1]);
 assert.equal((await store.list()).length,0);
 const crowded=Array.from({length:5000},(_,i)=>identified('crowded-'+i,{title:'Shared work',author:'A'},'open-library','/works/OL999W','R2'));
 const star=deriveLibraryRelations(crowded);
 assert.equal(star.length,4999,'one representative edge per remaining work preserves the linked group');
 const crowdedDuplicates=Array.from({length:5000},(_,i)=>{
  const record=identified('duplicate-'+i,{title:'Unrelated '+i,author:'Author'},'open-library','/works/OL'+(20000+i)+'W','R2');
  record.members[0]={assetId:'duplicate-asset-'+i,container:'cbz',size:42,modified:100};
  return record;
 });
 const fingerprints=crowdedDuplicates.map(record=>({assetId:record.members[0].assetId,sha256:'c'.repeat(64),size:42,container:'cbz',modified:100}));
 assert.equal(deriveLibraryRelations(crowdedDuplicates,fingerprints).filter(x=>x.kind==='duplicate').length,4999,'duplicate buckets emit representative edges only');
 const conflictingA=identified('conflicting-a',{title:'One',author:'A',isbn:'9780000000002'},'open-library','/works/OL300W','R2');
 const conflictingB=identified('conflicting-b',{title:'Two',author:'B',isbn:'9780000000002'},'open-library','/works/OL301W','R2');
 assert.equal(deriveLibraryRelations([conflictingA,conflictingB]).length,0,'a shared edition identifier cannot override conflicting verified work identifiers');
 console.log('PASS: strong work links, exact duplicate links, and durable relation refresh preserve independent records');
})().catch(e=>{console.error(e);process.exitCode=1});
