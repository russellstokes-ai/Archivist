const assert=require('node:assert/strict'),fs=require('fs'),crypto=require('crypto');
const originalText=fs.readFileSync(__dirname+'/assets/motion/rewards/badge-original.json','utf8');
const variantText=fs.readFileSync(__dirname+'/assets/motion/rewards/badge-gold-variant.json','utf8');
assert.equal(crypto.createHash('sha256').update(originalText).digest('hex'),
 'cff72e0202982a1503bdba29b500a3fa072b463992203dc9385bd6201140adba',
 'Original approved badge source must NEVER be mutated');
const gold=JSON.parse(variantText),original=JSON.parse(originalText);
assert.deepEqual(original.layers[2].shapes[1].it[1].c.k,[1,1,1,1],
 'Badge original genuinely contains an all-white medallion fill');
assert.deepEqual(gold.layers[2].shapes[1].it[1].c.k,
 [185/255,154/255,104/255,1],
 'Single approved badge medallion fill is Archivist gold #B99A68');
gold.layers[2].shapes[1].it[1].c.k=[1,1,1,1];
assert.deepEqual(gold,original,
 'All original paths, transforms, timing, keyframes, frame count, shapes and opacity MUST remain identical');
const overlay=fs.readFileSync(__dirname+'/AchievementRewardOverlay.tsx','utf8');
assert(overlay.includes("badge:require('./assets/motion/rewards/badge-gold-variant.json')"));
assert(overlay.includes("loop={false}")&&overlay.includes('speed={1}'));
for(const other of ['books-stack','headphones','trophy','crown','level-confetti']){
 const file=other==='books-stack'?'books-stack-original.json':other+'-original.json';
 assert(overlay.includes("'./assets/motion/rewards/"+file+"'"),
   'Other approved animation sources remain unchanged: '+other);
}
assert(overlay.includes('onAnimationFinish={(cancelled)=>{if(!cancelled)setMainFinished(true)}'));
console.log('PASS: only white badge medallion recoloured to branded gold; source Lotties and animation behaviour untouched');
