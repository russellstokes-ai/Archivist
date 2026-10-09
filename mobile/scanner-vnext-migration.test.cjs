const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createLegacyMigration}=require('./scannerVNext/migration.ts');
(async()=>{const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(tmp,'migration.db'));try{
 let ids=0;const store=await createLegacyMigration(db,()=>`migrated-${++ids}`),books=[{uri:'content://fixture/a',workKey:'old-work',title:'Generated title',author:'Writer',genre:'Fantasy',coverUri:'file:///manual.png',metadataSource:'manual'},{uri:'content://fixture/b',workKey:'old-work',title:'Generated title',author:'Writer',genre:'Fantasy'}],progress={'old-work':{seconds:120,trackUri:books[1].uri}};
 const first=await store.preserve(books,progress);assert.equal(first.records,2);assert.equal(first.created,2);assert.equal((await store.get(books[0].uri)).book.coverUri,'file:///manual.png');assert.equal((await store.get(books[0].uri)).progress['old-work'].seconds,120);
 const repeated=await store.preserve([{...books[0],title:'Rescanned title'},books[1]],{});assert.equal(repeated.created,0);assert.equal((await store.get(books[0].uri)).book.title,'Generated title');assert.equal(ids,2);
 const restarted=await createLegacyMigration(db,()=>`new-${++ids}`);assert.equal((await restarted.get(books[0].uri)).recordId,(await store.get(books[0].uri)).recordId);
 const controller=new AbortController();controller.abort();await assert.rejects(store.preserve([{uri:'content://fixture/c',title:'Other'}],{},controller.signal),/cancelled/);assert.equal(await store.get('content://fixture/c'),null);
 console.log('PASS: additive idempotent legacy metadata/artwork/progress preservation, stable restart IDs and cancelled migration');
}finally{await db.close();fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
