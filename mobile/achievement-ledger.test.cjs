const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');

(async()=>{
  const source=fs.readFileSync(__dirname+'/achievementLedger.ts','utf8');
  const url='data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64');
  const x=await import(url);

  const achievements=[
    {id:'first-shelf',unlocked:true,progress:1,target:1},
    {id:'series-keeper',unlocked:true,progress:5,target:5},
    {id:'ten-finished',unlocked:false,progress:9,target:10},
  ];

  let ledger=x.emptyAchievementLedger();
  let result=x.reconcileAchievementLedger(achievements,ledger,{now:'2026-10-05T12:00:00Z',suppressNew:true});
  ledger=result.ledger;
  assert.equal(result.newlyEarned.length,0,'migration/bootstrap must never replay historical achievements');
  assert.equal(ledger.records['series-keeper'].earnedAt,'2026-10-05T12:00:00.000Z');
  assert.equal(ledger.records['series-keeper'].celebrationShownAt,'2026-10-05T12:00:00.000Z');

  result=x.reconcileAchievementLedger(achievements,ledger,{now:'2026-10-05T12:10:00Z'});
  assert.equal(result.changed,false,'recalculation must not recreate an earned achievement');
  assert.equal(x.pendingAchievementIds(achievements,ledger).length,0,'already-shown award must stay quiet after relaunch/recalc');

  const upgraded=[...achievements.slice(0,2),{id:'ten-finished',unlocked:true,progress:10,target:10}];
  result=x.reconcileAchievementLedger(upgraded,ledger,{now:'2026-10-05T13:00:00Z'});
  ledger=result.ledger;
  assert.deepEqual(result.newlyEarned,['ten-finished'],'only the genuinely new unlock should enter the celebration queue');
  assert.equal(ledger.records['ten-finished'].celebrationShownAt,undefined);

  const claim=x.claimAchievementCelebration(upgraded,ledger,'2026-10-05T13:00:01Z');
  ledger=claim.ledger;
  assert.equal(claim.id,'ten-finished');
  assert.equal(ledger.records['ten-finished'].celebrationShownAt,'2026-10-05T13:00:01.000Z');
  assert.equal(x.claimAchievementCelebration(upgraded,ledger,'2026-10-05T13:00:02Z').id,null,'claimed celebration must be exactly once');

  const restored=x.sanitizeAchievementLedger({version:1,records:{
    'series-keeper':{id:'series-keeper',earnedAt:'2026-10-01T09:00:00Z',celebrationShownAt:'2026-10-01T09:00:02Z'},
    'ten-finished':{id:'ten-finished',earnedAt:'2026-10-05T12:59:59Z'},
  }});
  const merged=x.mergeAchievementLedgers(ledger,restored);
  assert.ok(merged.records['series-keeper'].celebrationShownAt,'backup restore must retain shown state');
  assert.ok(merged.records['ten-finished'].celebrationShownAt,'restoring an older unshown record must not erase a local shown timestamp');

  const firstOnly=x.reconcileAchievementLedger([{id:'first-shelf',unlocked:true}],x.emptyAchievementLedger(),{now:'2026-10-05T14:00:00Z'});
  assert.equal(firstOnly.ledger.records['first-shelf'].celebrationShownAt,'2026-10-05T14:00:00.000Z','first shelf remains handled by its separate onboarding celebration');

  console.log('PASS: achievement ledger makes Series Keeper and every reward celebration durable and exactly-once');
})().catch(error=>{console.error(error);process.exitCode=1;});
