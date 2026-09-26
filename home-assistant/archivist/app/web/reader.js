const $=id=>document.getElementById(id),asset=new URLSearchParams(location.search).get('asset');
let manifest,part=0,revision=0,busy=true,font=20,pdf,saveQueue=Promise.resolve(),conflict=false,loaded=false,renderTask,zoom=1,lastTap=0,turning=false,pinchStartDistance=0,pinchStartZoom=1,pinchStartFont=20;
let soundEnabled=localStorage.getItem('reader-page-sound')!=='off';

async function api(path,method='GET',body){
  const r=await fetch(path,{method,headers:{'Content-Type':'application/json','X-Archivist-Action':'1'},body:body?JSON.stringify(body):undefined});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to open book');return data;
}
function status(s){$('reader-status').textContent=s;}
function fraction(){const h=document.documentElement.scrollHeight-innerHeight;return h>0?Math.max(0,Math.min(1,scrollY/h)):0;}
function save(){
  if(busy||!loaded||conflict)return saveQueue;
  const p={part,fraction:fraction()};
  saveQueue=saveQueue.then(async()=>{if(conflict)return;try{const result=await api('./api/assets/'+asset+'/reading-progress','PUT',{...p,revision});revision=result.revision;}catch(e){conflict=true;status('Position not synced: '+e.message);}});
  return saveQueue;
}
function controls(){
  $('previous').disabled=busy||turning||part===0;
  $('next').disabled=busy||turning||part>=manifest.parts.length-1;
  $('sections').disabled=busy||turning;
  $('position').textContent=(part+1)+' / '+manifest.parts.length;
}
function pageSound(){
  if(!soundEnabled)return;
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    const ctx=new AudioContext(),length=Math.floor(ctx.sampleRate*.09),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++){const t=i/length;data[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)*.13;}
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    filter.type='highpass';filter.frequency.value=850;
    gain.gain.setValueAtTime(.001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.085,ctx.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.095);
    source.buffer=buffer;source.connect(filter).connect(gain).connect(ctx.destination);source.start();source.stop(ctx.currentTime+.1);source.onended=()=>ctx.close();
  }catch{}
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function distance(a,b){const x=a.clientX-b.clientX,y=a.clientY-b.clientY;return Math.sqrt(x*x+y*y);}
function applyComicZoom(originX=50,originY=50){
  const img=$('reading').querySelector('.comic-page');
  if(!img)return;
  img.style.transformOrigin=originX+'% '+originY+'%';
  img.style.transform='scale('+zoom+')';
  img.classList.toggle('focused',zoom>1.01);
}
function focusComicPage(img,x,y){
  if(manifest?.format!=='Comic')return;
  const rect=img.getBoundingClientRect(),px=clamp((x-rect.left)/Math.max(1,rect.width)*100,0,100),py=clamp((y-rect.top)/Math.max(1,rect.height)*100,0,100);
  zoom=zoom>1.01?1:2.45;applyComicZoom(px,py);
}
function focusText(target){
  if(manifest?.format!=='Ebook')return;
  const block=target?.closest?.('p,li,blockquote,h1,h2,h3');
  if(!block)return;
  const active=block.classList.contains('text-focused');
  $('reading').querySelectorAll('.text-focused').forEach(node=>node.classList.remove('text-focused'));
  if(!active){block.classList.add('text-focused');setTimeout(()=>block.scrollIntoView({block:'center',behavior:'smooth'}),30);}
}
async function show(index,offset=0){
  busy=true;loaded=false;part=index;controls();$('reading').replaceChildren();$('sections').value=String(index);
  try{
    if(manifest.format==='Ebook'){
      const data=await api('./api/assets/'+asset+'/reader/'+index);
      if(typeof data.html==='string')$('reading').innerHTML=data.html;
      else for(const text of data.paragraphs){const p=document.createElement('p');p.textContent=text;$('reading').append(p);}
      await Promise.all([...$('reading').querySelectorAll('img')].map(img=>img.decode().catch(()=>undefined)));
    }else if(manifest.format==='Comic'){
      const img=document.createElement('img');img.alt='Page '+(index+1);img.className='comic-page';img.src='./api/assets/'+asset+'/reader/'+index;
      $('reading').append(img);await img.decode();zoom=1;applyComicZoom();
    }else if(manifest.format==='PDF'){
      const frame=document.createElement('iframe');
      frame.src='./api/assets/'+asset;frame.title='PDF document';frame.style.width='100%';frame.style.height='calc(100vh - 170px)';frame.style.border='0';
      $('reading').append(frame);await new Promise(resolve=>{frame.onload=()=>resolve();setTimeout(resolve,500);});
    }else throw Error('This format is not supported by the reader.');
    loaded=true;await new Promise(requestAnimationFrame);scrollTo(0,offset*Math.max(0,document.documentElement.scrollHeight-innerHeight));status('');
  }catch(e){status(e.message);}finally{busy=false;controls();}
}
async function move(n){
  if(busy||turning||(manifest?.format==='Comic'&&zoom>1.01))return;
  const target=clamp(part+n,0,manifest.parts.length-1);if(target===part)return;
  await save();turning=true;controls();pageSound();
  const reading=$('reading'),cls=n>0?'turn-next':'turn-prev';reading.classList.add(cls);
  await new Promise(resolve=>setTimeout(resolve,115));
  await show(target);
  await new Promise(resolve=>setTimeout(resolve,125));
  reading.classList.remove(cls);turning=false;controls();
}
$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);
$('sections').onchange=async()=>{if(busy||turning)return;const next=Number($('sections').value);if(next===part)return;await save();part=next;await show(next);};
$('appearance').value=localStorage.getItem('reader-appearance')||'light dark';
function appearance(){document.documentElement.style.colorScheme=$('appearance').value;localStorage.setItem('reader-appearance',$('appearance').value);}
$('appearance').onchange=appearance;appearance();
font=Math.max(14,Math.min(36,Number(localStorage.getItem('reader-font'))||20));
function resize(n){font=Math.max(14,Math.min(36,font+n));$('reading').style.fontSize=font+'px';localStorage.setItem('reader-font',String(font));}
$('smaller').onclick=()=>resize(-2);$('larger').onclick=()=>resize(2);resize(0);

