const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,f);
const {makeScannerStageRecord}=require('./scannerDeviceDiagnostics.ts');
const root='content://provider/tree/primary%3Aaudio/document/primary%3Aaudio';
const tracks=[1,2,3].map(i=>({
  uri:'content://provider/document/primary:audio%2FPrivate%20Writer%2FSECRET%20TITLE%2F'+i+'%20-%20Chapter%20'+i+'.mp3',
  rootUri:root,title:'SECRET TITLE',author:'PRIVATE NAME',series:'',format:'Audio',space:'audio',
  embeddedMetadata:{workTitle:'SECRET TITLE',trackNumber:i},needsReview:true,available:true,
}));
const record=makeScannerStageRecord('audio',tracks,513.6,{
  metadataAttempted:1,metadataTimedOut:0,lookupUnits:2,secretToken:'MUST NEVER LEAK',
  providerUrl:'https://private.example/secret',maxJsDelayMs:123.9,
});
assert.equal(record.schema,'archivist-scanner-stage-v1');
assert.equal(record.counts.physicalFiles,3);
assert.equal(record.counts.logicalWorks,1);
assert.equal(record.counts.audioWorks,1);
assert.equal(record.counts.audioFolderEvidence.total,1);
assert.deepEqual(record.counts.audioFolderEvidence.largest[0],{position:1,files:3,logicalGroups:1,albumTagVariants:1,missingAlbumTags:0});
assert.equal(record.counts.workFileCountBands.twoToThree,1);
assert.equal(record.counters.metadataAttempted,1);
assert.equal(record.counters.maxJsDelayMs,124);
assert.equal(record.elapsedMs,514);
const content=JSON.stringify(record);
for(const forbidden of ['SECRET TITLE','PRIVATE NAME','Private%20Writer','provider/document',
 'secretToken','providerUrl','private.example','sourceUri']){
  assert.ok(!content.includes(forbidden),'diagnostics leaked '+forbidden);
}
assert.equal(makeScannerStageRecord('discovery',[],0).counts.logicalWorks,0);
console.log('PASS: release scanner traces include stage and work counts, never private metadata or paths');
