'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createMetadataStore}=require('./scannerVNext/fieldEvidence.ts');
const {createAssistMetadataStore}=require('./assistMetadata/store.ts');
const {validatePortableRecord,makePortableFields,portableMatches}=require('./assistMetadata/portable.ts');
const {createImprovedAssist}=require('./assistMetadata/controller.ts');
(async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-'));
 const db=sqlite(path.join(dir,'before.db')),fresh=sqlite(path.join(dir,'after.db'));
 try{
  const store=await createAssistMetadataStore(db,await createMetadataStore(db));
  await store.ensure({workId:'old',revision:0,fields:{title:'Recovered Book',author:'Fixture Writer',genre:'History',coverUri:'file:///private/old.jpg'},manual:{},identityConfirmed:true,partIds:['old-part']});
  const edited=await store.saveManual('old',{description:'',publisher:'My Press'},0);
  // A real file and serialized snapshot survive creating a completely fresh app database.
  const file=path.join(dir,'book.txt');fs.writeFileSync(file,'Synthetic recovery fixture\n');
  const member=()=>({path:'book.txt',bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
  const snapshot={schema:1,kind:'archivist-work',portableId:'12345678-1234-1234-1234-123456789abc',savedAt:1,revision:edited.revision,...makePortableFields(edited),members:[member()]};
  const savedPath=path.join(dir,'snapshot.json');fs.writeFileSync(savedPath,JSON.stringify(snapshot));
  const record=validatePortableRecord(JSON.parse(fs.readFileSync(savedPath,'utf8')));
  assert.equal(record.fields.coverUri,undefined,'App-private cover paths must not escape into portable fields');
  assert.equal(portableMatches(record,[member()]),true);
  const restoredStore=await createAssistMetadataStore(fresh,await createMetadataStore(fresh));
  const initial={workId:'new',revision:0,fields:{title:'Filename guess'},manual:{},identityConfirmed:false,partIds:['new-part']};
  await restoredStore.ensure(initial);
  const restored=await restoredStore.restorePortable('new',record.fields,record.manual,0);
  assert.equal(restored.identityConfirmed,true);assert.equal(restored.fields.title,'Recovered Book');
  assert.equal(restored.fields.publisher,'My Press');assert.equal(restored.fields.description,'');assert.equal(restored.manual.description,true);
  assert.deepEqual(restored.partIds,['new-part'],'Restore must retain newly discovered file membership');
  const candidate={id:'one',provider:'fixture',identifiers:[],fields:{title:'Recovered Book',author:'Fixture Writer',description:'Provider summary',language:'en'}};
  const assist=await createImprovedAssist(fresh,restoredStore,{search:async()=>({state:'review',candidates:[{candidate,score:140,conflicts:[],automaticEligible:true}],requests:1,cacheHit:false,issues:[],nextPages:{}})});
  assert.equal((await (await assist.search('new',{online:true,automatic:true})).completion).state,'accepted');
  const enriched=await restoredStore.get('new');assert.equal(enriched.identityConfirmed,true);assert.equal(enriched.fields.language,'en');
  assert.equal(enriched.fields.description,'','A restored manual clear must survive automatic enrichment');
  await assert.rejects(restoredStore.restorePortable('new',record.fields,record.manual,enriched.revision),/manual decisions/);
  await assert.rejects(restoredStore.restorePortable('new',record.fields,record.manual,0),/Stale/);
  fs.writeFileSync(file,'Different recovery fixture\n');assert.equal(portableMatches(record,[member()]),false,'Changed media cannot inherit the snapshot');
  for(const bad of [
   {...record,schema:2}, {...record,fields:{...record.fields,coverUri:'file:///private/old.jpg'}},
   {...record,members:[{...record.members[0],path:'../book.txt'}]},
   {...record,members:[record.members[0],record.members[0]]}, {...record,manual:{title:'yes'}},
   {...record,fields:{title:' ',author:'Fixture Writer'}},
  ])assert.throws(()=>validatePortableRecord(bad));
  assert.equal((await restoredStore.get('new')).fields.title,'Recovered Book');
  await restoredStore.ensure({workId:'weak',revision:0,fields:{title:'Uncertain filename'},manual:{},identityConfirmed:false,partIds:['weak-part']});
  const weakCandidate={id:'borrowed',provider:'fixture',identifiers:['9780306406157'],fields:{title:'A real title',author:'A real author',isbn:'9780306406157'}};
  const selected=await restoredStore.accept('weak',weakCandidate,0);
  assert.equal(selected.identityConfirmed,false);
  const repeated=await restoredStore.accept('weak',weakCandidate,selected.revision);
  assert.equal(repeated.identityConfirmed,false,'Provider-supplied ISBN/title/author cannot corroborate their own next lookup');
  assert.equal(repeated.identification.rung,undefined,'Repeated selection cannot upgrade borrowed fields to R1');
  console.log('PASS: real-file identity checks, serialized metadata recovery into a fresh SQLite database, restored locks/manual clears, published identity preservation and rejection of invalid snapshots (Android SAF transport not exercised)');
 }finally{await db.close();await fresh.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