const zoomOut=document.createElement('button'),zoomIn=document.createElement('button'),fit=document.createElement('button'),sound=document.createElement('button');
zoomOut.textContent='−';zoomOut.setAttribute('aria-label','Zoom out');zoomOut.title='Zoom out';
zoomIn.textContent='+';zoomIn.setAttribute('aria-label','Zoom in');zoomIn.title='Zoom in';
fit.textContent='Fit';fit.setAttribute('aria-label','Fit page');
function updateSoundButton(){sound.textContent=soundEnabled?'Sound on':'Sound off';sound.setAttribute('aria-pressed',soundEnabled?'true':'false');}
updateSoundButton();
sound.onclick=()=>{soundEnabled=!soundEnabled;localStorage.setItem('reader-page-sound',soundEnabled?'on':'off');if(soundEnabled)pageSound();updateSoundButton();};
function changeZoom(value){if(busy||!manifest||manifest.format!=='Comic')return;zoom=clamp(value,1,4);applyComicZoom();}
zoomOut.onclick=()=>changeZoom(zoom-.25);zoomIn.onclick=()=>changeZoom(zoom+.25);fit.onclick=()=>changeZoom(1);
document.querySelector('.tools').append(zoomOut,fit,zoomIn,sound);

$('reading').addEventListener('click',e=>{
  if(busy||turning||manifest?.format==='PDF')return;
  const rect=$('reading').getBoundingClientRect(),x=e.clientX-rect.left;
  if(x<rect.width*.18){void move(-1);return;}
  if(x>rect.width*.82){void move(1);return;}
  if(manifest.format==='Comic'){const img=e.target.closest?.('.comic-page');if(img)focusComicPage(img,e.clientX,e.clientY);}
  else focusText(e.target);
});
$('reading').addEventListener('dblclick',e=>{const img=e.target.closest?.('.comic-page');if(img){e.preventDefault();focusComicPage(img,e.clientX,e.clientY);}});
$('reading').addEventListener('touchstart',e=>{
  if(e.touches.length===2){
    e.preventDefault();pinchStartDistance=distance(e.touches[0],e.touches[1]);pinchStartZoom=zoom;pinchStartFont=font;
  }
},{passive:false});
$('reading').addEventListener('touchmove',e=>{
  if(e.touches.length!==2||!pinchStartDistance||manifest?.format==='PDF')return;
  e.preventDefault();const ratio=distance(e.touches[0],e.touches[1])/pinchStartDistance;
  if(manifest.format==='Comic'){
    zoom=clamp(pinchStartZoom*ratio,1,4);
    const img=$('reading').querySelector('.comic-page');if(!img)return;
    const a=e.touches[0],b=e.touches[1],rect=img.getBoundingClientRect(),x=(a.clientX+b.clientX)/2,y=(a.clientY+b.clientY)/2;
    applyComicZoom(clamp((x-rect.left)/Math.max(1,rect.width)*100,0,100),clamp((y-rect.top)/Math.max(1,rect.height)*100,0,100));
  }else if(manifest.format==='Ebook'){
    font=clamp(Math.round(pinchStartFont*ratio),14,36);$('reading').style.fontSize=font+'px';
  }
},{passive:false});
$('reading').addEventListener('touchend',e=>{
  if(e.touches.length<2&&pinchStartDistance){pinchStartDistance=0;if(manifest?.format==='Ebook')localStorage.setItem('reader-font',String(font));}
},{passive:false});

document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight')void move(1);if(e.key==='ArrowLeft')void move(-1);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)void save();});setInterval(save,5000);

try{
  if(!/^\d+$/.test(asset||''))throw Error('Choose a book from Library.');status('Opening...');
  manifest=await api('./api/assets/'+asset+'/reader');const progress=await api('./api/assets/'+asset+'/reading-progress');revision=progress.revision;
  if(manifest.format==='PDF')manifest.parts=['Document'];
  for(const control of [zoomOut,fit,zoomIn])control.hidden=manifest.format!=='Comic';
  sound.hidden=manifest.format==='PDF';
  $('smaller').hidden=$('larger').hidden=manifest.format!=='Ebook';
  if(!manifest.parts.length)throw Error('This book has no readable pages.');
  manifest.parts.forEach((name,i)=>$('sections').add(new Option(name,String(i))));
  await show(Math.min(progress.part,manifest.parts.length-1),progress.fraction);
}catch(e){status(e.message);}
