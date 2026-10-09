const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createMetadataStore}=require('./scannerVNext/fieldEvidence.ts'),{createPublicationStore}=require('./scannerVNext/publication.ts'),{resolveArtwork}=require('./scannerVNext/artwork.ts');
(async()=>{const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(tmp,'publish.db'));try{
 const metadata=await createMetadataStore(db),publication=await createPublicationStore(db);
 const work=await metadata.ensure({workId:'one',revision:0,fields:{title:'Generated title',author:'Fixture author',genre:'Space opera'},identityConfirmed:true,manual:{},partIds:['a','b']});
 assert.equal((await publication.publish(work,{state:'missing'})).state,'staged');
 const ready={state:'ready',uri:'file:///fixture-cover.png',manual:false,bytes:100,width:300,height:500};
 assert.equal((await publication.publish(work,{...ready,bytes:999999999})).state,'staged');
 assert.equal((await publication.publish(work,ready)).state,'published');assert.equal((await publication.load('one')).revision,0);
 const edited=await metadata.saveManual('one',{genre:'Other'},0);assert.equal((await publication.publish(edited,ready)).state,'staged');assert.equal((await publication.load('one')).fields.genre,'Science Fiction');
 assert.equal((await publication.publish(work,ready)).state,'stale');
 const restored=await createPublicationStore(db);assert.equal((await restored.load('one')).partIds.length,2);
 let writes=0;const invalid=await resolveArtwork('one',[{uri:'https://covers.openlibrary.org/b/id/1.jpg',manual:false}],{async read(){return {bytes:new Uint8Array([1,2,3]),width:50,height:50};},async save(){writes++;return 'file:///cache';}});assert.equal(invalid.state,'invalid');assert.equal(writes,0);
 const png=new Uint8Array(24);png.set([137,80,78,71,13,10,26,10]);
 const manual=await resolveArtwork('one',[{uri:'file:///manual.png',manual:true},{uri:'https://covers.openlibrary.org/b/id/1.jpg',manual:false}],{async read(uri){assert.equal(uri,'file:///manual.png');return {bytes:png,width:300,height:500};},async save(){throw new Error('manual must be retained');}});assert.equal(manual.uri,'file:///manual.png');assert.equal(manual.manual,true);
 const corruptManual=await resolveArtwork('one',[{uri:'file:///manual.png',manual:true},{uri:'https://covers.openlibrary.org/b/id/1.jpg',manual:false}],{async read(){throw new Error('corrupt');},async save(){throw new Error('unexpected');}});assert.equal(corruptManual.state,'invalid');
 console.log('PASS: work-atomic publication, unresolved genre/artwork staging, stale rejection, restart, prior accepted retention and manual artwork protection');
}finally{await db.close();fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
