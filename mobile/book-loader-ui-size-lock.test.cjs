const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/BookLoader.tsx','utf8');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');

// UI LOCK: only responsive size adjustment for the existing user-selected
// Book Loader animation, not new colours, animation frames or screen layout.
assert.match(source,/size=30, accessibilityLabel='Loading'/,
 'default loader should be modestly larger than the old 24-point version');
assert.match(source,/autoPlay=\{!reduceMotion\}/);
assert.match(source,/loop=\{!reduceMotion\}/);
assert.match(source,/progress=\{reduceMotion \? 0\.26 : undefined\}/);
assert.match(source,/resizeMode="contain"/);
assert.ok(source.includes("require('./assets/animations/book-loader-dark.json')"));
assert.ok(source.includes("require('./assets/animations/book-loader-light.json')"));
const loaders=[...app.matchAll(/<BookLoader\s[^>]+\/>/g)].map(m=>m[0]);
assert.ok(loaders.length>=7,'maintain loading indicators across all existing user flows');
for(const element of loaders){
  assert.match(element,/reduceMotion=\{reduceMotion\}/,'loader must respect reduced motion in every screen');
  assert.match(element,/size=\{(?:width>=760\?\d+:\d+|\d+)\}/);
  const nums=[...element.matchAll(/\b\d{2}\b/g)].map(x=>Number(x[0]));
  assert.ok(nums.some(n=>n>=28),'small loaders must remain legible');
}
assert.ok(app.includes('size={width>=760?38:34}'),
 'the scan banner should use a proportional Fold-sized book loader');
assert.ok(app.includes('size={width>=760?42:36}'),
 'reader load affordance must scale on wider Fold layouts');
console.log('PASS: canonical Lottie loader enlarged proportionately; reduced motion/colours preserved');
