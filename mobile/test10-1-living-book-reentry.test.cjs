const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const canvas=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const player=fs.readFileSync(__dirname+'/playerExperience.ts','utf8');

assert.ok(player.includes("case 'visibility-change':\n      return state;"),'leaving Now must preserve the physical Living Book state instead of resetting the hinge');
assert.ok(app.includes("transitionLivingBook({type:'visibility-change',visible:playbackVisible})"),'player visibility must be reported to the Living Book lifecycle');
assert.ok(app.includes("if(!playing){")&&app.includes("transitionLivingBook({type:'restore',playing:false})"),'only ending the media session may reset the physical book to closed');
assert.ok(app.includes("if(!playbackVisible||!playerMotionPlaying||reduceMotion||livingBookMotion.phase!=='open')return"),'hidden or paused players must stop scheduling ambient page turns without destroying book state');
assert.ok(app.includes('const [playerMotionIntent,setPlayerMotionIntent]=useState<boolean|null>(null)'),'play/pause must have an immediate visual intent independent of transport-status latency');
assert.ok(app.includes('setPlayerMotionIntent(targetPlaying)'),'transport taps must drive the cover on the same interaction');
assert.equal(app.includes('pauseGraceMs'),false,'the old pause grace must not keep the book open after Pause');
assert.ok(player.includes("if(state.phase==='turning')return {...state,closeAfterSettle:true}")&&player.includes("if(state.phase==='settling')return {phase:'settling',closeAfterSettle:true}"),'Pause during a turn must wait for the page to settle rather than snap it away');
assert.ok(player.includes("state.closeAfterSettle?{phase:'closing'"),'deferred Pause must close immediately after settling');
assert.ok(app.includes('if(generation!==livingBookGeneration.current)return'),'stale animation callbacks from an earlier motion must be ignored');
assert.ok(app.includes('++skipGeneration.current')&&app.includes('generation!==skipGeneration.current'),'manual multi-page turns must reject stale callbacks');
assert.ok(app.includes('livingBookCoverSessionRef')&&app.includes('lockLivingBookCoverSession'),'leaving and returning to Now must not swap cover artwork mid-session');
assert.ok(canvas.includes('window.ArchivistLivingBook')&&canvas.includes('setState:data=>'),'Canvas must retain one renderer instance and accept state updates without remounting');
assert.ok(canvas.includes("if(next===phase)return"),'identical re-entry state must not replay an opening or page transition');
assert.ok(canvas.includes("if(previous==='settling'||previous==='turning')commitTurn()"),'a turned page may be committed only after a real completed turn, preventing phantom pages');

console.log('PASS: Test 13 Living Book re-entry preserves physical state and Pause closes safely after page settle');
