const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync(__dirname+'/speechFocus.ts','utf8')).replace(/^import .*speechFocus.generated.*\n/m,'').replaceAll('export function','function');
const generated=stripTypeScriptTypes(fs.readFileSync(__dirname+'/speechFocus.generated.ts','utf8')).replace('export const','const');
const {detectBubbleRegion,speechFocusBrowserSource}=vm.runInNewContext(generated+'\n'+source+';({detectBubbleRegion,speechFocusBrowserSource})');

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
// Concave silhouette with two spans on the same scanline. The former
// envelope filled the entire notch, lifting unrelated artwork with it.
{
  const w=180,h=150,data=image(w,h,45,45,45);
  for(let y=25;y<=105;y++)for(let x=30;x<=110;x++){
    if(x<=48||x>=92||y>=88)pixel(data,w,x,y,245,245,245);
  }
  // Enclosed lettering on both arms must survive as original opaque pixels.
  textBlock(data,w,35,45,42,62,15);
  textBlock(data,w,98,48,104,65,15);
  const r=detectBubbleRegion(data,w,h,39,75);
  assertBounded(r,w,h,'concave bubble');
  const includes=(x,y)=>r.rows.some(row=>row.y===y&&x>=row.left&&x<=row.right);
  assert.equal(r.rows.filter(row=>row.y===55).length,2,'concave rows need independent spans');
  assert(!includes(70,55),'open notch must not include page artwork');
  assert(includes(38,53)&&includes(101,55),'enclosed text must not become transparent');
  assert(includes(30,75)&&includes(110,75),'outer edges must survive');
  // Every source bubble pixel must be represented by the mask.
  for(let y=25;y<=105;y++)for(let x=30;x<=110;x++){
    if(x<=48||x>=92||y>=88)assert(includes(x,y),`missing bubble pixel ${x},${y}`);
  }
  // A distinct nearby bubble cannot appear in this mask.
  ellipse(data,w,h,145,55,18,22,245);
  const r2=detectBubbleRegion(data,w,h,39,75);
  assert(r2.rows.every(row=>row.right<125),'neighbour must stay outside the selected mask');
}
// Rounded outline padding, unlike square/envelope expansion, does not add
// diagonal artwork beyond the selected silhouette's border allowance.
{
  const w=160,h=140,data=image(w,h,35,35,35);
  for(let y=30;y<=70;y++)for(let x=30;x<=90;x++)pixel(data,w,x,y,245,245,245);
  textBlock(data,w,45,42,75,48,15);
  const r=detectBubbleRegion(data,w,h,40,55);
  const includes=(x,y)=>r.rows.some(row=>row.y===y&&x>=row.left&&x<=row.right);
  assert(includes(30,28),'retain top border padding');
  assert(!includes(28,28),'do not pull in square corner artwork');
  assert(includes(55,45),'keep lettering opaque');
}
// Full component coverage: every light pixel is visited exactly once, even
// with holes for lettering. Padding must preserve the complete top edge.
{
  const w=240,h=200,data=image(w,h);
  rectangle(data,w,40,30,180,100,245,20,2);
  textBlock(data,w,70,50,150,58);
  const region=detectBubbleRegion(data,w,h,100,70);
  assert.equal(region.area,137*67-81*9);
  assert(region.rows[0].left<=42 && region.rows[0].right>=178,'top border must not become a triangular crop');
  for(const [x,y] of [[NaN,1],[Infinity,1],[-1,20],[w,20]])assert.equal(detectBubbleRegion(data,w,h,x,y),null);
  assert.equal(detectBubbleRegion(data,240.5,h,20,20),null);
  assert.equal(detectBubbleRegion(data,2000,2000,20,20),null);
}
// A real coloured narration fill, not merely a greyscale approximation.
{
  const w=160,h=120,data=image(w,h,40,40,40);
  rectangle(data,w,25,20,110,60);
  for(let y=23;y<=57;y++)for(let x=28;x<=107;x++)pixel(data,w,x,y,242,212,120);
  textBlock(data,w,40,35,85,39);
  const region=detectBubbleRegion(data,w,h,60,47);
  assertBounded(region,w,h,'ochre narration box');
  assert(region.left<=28&&region.right>=107);
}
// Execute the browser controller with controlled pixel input. Two taps in
// the old 24px cache bucket must run independent detection; replacing the
// image source at the same page number must also invalidate the cached crop.
{
  let detections=0;
  const canvases=[];
  const context={
    document:{addEventListener(){},body:{append(){}},createElement(tag){
      if(tag==='canvas'){
        const canvas={style:{},getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(400*400*4)}),save(){},clip(){},restore(){}})};
        canvases.push(canvas);return canvas;
      }
      return {style:{},classList:{add(){}},setAttribute(){},append(){},focus(){},remove(){}};
    }},Path2D:class{rect(){}moveTo(){}lineTo(){}closePath(){}},innerWidth:400,innerHeight:800,requestAnimationFrame:fn=>fn(),
    detector:()=>{detections++;return {left:20,top:20,right:60,bottom:60,rows:[{y:20,left:20,right:60},{y:60,left:20,right:60}]};}
  };
  const controller=vm.runInNewContext(source+';installSpeechFocus(detector)',context);
  const img={src:'first-page',naturalWidth:400,naturalHeight:400,getBoundingClientRect:()=>({left:0,top:0,width:400,height:400})};
  assert(controller.focus(img,25,25,'page-1'));controller.close();
  assert(controller.focus(img,30,25,'page-1'));controller.close();
  assert.equal(detections,2,'nearby taps must not reuse another bubble');
  assert(controller.focus(img,30,25,'page-1'));controller.close();
  assert.equal(detections,2,'identical taps should use the cache');
  img.src='replacement-page';assert(controller.focus(img,30,25,'page-1'));controller.close();
  assert.equal(detections,3,'replaced artwork must invalidate the cache');
  assert.equal(controller.focus(img,-1,25,'page-1'),false);
}
assert(browser.includes('speech-focus-overlay'));
assert(browser.includes('getImageData'));
assert(browser.includes('Path2D'));
assert(browser.includes('1600'),'display crop should be bounded while retaining high-resolution source pixels');
assert(browser.includes('Close enlarged speech bubble'),'enlarged bubble must be keyboard/screen-reader dismissible');

