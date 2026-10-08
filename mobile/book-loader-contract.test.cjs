const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');
const reader=fs.readFileSync(path.join(__dirname,'LocalPdfReader.tsx'),'utf8');
const book=fs.readFileSync(path.join(__dirname,'BookLoader.tsx'),'utf8');
const original={fr:60,ip:0,op:240,w:300,h:300};
const dark=require('./assets/animations/book-loader-dark.json');
const light=require('./assets/animations/book-loader-light.json');
function strokes(data){const items=[];function scan(x){if(!x||typeof x!=='object')return;if(['st','fl'].includes(x.ty)&&x.c?.a===0&&Array.isArray(x.c.k))items.push(x.c.k.map((y,i)=>i<3?Math.round(y*255):y));for(const v of Object.values(x))scan(v)}scan(data);return items}
for(const variant of [dark,light]){
  for(const [key,value] of Object.entries(original))assert.equal(variant[key],value,'original Lottie animation frame/size timing must stay unchanged');
  assert.ok(strokes(variant).length>=11,'book vector artwork must retain every original stroke');
  assert.equal(variant.nm,'book pagination');
}
assert.notDeepEqual(strokes(dark),strokes(light),'dark and light must have their own existing palette colours');
assert.equal((app.match(/<BookLoader\b/g)||[]).length,8,'all App circular spinners should be replaced, not just onboarding');
assert.equal((reader.match(/<BookLoader\b/g)||[]).length,1,'local PDF page spinner should use the book');
assert.doesNotMatch(app+reader,/\bActivityIndicator\b/,'no stock circular spinners remain in the mobile UI');
assert.match(book,/autoPlay=\{!reduceMotion\}/,'Reduced Motion disables the animation');
assert.match(book,/progress=\{reduceMotion \? 0\.26 : undefined\}/,'Reduced Motion displays static book artwork');
assert.match(book,/accessibilityRole="progressbar"/,'book loader is accessible');
assert.match(app,/dark=\{darkMode\}/,'all App load indicators inherit canonical dark/light theme');
assert.match(reader,/dark=\{paper==='#000000'\}/,'PDF indicator retains theme matching');
console.log('PASS: user's exact Lottie book recoloured into both themes and replaces all 9 circular UI spinners');
