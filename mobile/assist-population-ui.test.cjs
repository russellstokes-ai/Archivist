const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
// Exercise the actual App update function against a large catalogue. Metadata
// projection must not load or replace every asset for a single changed work.
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const body=app.slice(app.indexOf('  async function applyScannerRows('),app.indexOf('  async function scanFreshFolders('));
let books=Array.from({length:20000},(_,i)=>({uri:'file:///'+i,scannerWorkId:'w'+i,title:'Old '+i})),writes=[];
const compile=ts.transpileModule(body+'\nexports.apply=applyScannerRows;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={exports:{},scannerRowsCommit:{current:Promise.resolve()},upsertLocalStageBooks:async rows=>writes.push(rows),loadLocalStageBooks:()=>{throw Error('Full-library reload during population');},replaceLocalStageBooks:()=>{throw Error('Full-library rewrite during population');},setLocalBooks:fn=>{books=fn(books)},setEditing:fn=>fn(null)};
require('node:vm').runInNewContext(compile,context);
(async()=>{
 const other=books[200];await context.exports.apply([{uri:'file:///17',scannerWorkId:'w17',title:'Identified'}]);
 assert.equal(writes.length,1);assert.equal(writes[0].length,1);assert.equal(books.length,20000);assert.equal(books[17].title,'Identified');assert.equal(books[200],other);
 const scan=app.slice(app.indexOf('    setScanResultSummary(summary);'),app.indexOf('  async function populateLibrary()'));
 assert(!scan.includes('openMetadataReview()'),'Scan completion must not navigate to Library review');
 console.log('PASS: one identified work updates one database record, retains order/membership, and scan completion stays on its screen');
})().catch(e=>{console.error(e);process.exitCode=1});
