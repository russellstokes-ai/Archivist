const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {achievementsFor,clampProgress} = require('./profileStats.ts');

const base = {
  name:'Local library',owner:true,works:1,formats:1,series:0,
  startedAudio:0,completedAudio:0,inProgressAudio:0,
  startedReading:0,completedReading:0,inProgressReading:0,
  inProgress:0,completed:0,
};
let achievements=achievementsFor(base);
assert.equal(achievements.find(a=>a.id==='first-shelf').unlocked,true);
assert.equal(achievements.find(a=>a.id==='first-finish').unlocked,false);

achievements=achievementsFor({...base,works:1000,formats:3,series:5,completed:10});
for(const id of ['first-shelf','format-explorer','series-keeper','first-finish','ten-finished','curator','deep-archive']){
  assert.equal(achievements.find(a=>a.id===id).unlocked,true,id);
}
assert.equal(clampProgress(5,10),0.5);
assert.equal(clampProgress(20,10),1);
assert.equal(clampProgress(-1,10),0);

console.log('PASS: Profile achievements derive only from verified statistics');
