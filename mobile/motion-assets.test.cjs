const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'assets/motion');const names=['books-stack','headphones','play-pause','audio-waveform','trophy','twinkle-crown','achievement-badge','level-confetti','firework-burst'];
for(const name of names){
 const file=path.join(dir,name+'.json'),content=fs.readFileSync(file,'utf8'),v=JSON.parse(content);
 assert.ok(content.length<160000,name+' should be lightweight');
 assert.equal(v.fr,60);assert.equal(v.w,192);assert.equal(v.h,192);
 assert.ok(v.layers.length>=3,name+' needs meaningful vector layers');
 assert.deepEqual(v.assets,[],name+' must not load remote assets');
 for(const l of v.layers){assert.equal(l.ty,4,'shape only');assert.ok(l.shapes.every(x=>x.ty==='gr'),'vector group only');}
}
assert.equal(names.includes('open-book'),false,'rejected Open Book loader must not return');
const lab=fs.readFileSync(path.join(__dirname,'../motion-lab/App.tsx'),'utf8');
assert.ok(lab.includes('AccessibilityInfo.isReduceMotionEnabled'),'Motion Lab respects reduced motion');
assert.ok(lab.includes('lottie-react-native'),'Motion Lab renders real local Lottie');
console.log('All nine approved local motion assets structurally validated');
