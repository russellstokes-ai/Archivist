const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
function load(){
  const src=fs.readFileSync(__dirname+'/scanLifecycle.ts','utf8');
  const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod={exports:{}};vm.runInNewContext('(function(module,exports){'+out+'\n})(module,module.exports)',{module:mod,exports:mod.exports});return mod.exports;
}
const {ScanCommitGate,scanStatusCopy,scanFailureCopy}=load();
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
console.log('PASS: scan generation, stable catalogue messaging and failure recovery');
