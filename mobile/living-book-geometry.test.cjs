const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');

require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {LIVING_BOOK_GEOMETRY:G,livingBookDepthLayers,livingBookGeometryIsLevel}=require('./livingBookGeometry.ts');
const source=fs.readFileSync(__dirname+'/LivingBookArtwork.tsx','utf8');

assert.equal(G.bookWidth,G.pageWidth*2,'spread must be exactly two equal page widths');
assert.equal(G.coverWidth,G.pageWidth,'closed cover must match one page width');
assert.equal(G.pageInsetY*2+G.pageHeight,G.coverHeight,'page faces must be vertically centred inside both covers');
assert.equal(G.spineX,G.pageWidth,'hinge must sit exactly between equal page halves');
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
assert.match(source,/internalClip:{[^}]*overflow:'hidden'/s,'internal pages must be clipped inside the hardcover silhouette');
assert.ok(source.includes("inputRange:[0,G.internalRevealStart,G.internalRevealEnd,1]"),'internal spread must remain invisible at full closure');
assert.match(source,/backfaceVisibility:'hidden'/,'folded page/cover backfaces must be hidden');
assert.equal(source.includes("rotateX:'9deg'"),false,'whole spread must not be tilted out of level');
assert.match(source,/Animated\.multiply\(\s*open,\s*turn\.interpolate/s,'ambient turn leaves must disappear as the book closes');
assert.match(source,/livingBookDepthLayers\(\)\.map/,'page depth must come from symmetric shared geometry');
assert.match(source,/top:G\.pageInsetY,width:G\.pageWidth,height:G\.pageHeight/,'both page faces must share one baseline and height');

console.log('PASS: Living Book closes cleanly and opens on one level symmetric spread');
