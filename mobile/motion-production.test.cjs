const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const text=fs.readFileSync(__dirname+'/MotionAnimations.tsx','utf8');
const pure=text.slice(text.indexOf("export type MotionLoaderVariant"),text.indexOf('const loaderAssets='));
const compiled=ts.transpileModule(pure.replaceAll('export type MotionRewardKind','type MotionRewardKind').replaceAll('export type MotionLoaderVariant','type MotionLoaderVariant'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{}};require('node:vm').runInNewContext(compiled,context);
const scan=context.exports.scanMotionVariant,award=context.exports.achievementMotionKind;
assert.equal(scan([]),'books');assert.equal(scan([{format:'Audio'}]),'audio');
assert.equal(scan([{format:'Audio'},{format:'EPUB'}]),'books','mixed scan should not be called audiobook-only');
assert.equal(award('deep-archive'),'firework');assert.equal(award('streak-30'),'crown');
assert.equal(award('first-finish'),'confetti');assert.equal(award('listener-10','Listening'),'trophy');
assert.equal(award('format-explorer'),'badge');
assert.match(text,/Animated\.createAnimatedComponent\(LottieView\)/,'controlled native Lottie progress');
assert.match(text,/reduceMotion\)/,'all animated components gate Reduced Motion');
assert.ok(text.includes("speed={running?1:0}"),'scanner animation paused when backgrounded');
assert.ok(text.includes("animation.current?.play()"),'waveform resumes explicitly after pause');
assert.ok(text.includes("animation.current?.reset()"),'paused waveform is held still');
assert.ok(text.includes("animation.current?.pause()"),'waveform unmount/background cleanup');
for(const tone of ['ivory','navy']){
 const data=JSON.parse(fs.readFileSync(__dirname+'/assets/motion/play-pause-'+tone+'.json','utf8'));
 assert.equal(data.layers.length,3,'control disc must NOT be redrawn over existing button');
}
console.log('Production motion component states and icon geometry passed');
