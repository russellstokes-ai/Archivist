const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,lib:['es2022','dom']}}).outputText,file);
const {detectBubbleRegion,speechFocusBrowserSource}=require('./speechFocus.ts');

function image(width,height,r=70,g=70,b=70){
  const data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<width*height;i++){data[i*4]=r;data[i*4+1]=g;data[i*4+2]=b;data[i*4+3]=255;}
  return data;
}
function pixel(data,width,x,y,r,g,b,a=255){
  const i=(y*width+x)*4;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=a;
}
function rectangle(data,width,left,top,right,bottom,fill=245,border=20,thickness=3){
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const edge=x<left+thickness||x>right-thickness||y<top+thickness||y>bottom-thickness;
    pixel(data,width,x,y,edge?border:fill,edge?border:fill,edge?border:fill);
  }
}
function ellipse(data,width,height,cx,cy,rx,ry,fill=245,border=20){
  for(let y=Math.max(0,cy-ry-2);y<=Math.min(height-1,cy+ry+2);y++)for(let x=Math.max(0,cx-rx-2);x<=Math.min(width-1,cx+rx+2);x++){
    const d=((x-cx)*(x-cx))/(rx*rx)+((y-cy)*(y-cy))/(ry*ry);
    if(d<=1.08){
      const v=d>.88?border:fill;
      pixel(data,width,x,y,v,v,v);
    }
  }
}
function textBlock(data,width,left,top,right,bottom,value=25){
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)pixel(data,width,x,y,value,value,value);
}
function assertBounded(region,width,height,message){
  assert(region,message);
  assert(region.right-region.left < width*.88,message+' leaked horizontally');
  assert(region.bottom-region.top < height*.78,message+' leaked vertically');
  assert(region.rows.length>3,message+' missing clipped outline');
}

// Baseline rectangular speech bubble with dark text.
{
  const w=120,h=100,data=image(w,h);
  rectangle(data,w,19,19,94,62);
  textBlock(data,w,42,36,68,41);
  const region=detectBubbleRegion(data,w,h,55,48);
  assertBounded(region,w,h,'closed light speech bubble should be detected');
  assert(region.left<=22 && region.right>=91,'detected region should cover the bubble width');
  assert(region.top<=22 && region.bottom>=59,'detected region should cover the bubble height');
}

// Corpus: common comic bubble shapes, tones, text placement and tap positions.
const corpus=[
  {name:'white oval',fill:248,tap:[60,45],draw:(d,w,h)=>ellipse(d,w,h,60,45,35,21,248)},
  {name:'off-white oval',fill:218,tap:[60,45],draw:(d,w,h)=>ellipse(d,w,h,60,45,34,20,218)},
  {name:'light grey rectangle',fill:195,tap:[48,42],draw:(d,w)=>rectangle(d,w,18,20,88,62,195)},
  {name:'wide dialogue bubble',fill:245,tap:[58,48],draw:(d,w)=>rectangle(d,w,10,29,108,66,245)},
  {name:'small bubble',fill:250,tap:[37,34],draw:(d,w,h)=>ellipse(d,w,h,38,34,19,13,250)},
  {name:'bubble near page edge',fill:245,tap:[25,48],draw:(d,w,h)=>ellipse(d,w,h,24,48,20,18,245)},
];
for(const item of corpus){
  const w=120,h=96,data=image(w,h,58,60,62);
  item.draw(data,w,h);
  // Simulate lettering, including a tap directly on a dark glyph for some cases.
  textBlock(data,w,45,41,72,45,28);
  const region=detectBubbleRegion(data,w,h,item.tap[0],item.tap[1]);
  assertBounded(region,w,h,item.name);
}

// Tapping dark lettering must still seed a nearby light interior rather than fail.
{
  const w=140,h=100,data=image(w,h,45,45,45);
  rectangle(data,w,24,18,112,70,245);
  textBlock(data,w,52,39,84,48,15);
  const region=detectBubbleRegion(data,w,h,68,43);
  assertBounded(region,w,h,'tap on lettering');
  assert(region.left<40&&region.right>95,'tap on lettering should recover the surrounding bubble');
}

// Two nearby bubbles: detection must stay with the tapped connected region.
{
  const w=180,h=100,data=image(w,h,50,50,50);
  ellipse(data,w,h,50,45,34,20,245);
  ellipse(data,w,h,132,47,30,18,242);
  const left=detectBubbleRegion(data,w,h,50,45);
  const right=detectBubbleRegion(data,w,h,132,47);
  assertBounded(left,w,h,'left bubble');
  assertBounded(right,w,h,'right bubble');
  assert(left.right<95,'left bubble must not absorb adjacent dialogue');
  assert(right.left>90,'right bubble must not absorb adjacent dialogue');
}

// A speech tail connected to an oval should remain in the clipped region.
{
  const w=140,h=110,data=image(w,h,55,55,55);
  ellipse(data,w,h,67,43,39,23,246);
  for(let y=63;y<=82;y++){
    const half=Math.max(1,Math.round((82-y)*.35));
    for(let x=82-half;x<=82+half;x++)pixel(data,w,x,y,246,246,246);
  }
  const region=detectBubbleRegion(data,w,h,65,44);
  assertBounded(region,w,h,'bubble with tail');
  assert(region.bottom>=70,'speech tail should survive clipping');
}

// Negative corpus.
{
  const dark=image(80,80,30,30,30);
  assert.equal(detectBubbleRegion(dark,80,80,40,40),null,'dark non-bubble region should be rejected');

  const white=image(80,80,245,245,245);
  assert.equal(detectBubbleRegion(white,80,80,40,40),null,'unbounded white page background should be rejected');

  const transparent=image(80,80,245,245,245);
  for(let y=0;y<80;y++)for(let x=0;x<80;x++)pixel(transparent,80,x,y,245,245,245,40);
  assert.equal(detectBubbleRegion(transparent,80,80,40,40),null,'transparent artwork should be rejected');

  const tiny=image(100,100,50,50,50);
  rectangle(tiny,100,48,48,53,53,250,20,1);
  assert.equal(detectBubbleRegion(tiny,100,100,50,50),null,'tiny highlight should not be treated as a speech bubble');
}

const browser=speechFocusBrowserSource();
assert(browser.includes('speech-focus-overlay'));
assert(browser.includes('getImageData'));
assert(browser.includes('Path2D'));
assert(browser.includes('1600'),'display crop should be bounded while retaining high-resolution source pixels');
assert(browser.includes('Close enlarged speech bubble'),'enlarged bubble must be keyboard/screen-reader dismissible');

console.log('PASS: speech focus corpus covers oval, rectangular, grey, edge, lettering, adjacent, tailed and negative comic regions');
