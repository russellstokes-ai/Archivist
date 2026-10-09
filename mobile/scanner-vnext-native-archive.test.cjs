const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {NativeArchiveReader}=require('./scannerVNext/nativeArchive.ts');
const asset={assetId:'asset',documentId:'document',name:'generated.cbz',source:{id:'source',rootUri:'content://fixture/tree/root',name:'Generated'},size:200,modified:1};
(async()=>{
 let closed=0;const native={async beginScope(){return {scope:'scope',rootDocumentId:'root'};},async cancelScope(){closed++;},async readArchiveClues(scope,id){assert.equal(scope,'scope');assert.equal(id,'document');return {state:'ok',status:'parsed',reason:'bounded-zip-metadata',bytesRead:200,provenance:'embedded',fields:{title:'Generated Comic',genre:'SF'}};}};
 const clues=await new NativeArchiveReader(native).read(asset);assert.equal(clues.fields.title,'Generated Comic');assert.equal(clues.fields.genre,'SF');assert.equal(closed,1);
 const unreadable=await new NativeArchiveReader({...native,async readArchiveClues(){return {state:'ok',status:'unresolved',reason:'rar-metadata-unsupported',bytesRead:8,provenance:'embedded',fields:{}};}}).read(asset);assert.equal(unreadable.status,'unresolved');assert.equal(unreadable.reason,'rar-metadata-unsupported');
 await assert.rejects(()=>new NativeArchiveReader({...native,async readArchiveClues(){return {state:'ok',status:'parsed',reason:'bad',bytesRead:8388609,provenance:'embedded',fields:{}};}}).read(asset),/Invalid/);assert.equal(closed,3);
 const stop=new AbortController();await assert.rejects(()=>new NativeArchiveReader({...native,async readArchiveClues(){stop.abort();return {state:'ok',status:'parsed',reason:'late',bytesRead:1,provenance:'embedded',fields:{title:'Late'}};}}).read(asset,stop.signal),/cancel/i);assert.equal(closed,4);
 console.log('PASS: scoped archive bridge keeps raw evidence and unresolved RAR visible, enforces budgets and suppresses cancelled data');
})().catch(e=>{console.error(e);process.exitCode=1;});
