const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sourceRaw=read('assets/motion/live-forward-media-source.json');
const source=JSON.parse(sourceRaw);
const ink=JSON.parse(read('assets/motion/live-forward-media-ink.json'));

assert.equal(crypto.createHash('sha256').update(sourceRaw).digest('hex'),
  '7598a66a5ea82a21f863648d837e0516e0a891c487069e4614d6a1660b9fa65a',
  'Selected user-provided LottieFiles asset changed');
assert.equal(source.nm,'Forward');
assert.deepEqual(source.layers.map(x=>x.nm),['Frame','Frame 2','FF']);
assert.deepEqual(ink.layers.map(x=>x.nm),['FF'],
  'Only the animated skip chevrons may appear inside the existing circular button');
assert.equal(ink.fr,source.fr);
assert.equal(ink.op,source.op);
assert.equal(ink.w,source.w);
assert.equal(ink.h,source.h);
const same=JSON.parse(JSON.stringify(ink));
for(const asset of same.assets??[])for(const layer of asset.layers??[])
  for(const group of layer.shapes??[])for(const item of group.it??[])
    if((item.ty==='st'||item.ty==='fl')&&item.c?.a===0)
      item.c.k=item.ty==='fl'?[0,0,0,1]:[0.026188491373,0.021800510556,0.023205497218,1];
assert.deepEqual(same.assets,source.assets,
  'Source arrow frames, orientation, positions and easing must be identical');
assert.deepEqual(same.layers[0],source.layers[2]);

const app=read('App.tsx');
const icon=read('LivePlayerSkipIcon.tsx');
const book=read('LivingBookCanvas.tsx');
const transport=read('playerTransport.ts');

assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(book)+'\\0').update(book).digest('hex'),
  '3f2b6f2b91dbe77e71f65c02a8696b372d2126fd',
  'The Living Book renderer has been changed');
assert.match(transport,/small: \\{seconds: 15, pages: 3\\}/);
assert.match(transport,/large: \\{seconds: 30, pages: 6\\}/);
assert.equal((app.match(/<LivePlayerSkipIcon /g)||[]).length,4);
assert.equal((app.match(/backgroundColor:'#F1EEE4'/g)||[]).length,4,'Each skip has warm white surface');
assert.equal((app.match(/<Text pointerEvents="none" style=\\{\\[styles.skipNumber/g)||[]).length,4);
assert.equal((app.match(/>15s<\\/Text>/g)||[]).length,2);
assert.equal((app.match(/>30s<\\/Text>/g)||[]).length,2);
for(const key of ['back30','back15','forward15','forward30'])
  assert(app.includes('trigger={skipButtonPulse.'+key+'}'),'Missing tap animation '+key);
assert.match(icon,/scaleX:direction/,'Rewind MUST face left');
assert.match(icon,/autoPlay=\\{false\\} loop=\\{false\\}/,'Animation is a one-shot');
assert.match(icon,/progress=\\{progress\\}/,'Icon has a stable static frame');
assert.match(app,/styles\\.transportEdgeButton/);
assert.match(app,/styles\\.skipButton/);
assert.match(app,/transportEdgeButton: \\{width:50,height:50,borderRadius:25/);
assert.match(app,/skipButton: \\{width:58,height:58,borderRadius:29/);
assert.match(app,/setSkipButtonPulse\\(current=>\\(\\{\\.\\.\\.current,\\[key\\]:current\\[key\\]\\+1\\}\\)\\)/);

const burst=app.slice(app.indexOf('function runSkipBurstStep('),app.indexOf('\\n\\n  const [queuedBooks'));
assert.match(burst,/skipBurstQueue\\.current\\.push\\(\\{remaining:count,direction\\}\\)/);
assert.match(burst,/if\\(skipBurstRunning\\.current\\)return/,'Rapid taps should queue rather than interrupt');
assert.match(burst,/setSkipDirection\\(action.direction\\)/);
assert.match(burst,/transitionLivingBook\\(\\{type:'turn-request'\\}\\)/);
assert.match(burst,/transitionLivingBook\\(\\{type:'turn-complete'\\}\\)/);
assert.match(burst,/transitionLivingBook\\(\\{type:'settle-complete'\\}\\)/);
assert.match(burst,/--action.remaining/);
assert.match(burst,/skipBurstQueue\\.current\\.shift\\(\\)/);
assert.match(burst,/cancelSkipBurst\\(\\)/);
assert.match(app,/requestSeek\\(\\{delta:direction\\*skip.seconds\\},skip.pages,direction\\)/,
  'Keep seeking and page-counts coupled to the original skip map');
assert(!app.includes('<UiIcon name="skipBack" color={p.ink} size={30}/>') &&
       !app.includes('<UiIcon name="skipForward" color={p.ink} size={30}/>'),
  'No double glyphs under animated chevrons');

console.log('PASS: exact Forward Media asset, mirrored rewind, four fixed-size white controls, 15/30 labels, 3/6 leaf sequencing, canonical book byte lock');
