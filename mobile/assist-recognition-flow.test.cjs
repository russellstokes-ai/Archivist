const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createMetadataStore}=require('./scannerVNext/fieldEvidence.ts'),{createAssistMetadataStore}=require('./assistMetadata/store.ts'),{createImprovedAssist}=require('./assistMetadata/controller.ts'),{writeEligibility}=require('./assistMetadata/changePlan.ts');
(async()=>{const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(tmp,'recognition.db'));try{
const base=await createMetadataStore(db),store=await createAssistMetadataStore(db,base);
await db.execAsync('CREATE TABLE scanner_vnext_catalogue(work_id TEXT PRIMARY KEY,source_id TEXT NOT NULL,payload TEXT NOT NULL)');
for(const n of [2,3,4]){const work={workId:'i'+n,revision:0,fields:{series:'Example',seriesNumber:String(n),...(n===3?{}:{title:'Example '+n,publisher:'Press',publishedYear:'1980'})},fieldSources:{series:'filename',seriesNumber:'filename'},manual:{},partIds:['p'+n],identityConfirmed:n!==3,...(n!==3?{identification:{rung:'R2',provider:'gcd',candidateId:String(n),conflicts:[],selectedAt:1}}:{})};await base.ensure(work);await db.runAsync('INSERT INTO scanner_vnext_catalogue VALUES(?,?,?)',work.workId,'source',JSON.stringify({entry:{assets:[{relativePath:'Example/'+n+'.cbz',disposition:{kind:'comic'}}]}}));}
const candidate={id:'3',provider:'gcd',fields:{title:'Example 3',series:'Example',seriesNumber:'3',publisher:'Press',publishedYear:'1980'},identifiers:[]};
const assist=await createImprovedAssist(db,store,{async search(work){assert.equal(work.fields.publisher,'Press');return {state:'review',candidates:[{candidate,score:50,conflicts:[],automaticEligible:false}],issues:[],requests:1,cacheHit:false,nextPages:{}};}});
assert.equal((await (await assist.search('i3',{online:true,automatic:true})).completion).state,'accepted');
const saved=await store.get('i3');assert.equal(saved.identification.rung,'R3');assert.equal(saved.identityConfirmed,true);assert.equal(writeEligibility(saved,[],false),'identity-needs-evidence');
assert.ok((await store.evidence('i3')).some(o=>o.source==='neighbour'&&o.detail==='anchors:i2,i4'));
const repeated=await store.accept('i3',candidate,saved.revision);assert.equal(repeated.identification.rung,'R3','provider fields cannot promote a neighbour match');
const promotedClues=await base.refreshDiscovery('i3',{series:'Example',seriesNumber:'3',publisher:'Press',publishedYear:'1980'},{series:'embedded',seriesNumber:'embedded',publisher:'embedded',publishedYear:'embedded'},repeated.revision);
assert.equal(promotedClues.identityConfirmed,false);const promoted=await store.accept('i3',candidate,promotedClues.revision);assert.equal(promoted.identification.rung,'R2','new embedded facts can promote R3; provider facts alone cannot');
const unknown=await base.ensure({workId:'rescan',revision:0,fields:{title:'Unhelpful name'},manual:{},partIds:['p'],identityConfirmed:false,fieldSources:{title:'filename'}});
const refreshed=await base.refreshDiscovery('rescan',{title:'Novel',author:'Writer'},{title:'embedded',author:'embedded'},0);assert.equal(refreshed.fields.title,'Novel');assert.equal(refreshed.revision,1);
const locked=await store.saveManual('rescan',{title:'My title'},1);const again=await base.refreshDiscovery('rescan',{title:'Other',genre:'Fantasy'},{title:'embedded',genre:'embedded'},locked.revision);assert.equal(again.fields.title,'My title');assert.equal(again.fields.genre,'Fantasy');
console.log('PASS: persisted neighbour acceptance stays R3 and non-writable; rescans add embedded clues while preserving locks');
}finally{await db.close();fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
