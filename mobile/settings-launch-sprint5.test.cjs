const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.ok(source.includes('const brandedLaunchHoldMs=1600'),'branded launch hold must be long enough to be visible');
assert.ok(source.includes('const brandedLaunchFadeMs=380'),'branded launch must fade rather than disappear abruptly');
assert.ok(source.includes('launchSequenceStarted.current=true'),'launch sequence must be one-shot for the mounted app');
assert.ok(source.includes('requestAnimationFrame(()=>')&&source.includes('secondFrame=requestAnimationFrame(()=>'),'native splash must not hide until the branded React layer has had render frames');
assert.ok(source.includes('void SplashScreen.hideAsync()'),'native splash handoff is missing');
assert.ok(source.includes('brandLaunchVisible?<Animated.View'),'branded in-app launch layer is missing');
assert.ok(source.includes('<ArchivistLogo size={96}/>'),'launch layer must use canonical Archivist branding');
assert.ok(source.includes('AccessibilityInfo.isReduceMotionEnabled()'),'launch fade must respect Reduced Motion');
assert.equal(source.includes('nativeSplashMinimumMs'),false,'old timer-only splash implementation must be removed');
assert.equal(source.includes('nativeSplashStartedAt'),false,'old module-start splash timing must be removed');

assert.ok(source.includes('>DATA</Text>'),'Settings Data section is missing');
assert.equal(source.includes('>PRIVACY & DATA</Text>'),false,'Privacy & Data heading must be simplified to Data');
assert.equal(source.includes('>Local-first · private by default</Text>'),false,'privacy warning card must be removed');
assert.equal(source.includes('>External metadata network access</Text>'),false,'obsolete external metadata OFF row must be removed');
assert.equal(source.includes('>Local-first metadata</Text>'),false,'redundant local-first metadata paragraph must be removed');
assert.ok(source.includes('Back up reading history and app settings. Credentials are never included.'),'Data backup copy should remain concise and clear');

const refreshCount=(source.match(/>Refresh metadata & covers<\/Text>/g)||[]).length;
assert.equal(refreshCount,1,'Settings should expose one canonical metadata refresh action, not duplicates');

console.log('PASS: Sprint 5 Settings declutter and reliable branded cold-launch handoff are locked');
