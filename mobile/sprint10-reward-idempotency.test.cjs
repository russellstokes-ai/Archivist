const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const ledger=fs.readFileSync(__dirname+'/achievementLedger.ts','utf8');

assert.ok(app.includes("const achievementLedgerKey = 'archivist.achievementLedger.v1'"),'reward state must be durable');
assert.equal(app.includes('achievementBaseline'),false,'transient in-memory baseline must be removed');
assert.ok(app.includes('getPersistedJSON<AchievementLedger>(achievementLedgerKey)'),'reward ledger must restore before evaluating unlocks');
assert.ok(app.includes('achievementLedgerBootstrapRef.current=!value'),'first upgrade to the ledger must seed historical unlocks without replaying them');
assert.ok(app.includes('reconcileAchievementLedger(achievements,achievementLedgerRef.current,{suppressNew:suppress})'),'every recalculation must reconcile by durable achievement identity');
assert.ok(app.includes('claimAchievementCelebration(achievements,achievementLedgerRef.current)'),'celebration must be durably claimed before UI display');
assert.ok(app.includes('await setPersistedJSON(achievementLedgerKey,claimed.ledger)'),'shown state must be persisted before the animation is presented');
assert.ok(app.includes('if(achievementCelebrationRef.current)return'),'only one reward celebration may be active at a time');
assert.ok(app.includes('achievementLedger:achievementLedgerRef.current'),'backup must include reward history');
assert.ok(app.includes('mergeAchievementLedgers(achievementLedgerRef.current,sanitizeAchievementLedger(raw.achievementLedger))'),'restore must merge rather than rewind shown awards');
assert.ok(app.includes('rewardRestoreGuard.current=true')&&app.includes('rewardRestoreReleaseRequested.current=true'),'backup restore must suppress false unlock notifications until restored stats settle');
assert.ok(ledger.includes('earnedAt:string')&&ledger.includes('celebrationShownAt?:string'),'each earned reward must retain durable earned/shown timestamps');
assert.ok(ledger.includes("suppressIds||['first-shelf']"),'first-library onboarding celebration must remain separate');
assert.ok(ledger.includes('if(ledger.records[id])continue'),'relaunch, scan and recalculation must never recreate an existing award identity');

console.log('PASS: Test 10 Sprint 5 reward/notification idempotency is durably locked');
