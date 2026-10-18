// Reproduce approved 6-second WebGL splash with software rendering on a
// disposable GitHub runner. Never changes the approved HTML or app assets.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const asset=path.join(root,'mobile/assets/splash/archivist-premium-shine.html');
const folder=path.join(root,'qa/splash-hq');
fs.mkdirSync(folder,{recursive:true});
const css=[
  "html,body,main{background:#2F8B86!important}",
  "main{display:flex!important;align-items:center!important;justify-content:center!important;min-height:100%!important}",
  ".brand{position:relative!important;display:block!important;transform:none!important;width:var(--archivist-stage)!important;height:var(--archivist-stage)!important}",
  ":root{--archivist-stage:min(62vw,35vh,310px)}",
  "#stage{width:var(--archivist-stage)!important;height:var(--archivist-stage)!important}",
  "#wordmark{position:absolute!important;left:0!important;top:100%!important;width:var(--archivist-stage)!important;margin:-7px 0 0!important}",
  "#restart{display:none!important}",
].join('');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ARCHIVIST_CHROMIUM_EXECUTABLE,headless:true,args:[
  '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader',
  '--use-angle=swiftshader','--use-gl=angle','--ignore-gpu-blocklist',
  '--disable-dev-shm-usage',
 ]});
 try{
  const page=await browser.newPage({viewport:{width:480,height:800},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let source=fs.readFileSync(asset,'utf8');
  source=source.replace('</head>','<style id="archivist-native-fit">'+css+'</style></head>');
  await page.setContent(source,{waitUntil:'load',timeout:90000});
  await page.waitForTimeout(1000);
  const available=await page.evaluate(()=>({
    motion:!!window.ARCHIVIST_MOTION,
    duration:window.ARCHIVIST_MOTION?.duration,
    assetsReady:window.ARCHIVIST_MOTION?.assetsReady,
    webgl:!!document.getElementById('art')?.getContext('webgl'),
  }));
  console.log('Archivist approved splash software GPU:',JSON.stringify(available));
  if(!available.webgl||available.duration<5.9)throw Error('WebGL unavailable on disposable runner; video capture not supported here');
  await page.waitForFunction(()=>window.ARCHIVIST_MOTION?.assetsReady,{timeout:20000});
  for(const [index,time] of [0,.7,1.5,2.4,3.5,4.5,5.3,5.9,6].entries()){
    await page.evaluate(t=>window.ARCHIVIST_MOTION.renderFrame(t),time);
    await page.waitForTimeout(150);
    await page.screenshot({path:path.join(folder,'sample-'+index+'.png')});
  }
  assert.equal(errors.length,0,'WebGL page errors: '+errors.join('; '));
  const a=fs.readFileSync(path.join(folder,'sample-0.png'));
  const b=fs.readFileSync(path.join(folder,'sample-4.png'));
  const c=fs.readFileSync(path.join(folder,'sample-8.png'));
  assert(!a.equals(b)&&!b.equals(c),'Animation needs independent middle and final frames');
  console.log('PASS: approved original source generated visibly distinct mid and final frames');
  // Encode exactly sampled source frames into a deterministic, GPU-independent
  // startup fallback. Never simplify/rebuild the approved book, pages or emblem.
  // The native app will use this rather than requiring WebGL support on device.
  if(process.env.ARCHIVIST_RENDER_VIDEO==='1'){
    const fps=24,bookFrames=144,shineFrames=35;
    const originalHash=require('crypto').createHash('sha256').update(fs.readFileSync(asset)).digest('hex');
    const frames=path.join(folder,'frames');fs.mkdirSync(frames,{recursive:true});
    // Source shine is a linear 0→1100 SVG gradient translation over 1.3s.
    // Reproduce the exact source transform numerically, independent of how long
    // screenshot capture takes on the CI machine.
    await page.evaluate(()=>document.getElementById('shine-pass')?.remove());
    for(let i=0;i<bookFrames;i++){
      await page.evaluate(t=>window.ARCHIVIST_MOTION.renderFrame(t),i/fps);
      await page.screenshot({path:path.join(frames,'frame-'+String(i).padStart(4,'0')+'.png')});
    }
    await page.evaluate(()=>window.ARCHIVIST_MOTION.renderFrame(6));
    for(let j=0;j<shineFrames;j++){
      const frame=bookFrames+j,elapsed=j/fps;
      const value=1100*Math.min(1,elapsed/1.3);
      await page.evaluate(v=>document.getElementById('wordmark-shine')
        .setAttribute('gradientTransform','translate('+v+' 0)'),value);
      await page.screenshot({path:path.join(frames,'frame-'+String(frame).padStart(4,'0')+'.png')});
    }
    const first=fs.readFileSync(path.join(frames,'frame-0000.png'));
    const middle=fs.readFileSync(path.join(frames,'frame-0072.png'));
    const last=fs.readFileSync(path.join(frames,'frame-0178.png'));
    assert(!first.equals(middle)&&!middle.equals(last),'Video frames must change over time');
    fs.writeFileSync(path.join(folder,'provenance.json'),JSON.stringify({
      source:'mobile/assets/splash/archivist-premium-shine.html',
      htmlSha256:originalHash,
      renderEngine:'Original, unmodified WebGL source + source-defined SVG shine translation',
      viewport:'960x1600',fps,bookFrames,shineFrames,
      durationSeconds:(bookFrames+shineFrames)/fps,
      cssFit:'62vw / 35vh / 310px capped, centred book, wordmark below',
    },null,2));
    console.log('PASS: rendered '+(bookFrames+shineFrames)+' source-faithful 24fps frames');
  }

 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
