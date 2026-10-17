'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ivory=require('./assets/motion/live-play-pause-ivory.json');
const navy=require('./assets/motion/live-play-pause-navy.json');
const motion=fs.readFileSync(path.join(__dirname,'LivePlayerPlayPauseMorph.tsx'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');

// Source-derived optical geometry test. Test the original Lottie paths, not a
// screenshot, guessed viewBox or text-only presence of a magic offset.
function at(property,frame){
  if(property.a!==1)return property.k;
  let key=property.k[0];
  for(const next of property.k){if(next.t>frame)break;key=next;}
  return key.s;
}
function bounds(lottie,frame){
  const xs=[],ys=[];
  for(const layer of lottie.layers){
    const group=layer.shapes.find(s=>s.ty==='gr');
    const shape=group.it.find(s=>s.ty==='sh');
    const transform=group.it.find(s=>s.ty==='tr');
    assert(shape&&transform,'Every original glyph layer must have one outline and transform');
    const outline=at(shape.ks,frame)[0];
    const position=at(layer.ks.p,frame),anchor=at(layer.ks.a,frame);
    const degrees=at(layer.ks.r,frame),rad=degrees*Math.PI/180;
    const groupPos=at(transform.p,frame),groupAnchor=at(transform.a,frame);
    for(let i=0;i<outline.v.length;i++){
      const j=(i+1)%outline.v.length;
      const p=outline.v[i],next=outline.v[j],out=outline.o[i],inn=outline.i[j];
      for(let sample=0;sample<=32;sample++){
        const t=sample/32,u=1-t;
        const x=u*u*u*p[0]+3*u*u*t*(p[0]+out[0])+3*u*t*t*(next[0]+inn[0])+t*t*t*next[0];
        const y=u*u*u*p[1]+3*u*u*t*(p[1]+out[1])+3*u*t*t*(next[1]+inn[1])+t*t*t*next[1];
        const lx=x+groupPos[0]-groupAnchor[0]-anchor[0];
        const ly=y+groupPos[1]-groupAnchor[1]-anchor[1];
        xs.push(position[0]+lx*Math.cos(rad)-ly*Math.sin(rad));
        ys.push(position[1]+lx*Math.sin(rad)+ly*Math.cos(rad));
      }
    }
  }
  return {x:(Math.min(...xs)+Math.max(...xs))/2,
    y:(Math.min(...ys)+Math.max(...ys))/2};
}
function offset(x){return (750-x)*66/1500;}
function constant(name){
  const match=motion.match(new RegExp('export const '+name+'=([0-9.]+);'));
  assert(match,'Missing source-measured registration constant '+name);
  return Number(match[1]);
}
assert.equal(ivory.w,1500);assert.equal(ivory.h,1500);
assert.equal(navy.w,1500);assert.equal(navy.h,1500);
const play=bounds(ivory,0),pause=bounds(ivory,33);
assert.deepEqual(bounds(navy,0),play,'Dark art must have identical geometric silhouettes');
assert.deepEqual(bounds(navy,33),pause,'Dark Pause art must have identical silhouettes');
for(const [frame,centre,expectedX] of [
  [0,play,constant('PLAY_PAUSE_VISIBLE_OFFSET_X_PLAY')],
  [33,pause,constant('PLAY_PAUSE_VISIBLE_OFFSET_X_PAUSE')],
]){
  assert(Math.abs(offset(centre.x)-expectedX)<0.15,
    'Frame '+frame+' must centre the actual visible source outlines to 0.15dp');
  assert(Math.abs(offset(centre.y)-constant('PLAY_PAUSE_VISIBLE_OFFSET_Y'))<0.15,
    'Frame '+frame+' vertical glyph centring must remain within 0.15dp');
}
assert.notEqual(constant('PLAY_PAUSE_VISIBLE_OFFSET_X_PLAY'),
  constant('PLAY_PAUSE_VISIBLE_OFFSET_X_PAUSE'),'Play and Pause have distinct original optical centres');
assert(motion.includes("inputRange:[0,PAUSE_HOLD_PROGRESS]")&&
  motion.includes("outputRange:[PLAY_PAUSE_VISIBLE_OFFSET_X_PLAY,PLAY_PAUSE_VISIBLE_OFFSET_X_PAUSE]")&&
  motion.includes("transform:[{translateX:artOffsetX},{translateY:PLAY_PAUSE_VISIBLE_OFFSET_Y}]"),
  'Art-only offset must animate in sync with the unchanged original morph');
assert(motion.includes('useNativeDriver:false')&&
  motion.includes('progress={progress}')&&
  motion.includes('PAUSE_HOLD_FRAME=33'),'Same single bidirectional original 67-frame animation');
assert(app.includes('playButton: {width:80,height:80,'),
  'The approved 80dp control is not changed by correcting Lottie registration');
console.log('PASS: vector-measured Play/Pause optical centres match both original Lotties, animation and approved button size remain intact');