// Motion lifecycle with a controllable animation clock (no timing sleeps).
{
  const animations=[],buttons=[],events={};let reduce=false,restored=0;
  const previous={isConnected:true,focus(options){assert.equal(options.preventScroll,true);restored++;}};
  const context={
    document:{activeElement:previous,addEventListener(name,fn){events[name]=fn;},body:{append(){}},createElement(tag){
      if(tag==='canvas')return {style:{},getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(400*400*4)}),save(){},clip(){},restore(){}})};
      const button={style:{},classList:{add(){}},setAttribute(){},append(){},focus(){},contains(){return false;},remove(){this.removed=true;},
        animate(frames,options){const a={frames,options,cancel(){this.cancelled=true;}};animations.push(a);return a;}};
      buttons.push(button);return button;
    }},Path2D:class{rect(){}moveTo(){}lineTo(){}closePath(){}},innerWidth:320,innerHeight:640,
    matchMedia:()=>({matches:reduce}),getComputedStyle:()=>({transform:'matrix(0.8, 0, 0, 0.8, -10, -20)',paddingTop:'24px',paddingBottom:'20px',paddingLeft:'0px',paddingRight:'0px'}),
    detector:()=>({left:20,top:20,right:60,bottom:60,rows:[{y:20,left:20,right:60},{y:60,left:20,right:60}]})
  };
  const c=vm.runInNewContext(source+';installSpeechFocus(detector)',context);
  const img={src:'page',naturalWidth:400,naturalHeight:400,getBoundingClientRect:()=>({left:0,top:0,width:400,height:400})};
  assert(c.focus(img,30,30));
  const b=buttons.at(-1);
  assert.equal(animations[0].options.duration,340);
  assert.equal(b.style.transition,'none','avoid layout animation competing with transform');
  assert(parseFloat(b.style.left)>=16&&parseFloat(b.style.top)>=40,'respect safe area');
  assert(parseFloat(b.style.left)+parseFloat(b.style.width)<=304);
  c.close();assert(!b.removed,'dismiss should animate, not disappear');
  assert(animations[0].cancelled,'interrupt opening cleanly');
  assert.equal(animations[1].frames[0].transform,'matrix(0.8, 0, 0, 0.8, -10, -20)','reverse from current visual position');
  c.close();assert.equal(animations.length,2,'repeated dismissal is idempotent');
  animations[1].onfinish();assert(b.removed);assert.equal(restored,1);
  c.focus(img,30,30);c.close();const stale=animations.at(-1);
  c.focus(img,31,30);const replacement=buttons.at(-1);stale.onfinish();
  assert(!replacement.removed,'stale animation cannot remove a new focus');
  events.touchstart({touches:[{},{}]});assert(replacement.removed,'pinch immediately cancels the overlay');
  reduce=true;const count=animations.length;c.focus(img,30,30);c.close();
  assert.equal(animations.length,count,'Reduced Motion creates no animation');
  assert(buttons.at(-1).removed);
}

console.log('PASS: speech focus corpus covers oval, rectangular, grey, edge, lettering, adjacent, tailed and negative comic regions');

assert(!source.includes('.toString()'),'Hermes reader source must be static, not runtime function serialization');
new vm.Script(speechFocusBrowserSource());
