const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const ts=require('typescript');
const Module=require('node:module');
const {DatabaseSync}=require('node:sqlite');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'archivist-edit-'));
let db;
const original=Module._load;
Module._load=function(name,parent,isMain){
  if(name==='expo-sqlite')return {openDatabaseAsync:async()=>{
    db=new DatabaseSync(path.join(dir,'library.sqlite'));
    const api={
      execAsync:async sql=>db.exec(sql),
      runAsync:async(sql,...args)=>db.prepare(sql).run(...args),
      getAllAsync:async sql=>db.prepare(sql).all(),
      getFirstAsync:async(sql,...args)=>db.prepare(sql).get(...args),
      prepareAsync:async sql=>({executeAsync:async args=>{await new Promise(r=>setImmediate(r));return db.prepare(sql).run(args)},finalizeAsync:async()=>{}}),
      withExclusiveTransactionAsync:async fn=>{db.exec('BEGIN IMMEDIATE');try{await fn(api);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}},
    };return api;
  }};
  return original.call(this,name,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const stage=require('./localStageStore.native.ts');
const {persistWorkEdit}=require('./metadataEditPersistence.ts');
const {applyLocalMetadata}=require('./libraryIntelligence.ts');
const storage={load:()=>stage.loadLocalStageBooks(),commit:(patches,expected)=>stage.commitLocalWorkEdit(patches,expected)};
const track=(uri,n)=>({uri,title:'Old',author:'Old author',series:'',genre:'',format:'Audio',embeddedMetadata:{trackNumber:n,discNumber:1,title:'Chapter '+n}});
(async()=>{
 const books=[track('one',1),track('two',2),track('unrelated',1)];
 await stage.replaceLocalStageBooks(books);
 const targets=['one','two'];
 const override={title:'New',author:'New author',series:'Series',genre:'History',description:'Edited',publishedYear:2001,seriesNumber:2,clearedFields:[]};
 const overrides=Object.fromEntries(targets.map(uri=>[uri,override]));
 const updated=books.map(book=>targets.includes(book.uri)?{...book,...override,metadataSource:'manual'}:book);
 // A scanner transaction already in flight must finish before the editor reads.
 const oldWrite=stage.replaceLocalStageBooks(books);
 await persistWorkEdit(updated,targets,overrides,storage);
 await oldWrite;
 let saved=await stage.loadLocalStageBooks();
 assert.equal(saved[0].title,'New');assert.equal(saved[1].description,'Edited');
 assert.equal(saved[2].title,'Old');assert.deepEqual(saved[1].embeddedMetadata,books[1].embeddedMetadata);
 // Reopen the actual SQLite file (not merely the React state).
 // Independent connection verifies committed disk state without replacing the live writer.
 const reopened=new DatabaseSync(path.join(dir,'library.sqlite'));
 saved=reopened.prepare('SELECT payload FROM local_assets ORDER BY ordinal').all().map(row=>JSON.parse(row.payload));
 reopened.close();
 assert.equal(saved[1].title,'New');
 const persisted=Object.fromEntries(saved.map(book=>[book.uri,book.manualOverride]));
 const rescanned=applyLocalMetadata({...saved[0],title:'Old path title',author:'Old author'},persisted.one,'manual');
 assert.equal(rescanned.title,'New');assert.equal(rescanned.author,'New author');
 const cleared=applyLocalMetadata({...saved[0],description:'Old',isbn:'123'}, {...override,description:'',isbn:''},'manual');
 assert.equal(cleared.description,undefined);assert.equal(cleared.isbn,undefined);
 await assert.rejects(persistWorkEdit(updated,targets,overrides,{...storage,commit:async()=>{throw Error('disk full')}}),/disk full/);
 // A stale second row aborts the entire transaction, including the first patch.
 const before=await stage.loadLocalStageBooks();
 const changed=before.map(book=>({...book,title:'Must roll back',manualOverride:{title:'Must roll back'}}));
 await assert.rejects(stage.commitLocalWorkEdit(changed,[before[0],{...before[1],title:'stale'},before[2]]),/changed/);
 assert.deepEqual(await stage.loadLocalStageBooks(),before);
 // Editing only a published subset cannot delete an unrelated staged row.
 await persistWorkEdit([updated[0]],['one'],overrides,storage);
 assert.equal((await stage.loadLocalStageBooks()).length,3);
 assert.equal((await stage.loadLocalStageBooks())[0].manualOverride.title,'New');
 await assert.rejects(persistWorkEdit(updated,['missing'],overrides,storage),/changed/);
 console.log('PASS: real SQLite whole-work save, queued writes, restart, rescan, chapter preservation and failed-save detection');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{db?.close();fs.rmSync(dir,{recursive:true,force:true})});
