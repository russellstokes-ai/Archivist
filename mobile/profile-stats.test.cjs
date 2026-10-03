const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {achievementsFor,clampProgress,progressionFor,levelFromXp} = require('./profileStats.ts');

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
const emptyProgression=progressionFor(base);
assert.equal(emptyProgression.overall.level>=1,true);
assert.equal(emptyProgression.paths.Reading.level,1);
assert.equal(emptyProgression.paths.Listening.level,1);
assert.equal(levelFromXp(0).progress,0);
const activeProgression=progressionFor({...base,works:400,series:24,formats:4,startedReading:45,completedReading:30,startedAudio:20,completedAudio:12,rated:40,favourites:25,bestStreak:60,activeDays:180});
assert.equal(activeProgression.overall.level>emptyProgression.overall.level,true);
assert.equal(activeProgression.paths.Reading.level>1,true);
assert.equal(activeProgression.paths.Listening.level>1,true);
assert.equal(activeProgression.paths.Library.level>1,true);
assert.equal(activeProgression.paths.Ritual.level>1,true);
assert.equal(activeProgression.overall.progress>=0&&activeProgression.overall.progress<=1,true);
console.log('PASS: Archivist levels and four progression paths derive from verified statistics');
const {streakStats,localDay}=require('./profileStats.ts');
assert.equal(new Set(achievementsFor(base).map(a=>a.id)).size,achievementsFor(base).length);
assert.equal(achievementsFor(base).length,143);
assert.equal(achievementsFor({...base,bestStreak:7}).find(a=>a.id==='streak-7').unlocked,true);
assert.deepEqual(streakStats({'2026-03-28':60,'2026-03-29':60,'2026-03-30':60},'2026-03-30'),{bestStreak:3,currentStreak:3,activeDays:3,todaySeconds:60});
assert.equal(streakStats({'2026-12-31':60,'2027-01-01':60},'2027-01-02').currentStreak,2);
assert.equal(streakStats({'2026-01-01':60,'2026-01-02':60},'2026-01-04').currentStreak,0);
assert.equal(streakStats({'2026-01-01':59,'2026-01-02':60,'2026-01-03':60},'2026-01-02').activeDays,1);
assert.equal(streakStats({'2026-01-01':60,'2026-01-03':60},'2026-01-03').bestStreak,1);
assert.equal(localDay(new Date(2026,0,2,23,59)),'2026-01-02');
console.log('PASS: Daily ritual calendar boundaries, minimum activity, gaps and award identities');

assert.equal(achievementsFor({...base,formats:4,completedAudio:1,completedReading:1}).find(a=>a.id==='balance-2').unlocked,true);
assert.equal(achievementsFor({...base,formats:4,completedAudio:1}).find(a=>a.id==='balance-2').unlocked,false);
