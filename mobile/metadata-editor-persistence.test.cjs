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
      getFirstAsync:async sql=>db.prepare(sql).get(),
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
const overridesFile=path.join(dir,'overrides.json');
const storage={load:stage.loadLocalStageBooks,replace:stage.replaceLocalStageBooks,saveOverrides:async value=>fs.writeFileSync(overridesFile,JSON.stringify(value)),loadOverrides:async()=>JSON.parse(fs.readFileSync(overridesFile,'utf8'))};
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
 db.close();delete require.cache[require.resolve('./localStageStore.native.ts')];
 saved=await require('./localStageStore.native.ts').loadLocalStageBooks();
 assert.equal(saved[1].title,'New');
 const persisted=await storage.loadOverrides();
 const rescanned=applyLocalMetadata({...saved[0],title:'Old path title',author:'Old author'},persisted.one,'manual');
 assert.equal(rescanned.title,'New');assert.equal(rescanned.author,'New author');
 const cleared=applyLocalMetadata({...saved[0],description:'Old',isbn:'123'}, {...override,description:'',isbn:''},'manual');
 assert.equal(cleared.description,undefined);assert.equal(cleared.isbn,undefined);
 await assert.rejects(persistWorkEdit(updated,targets,overrides,{...storage,saveOverrides:async()=>{throw Error('disk full')}}),/disk full/);
 await assert.rejects(persistWorkEdit(updated,targets,overrides,{...storage,loadOverrides:async()=>({})}),/could not be verified/);
 await assert.rejects(persistWorkEdit(updated,['missing'],overrides,storage),/changed/);
 console.log('PASS: real SQLite whole-work save, queued writes, restart, rescan, chapter preservation and failed-save detection');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{db?.close();fs.rmSync(dir,{recursive:true,force:true})});
