import JSZip from 'jszip';
import {EncodingType, readAsStringAsync} from 'expo-file-system/legacy';

export type LocalReaderDocument = {
  html?: string;
  uri?: string;
};

const imageExt = /\.(jpe?g|png|gif|webp)$/i;
const textExt = /\.(xhtml|html|htm)$/i;

export async function buildLocalReaderDocument(uri: string, format: string, title: string, initialPage = 0): Promise<LocalReaderDocument> {
  if (format === 'PDF') return {uri};
  if (format === 'Comic') return {html: await comicHtml(uri, title, initialPage)};
  if (format === 'EPUB') return {html: await epubHtml(uri, title, initialPage)};
  return {uri};
}

async function comicHtml(uri: string, title: string, initialPage: number) {
  const zip = await zipFromUri(uri);
  const pages = Object.values(zip.files)
    .filter(file => !file.dir && imageExt.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
  const images = await Promise.all(pages.slice(0, 250).map(async (page, index) => {
    const base64 = await page.async('base64');
    return `<img class="comic-page${index === 0 ? ' active' : ''}" data-page="${index}" src="data:${mime(page.name)};base64,${base64}" alt="Page ${index + 1}">`;
  }));
  return shell(title, images.join('\n') || '<p>No readable comic pages found.</p>', 'comic', initialPage);
}

async function epubHtml(uri: string, title: string, initialPage: number) {
  const zip = await zipFromUri(uri);
  const docs = Object.values(zip.files)
    .filter(file => !file.dir && textExt.test(file.name))
    .sort((a, b) => scoreEpubPath(a.name) - scoreEpubPath(b.name));
  const parts = await Promise.all(docs.slice(0, 80).map(async file => {
    const raw = await file.async('text');
    return `<section>${sanitizeEpubHtml(raw)}</section>`;
  }));
  return shell(title, parts.join('\n') || '<p>No readable EPUB text found.</p>', 'epub', initialPage);
}

async function zipFromUri(uri: string) {
  const data = await readAsStringAsync(uri, {encoding: EncodingType.Base64});
  return JSZip.loadAsync(data, {base64: true});
}

function shell(title: string, body: string, mode: 'comic' | 'epub', initialPage: number) {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title>
<style>
:root{--paper:#f8f7f2;--ink:#0f2a36;--muted:#667778;--line:#d9dfdc;--sage:#397076;--gold:#c6a374;--reader-scale:1}
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overscroll-behavior:none}
body{background:var(--paper);color:var(--ink);font:calc(18px * var(--reader-scale))/1.7 Georgia,serif;overflow:hidden;-webkit-tap-highlight-color:transparent}
main{width:100%;height:100%;margin:0;position:relative}
.reader-hud{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid color-mix(in srgb,var(--line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--paper) 90%,transparent);backdrop-filter:blur(16px);box-shadow:0 8px 28px #0002;transition:opacity .2s ease}
.reader-hud.dim{opacity:.32}
.reader-hud button{appearance:none;border:0;background:transparent;color:var(--ink);font:700 12px system-ui,-apple-system,sans-serif;min-width:36px;height:32px;border-radius:999px;padding:0 9px}
.reader-hud button:active{background:color-mix(in srgb,var(--sage) 14%,transparent)}
.reader-position{font:700 12px system-ui,-apple-system,sans-serif;color:var(--muted);min-width:58px;text-align:center;font-variant-numeric:tabular-nums}
.turn-surface{position:absolute;inset:0;perspective:1400px;transform-style:preserve-3d}
.turn-surface.turn-next{animation:turnNext .24s cubic-bezier(.2,.72,.2,1)}
.turn-surface.turn-prev{animation:turnPrev .24s cubic-bezier(.2,.72,.2,1)}
@keyframes turnNext{0%{opacity:1;transform:translateX(0) rotateY(0)}48%{opacity:.55;transform:translateX(-3%) rotateY(-7deg)}52%{opacity:.55;transform:translateX(3%) rotateY(7deg)}100%{opacity:1;transform:translateX(0) rotateY(0)}}
@keyframes turnPrev{0%{opacity:1;transform:translateX(0) rotateY(0)}48%{opacity:.55;transform:translateX(3%) rotateY(7deg)}52%{opacity:.55;transform:translateX(-3%) rotateY(-7deg)}100%{opacity:1;transform:translateX(0) rotateY(0)}}

.comic main{display:flex;align-items:center;justify-content:center;background:#101314;padding:0;overflow:hidden;touch-action:none}
.comic .comic-page{display:none;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;transform-origin:center center;will-change:transform,opacity;user-select:none;-webkit-user-drag:none}
.comic .comic-page.active{display:block}
.comic .comic-page.focused{cursor:zoom-out}
.comic .reader-hud{--paper:#11181b;--ink:#f8f7f2;--muted:#b4c0c1;--line:#415052}

.epub main{padding:26px 32px 72px;column-width:calc(100vw - 64px);column-gap:64px;column-fill:auto;overflow:hidden;height:100vh;scroll-behavior:auto}
.epub section{break-after:column;margin:0}
.epub img{max-width:100%;height:auto}
.epub h1,.epub h2,.epub h3{line-height:1.22;break-after:avoid}
.epub p{margin:0 0 1.05em}
.epub p,.epub li,.epub blockquote,.epub h1,.epub h2,.epub h3{transition:transform .18s ease,background .18s ease,padding .18s ease,border-radius .18s ease}
.epub .text-focused{transform:scale(1.16);transform-origin:center center;background:color-mix(in srgb,var(--gold) 12%,transparent);padding:.25em .4em;border-radius:.35em;position:relative;z-index:3}
@media (prefers-color-scheme:dark){:root{--paper:#10191d;--ink:#edf2ef;--muted:#a8b6b5;--line:#314247;--sage:#6f9da1;--gold:#d4b988}}
</style>
</head>
<body class="${mode}">
<main id="reader" class="turn-surface">${body}</main>
<div id="readerHud" class="reader-hud" aria-label="Reader controls">
  <button id="readerPrev" aria-label="Previous page">‹</button>
  <span id="readerPosition" class="reader-position"></span>
  <button id="readerSound" aria-label="Toggle page turn sound">Sound</button>
  <button id="readerNext" aria-label="Next page">›</button>
</div>
${readerInteractionScript(mode, initialPage)}
</body>
</html>`;
}

function readerInteractionScript(mode: 'comic' | 'epub', initialPage: number) {
  return `<script>
(() => {
  const mode = '${mode}';
  const reader = document.getElementById('reader');
  const hud = document.getElementById('readerHud');
  const position = document.getElementById('readerPosition');
  const prev = document.getElementById('readerPrev');
  const next = document.getElementById('readerNext');
  const soundButton = document.getElementById('readerSound');
  const pages = [...document.querySelectorAll('.comic-page')];
  let page = Math.max(0, Number('${Math.max(0, Math.floor(initialPage))}') || 0);
  let turning = false;
  let zoom = 1;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let pinchStartScale = Number(localStorage.getItem('archivist-reader-text-scale')) || 1;
  let soundEnabled = localStorage.getItem('archivist-reader-sound') !== 'off';
  let hudTimer;

  document.documentElement.style.setProperty('--reader-scale', String(Math.max(.78, Math.min(1.5, pinchStartScale))));

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function distance(a,b){const x=a.clientX-b.clientX,y=a.clientY-b.clientY;return Math.sqrt(x*x+y*y);}
  function pageCount(){
    if(mode==='comic') return Math.max(1,pages.length);
    return Math.max(1,Math.ceil(reader.scrollWidth / Math.max(1,innerWidth)));
  }
  function reportPosition(){
    try{
      window.ReactNativeWebView?.postMessage(JSON.stringify({type:'reader-position',page,count:pageCount()}));
    }catch{}
  }
  function refreshHud(){
    position.textContent=(page+1)+' / '+pageCount();
    prev.disabled=page<=0;
    next.disabled=page>=pageCount()-1;
    soundButton.textContent=soundEnabled?'Sound on':'Sound off';
    clearTimeout(hudTimer);hud.classList.remove('dim');hudTimer=setTimeout(()=>hud.classList.add('dim'),1800);
  }
  function pageSound(){
    if(!soundEnabled)return;
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      const ctx=new AudioContext();
      const length=Math.floor(ctx.sampleRate*.09);
      const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
      const data=buffer.getChannelData(0);
      for(let i=0;i<length;i++){const t=i/length;data[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)*.13;}
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      filter.type='highpass';filter.frequency.value=850;
      gain.gain.setValueAtTime(.001,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.09,ctx.currentTime+.015);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.095);
      source.buffer=buffer;source.connect(filter).connect(gain).connect(ctx.destination);source.start();source.stop(ctx.currentTime+.1);
      source.onended=()=>ctx.close();
    }catch{}
  }
  function resetComicZoom(){
    zoom=1;
    const img=pages[page];
    if(img){img.classList.remove('focused');img.style.transform='scale(1)';img.style.transformOrigin='center center';}
  }
  function showComic(index){
    pages.forEach((img,i)=>img.classList.toggle('active',i===index));
  }
  function move(delta){
    if(turning || (mode==='comic' && zoom>1.01))return;
    const count=pageCount(),target=clamp(page+delta,0,count-1);
    if(target===page)return;
    turning=true;
    const cls=delta>0?'turn-next':'turn-prev';
    reader.classList.add(cls);pageSound();
    setTimeout(()=>{
      page=target;
      if(mode==='comic'){resetComicZoom();showComic(page);}
      else reader.scrollLeft=page*innerWidth;
      refreshHud();reportPosition();
    },115);
    setTimeout(()=>{reader.classList.remove(cls);turning=false;},260);
  }
  function focusAt(target,x,y){
    if(mode==='comic'){
      const img=target?.closest?.('.comic-page');
      if(!img)return;
      const rect=img.getBoundingClientRect();
      const px=clamp((x-rect.left)/Math.max(1,rect.width)*100,0,100);
      const py=clamp((y-rect.top)/Math.max(1,rect.height)*100,0,100);
      const wasFocused=zoom>1.01;
      zoom=wasFocused?1:2.45;
      img.classList.toggle('focused',!wasFocused);
      img.style.transformOrigin=px+'% '+py+'%';
      img.style.transform='scale('+zoom+')';
      return;
    }
    const text=target?.closest?.('p,li,blockquote,h1,h2,h3');
    if(!text)return;
    const active=text.classList.contains('text-focused');
    document.querySelectorAll('.text-focused').forEach(node=>node.classList.remove('text-focused'));
    if(!active){text.classList.add('text-focused');setTimeout(()=>text.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}),30);}
  }

  reader.addEventListener('click',event=>{
    if(turning)return;
    const x=event.clientX;
    if(x<innerWidth*.18){move(-1);return;}
    if(x>innerWidth*.82){move(1);return;}
    focusAt(event.target,event.clientX,event.clientY);
    refreshHud();
  });

  reader.addEventListener('dblclick',event=>{event.preventDefault();focusAt(event.target,event.clientX,event.clientY);refreshHud();});

  reader.addEventListener('touchstart',event=>{
    if(event.touches.length===2){
      event.preventDefault();
      pinchStartDistance=distance(event.touches[0],event.touches[1]);
      pinchStartZoom=zoom;
      pinchStartScale=Number(getComputedStyle(document.documentElement).getPropertyValue('--reader-scale'))||1;
    }
  },{passive:false});

  reader.addEventListener('touchmove',event=>{
    if(event.touches.length!==2||!pinchStartDistance)return;
    event.preventDefault();
    const ratio=distance(event.touches[0],event.touches[1])/pinchStartDistance;
    if(mode==='comic'){
      const img=pages[page];if(!img)return;
      zoom=clamp(pinchStartZoom*ratio,1,4);
      const a=event.touches[0],b=event.touches[1],rect=img.getBoundingClientRect();
      const x=(a.clientX+b.clientX)/2,y=(a.clientY+b.clientY)/2;
      img.style.transformOrigin=clamp((x-rect.left)/Math.max(1,rect.width)*100,0,100)+'% '+clamp((y-rect.top)/Math.max(1,rect.height)*100,0,100)+'%';
      img.style.transform='scale('+zoom+')';img.classList.toggle('focused',zoom>1.01);
    }else{
      const scale=clamp(pinchStartScale*ratio,.78,1.5);
      document.documentElement.style.setProperty('--reader-scale',String(scale));
    }
  },{passive:false});

  reader.addEventListener('touchend',event=>{
    if(event.touches.length<2&&pinchStartDistance){
      pinchStartDistance=0;
      if(mode==='epub'){
        const scale=Number(getComputedStyle(document.documentElement).getPropertyValue('--reader-scale'))||1;
        localStorage.setItem('archivist-reader-text-scale',String(scale));
        page=clamp(page,0,pageCount()-1);reader.scrollLeft=page*innerWidth;refreshHud();
      }
    }
  },{passive:false});

  prev.onclick=()=>move(-1);
  next.onclick=()=>move(1);
  soundButton.onclick=()=>{
    soundEnabled=!soundEnabled;
    localStorage.setItem('archivist-reader-sound',soundEnabled?'on':'off');
    if(soundEnabled)pageSound();
    refreshHud();
  };

  addEventListener('resize',()=>{if(mode==='epub'){page=clamp(page,0,pageCount()-1);reader.scrollLeft=page*innerWidth;}refreshHud();});
  document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1);});

  requestAnimationFrame(()=>{
    page=clamp(page,0,pageCount()-1);
    if(mode==='comic')showComic(page);
    else reader.scrollLeft=page*innerWidth;
    refreshHud();reportPosition();
  });
})();
</script>`;
}

function sanitizeEpubHtml(raw: string) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?(?:html|body)[^>]*>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(src|href)=["'](?!data:|#)[^"']*["']/gi, '');
}

function scoreEpubPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes('nav') || lower.includes('toc')) return 9000;
  if (lower.includes('cover')) return 8000;
  return 0;
}

function mime(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
}
