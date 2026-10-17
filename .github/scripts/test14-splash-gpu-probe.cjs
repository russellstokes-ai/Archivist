// Reproduce approved 6-second WebGL splash with software rendering on a
// disposable GitHub runner. Never changes the approved HTML or app assets.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const asset=path.join(root,'mobile/assets/splash/archivist-premium-shine.html');
const folder=path.join(root,'qa/test14-splash-gpu');
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
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader',
  '--use-angle=swiftshader','--use-gl=angle','--ignore-gpu-blocklist',
  '--disable-dev-shm-usage',
 ]});
 try{
  const page=await browser.newPage({viewport:{width:480,height:800},deviceScaleFactor:1});
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
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
