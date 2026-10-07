const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
function load(){
  const src=fs.readFileSync(__dirname+'/scanLifecycle.ts','utf8');
  const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod={exports:{}};vm.runInNewContext('(function(module,exports){'+out+'\n})(module,module.exports)',{module:mod,exports:mod.exports});return mod.exports;
}
const {ScanCommitGate,scanStatusCopy,scanFailureCopy,sanitizeLibraryPreparationCheckpoint,beginLibraryPreparation,markLibraryDiscoveryCommitted,cancelLibraryPreparation,completeLibraryPreparation,shouldResumeLibraryPreparation}=load();
const gate=new ScanCommitGate();
const first=gate.begin();assert.equal(gate.isCurrent(first),true);
const second=gate.begin();assert.equal(gate.isCurrent(first),false,'older scan must become stale');assert.equal(gate.isCurrent(second),true);
const refreshing=scanStatusCopy({phase:'reading-metadata',currentFolder:'Audiobooks',entriesVisited:80,found:22,review:3,publishedCount:120});
assert.equal(refreshing.title,'Refreshing your library');
assert.match(refreshing.detail,/current 120 items remain available/);
const initial=scanStatusCopy({phase:'discovering',currentFolder:'Comics',entriesVisited:12,found:4,review:1,publishedCount:0});
assert.equal(initial.title,'Building your library');
assert.match(initial.detail,/appear together when this scan is complete/);
assert.match(scanFailureCopy(true),/existing library is unchanged/);
assert.match(scanFailureCopy(false),/folder is still saved/);

const restoredLegacy=sanitizeLibraryPreparationCheckpoint({signature:'folders-a',completedAt:'2026-10-07T20:00:00Z'});
assert.equal(restoredLegacy.signature,'folders-a');
assert.equal(restoredLegacy.activeJob,undefined,'legacy prepared state must restore without inventing a scan job');

const refreshing=beginLibraryPreparation(restoredLegacy,{kind:'refresh',signature:'folders-a',startedAt:'2026-10-07T21:00:00Z'});
assert.equal(refreshing.signature,'folders-a','starting a refresh must not clear the last completed preparation');
assert.equal(refreshing.activeJob.phase,'discovery');
assert.equal(shouldResumeLibraryPreparation(refreshing,'folders-a'),true,'only explicit durable job intent may resume after restart');

const discovered=markLibraryDiscoveryCommitted(refreshing);
assert.equal(discovered.activeJob.phase,'enrichment','a durably committed discovery stage must be distinguishable from transient UI progress');

const cancelled=cancelLibraryPreparation(discovered);
assert.equal(cancelled.signature,'folders-a','cancelling enrichment must preserve the last completed preparation');
assert.equal(cancelled.activeJob,undefined,'explicit cancellation must not auto-resume on restart');
assert.equal(shouldResumeLibraryPreparation(cancelled,'folders-a'),false);

const initial=beginLibraryPreparation({signature:''},{kind:'prepare',signature:'folders-b',startedAt:'2026-10-07T21:05:00Z'});
assert.equal(initial.signature,'','initial preparation is not complete merely because a job started');
assert.equal(shouldResumeLibraryPreparation(initial,'folders-b'),true);
assert.equal(shouldResumeLibraryPreparation(initial,'different-folders'),false,'changed folder configuration must never resume a stale job');
const complete=completeLibraryPreparation(markLibraryDiscoveryCommitted(initial),'folders-b','2026-10-07T21:06:00Z');
assert.equal(complete.signature,'folders-b');
assert.equal(complete.activeJob,undefined);
assert.equal(complete.completedAt,'2026-10-07T21:06:00Z');
assert.equal(shouldResumeLibraryPreparation(complete,'folders-b'),false);
console.log('PASS: scan generation, stable catalogue messaging and failure recovery');
