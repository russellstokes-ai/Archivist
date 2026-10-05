const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const artwork=fs.readFileSync(__dirname+'/LivingBookArtwork.tsx','utf8');
const geometry=fs.readFileSync(__dirname+'/livingBookGeometry.ts','utf8');
const loop=fs.readFileSync(__dirname+'/pageTurnLoop.ts','utf8');

assert.ok(app.includes('const bookOpenProgressRef=useRef(0)'),'player must remember the current normalized hinge position');
assert.ok(app.includes("bookOpenAnim.addListener(({value})=>{bookOpenProgressRef.current=value;})"),'hinge state must track the live native animation value');
assert.ok(app.includes('livingBookHingeDuration(current,target,baseDuration,reduceMotion)'),'rapid play/pause reversals must animate only the remaining hinge travel');
assert.ok(app.includes('preserveCurrentOnStop:false'),'player lifecycle changes must stop abandoned page turns instead of preserving phantom leaves');
assert.ok(app.includes("if(!playbackVisible)")&&app.includes('bookOpenAnim.setValue(0)')&&app.includes('bookOpenProgressRef.current=0')&&app.includes('pageTurnAnim.setValue(0)'),'leaving the Live Player must normalise hinge and page state before re-entry');
assert.ok(app.includes('const livingBookMotionGeneration=useRef(0)'),'stale native animation callbacks must be generation-guarded');
assert.ok(app.includes('useLayoutEffect(()=>{'),'Living Book visual resets must run before the first returned-player frame paints');
assert.ok(app.includes("const livingBookVisualWorkRef=useRef('')")&&app.includes('const livingBookWorkKey=playbackWorkKey(playing)'),'animation state must be scoped to a logical audiobook rather than leaking between titles');
assert.ok(app.includes('generation!==livingBookMotionGeneration.current'),'abandoned Living Book callbacks must never mutate a new visible session');
assert.ok(app.includes("if(finished&&target===0)")&&app.includes('pageTurnAnim.setValue(0)'),'visible pause must still end in a clean closed state');
assert.ok(loop.includes('preserveCurrentOnStop?:boolean')&&loop.includes('if(!input.preserveCurrentOnStop)input.stop()'),'ambient loop must support deterministic cancellation for player lifecycle changes');

assert.ok(artwork.includes('baseSpread')&&artwork.includes('leafEnvelope'),'static book layers and turning leaves must use separate clipping domains');
assert.ok(artwork.includes("overflow:'visible'")&&artwork.includes('leafEnvelopePad'),'turning pages must have an oversized visible animation envelope');
assert.ok(artwork.includes('coverFrontFace')&&artwork.includes('coverInsideFace'),'cover must remain visually continuous across the 90-degree hinge crossing');
assert.ok(artwork.includes('leafFrontFace')&&artwork.includes('leafBackFace'),'turning pages must have explicit front/back paper faces across the 90-degree crossing');
assert.equal(artwork.includes("backfaceVisibility:'visible'"),false,'native mirrored page backfaces must never be used');
assert.ok(artwork.includes('const leafGate=open.interpolate'),'page visibility must derive from the same normalized book hinge');
assert.ok(artwork.includes('groundShadow')&&artwork.includes("transformOrigin:'right center'"),'shadow must be anchored to the visible footprint');
assert.equal(artwork.includes('shadowColor'),false,'rotating book layers must not use native shadows');
assert.equal(artwork.includes('elevation:'),false,'rotating book layers must not use Android elevation shadows');
assert.ok(artwork.includes('leftPageAngle=open.interpolate')&&artwork.includes('coverAngle=open.interpolate'),'cover and page geometry must derive from one hinge value');
assert.ok(geometry.includes('leafRevealStart:0.88')&&geometry.includes('leafRevealEnd:0.97'),'turning leaves must disappear before close-edge rendering becomes visible');
assert.ok(geometry.includes('leafEnvelopePad:18'),'turn envelope must protect page perspective from top/edge clipping');
assert.ok(geometry.includes('spineOverlap:3')&&geometry.includes('gutterWidth:14'),'open pages must overlap beneath a narrow rendered gutter instead of exposing a centre gap');
assert.ok(artwork.includes('spinePaperBridge')&&artwork.includes('gutterCrease'),'a continuous paper bridge and crease must cover the physical spine');

const livingBookUsages=(app.match(/<LivingBookArtwork\b/g)||[]).length;
assert.equal(livingBookUsages,1,'phone and unfolded Fold must share one Living Book renderer rather than divergent implementations');

console.log('PASS: Test 10 Sprint 2 Living Book engine is single-hinge, unclipped, shadow-safe and reversal-safe');
