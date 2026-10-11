const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const p=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

const originalText=p('assets/motion/live-play-pause-lottiefiles.json');
const original=JSON.parse(originalText);
const sourceSha=crypto.createHash('sha256').update(originalText).digest('hex');
assert.equal(sourceSha,'905dc4f7a186facc6173b6e78375e7d8fd1cefd83c000c48cacf2dc351ef6300');
assert.equal(original.nm,'Play-Pause');
assert.equal(original.v,'5.5.1');
assert.equal(original.layers.length,3);
assert.deepEqual(original.layers.map(l=>l.nm),['Frame','Pause Outlines','Pause Outlines 2']);
assert.equal(original.w,1500);assert.equal(original.h,1500);
assert(original.op>67&&original.op<68);
const sourceLayers=original.layers.filter(l=>l.nm!=='Frame');
for(const [tone,rgba] of [
  ['ivory',[1,1,1,1]],
  ['navy',[24/255,44/255,41/255,1]],
]){
  const derived=JSON.parse(p('assets/motion/live-play-pause-'+tone+'.json'));
  assert.equal(derived.layers.length,2,'No duplicate outer circular frame');
  assert.deepEqual(derived.layers.map(l=>l.nm),sourceLayers.map(l=>l.nm));
  assert.deepEqual([derived.w,derived.h,derived.ip,derived.op,derived.fr],[original.w,original.h,original.ip,original.op,original.fr]);
  for(let i=0;i<derived.layers.length;i++){
    let a=JSON.parse(JSON.stringify(derived.layers[i]));
    for(const shape of a.shapes||[])for(const item of shape.it||[]){
      if(item.ty==='fl'||item.ty==='st') {
        assert.deepEqual(item.c.k,rgba,'Only approved theme tone changes');
        item.c.k=[0.026188491373,0.021800510556,0.023205497218,1];
      }
    }
    assert.deepEqual(a,sourceLayers[i],'Morph, timing, geometry and easing must match source');
  }
}
const morph=p('LivePlayerPlayPauseMorph.tsx');
assert.match(morph,/PAUSE_HOLD_FRAME=33/);
assert.match(morph,/PLAY_PAUSE_MORPH_MS=260/);
assert.match(morph,/PLAY_PAUSE_ART_SIZE=66/);
assert.match(morph,/useRef\(new Animated.Value\(playing\?PAUSE_HOLD_PROGRESS:0\)\)/);
assert.match(morph,/previous.current===playing/);
assert.match(morph,/return\(\)=>transition.stop\(\)/);
assert.match(morph,/loop=\{false\}/);
assert.match(morph,/autoPlay=\{false\}/);
assert.match(morph,/progress=\{progress\}/);
assert(!morph.includes('setInterval(')&&!morph.includes('repeat('),'No looping');
const app=p('App.tsx');
assert.match(app,/onPress=\{\(\)=>void togglePlayback\(\)\}/);
assert.match(app,/const targetPlaying=!playerMotionPlaying;/);
assert.match(app,/if\(targetPlaying\)player.play\(\)/);
assert.match(app,/playing=\{playerMotionPlaying\} active=\{appActive\}/);
assert.match(app,/reducedMotion=\{reduceMotion\}/);
assert.match(app,/!transportReady \? <ArchivistBookLoader/,'Keep existing loading behavior');
assert.match(app,/style=\{\(\{pressed\}\)=>\[styles.playButton/,'Preserve exact button geometry');
assert.equal((app.match(/<LivePlayerPlayPauseMorph/g)||[]).length,1,'Exactly one glyph instance in existing play button');
const book=p('LivingBookCanvas.tsx');
const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(book)+'\0').update(book).digest('hex');
assert.equal(blob,'3f2b6f2b91dbe77e71f65c02a8696b372d2126fd','Original inherited Living Book untouched');
console.log('PASS: approved source checksum, two colour variants, no second ring, bidirectional nonlooping morph, one button, book unchanged');
