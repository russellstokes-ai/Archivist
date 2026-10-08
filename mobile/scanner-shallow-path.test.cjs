const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync('App.tsx','utf8');
const feedback=fs.readFileSync('scanFeedback.ts','utf8');

const pipelineStart=app.indexOf('async function enrichPublishedLocalLibrary');
const pipelineEnd=app.indexOf('async function enrichPublishedLocalEmbeddedMetadata',pipelineStart);
assert.ok(pipelineStart>=0&&pipelineEnd>pipelineStart,'library enrichment pipeline must exist');
const pipeline=app.slice(pipelineStart,pipelineEnd);
assert.match(
  pipeline,
  /enrichPublishedLocalEmbeddedMetadata\(currentBooks,generation,false,true\)/,
  'normal Prepare must read only bounded unresolved audio properties before online matching'
);
assert.match(
  app,
  /if\(fastAudioProperties\)\{[\s\S]*?book\.format==='Audio'\&\&!book\.embeddedMetadata/,
  'fast properties mode must exclude EPUB/comic archive parsing'
);
assert.match(
  pipeline,
  /checkpointLocalEnrichment\(currentBooks,generation\)/,
  'shallow staged discovery must checkpoint before online enrichment'
);
assert.equal(
  pipeline.includes('enrichPublishedLocalCovers(currentBooks,generation)'),
  false,
  'normal Prepare/Refresh must never run catalogue-wide local cover extraction'
);
assert.match(
  pipeline,
  /cacheRequiredWorkArtwork\(currentBooks/,
  'normal preparation must use cached/provider artwork at the work publication gate'
);


const searchStart=app.indexOf('const runMetadataSearch=async');
const searchEnd=app.indexOf('const useProposal=',searchStart);
const search=app.slice(searchStart,searchEnd);

assert.match(feedback,/preparing:\[34,40\]/);
assert.match(feedback,/'online-books':\[40,72\]/);

console.log('PASS: normal scanner is shallow; deep local parsing is explicit, serial and work-scoped');

const editorSearch=app.split('const runMetadataSearch=async')[1].split('const useProposal=')[0];
assert.equal(/enrichLocalEmbeddedMetadata|synchronizeLocalMetadataCooperative|if\(deep\)/.test(editorSearch),false,'interactive search must never inspect local files');
