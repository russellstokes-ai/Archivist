const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {diagnosticValue,collectAssistDiagnostics}=require('./assistMetadata/diagnostics.ts');
const sqlite=require('./test-support/sqlite-port.cjs');
(async()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'.scanner-store-test-')),db=sqlite(path.join(dir,'diagnostics.db'));
 try{
  const empty=await collectAssistDiagnostics(db,'0.10.0');assert.equal(empty.sections.catalogue.available,false);
  await db.execAsync('CREATE TABLE scanner_vnext_catalogue(payload TEXT); CREATE TABLE scanner_vnext_file_writes(work_id TEXT, state TEXT);');
  const value={source:{id:'root',rootUri:'content://private/grant',token:'secret'},entry:{work:{workId:'book',fields:{title:'Book',coverUri:'https://example/?key=secret'}},assets:[{assetId:'a1',relativePath:'Book/CD1/Track01.mp3',uri:'file:///private/track.mp3'}],issues:['path-only-grouping-provisional']}};
  await db.runAsync('INSERT INTO scanner_vnext_catalogue VALUES(?)',JSON.stringify(value));
  await db.runAsync('INSERT INTO scanner_vnext_file_writes VALUES(?,?)','book','source-review-required');
  const result=await collectAssistDiagnostics(db,'0.10.0'),encoded=JSON.stringify(result);
  assert(!encoded.includes('secret'));assert(!encoded.includes('private'));assert(!encoded.includes('rootUri'));
  assert.equal(result.sections.catalogue.rows[0].entry.work.fields.title,'Book');
  assert.equal(result.sections.catalogue.rows[0].entry.assets[0].relativePath,'Book/CD1/Track01.mp3');
  assert.equal(result.sections.fileWrites[0].state,'source-review-required');
  assert.equal(diagnosticValue('https://server/?token=secret'),'[address removed]');
  assert.equal(diagnosticValue('C:\\Users\\private\\file'),'[path removed]');
  assert.equal((await db.getFirstAsync('SELECT count(*) AS n FROM scanner_vnext_catalogue')).n,1);
  await db.execAsync("WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<501) INSERT INTO scanner_vnext_catalogue SELECT '{}' FROM n;");
  const capped=await collectAssistDiagnostics(db,'0.10.0');assert.equal(capped.sections.catalogue.included,500);assert.equal(capped.sections.catalogue.truncated,true);
  console.log('PASS: diagnostic export retains grouping clues, excludes addresses/secrets, handles empty DB and declares truncation without mutations');
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
