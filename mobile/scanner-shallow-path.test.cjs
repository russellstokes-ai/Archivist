const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync('App.tsx','utf8');
const feedback=fs.readFileSync('scanFeedback.ts','utf8');

const pipelineStart=app.indexOf('async function enrichPublishedLocalLibrary');
const pipelineEnd=app.indexOf('async function enrichPublishedLocalEmbeddedMetadata',pipelineStart);
assert.ok(pipelineStart>=0&&pipelineEnd>pipelineStart,'library enrichment pipeline must exist');
const pipeline=app.slice(pipelineStart,pipelineEnd);
assert.equal(
  pipeline.includes('enrichPublishedLocalEmbeddedMetadata('),
  false,
  'normal Prepare/Refresh must never bulk deep-read local media'
);
assert.match(
  pipeline,
  /checkpointLocalEnrichment\(currentBooks,generation\)/,
  'shallow staged discovery must checkpoint before online enrichment'
);

const searchStart=app.indexOf('const runMetadataSearch=async');
const searchEnd=app.indexOf('const acceptProposal=async',searchStart);
const search=app.slice(searchStart,searchEnd);
assert.match(search,/if\(deep\)/,'Deep Search must own local forensic inspection');
assert.match(search,/concurrency:1/,'Deep Search local inspection must be serial');
assert.match(search,/maxConsecutiveTimeouts:1/,'one pathological local read must open the circuit');
assert.match(search,/workBooks\[Math\.floor\(workBooks\.length\/2\)\]/,'multi-part audio Deep Search must sample the work rather than scan every part');
assert.match(search,/workBooks\.slice\(0,1\)/,'single-file book/comic Deep Search must inspect only that work');
assert.match(search,/synchronizeLocalMetadataCooperative\(inspected\.books\)/,'local clues must be propagated at work level before online search');

assert.match(feedback,/preparing:\[34,40\]/);
assert.match(feedback,/'online-books':\[40,72\]/);

console.log('PASS: normal scanner is shallow; deep local parsing is explicit, serial and work-scoped');
