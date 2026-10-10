const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createMetadataStore}=require('./scannerVNext/fieldEvidence.ts'),{createAssistController}=require('./scannerVNext/assist.ts');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(tmp,'assist.db'));
 try{
  const store=await createMetadataStore(db);await store.ensure({workId:'work',revision:0,fields:{title:'Generated Novel'},manual:{},identityConfirmed:false,partIds:['a','b']});
  let release,calls=0;const service={async search(work,policy){calls++;assert.equal(work.fields.author,'Fixture Writer');return new Promise(resolve=>{release=resolve;});}};
  const assist=await createAssistController(db,store,service);const saved=await assist.save('work',{author:'Fixture Writer'},0,{online:true,automatic:true});assert.equal(saved.work.revision,1);assert.equal(calls,1);assert.equal((await store.get('work')).manual.author,true);assert.equal((await assist.get('work')).state,'pending');
  await store.saveManual('work',{genre:'Fantasy'},1);
  release({state:'review',candidates:[],requests:2,cacheHit:false,issues:[],nextPages:{}});assert.equal((await saved.completion).state,'stale');assert.equal((await store.get('work')).fields.genre,'Fantasy');
  const restarted=await createAssistController(db,store,service);assert.equal((await restarted.get('work')).state,'error','Interrupted persisted requests must be retryable');
  const offline=await createAssistController(db,store,{async search(){return {state:'offline',candidates:[],requests:0,cacheHit:false,issues:[],nextPages:{}};}});const second=await offline.save('work',{title:'Corrected title'},2,{online:false,automatic:true});await second.completion;assert.equal((await offline.get('work')).state,'offline');assert.equal((await store.get('work')).fields.title,'Corrected title');
  let rejectOld,lookupCount=0;const race=await createAssistController(db,store,{async search(){if(++lookupCount===1)return new Promise((resolve,reject)=>{rejectOld=reject;});return {state:'review',candidates:[],requests:1,cacheHit:false,issues:[],nextPages:{}};}});const older=await race.search('work',{online:true,automatic:true}),newest=await race.search('work',{online:true,automatic:true});await newest.completion;rejectOld(new Error('Cancelled older lookup'));await older.completion;assert.equal((await race.get('work')).state,'review');
  let releasePage,pageLookups=0;const paging=await createAssistController(db,store,{async search(){return {state:++pageLookups===1?'review':'no-match',candidates:[],requests:1,cacheHit:false,issues:[],nextPages:{'open-library':1},nextPlans:{'open-library':1}};},async more(work,provider,page,policy,plan){assert.equal(plan,1);return new Promise(resolve=>{releasePage=resolve;});}});await (await paging.search('work',{online:true,automatic:true})).completion;const oldPage=paging.more('work','open-library',1,3,{online:true,automatic:true});while(!releasePage)await new Promise(r=>setTimeout(r,0));await (await paging.search('work',{online:true,automatic:true})).completion;releasePage({state:'review',candidates:[],requests:1,cacheHit:false,issues:[],nextPages:{'open-library':2}});await assert.rejects(oldPage,/Stale/);assert.equal((await paging.get('work')).state,'no-match');
  await store.ensure({workId:'automatic',revision:0,fields:{title:'Exact Novel',author:'Exact Writer'},manual:{author:true},identityConfirmed:false,partIds:['a']});
  const candidate={id:'exact',provider:'fixture',identifiers:[],fields:{title:'Exact Novel',author:'Exact Writer',genre:'Fantasy',publishedYear:'1937',coverUrl:'https://example.org/cover.jpg'}};
  const automatic=await createAssistController(db,store,{async search(){return {state:'review',candidates:[{candidate,score:140,conflicts:[],automaticEligible:true}],requests:1,cacheHit:false,issues:[],nextPages:{}};}});
  assert.equal((await (await automatic.search('automatic',{online:true,automatic:true})).completion).state,'accepted');
  assert.equal((await store.get('automatic')).fields.genre,'Fantasy');assert.equal((await store.get('automatic')).fields.coverUri,candidate.fields.coverUrl);assert.equal((await store.get('automatic')).manual.author,true);
  for(const variant of ['ambiguous','paged','disabled']){
   await store.ensure({workId:variant,revision:0,fields:{title:'Exact Novel',author:'Exact Writer'},manual:{},identityConfirmed:false,partIds:['a']});
   const rows=[{candidate,score:140,conflicts:[],automaticEligible:true}];if(variant==='ambiguous')rows.push({...rows[0],candidate:{...candidate,id:'another-edition'}});
   const guarded=await createAssistController(db,store,{async search(){return {state:'review',candidates:rows,requests:1,cacheHit:false,issues:[],nextPages:variant==='paged'?{fixture:1}:{}};}});
   assert.equal((await (await guarded.search(variant,{online:true,automatic:variant!=='disabled'})).completion).state,'review');assert.equal((await store.get(variant)).fields.genre,undefined);
  }
  console.log('PASS: automatic exact-match enrichment, manual preservation, Save first, stale completion/paging rejection and offline edits');
  const failure=await createAssistController(db,store,{async search(){throw Error('Network failed');}});
  await store.ensure({workId:'recognised',revision:0,fields:{title:'Exact Novel',author:'Exact Writer'},manual:{},identityConfirmed:true,partIds:['a']});
  const consensus=await createAssistController(db,store,{async search(){return {state:'review',candidates:[{candidate,score:140,conflicts:[],automaticEligible:true},{candidate:{...candidate,id:'edition2'},score:140,conflicts:[],automaticEligible:true}],requests:1,cacheHit:false,issues:[],nextPages:{fixture:1}};}});
  assert.equal((await (await consensus.search('recognised',{online:true,automatic:true})).completion).state,'accepted');assert.equal((await store.get('recognised')).fields.genre,'Fantasy');assert.equal((await store.get('recognised')).fields.publishedYear,'1937');
  assert.equal((await (await failure.search('work',{online:true,automatic:true})).completion).state,'error','Failed lookups must stop Looking status');
  const unavailable=await createAssistController(db,store,{async search(){return {state:'pending',candidates:[],requests:1,cacheHit:false,issues:['open-library:request-failed'],nextPages:{}};}});
  assert.equal((await (await unavailable.search('work',{online:true,automatic:true})).completion).state,'error');
 }finally{await db.close();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
