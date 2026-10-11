const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const file=fs.readFileSync(path.join(__dirname,'LivingBookCanvas.tsx'),'utf8');
const scaled='ctx.clearRect(0,0,500,420);ctx.transform(1.16,0,0,1.16,-40,12);ctx.save();';
const canonical='ctx.clearRect(0,0,500,420);ctx.save();';
const canonicalBlob='bac9a25bd1e75df7dd3ee8ed914d3005e201a5e0';

// The complete accepted renderer, CSS viewport, page geometry, source artwork,
// timings and native stage MUST remain byte-identical outside the drawing transform.
assert.equal(file.split(scaled).length,2,'Exactly one drawing-scale transform is required');
const restored=file.replace(scaled,canonical);
const sha=crypto.createHash('sha1')
  .update('blob '+Buffer.byteLength(restored)+'\0')
  .update(restored)
  .digest('hex');
assert.equal(sha,canonicalBlob,'Any other Living Book edit requires separate approval');

// Retain the exact layout dimensions; only rendered book pixels may get larger.
assert.match(file,/stage:\{width:340,maxWidth:'100%',height:290,alignSelf:'center',overflow:'hidden'/);
const scale=1.16, tx=-40, ty=12;
assert.equal(250*scale+tx,250,'Horizontal centre must not move');
assert(scale>1 && scale<1.2,'Use bounded uniform magnification');
// Original canonical mesh envelope across opening/closing/turns, sampled
// independently from unchanged project/rigid/flex geometry (canvas: 500x420).
const meshBounds={left:49.7976,right:436.4326,top:-4.7145,bottom:346.7212};
assert(meshBounds.left*scale+tx>=0,'Book must not clip on left');
assert(meshBounds.right*scale+tx<=500,'Book must not clip on right');
assert(meshBounds.top*scale+ty>=0,'Book must not clip at top');
assert(meshBounds.bottom*scale+ty<=420,'Book must not clip at bottom');
console.log('PASS: exact canonical renderer restored by removing scale transform; mesh stays within fixed stage');
