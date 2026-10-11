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
  'Source must match the exact user-selected Forward Media animation');
assert.equal(source.nm,'Forward');
assert.deepEqual(source.layers.map(x=>x.nm),['Frame','Frame 2','FF']);
assert.deepEqual(ink.layers.map(x=>x.nm),['FF'],'Do not add a second circular outline');
assert.equal(ink.fr,source.fr);
assert.equal(ink.op,source.op);
assert.equal(ink.w,source.w);
assert.equal(ink.h,source.h);
const same=JSON.parse(JSON.stringify(ink));
for(const asset of same.assets||[])
  for(const layer of asset.layers||[])
    for(const group of layer.shapes||[])
      for(const item of group.it||[])
        if((item.ty==='st'||item.ty==='fl')&&item.c?.a===0)
          item.c.k=item.ty==='fl'?[0,0,0,1]:[0.026188491373,0.021800510556,0.023205497218,1];
assert.deepEqual(same.assets,source.assets,'Only ink colour may change, not the approved source animation');
assert.deepEqual(same.layers[0],source.layers[2]);

const app=read('App.tsx');
const icon=read('LivePlayerSkipIcon.tsx');
const book=read('LivingBookCanvas.tsx');
const transport=read('playerTransport.ts');
assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(book)+'\0').update(book).digest('hex'),
  '3f2b6f2b91dbe77e71f65c02a8696b372d2126fd','Do not change the Living Book renderer');
assert(transport.includes('small: {seconds: 15, pages: 3}'));
assert(transport.includes('large: {seconds: 30, pages: 6}'));
assert.equal(app.split('<LivePlayerSkipIcon ').length-1,4);
assert.equal(app.split("backgroundColor:'#F1EEE4'").length-1,4);
assert.equal(app.split('<Text pointerEvents="none" style={[styles.skipNumber').length-1,4);
assert.equal(app.split('>15s</Text>').length-1,2);
assert.equal(app.split('>30s</Text>').length-1,2);
for(const key of ['back30','back15','forward15','forward30'])
  assert(app.includes('trigger={skipButtonPulse.'+key+'}'),'No animation triggered on '+key);
assert(icon.includes('scaleX:direction'),'Reverse artwork must point to left');
assert(icon.includes('autoPlay={false} loop={false}'),'Skip animation must run only on tap');
assert(icon.includes('progress={progress}'),'Keep stable first frame without a second icon');
assert(app.includes('transportEdgeButton: {width:50,height:50,borderRadius:25'));
assert(app.includes('skipButton: {width:58,height:58,borderRadius:29'));
assert(app.includes('setSkipButtonPulse(current=>({...current,[key]:current[key]+1}))'));

const start=app.indexOf('function runSkipBurstStep(');
const stop=app.indexOf('\n\n  const [queuedBooks',start);
assert(start>0&&stop>start,'Bounded page-burst controller must exist');
const burst=app.slice(start,stop);
for(const item of [
  'skipBurstQueue.current.push({remaining:count,direction})',
  'if(skipBurstRunning.current)return',
  'setSkipDirection(action.direction)',
  "transitionLivingBook({type:'turn-request'})",
  "transitionLivingBook({type:'turn-complete'})",
  "transitionLivingBook({type:'settle-complete'})",
  '--action.remaining',
  'skipBurstQueue.current.shift()',
  'cancelSkipBurst()',
]){
  assert(burst.includes(item),'Missing existing renderer sequence: '+item);
}
assert(app.includes('requestSeek({delta:direction*skip.seconds},skip.pages,direction)'),
  'Keep actual audio seeks, direction and page counts coupled');
assert(!app.includes('<UiIcon name="skipBack" color={p.ink} size={30}/>'));
assert(!app.includes('<UiIcon name="skipForward" color={p.ink} size={30}/>'));
console.log('PASS: exact Forward Media source, mirrored rewind, four white fixed-size controls, labels, 3/6 page flips, renderer unchanged');
