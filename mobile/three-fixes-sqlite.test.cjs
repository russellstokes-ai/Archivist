'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const {test}=require('node:test');
const sqlite=require('./test-support/sqlite-port.cjs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {createWriteQueue}=require('./scannerVNext/metadataWrites.ts');
function stage(db){
 const exports={},file=path.join(__dirname,'localStageStore.native.ts'),write=createWriteQueue();
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:key=>{
  if(key==='expo-sqlite')return {openDatabaseAsync:async()=>db};
  if(key==='./scannerVNext/metadataWrites')return {metadataWrite:write};
  throw Error('Unexpected dependency '+key);
 },setTimeout,clearTimeout,Date,Promise,console});return exports;
}
test('real SQLite retains all 3,000 rows and manual metadata across cancel, SQL failure and reopen',async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.three-fix-sqlite-')),file=path.join(dir,'library.db');
 let db=sqlite(file),inserts=0;
 try{
  const rawRun=db.runAsync;
  db.runAsync=async(sql,...args)=>{if(sql.includes('INSERT INTO local_assets')){inserts++;assert.ok(args.length<=320);}return rawRun(sql,...args);};
  const api=stage(db),books=Array.from({length:3000},(_,n)=>({id:n+1,uri:'content://fixture/comic-'+n,rootUri:'content://fixture/root',title:'Corrected title '+n,author:'Owner choice',metadataSource:'manual',scannerWorkId:'stable-'+n})),events=[];
  await api.replaceLocalStageBooks(books,{onProgress:event=>events.push({...event})});
  assert.equal(inserts,47);assert.equal(events.at(-1).stage,'committed');
  let row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM local_assets');assert.equal(row.count,3000);
  row=await db.getFirstAsync('SELECT payload,ordinal FROM local_assets WHERE uri=?',books[1800].uri);assert.deepEqual(JSON.parse(row.payload),books[1800]);assert.equal(row.ordinal,1800);
  let current=true;
  await assert.rejects(api.replaceLocalStageBooks(books.slice(0,200),{shouldContinue:()=>current,onProgress:event=>{if(event.stage==='saving'&&event.processed>=64)current=false;}}),/cancel/i);
  row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM local_assets');assert.equal(row.count,3000,'cancelled replacement must roll back in real SQLite');
  await db.execAsync("CREATE TRIGGER fail_fixture_row BEFORE INSERT ON local_assets WHEN NEW.uri='content://fixture/fail' BEGIN SELECT RAISE(ABORT,'fixture write failure'); END;");
  await assert.rejects(api.replaceLocalStageBooks([{...books[0],uri:'content://fixture/new'},{...books[1],uri:'content://fixture/fail'}]),/fixture write failure/);
  row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM local_assets');assert.equal(row.count,3000,'SQL failure must not leave a partially replaced library');
  await db.close();db=sqlite(file);
  row=await db.getFirstAsync('SELECT COUNT(*) AS count FROM local_assets');assert.equal(row.count,3000);
  row=await db.getFirstAsync('SELECT payload FROM local_assets WHERE uri=?',books[1800].uri);assert.deepEqual(JSON.parse(row.payload),books[1800]);
  console.log('ThreeFixSQLiteEvidence: 3000 durable rows in 47 bounded inserts; manual metadata, cancellation rollback, SQL-error rollback and reopen verified');
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
