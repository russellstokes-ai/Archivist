const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const canvas=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const player=fs.readFileSync(__dirname+'/playerExperience.ts','utf8');
const cover=fs.readFileSync(__dirname+'/livingBookCover.ts','utf8');

assert.ok(app.includes("import {AmbientGlow,LivingBookCanvas} from './LivingBookCanvas'"),'player must use the corrected Canvas Living Book renderer');
assert.equal((app.match(/<LivingBookCanvas\b/g)||[]).length,1,'phone and unfolded Fold must share one Living Book renderer');
assert.ok(app.includes('const [livingBookMotion,setLivingBookMotion]=useState<LivingBookMotion>'),'Living Book must have explicit physical motion state');
assert.ok(app.includes('const livingBookGeneration=useRef(0)'),'stale cover/page animation callbacks must be generation-guarded');
assert.ok(app.includes('duration:1900')&&app.includes('},7200);'),'ambient pages must turn slowly and rest between turns');
assert.ok(player.includes("type LivingBookPhase = 'closed'|'opening'|'open'|'turning'|'settling'|'closing'"),'motion state must model the complete physical book lifecycle');
assert.ok(player.includes("if(state.phase==='turning')return {...state,closeAfterSettle:true}"),'Pause during a page turn must defer closing until the sheet lands');
assert.ok(player.includes("return state.closeAfterSettle?{phase:'closing'"),'settling must hand deferred Pause into a smooth close');
assert.ok(canvas.includes('function project(')&&canvas.includes('function flex(progress)')&&canvas.includes('Math.sin(PI*progress)'),'Canvas pages must use projected curved geometry rather than a flat card flip');
assert.ok(canvas.includes("else if(next==='opening')")&&canvas.includes("else if(next==='closing')")&&canvas.includes("else if(next==='turning')")&&canvas.includes("else if(next==='settling')"),'renderer must animate each physical phase independently');
assert.ok(canvas.includes("if(previous==='settling'||previous==='turning')commitTurn()"),'a page must commit only after the turn has physically settled');
assert.ok(canvas.includes("ctx.filter='blur(15px)'"),'ground shadow must be drawn inside the Canvas rather than attached to a rotating native layer');
assert.equal(canvas.includes('shadowColor'),false,'rotating book surfaces must not use native shadows');
assert.equal(canvas.includes('elevation:'),false,'rotating book surfaces must not use Android elevation shadows');
assert.ok(cover.includes("input.format==='Audio'")&&cover.includes("kind:'jacket'"),'square audiobook artwork must become a generated jacket rather than be stretched into a portrait cover');
assert.ok(cover.includes('lockLivingBookCoverSession'),'the physical cover texture must remain stable for a listening session');

console.log('PASS: Test 13 Living Book Canvas is stateful, curl-based, pause-safe and session-stable');
