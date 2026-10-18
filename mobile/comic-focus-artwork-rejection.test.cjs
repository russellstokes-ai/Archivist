const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {detectBubbleRegion}=require('./speechFocus.ts');
const w=180,h=160;
function fixture(){const p=new Uint8ClampedArray(w*h*4);for(let i=0;i<p.length;i+=4){p[i]=p[i+1]=p[i+2]=45;p[i+3]=255;}return p;}
function rect(p,x1,y1,x2,y2,r,g=r,b=r){for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){const i=(y*w+x)*4;p[i]=r;p[i+1]=g;p[i+2]=b;}}
for(const color of [[245,245,245],[225,181,150]]){
 const p=fixture();rect(p,70,20,91,125,...color);
 assert.equal(detectBubbleRegion(p,w,h,80,65),null,'An elongated bright or skin-coloured limb is not dialogue');
}
const blank=fixture();rect(blank,40,40,120,90,245);
assert.equal(detectBubbleRegion(blank,w,h,65,70),null,'A bright artwork patch without enclosed lettering is not dialogue');
const p=fixture();rect(p,40,40,120,90,245);rect(p,55,55,62,61,20);rect(p,68,55,75,61,20);
const r=detectBubbleRegion(p,w,h,80,70);assert(r,'Lettered bubble must remain focusable');
assert(r.left>=38&&r.right<=122&&r.top>=38&&r.bottom<=92,'Crop includes only a small outline allowance');
console.log('PASS: limbs and unlettered artwork rejected; lettered bubble tightly isolated');
