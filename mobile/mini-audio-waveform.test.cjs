const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');

const exact=read('assets/motion/mini-audio-waveform-original.json');
const src=JSON.parse(exact);
assert.equal(crypto.createHash('sha256').update(exact).digest('hex'),
  'ebd76660844ec46eb8b9176c51a909119ad65a98b4fd771b2a4a3355dd610deb',
  'Never replace the user-selected five-bar waveform');
assert.equal(src.nm,'sound');
assert.deepEqual([src.w,src.h,src.fr,src.ip,src.op],[120,120,24,0,28]);
assert.equal(src.layers.length,5);

for(const [tone,rgb] of [
  ['teal',[47/255,139/255,134/255,1]],
  ['ivory',[241/255,234/255,213/255,1]]
]){
  const variant=JSON.parse(read('assets/motion/mini-audio-waveform-'+tone+'.json'));
  assert.equal(variant.layers.length,5);
  let count=0;
  for(let i=0;i<variant.layers.length;i++){
    const sourceLayer=src.layers[i];
    const layer=JSON.parse(JSON.stringify(variant.layers[i]));
    for(let j=0;j<layer.shapes.length;j++)
      for(let k=0;k<(layer.shapes[j].it||[]).length;k++){
        const shape=layer.shapes[j].it[k];
        if(shape.ty==='st'&&shape.c?.a===0){
          count++;
          assert.deepEqual(shape.c.k,rgb,'Only tone-specific ink may change');
          shape.c.k=sourceLayer.shapes[j].it[k].c.k;
        }
      }
    assert.deepEqual(layer,sourceLayer,'Waveform geometry, keyframes, stroke widths or easing changed');
  }
  assert.equal(count,5);
}

const component=read('MiniAudioWaveform.tsx');
assert(component.includes('MINI_WAVEFORM_SIZE=20'),'Waveform must not exceed mini-player text height');
assert(component.includes('autoPlay={false} loop={true}'),'Loop only when explicitly playing');
assert(component.includes('if(playing&&active)'),'Only foreground playback may start the waveform');
assert(component.includes('animation.current?.play()'));
assert(component.includes('animation.current?.pause()'),'Pause and background must freeze the waveform');
assert(component.includes('if(reducedMotion)')&&component.includes('animation.current?.reset()'),
  'Reduced Motion must show a neutral static frame');
assert(component.includes("source={tone==='ivory'?IVORY:TEAL}"),'Theme palettes should match Archivist');

const app=read('App.tsx');
assert.equal(app.split('<MiniAudioWaveform ').length-1,1,'Waveform only appears in persistent audio mini-player');
assert(app.includes("!readerIsFullscreen && playing && !(activeTab==='now'&&liveMode==='player')"),
  'Do not render waveform without an active audiobook session');
assert(app.includes("playing={Boolean(playing.source==='server'?playback?.playing:audio.playing)}"),
  'Server/local playback state must be used, not a decorative timer');
assert(app.includes("active={appActive} reducedMotion={reduceMotion}"),
  'Background and accessibility preferences must control playback animation');
assert(app.includes("tone={darkMode?'ivory':'teal'}"));
assert(app.includes("miniPlayer: {minHeight:64,marginHorizontal:12,marginBottom:8"));
assert(app.includes("miniButton: {width:40,height:40,borderRadius:10"),'Control sizes must remain unchanged');
assert(app.includes("miniMeta: {fontSize:10.5,lineHeight:14"),'Status typography must remain unchanged');

const book=read('LivingBookCanvas.tsx');
const gitBlob=crypto.createHash('sha1')
  .update('blob '+Buffer.byteLength(book)+'\0').update(book).digest('hex');
assert.equal(gitBlob,'3f2b6f2b91dbe77e71f65c02a8696b372d2126fd',
  'No Living Book artwork, renderer or animations may change');
console.log('PASS: exact waveform, five unchanged animated paths, teal/ivory ink, 20dp mini-player only, pause/stop/background/reduced-motion gates, book untouched');
