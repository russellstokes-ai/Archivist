const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const artwork=fs.readFileSync(__dirname+'/LivingBookArtwork.tsx','utf8');

assert.ok(app.includes("if(!playbackVisible){"),'leaving Now must have an explicit Living Book lifecycle boundary');
assert.ok(app.includes('useLayoutEffect(()=>{')&&app.includes('const livingBookMotionGeneration=useRef(0)'),'Living Book reset must occur in the layout phase before a stale native frame can paint');
assert.ok(app.includes('bookOpenAnim.stopAnimation();')&&app.includes('bookOpenAnim.setValue(0);'),'hidden player must abandon and reset any partial hinge frame');
assert.ok(app.includes('bookOpenProgressRef.current=0;'),'hidden player must reset the tracked native hinge position too');
assert.ok(app.includes('pageTurnAnim.stopAnimation();')&&app.includes('pageTurnAnim.setValue(0);'),'hidden player must discard an in-flight ambient page');
assert.ok(app.includes('skipTurnAnim.stopAnimation();')&&app.includes('skipTurnAnim.setValue(0);')&&app.includes('setSkipTurning(false);'),'hidden player must discard skip-page layers');
assert.ok(app.includes('const livingBookMotionGeneration=useRef(0)'),'Living Book transitions must identify the current visible session');
assert.ok(app.includes("const livingBookVisualWorkRef=useRef('')")&&app.includes('const livingBookWorkKey=playbackWorkKey(playing)'),'visual state must track the logical audiobook, not individual chapter files');
assert.ok(app.includes('if(workChanged)')&&app.includes("livingBookVisualWorkRef.current=livingBookWorkKey"),'switching audiobooks must reset the old cover/leaf frame without reopening on ordinary chapter changes');
assert.ok(app.includes("key={workKey||'living-book'}"),'each logical audiobook must own a fresh Living Book renderer while chapter changes keep the same work key');
assert.ok(app.includes('++skipGeneration.current')&&app.includes('ambientPageLoopStopRef.current=null'),'leaving or changing books must invalidate stale manual and ambient page callbacks');
assert.ok(app.includes('generation!==livingBookMotionGeneration.current'),'stale animation callbacks from the previous screen session must be ignored');
assert.ok(app.includes('preserveCurrentOnStop:false'),'page turn cancellation must not preserve a phantom leaf across player lifecycle changes');
assert.ok(app.includes("const ambientPageLoopStopRef=useRef<(()=>void)|null>(null)")&&app.includes('ambientPageLoopStopRef.current?.();'),'manual skip must take exclusive ownership from the ambient page loop');
assert.ok(app.includes("bookOpenProgressRef.current<.95"),'manual page skips must not animate beside a partially opened cover');
assert.ok(app.includes('setAmbientPageLoopEpoch(value=>value+1)'),'ambient turning must restart from a fresh schedule only after a manual skip completes');
assert.ok(app.includes("if(!playbackVisible||!playbackIsPlaying||reduceMotion)")&&app.includes('pageTurnAnim.stopAnimation();pageTurnAnim.setValue(0);'),'Pause must stop ambient paper immediately even while the cover-close grace remains active');
assert.ok(app.includes('if(playerVisualPlaying&&bookOpenProgressRef.current>=.95)setAmbientPageLoopEpoch(value=>value+1)'),'rapid Pause→Play must restart a fresh ambient schedule instead of resuming a stopped leaf');

const visibleReset=app.indexOf('// Every visible player session starts with a clean page layer.');
const timing=app.indexOf('Animated.timing(bookOpenAnim,{',visibleReset);
const pageReset=app.indexOf('pageTurnAnim.setValue(0);',visibleReset);
assert.ok(visibleReset>=0&&pageReset>visibleReset&&pageReset<timing,'returning to Now must clear leaf state before the cover starts opening');

assert.ok(artwork.includes('const turnOpacity=Animated.multiply(')&&artwork.includes('leafGate'),'turning leaf visibility must remain gated by the cover hinge');
assert.ok(artwork.includes("inputRange:[0,.04,.94,1],outputRange:[0,1,1,0]"),'a reset turn value must render no ambient leaf before the first real page turn');
assert.ok(artwork.includes('leafFrontFace')&&artwork.includes('leafBackFace'),'turning paper must have explicit front and back faces rather than a mirrored visible backface');
assert.equal(artwork.includes("backfaceVisibility:'visible'"),false,'turning pages must never expose a mirrored native backface');

console.log('PASS: Test 10.1 Living Book re-entry starts clean with no phantom page or stale hinge frame');
