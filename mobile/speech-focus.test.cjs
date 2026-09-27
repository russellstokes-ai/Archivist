const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,lib:['es2022','dom']}}).outputText,file);
const {detectBubbleRegion,speechFocusBrowserSource}=require('./speechFocus.ts');

function image(width,height,r=70,g=70,b=70){
  const data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<width*height;i++){data[i*4]=r;data[i*4+1]=g;data[i*4+2]=b;data[i*4+3]=255;}
  return data;
}
function pixel(data,width,x,y,r,g,b){
  const i=(y*width+x)*4;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255;
}
const w=120,h=100,data=image(w,h);
for(let y=19;y<=62;y++)for(let x=19;x<=94;x++){
  const border=x<22||x>91||y<22||y>59;
  pixel(data,w,x,y,border?20:245,border?20:245,border?20:245);
}
// A black text block inside the white bubble should not split the outer detected silhouette.
for(let y=36;y<=41;y++)for(let x=42;x<=68;x++)pixel(data,w,x,y,25,25,25);

const region=detectBubbleRegion(data,w,h,55,48);
assert(region,'closed light speech bubble should be detected');
assert(region.left<=22 && region.right>=91,'detected region should cover the bubble width');
assert(region.top<=22 && region.bottom>=59,'detected region should cover the bubble height');
assert(region.right-region.left < w*.8,'detector must not leak across most of the page');
assert(region.rows.length>5,'detector should return a clipped row outline');

const dark=image(80,80,30,30,30);
assert.equal(detectBubbleRegion(dark,80,80,40,40),null,'dark non-bubble region should be rejected');
const white=image(80,80,245,245,245);
assert.equal(detectBubbleRegion(white,80,80,40,40),null,'unbounded white page background should be rejected');

const browser=speechFocusBrowserSource();
assert(browser.includes('speech-focus-overlay'));
assert(browser.includes('getImageData'));
assert(browser.includes('Path2D'));
assert(browser.includes('1600'),'display crop should be bounded while retaining high-resolution source pixels');

console.log('PASS: deterministic speech focus detects bounded bubble interiors, rejects page-wide leakage and emits clipped high-resolution browser rendering');
