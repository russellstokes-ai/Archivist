const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createCatalogueRuntime,projectScannerWorks}=require('./scannerVNext/runtime.ts');
(async()=>{const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(dir,'runtime.db'));try{
 let id=0,queries=0,lookups=0;const root='content://fixture/tree/root';
 const runtime=await createCatalogueRuntime(db,()=>`id-${++id}`,{
 access:{async nextBatch(){queries++;return {entries:[1,2].map(n=>({documentId:`root/part${n}`,relativePath:`Book/Disc 1/Chapter ${n}.mp3`,name:`Chapter ${n}.mp3`,size:100,modified:10})),nextCursor:null};}},
 clues:async()=>({title:'Book',author:'Writer',genre:'Space opera'}),
 artwork:async()=>({state:'ready',uri:'file:///private/cover.png',bytes:100,width:100,height:150}),
 search:{async search(){lookups++;return {state:'review',candidates:[],requests:0,cacheHit:false,issues:[],nextPages:{}};}}
 });
 const folder={id:'source',uri:root,name:'Library',status:'',itemCount:0};
 const first=await runtime.scan([folder],[],{}, {online:false,automatic:false});
 await runtime.scan([folder],[],{}, {online:true,automatic:true});assert.equal(lookups,0,'Discovery must finish without online searches');
 assert.equal(first.books.length,2);assert.equal(first.review,1);assert.equal(projectScannerWorks(first.books,()=>[]).length,1);
 assert.equal(first.books[0].coverUri,'file:///private/cover.png','A reviewable work still displays its available cover');assert.equal(first.books[0].genre,'Science Fiction');
 const workId=first.books[0].scannerWorkId;assert.ok(workId);assert.equal(first.books[0].scannerPublished,false);
 const saved=await runtime.save(workId,{title:'Book',author:'Manual Writer',genre:'Sci-fi'}, {online:false,automatic:false});await saved.completion;
 assert.equal(queries,2,'Save must never enumerate or read files');assert.equal(lookups,1);
 await runtime.confirm(workId);const ready=await runtime.refresh(workId);assert.equal(ready[0].scannerPublished,true);assert.equal(ready[0].genre,'Science Fiction');assert.equal(ready[0].author,'Manual Writer');
 const accepted=projectScannerWorks(ready,()=>[])[0];assert.equal(accepted.logicalWorkKey,workId);assert.equal(accepted.files,2);assert.equal(accepted.needsReview,false);
 const next=await runtime.scan([folder],ready,{}, {online:false,automatic:false});assert.equal(next.books[0].author,'Manual Writer');assert.equal(next.books[0].scannerPublished,true);
 const overlapping=await runtime.scan([folder,{...folder,id:'nested',uri:'content://fixture/tree/root%2FBook'}],ready,{}, {online:false,automatic:false});
 assert.equal(overlapping.books.length,2,'Overlapping source grants must not duplicate physical parts');assert.equal(projectScannerWorks(overlapping.books,()=>[]).length,1,'Atlas must retain one logical work');assert.equal(overlapping.books[0].scannerWorkId,workId);assert.equal(overlapping.books[0].id,ready[0].id);
 const bad=await runtime.save(workId,{genre:'Other'}, {online:false,automatic:false});await bad.completion;
 const staged=await runtime.refresh(workId);assert.equal(staged[0].genre,'Science Fiction','Prior accepted revision remains active');assert.equal(staged[0].scannerPublished,true);assert.equal(staged[0].needsReview,true);
 const restarted=await createCatalogueRuntime(db,()=>`id-${++id}`,{access:{async nextBatch(){throw Error('permission lost');}},artwork:async()=>({state:'missing'}),search:{async search(){throw Error('offline');}}});
 const lost=await restarted.scan([folder],staged,{}, {online:false,automatic:false});assert.equal(lost.books.length,2);assert.equal(lost.books[0].available,false);assert.equal(lost.books[0].author,'Manual Writer');assert.equal(lost.books[0].needsReview,true);
 const reused=projectScannerWorks(ready.map(b=>({...b,scannerLegacyKey:'legacy-progress-key'})),()=>[])[0];assert.equal(reused.key,'legacy-progress-key');
 console.log('PASS: fresh app runtime, Save without file reads, canonical genre, prior publication, restart/permission loss and progress-key projection');
}finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
