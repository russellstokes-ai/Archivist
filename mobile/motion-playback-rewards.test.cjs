const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'motion/rewardMotion.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};vm.runInNewContext(compiled,{module:mod,exports:mod.exports});
const choose=mod.exports.rewardAnimationForTitle;
for(const [title,kind] of [['First shelf','badge'],['Format explorer','twinkle-crown'],['Deep archive','firework-burst'],['Curator','trophy'],['Ten finished','level-up-confetti']])assert.equal(choose(title),kind);
const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');
assert(app.includes('kind="pause-play"')&&app.includes('kind="audio-waveform"'));
assert(app.includes('rewardAnimationForTitle(achievementCelebration.title)'));
for(const tone of ['light','dark']){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/motion/pause-play-'+tone+'-glyph.json'),'utf8'));
 assert.deepEqual(data.layers.map(l=>l.nm),['play triangle','pause left','pause right']);
}
console.log('PASS: playback icons and reward asset selection are visual only');
