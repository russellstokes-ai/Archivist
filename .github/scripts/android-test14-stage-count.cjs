#!/usr/bin/env node
// Use the *historical Test 14 source code*, not the current Test23 grouping
// algorithm, to count actual Android-discovered SQLite records.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const stage=process.argv[2],sourceRoot=process.argv[3],out=process.argv[4];
if(!stage||!sourceRoot||!out)throw Error('Usage: node android-test14-stage-count.cjs <stage-json> <test14-source> <out>');
const typeScript=require('/tmp/archivist-qa-ts/node_modules/typescript');
require.extensions['.ts']=(module,file)=>module._compile(typeScript.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:typeScript.ModuleKind.CommonJS,target:typeScript.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText,file);
const assets=JSON.parse(fs.readFileSync(stage,'utf8'));
const {groupLocalWorks}=require(path.resolve(sourceRoot,'mobile/localWorks.ts'));
const {audioWorkGroupKeys}=require(path.resolve(sourceRoot,'mobile/metadataSync.ts'));
const {partitionLocalBooksByPublication}=require(path.resolve(sourceRoot,'mobile/publicationPipeline.ts'));
const works=groupLocalWorks(assets);
const publication=partitionLocalBooksByPublication(assets);
const keys=audioWorkGroupKeys(assets);
const identities={directory:0,root:0,album:0,singleFile:0,seriesFile:0};
const unique=new Set(keys.values());
for(const id of unique){
  if(id.startsWith('audio-dir:'))identities.directory++;
  else if(id.startsWith('audio-root:'))identities.root++;
  else if(id.startsWith('audio-album:'))identities.album++;
  else if(id.startsWith('audio-series-file:'))identities.seriesFile++;
  else identities.singleFile++;
}
const sizes=works.map(w=>w.files).sort((a,b)=>a-b);
const output={
  physical_files:assets.length,
  logical_works:works.length,
  audio_works:works.filter(w=>w.format==='Audio').length,
  review_works:works.filter(w=>w.needsReview).length,
  publication_ready_works:groupLocalWorks(publication.published).length,
  publication_blocked_works:groupLocalWorks(publication.staged).length,
  work_identity_categories:identities,
  single_track_work_count:sizes.filter(n=>n===1).length,
  track_counts_per_work:sizes,
  source_version:'Test14 mobile/localWorks.ts and metadataSync.ts at exact released commit',
};
fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n');
console.log('REAL_TEST14_GROUPING_RESULT '+JSON.stringify(output));
