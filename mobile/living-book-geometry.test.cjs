const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');

require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {LIVING_BOOK_GEOMETRY:G,LIVING_BOOK_MOTION:M,livingBookDepthLayers,livingBookGeometryIsLevel,livingBookVisualFrame}=require('./livingBookGeometry.ts');
const source=fs.readFileSync(__dirname+'/LivingBookArtwork.tsx','utf8');

assert.equal(G.bookWidth,G.pageWidth*2,'spread must be exactly two equal page widths');
assert.equal(G.coverWidth,G.pageWidth,'closed cover must match one page width');
assert.equal(G.pageInsetY*2+G.pageHeight,G.coverHeight,'page faces must be vertically centred inside both covers');
assert.equal(G.spineX,G.pageWidth,'hinge must sit exactly between equal page halves');
assert.ok(G.spineOverlap>=2,'paper blocks must overlap under the spine so there is no visible centre gap');
assert.ok(G.gutterWidth>=G.spineOverlap*3,'the visual gutter must be wider than the hidden overlap so it reads as curvature, not a slit');
assert.ok(G.leafEnvelopePad>=12,'turning leaf envelope must extend beyond the hardcover bounds');
assert.equal(livingBookGeometryIsLevel(),true,'shared book geometry must stay level and symmetric');

const layers=livingBookDepthLayers();
for(const offset of G.depthOffsets){
  const left=layers.find(layer=>layer.side==='left'&&layer.offset===offset);
  const right=layers.find(layer=>layer.side==='right'&&layer.offset===offset);
  assert.deepEqual(
    {top:left.top,bottom:left.bottom},
    {top:right.top,bottom:right.bottom},
    'left/right page depth must be symmetric at offset '+offset,
  );
}

const checkpoints=[0,.05,.1,.5,.9,.95,1].map(livingBookVisualFrame);
assert.equal(checkpoints[0].internalReveal,0);
assert.equal(checkpoints[0].leafReveal,0);
assert.equal(checkpoints.at(-1).internalReveal,1);
assert.equal(checkpoints.at(-1).leafReveal,1);
for(let i=1;i<checkpoints.length;i++){
  assert.ok(checkpoints[i].internalReveal>=checkpoints[i-1].internalReveal,'internal reveal must be monotonic');
  assert.ok(checkpoints[i].leafReveal>=checkpoints[i-1].leafReveal,'leaf visibility gate must be monotonic');
  assert.ok(checkpoints[i].shadowScale>=checkpoints[i-1].shadowScale,'shadow footprint must widen monotonically');
  assert.ok(checkpoints[i].shadowTranslateX>=checkpoints[i-1].shadowTranslateX,'shadow must move continuously with the hinge');
}
assert.ok(M.coverAngles[0]==='0deg'&&M.coverAngles.at(-1)==='-180deg','cover hinge must span one continuous half turn');

assert.match(source,/baseSpread:\{[^}]*overflow:'hidden'/s,'static internal spread may clip to the hardcover');
assert.match(source,/leafEnvelope:\{[^}]*overflow:'visible'/s,'turning leaves must render in an oversized unclipped envelope');
assert.ok(source.includes('top:G.leafEnvelopePad+G.pageInsetY'),'turning pages must be inset inside the oversized envelope rather than clipped at the cover top');
assert.ok(source.includes('const leafGate=open.interpolate'),'turning leaves must be gated by the same hinge state');
assert.ok(source.includes("inputRange:[0,G.leafRevealStart,G.leafRevealEnd,1]"),'leaf gate must hide turns during open/close edges');
assert.ok(source.includes('coverFrontFace')&&source.includes('coverInsideFace'),'cover must have continuous front and inside faces across the 90-degree hinge');
assert.equal(source.includes('shadowColor'),false,'rotating book layers must not use native shadows that can remain on the wrong side');
assert.ok(source.includes("transformOrigin:'right center'")&&source.includes('groundShadow'),'ground shadow must stay anchored to the visible footprint');
assert.equal(source.includes("rotateX:'9deg'"),false,'whole spread must not tilt out of level');
assert.match(source,/Animated\.multiply\(\s*leafGate,\s*turn\.interpolate/s,'ambient turns must disappear before the book closes');
assert.match(source,/livingBookDepthLayers\(\)\.map/,'page depth must come from symmetric shared geometry');
assert.ok(source.includes('s.rightPage')&&source.includes('G.pageWidth+G.spineOverlap'),'right paper must overlap beneath the centre crease');
assert.ok(source.includes('gutterLeftShadow')&&source.includes('gutterCrease')&&source.includes('gutterRightShadow'),'centre must render as a layered concave gutter rather than a dark physical gap');
assert.ok(source.includes('spinePaperBridge'),'a continuous paper bridge must sit beneath the gutter so the hardcover binding cannot appear as a centre slit');
assert.ok(source.includes('borderRightWidth:0')&&source.includes('borderLeftWidth:0'),'inner paper edges must not draw competing borders through the spine');
assert.ok(source.includes('leafFrontFace')&&source.includes('leafBackFace'),'animated paper must render as two-sided material');

console.log('PASS: Living Book uses one continuous hinge, unclipped turns and footprint-bound shadow geometry');
