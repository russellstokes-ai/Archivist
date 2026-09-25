const $=id=>document.getElementById(id),asset=new URLSearchParams(location.search).get('asset');
let manifest,part=0,revision=0,busy=true,font=20,pdf,saveQueue=Promise.resolve(),conflict=false,loaded=false,renderTask,zoom=1,lastTap=0;
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
  $('previous').disabled=busy||part===0;$('next').disabled=busy||part>=manifest.parts.length-1;$('sections').disabled=busy;
  $('position').textContent=(part+1)+' / '+manifest.parts.length;
}
async function show(index,offset=0){
  busy=true;loaded=false;part=index;controls();$('reading').replaceChildren();$('sections').value=String(index);
  try{
    if(manifest.format==='Ebook'){
      const data=await api('./api/assets/'+asset+'/reader/'+index);
      // HTML comes only from the server's allowlist sanitizer, never raw EPUB bytes.
      if(typeof data.html==='string')$('reading').innerHTML=data.html;
      else for(const text of data.paragraphs){const p=document.createElement('p');p.textContent=text;$('reading').append(p);}
      await Promise.all([...$('reading').querySelectorAll('img')].map(img=>img.decode().catch(()=>undefined)));
    }else if(manifest.format==='Comic'){
      const img=document.createElement('img');img.alt='Page '+(index+1);img.className='comic-page';img.src='./api/assets/'+asset+'/reader/'+index;
      $('reading').append(img);await img.decode();img.style.width=Math.round($('reading').clientWidth*zoom)+'px';img.style.maxWidth='none';
    }else if(manifest.format==='PDF'){
      const frame=document.createElement('iframe');
      frame.src='./api/assets/'+asset;
      frame.title='PDF document';
      frame.style.width='100%';
      frame.style.height='calc(100vh - 170px)';
      frame.style.border='0';
      $('reading').append(frame);
      await new Promise(resolve=>{frame.onload=()=>resolve();setTimeout(resolve,500);});
    }else{
      throw Error('This format is not supported by the reader.');
    }
    loaded=true;await new Promise(requestAnimationFrame);scrollTo(0,offset*Math.max(0,document.documentElement.scrollHeight-innerHeight));status('');
  }catch(e){status(e.message);}finally{busy=false;controls();}
}
async function move(n){if(busy)return;await save();await show(Math.max(0,Math.min(manifest.parts.length-1,part+n)));}
$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);
$('sections').onchange=async()=>{if(busy)return;const next=Number($('sections').value);await save();await show(next);};
$('appearance').value=localStorage.getItem('reader-appearance')||'light dark';
function appearance(){document.documentElement.style.colorScheme=$('appearance').value;localStorage.setItem('reader-appearance',$('appearance').value);}
$('appearance').onchange=appearance;appearance();
font=Math.max(14,Math.min(36,Number(localStorage.getItem('reader-font'))||20));
function resize(n){font=Math.max(14,Math.min(36,font+n));$('reading').style.fontSize=font+'px';localStorage.setItem('reader-font',String(font));}
$('smaller').onclick=()=>resize(-2);$('larger').onclick=()=>resize(2);resize(0);
const zoomOut=document.createElement('button'),zoomIn=document.createElement('button'),fit=document.createElement('button');
zoomOut.textContent='-';zoomOut.setAttribute('aria-label','Zoom out');zoomOut.title='Zoom out';
zoomIn.textContent='+';zoomIn.setAttribute('aria-label','Zoom in');zoomIn.title='Zoom in';fit.textContent='Fit';
async function changeZoom(value){if(busy||!manifest||manifest.format==='Ebook')return;zoom=Math.max(.5,Math.min(3,value));const point=fraction();await show(part,point);}
zoomOut.onclick=()=>changeZoom(zoom-.25);zoomIn.onclick=()=>changeZoom(zoom+.25);fit.onclick=()=>changeZoom(1);
document.querySelector('.tools').append(zoomOut,fit,zoomIn);
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight')void move(1);if(e.key==='ArrowLeft')void move(-1);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)void save();});setInterval(save,5000);
function focusComicPage(img,x,y){
  if(manifest?.format!=='Comic')return;
  const rect=img.getBoundingClientRect(),px=Math.max(0,Math.min(100,(x-rect.left)/rect.width*100)),py=Math.max(0,Math.min(100,(y-rect.top)/rect.height*100));
  const active=img.classList.contains('focused');document.querySelectorAll('.comic-page.focused').forEach(page=>page.classList.remove('focused'));
  if(active)return;img.style.transformOrigin=px+'% '+py+'%';img.classList.add('focused');setTimeout(()=>img.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}),40);
}
document.addEventListener('dblclick',e=>{const img=e.target.closest?.('.comic-page');if(img){e.preventDefault();focusComicPage(img,e.clientX,e.clientY);}});
document.addEventListener('touchend',e=>{const now=Date.now(),touch=e.changedTouches?.[0],img=e.target.closest?.('.comic-page');if(img&&touch&&now-lastTap<320){e.preventDefault();focusComicPage(img,touch.clientX,touch.clientY);}lastTap=now;},{passive:false});
try{
  if(!/^\d+$/.test(asset||''))throw Error('Choose a book from Library.');status('Opening...');
  manifest=await api('./api/assets/'+asset+'/reader');const progress=await api('./api/assets/'+asset+'/reading-progress');revision=progress.revision;
  if(manifest.format==='PDF'){
    manifest.parts=['Document'];
  }
  for(const control of [zoomOut,fit,zoomIn])control.hidden=manifest.format==='Ebook'||manifest.format==='PDF';
  $('smaller').hidden=$('larger').hidden=manifest.format!=='Ebook';
  if(!manifest.parts.length)throw Error('This book has no readable pages.');
  manifest.parts.forEach((name,i)=>$('sections').add(new Option(name,String(i))));await show(Math.min(progress.part,manifest.parts.length-1),progress.fraction);
}catch(e){status(e.message);}
