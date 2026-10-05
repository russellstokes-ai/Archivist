import {openNativeZip,BookZip} from './nativeZip';
import JSZip from 'jszip';
import {EncodingType, readAsStringAsync} from 'expo-file-system/legacy';
import {speechFocusBrowserSource} from './speechFocus';
import {openCbrPages, readCbtImages, ArchiveImage} from './archiveReader';

export type LocalReaderPage = {mime:string;base64:string};
export type LocalReaderDocument = {
  dispose?:()=>Promise<void>;
  html?: string;
  uri?: string;
  pageCount?: number;
  loadPage?: (index:number)=>Promise<LocalReaderPage>;
};

const imageExt = /\.(jpe?g|png|gif|webp)$/i;
const textExt = /\.(xhtml|html|htm)$/i;

export async function buildLocalReaderDocument(uri: string, format: string, title: string, initialPage = 0): Promise<LocalReaderDocument> {
  if (format === 'PDF') return {uri};
  if (format === 'Comic') {
    const ext=(uri.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1]||'').toLowerCase();
    if(ext==='cbr'){
      const pages=await openCbrPages(uri);
      if(!pages.pageCount)throw Error('No readable comic pages found.');
      return {...pages,html:shell(title,'<img id="comicPage" class="comic-page active" alt="Loading comic page">','comic',initialPage,pages.pageCount)};
    }
    if(ext==='cbt')return comicArchiveDocument(await readCbtImages(uri), title, initialPage);
    return comicDocument(uri, title, initialPage);
  }
  if (format === 'EPUB') return {html: await epubHtml(uri, title, initialPage)};
  return {uri};
}

async function comicDocument(uri: string, title: string, initialPage: number):Promise<LocalReaderDocument> {
  const zip = await zipFromUri(uri);
  const pages = Object.values(zip.files)
    .filter(file => !file.dir && imageExt.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}))
    .slice(0,500);
  if(!pages.length){await zip.dispose?.();throw Error('No readable comic pages found.');}
  return {
    dispose:()=>zip.dispose?.()||Promise.resolve(),
    html:shell(title,'<img id="comicPage" class="comic-page active" alt="Comic page">','comic',initialPage,pages.length),
    pageCount:pages.length,
    loadPage:async index=>{
      const page=pages[Math.max(0,Math.min(pages.length-1,Math.floor(index)))];
      return {mime:mime(page.name),base64:await page.async('base64')};
    },
  };
}

function comicArchiveDocument(images: ArchiveImage[], title: string, initialPage: number):LocalReaderDocument {
  const pages=images.slice(0,500);
  if(!pages.length)return {html:shell(title,'<p>No readable comic pages found.</p>','comic',0,0),pageCount:0};
  return {
    html:shell(title,'<img id="comicPage" class="comic-page active" alt="Comic page">','comic',initialPage,pages.length),
    pageCount:pages.length,
    loadPage:async index=>{
      const page=pages[Math.max(0,Math.min(pages.length-1,Math.floor(index)))];
      return {mime:page.mime,base64:page.base64};
    },
  };
}

async function epubHtml(uri: string, title: string, initialPage: number) {
  const zip = await zipFromUri(uri);
  try{
  const docs = Object.values(zip.files)
    .filter(file => !file.dir && textExt.test(file.name))
    .sort((a, b) => scoreEpubPath(a.name) - scoreEpubPath(b.name));
  const parts:string[]=[];
  for(const file of docs.slice(0,80)){
    const raw = await file.async('text');
    parts.push(`<section>${sanitizeEpubHtml(raw)}</section>`);
  }
  return shell(title, parts.join('\n') || '<p>No readable EPUB text found.</p>', 'epub', initialPage);
  }finally{await zip.dispose?.();}
}

async function zipFromUri(uri: string):Promise<BookZip> {
  const native=await openNativeZip(uri);if(native)return native;
  const data = await readAsStringAsync(uri, {encoding: EncodingType.Base64});
  return JSZip.loadAsync(data, {base64: true});
}

function shell(title: string, body: string, mode: 'comic' | 'epub', initialPage: number, externalPageCount = 0) {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title>
<style>
:root{--paper:#FAF8F2;--ink:#111111;--muted:#6B6B6B;--line:#E8E8E8;--sage:#47736F;--gold:#B99A68;--reader-scale:1}
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overscroll-behavior:none}
body{background:var(--paper);color:var(--ink);font:calc(18px * var(--reader-scale))/1.68 ui-serif,Georgia,serif;overflow:hidden;-webkit-tap-highlight-color:transparent}
main{width:100%;height:100%;margin:0;position:relative}
.reader-hud{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid color-mix(in srgb,var(--line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--paper) 90%,transparent);backdrop-filter:blur(16px);box-shadow:0 8px 28px #0002;transition:opacity .2s ease}
.reader-hud.dim{opacity:0;pointer-events:none}
.reader-hud button{appearance:none;border:0;background:transparent;color:var(--ink);font:700 12px system-ui,-apple-system,sans-serif;min-width:36px;height:32px;border-radius:999px;padding:0 9px}
.reader-hud button:active{background:color-mix(in srgb,var(--sage) 14%,transparent)}
.reader-position{font:700 12px system-ui,-apple-system,sans-serif;color:var(--muted);min-width:58px;text-align:center;font-variant-numeric:tabular-nums}
.turn-surface{position:absolute;inset:0;perspective:1400px;transform-style:preserve-3d}
.turn-surface.turn-next{animation:turnNext .52s cubic-bezier(.2,.72,.2,1)}
.turn-surface.turn-prev{animation:turnPrev .52s cubic-bezier(.2,.72,.2,1)}
@keyframes turnNext{0%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}45%{opacity:.9;transform:translateX(-5%) rotateY(-16deg) scale(.99)}50%{opacity:.68;transform:translateX(-2%) rotateY(-26deg) scale(.985)}55%{opacity:.74;transform:translateX(4%) rotateY(21deg) scale(.99)}100%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}}
@keyframes turnPrev{0%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}45%{opacity:.9;transform:translateX(5%) rotateY(16deg) scale(.99)}50%{opacity:.68;transform:translateX(2%) rotateY(26deg) scale(.985)}55%{opacity:.74;transform:translateX(-4%) rotateY(-21deg) scale(.99)}100%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}}

.comic main{display:flex;align-items:center;justify-content:center;background:#000000;padding:0;overflow:hidden;touch-action:none}
.comic .comic-page{display:none;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;transform-origin:center center;transition:transform .3s cubic-bezier(.2,.72,.2,1);will-change:transform,opacity;user-select:none;-webkit-user-drag:none}
.comic .comic-page.active{display:block}
.comic .comic-page.focused{cursor:zoom-out}
.speech-focus-overlay{position:fixed;z-index:80;margin:0;padding:0;border:0;background:transparent;outline:none;opacity:.82;transform:scale(1);transform-origin:center center;transition:left .34s cubic-bezier(.2,.72,.2,1),top .34s cubic-bezier(.2,.72,.2,1),width .34s cubic-bezier(.2,.72,.2,1),height .34s cubic-bezier(.2,.72,.2,1),opacity .22s ease,filter .22s ease;filter:drop-shadow(0 12px 22px #0008);cursor:zoom-out}
.speech-focus-overlay.open{opacity:1;filter:drop-shadow(0 18px 34px #000a)}
.speech-focus-overlay:focus-visible{outline:2px solid var(--gold);outline-offset:5px}
.speech-focus-overlay canvas{display:block;width:100%;height:100%}
.comic .reader-hud{--paper:#111111;--ink:#F5F5F5;--muted:#A0A0A0;--line:#252525}

.epub main{padding:26px 32px 72px;column-width:calc(100vw - 64px);column-gap:64px;column-fill:auto;overflow:hidden;height:100vh;scroll-behavior:auto}
.epub section{break-after:column;margin:0 auto;max-width:680px}
.epub img{max-width:100%;height:auto}
.epub h1,.epub h2,.epub h3{line-height:1.22;break-after:avoid}
.epub p{margin:0 0 1.05em}
.epub p,.epub li,.epub blockquote,.epub h1,.epub h2,.epub h3{transition:transform .18s ease,background .18s ease,padding .18s ease,border-radius .18s ease}
.epub .text-focused{transform:scale(1.16);transform-origin:center center;background:color-mix(in srgb,var(--gold) 12%,transparent);padding:.25em .4em;border-radius:.35em;position:relative;z-index:3}
html[data-reader-theme='paper']{--paper:#FAF8F2;--ink:#111111;--muted:#6B6B6B;--line:#E8E8E8;--sage:#47736F;--gold:#B99A68}\nhtml[data-reader-theme='sepia']{--paper:#F3EAD8;--ink:#352C22;--muted:#776B5C;--line:#DACDB6;--sage:#526F69;--gold:#B99A68}\nhtml[data-reader-theme='dark']{--paper:#111111;--ink:#F5F5F5;--muted:#A0A0A0;--line:#252525;--sage:#47736F;--gold:#B99A68}\n@media (prefers-color-scheme:dark){html:not([data-reader-theme]),html[data-reader-theme='system']{--paper:#111111;--ink:#F5F5F5;--muted:#A0A0A0;--line:#252525;--sage:#47736F;--gold:#B99A68}}
@media (prefers-reduced-motion:reduce){.turn-surface,.comic-page,.speech-focus-overlay,.epub p,.epub li,.epub blockquote,.epub h1,.epub h2,.epub h3{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body class="${mode}">
<main id="reader" class="turn-surface">${body}</main>
<div id="readerHud" class="reader-hud" aria-label="Reader controls">

  <span id="readerPosition" class="reader-position"></span>


</div>
<script>${speechFocusBrowserSource()}</script>
${readerInteractionScript(mode, initialPage, externalPageCount)}
</body>
</html>`;
}

function readerInteractionScript(mode: 'comic' | 'epub', initialPage: number, externalPageCount = 0) {
  return `<script>
(() => {
  // Android HTML WebViews can deny localStorage on opaque origins.
  const storage={getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>{try{localStorage.setItem(key,value);}catch{}}};
  const mode = '${mode}';
  const externalComicCount = ${Math.max(0, Math.floor(externalPageCount))};
  const reader = document.getElementById('reader');
  const hud = document.getElementById('readerHud');
  const position = document.getElementById('readerPosition');
  const speechFocus = window.__archivistSpeechFocus;
  const pages = [...document.querySelectorAll('.comic-page')];
  let page = Math.max(0, Number('${Math.max(0, Math.floor(initialPage))}') || 0);
  let turning = false;
  let zoom = 1;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let pinchStartScale = Number(storage.getItem('archivist-reader-text-scale')) || 1;
  let soundEnabled = storage.getItem('archivist-reader-sound') !== 'off';
  let hudTimer;
  let touchStart=null,pinchGesture=false,gestureKind='idle',lastTouchEndedAt=0;
  let drag=null,turnLayer=null,underLayer=null,settleTimer=null;
  const comicCache=new Map(),requestedPages=new Set();
  const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function requestPage(index){
    if(index<0||index>=pageCount()||comicCache.has(index)||requestedPages.has(index))return;
    requestedPages.add(index);post({type:'reader-page-request',page:index});
  }
  function clearTurn(){
    clearTimeout(settleTimer);turnLayer?.remove();underLayer?.remove();turnLayer=null;underLayer=null;
    const img=activeComicImage();if(img)img.style.visibility='';
    drag=null;turning=false;
  }
  function paintTurn(progress){
    if(!turnLayer||!drag)return;
    const signed=drag.direction>0?-1:1;
    const eased=clamp(progress,0,1);
    turnLayer.style.transform='perspective(1600px) translateX('+(signed*eased*12)+'%) rotateY('+(signed*eased*150)+'deg) scale('+(1-eased*.012)+')';
    turnLayer.style.filter='brightness('+(1-eased*.34)+')';
    turnLayer.style.boxShadow=(-signed*eased*26)+'px 0 34px #0008';
    drag.progress=eased;
  }
  function beginTurn(direction,originX=0,startedAt=Date.now()){
    if(mode!=='comic'||zoom>1.01||turning||page+direction<0||page+direction>=pageCount())return false;
    const img=activeComicImage();if(!img||!img.src||!img.getBoundingClientRect)return false;
    speechFocus?.cancel?.();
    const rect=img.getBoundingClientRect();
    drag={direction,progress:0,target:page+direction,startX:originX,startAt:startedAt,lastX:originX,lastAt:startedAt,velocity:0};
    if(externalComicCount)requestPage(drag.target);
    underLayer=img.cloneNode(false);turnLayer=img.cloneNode(false);
    for(const layer of [underLayer,turnLayer]){
      layer.removeAttribute('id');layer.className='comic-turn-layer';
      Object.assign(layer.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',maxHeight:'none',display:'block',objectFit:'contain',pointerEvents:'none',background:'#eee9d5',zIndex:'50',transform:'none'});
      document.body.append(layer);
    }
    const next=externalComicCount?comicCache.get(drag.target):pages[drag.target]?.src;
    if(next)underLayer.src=next;else underLayer.removeAttribute('src');
    turnLayer.style.zIndex='51';turnLayer.style.transformOrigin=direction>0?'left center':'right center';
    turnLayer.style.backfaceVisibility='hidden';img.style.visibility='hidden';
    return true;
  }
  function finishTurn(commit){
    if(!drag)return;
    const target=drag.target;turning=true;
    const duration=reducedMotion()?0:Math.max(140,Math.round(320*(commit?1-drag.progress:drag.progress)));
    if(turnLayer)turnLayer.style.transition='transform '+duration+'ms cubic-bezier(.2,.7,.2,1),filter '+duration+'ms';
    paintTurn(commit?1:0);
    settleTimer=setTimeout(()=>{
      if(commit){page=target;resetComicZoom();showComic(page);pageSound();refreshHud();reportPosition();}
      clearTurn();
    },duration);
  }
  let lastTapAt=0,lastTapX=0,lastTapY=0,suppressClickUntil=0,singleTapTimer=null;
  function scheduleSingleTap(){
    clearTimeout(singleTapTimer);
    singleTapTimer=setTimeout(()=>{
      lastTapAt=0;
      post({type:'reader-chrome-toggle'});
      refreshHud();
    },330);
  }

  document.documentElement.style.setProperty('--reader-scale', String(Math.max(.78, Math.min(1.5, pinchStartScale))));

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function distance(a,b){const x=a.clientX-b.clientX,y=a.clientY-b.clientY;return Math.sqrt(x*x+y*y);}
  function pageCount(){
    if(mode==='comic') return Math.max(1,externalComicCount||pages.length);
    return Math.max(1,Math.ceil(reader.scrollWidth / Math.max(1,innerWidth)));
  }
  function activeComicImage(){return externalComicCount?pages[0]:pages[page];}
  function reportPosition(){
    try{
      const count=pageCount();
      window.ReactNativeWebView?.postMessage(JSON.stringify({type:'reader-position',page,count,complete:page>=count-1}));
    }catch{}
  }
  function refreshHud(){
    position.textContent=(page+1)+' / '+pageCount();
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
    speechFocus?.cancel?.();
    zoom=1;
    const img=activeComicImage();
    if(img){img.classList.remove('focused');img.style.transform='scale(1)';img.style.transformOrigin='center center';}
  }
  function displayComic(index,src){
    const img=pages[0];if(!img)return;
    img.alt='Page '+(index+1);img.dataset.page=String(index);
    img.onerror=()=>post({type:'reader-page-error',page:index});
    img.src=src;img.classList.add('active');refreshHud();
  }
  function showComic(index){
    if(externalComicCount){
      const cached=comicCache.get(index);
      if(cached)displayComic(index,cached);else requestPage(index);
      requestPage(index+1);requestPage(index-1);return;
    }
    pages.forEach((img,i)=>img.classList.toggle('active',i===index));
  }
  window.__archivistSetComicPage=(index,mimeType,base64)=>{
    if(mode!=='comic'||!externalComicCount)return;
    requestedPages.delete(index);
    if(Math.abs(index-page)>1&&index!==drag?.target)return;
    const src='data:'+String(mimeType||'image/jpeg')+';base64,'+String(base64||'');
    comicCache.set(index,src);
    for(const key of comicCache.keys())if(Math.abs(key-page)>1&&key!==drag?.target)comicCache.delete(key);
    if(drag?.target===index&&underLayer)underLayer.src=src;
    if(index===page)displayComic(index,src);
  };
  function move(delta){
    if(turning || (mode==='comic' && zoom>1.01))return;
    const count=pageCount(),target=clamp(page+delta,0,count-1);
    if(target===page)return;
    if(mode==='comic'&&beginTurn(delta>0?1:-1)){finishTurn(true);return;}
    turning=true;
    const cls=delta>0?'turn-next':'turn-prev';
    reader.classList.add(cls);pageSound();
    setTimeout(()=>{
      page=target;
      if(mode==='comic'){resetComicZoom();showComic(page);}
      else reader.scrollLeft=page*innerWidth;
      refreshHud();reportPosition();
    },260);
    setTimeout(()=>{reader.classList.remove(cls);turning=false;},540);
  }
  function focusAt(target,x,y){
    if(mode==='comic'){
      const img=target?.closest?.('.comic-page');
      if(!img)return;
      if(speechFocus?.focus?.(img,x,y,'page-'+page))return;
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
    const now=Date.now();
    if(turning||now<suppressClickUntil||now-lastTouchEndedAt<600)return;
    if(event.detail===1)scheduleSingleTap();
    refreshHud();
  });

  reader.addEventListener('dblclick',event=>{
    event.preventDefault();
    const now=Date.now();
    if(now<suppressClickUntil||now-lastTouchEndedAt<600)return;
    clearTimeout(singleTapTimer);
    suppressClickUntil=now+420;
    focusAt(event.target,event.clientX,event.clientY);
    refreshHud();
  });

  reader.addEventListener('touchstart',event=>{
    clearTimeout(singleTapTimer);
    pinchGesture=event.touches.length>1;
    if(event.touches.length===1){
      const touch=event.touches[0];
      touchStart={x:touch.clientX,y:touch.clientY,time:Date.now()};
      gestureKind='tap';
    }else touchStart=null;
    if(event.touches.length===2){
      gestureKind='pinch';
      clearTurn();
      event.preventDefault();
      speechFocus?.cancel?.();
      pinchStartDistance=distance(event.touches[0],event.touches[1]);
      pinchStartZoom=zoom;
      pinchStartScale=Number(getComputedStyle(document.documentElement).getPropertyValue('--reader-scale'))||1;
    }
  },{passive:false});

  reader.addEventListener('touchmove',event=>{
    if(event.touches.length===1&&touchStart&&mode==='comic'&&zoom<=1.01&&!turning){
      const touch=event.touches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;
      if(!drag&&gestureKind==='tap'&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.35){
        if(beginTurn(dx<0?1:-1,touchStart.x,touchStart.time)){gestureKind='page-turn';lastTapAt=0;}
      }
      if(drag){
        event.preventDefault();
        const stamp=typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
        const dt=Math.max(1,stamp-drag.lastAt);
        drag.velocity=(touch.clientX-drag.lastX)/dt;
        drag.lastX=touch.clientX;drag.lastAt=stamp;
        paintTurn(clamp(-dx*drag.direction/Math.max(1,innerWidth),0,1));
        return;
      }
      if(Math.hypot(dx,dy)>18)gestureKind='pan';
    }
    if(event.touches.length!==2||!pinchStartDistance)return;
    gestureKind='pinch';
    event.preventDefault();
    const ratio=distance(event.touches[0],event.touches[1])/pinchStartDistance;
    if(mode==='comic'){
      const img=activeComicImage();if(!img)return;
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
    const now=Date.now();lastTouchEndedAt=now;
    if(event.touches.length<2&&pinchStartDistance){
      pinchStartDistance=0;
      if(mode==='epub'){
        const scale=Number(getComputedStyle(document.documentElement).getPropertyValue('--reader-scale'))||1;
        storage.setItem('archivist-reader-text-scale',String(scale));
        page=clamp(page,0,pageCount()-1);reader.scrollLeft=page*innerWidth;refreshHud();
      }
      if(!event.touches.length){gestureKind='idle';pinchGesture=false;touchStart=null;suppressClickUntil=now+440;}
      return;
    }
    if(event.touches.length||event.changedTouches.length!==1)return;
    const tap=event.changedTouches[0];
    if(pinchGesture||gestureKind==='pinch'){pinchGesture=false;gestureKind='idle';touchStart=null;suppressClickUntil=now+440;return;}
    if(drag){
      event.preventDefault();
      suppressClickUntil=now+440;lastTapAt=0;touchStart=null;gestureKind='idle';
      const flickForward=(-drag.velocity*drag.direction)>.42;
      finishTurn(drag.progress>.24||flickForward);
      return;
    }
    if(touchStart){
      const dx=tap.clientX-touchStart.x,dy=tap.clientY-touchStart.y;touchStart=null;
      if(gestureKind==='pan'||Math.hypot(dx,dy)>18){gestureKind='idle';lastTapAt=0;return;}
      if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.35){event.preventDefault();suppressClickUntil=now+440;gestureKind='idle';lastTapAt=0;move(dx<0?1:-1);return;}
    }
    gestureKind='idle';
    const delta=now-lastTapAt;
    const distanceFromLast=Math.hypot(tap.clientX-lastTapX,tap.clientY-lastTapY);
    if(delta>0&&delta<=320&&distanceFromLast<=30){
      clearTimeout(singleTapTimer);
      event.preventDefault();
      suppressClickUntil=now+440;
      lastTapAt=0;
      const target=document.elementFromPoint(tap.clientX,tap.clientY)||event.target;
      focusAt(target,tap.clientX,tap.clientY);
      refreshHud();
      return;
    }
    lastTapAt=now;lastTapX=tap.clientX;lastTapY=tap.clientY;
    scheduleSingleTap();
  },{passive:false});

  reader.addEventListener('touchcancel',()=>{clearTurn();clearTimeout(singleTapTimer);touchStart=null;pinchStartDistance=0;pinchGesture=false;gestureKind='idle';lastTapAt=0;});
  addEventListener('resize',()=>{clearTurn();if(mode==='epub'){page=clamp(page,0,pageCount()-1);reader.scrollLeft=page*innerWidth;}refreshHud();});
  document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1);});

  function post(payload){try{window.ReactNativeWebView?.postMessage(JSON.stringify(payload));}catch{}}
  function currentSelection(){const selection=window.getSelection?.();const text=selection?String(selection).trim():'';if(text)post({type:'reader-selection',page,text:text.slice(0,4000)});}
  document.addEventListener('selectionchange',()=>{clearTimeout(window.__archivistSelectionTimer);window.__archivistSelectionTimer=setTimeout(currentSelection,180);});
  function clearSearch(){document.querySelectorAll('[data-archivist-search]').forEach(node=>{const parent=node.parentNode;if(parent){parent.replaceChild(document.createTextNode(node.textContent||''),node);parent.normalize();}});}
  function searchText(term){
    clearSearch();term=String(term||'').trim();if(!term){post({type:'reader-search-results',count:0});return;}
    const needle=term.toLowerCase();let count=0,first=null;
    document.querySelectorAll('p,li,blockquote,h1,h2,h3').forEach(el=>{if(mode!=='epub')return;const value=el.textContent||'';const index=value.toLowerCase().indexOf(needle);if(index<0)return;count++;if(!first)first=el;});
    if(first){first.classList.add('text-focused');first.scrollIntoView({block:'center',inline:'center'});}
    post({type:'reader-search-results',count});
  }
  function applyAppearance(value){
    soundEnabled=value?.sound!==false;storage.setItem('archivist-reader-sound',soundEnabled?'on':'off');
    const scale=clamp(Number(value?.scale)||1,.78,1.5);document.documentElement.style.setProperty('--reader-scale',String(scale));
    const theme=['system','paper','sepia','dark'].includes(value?.theme)?value.theme:'system';document.documentElement.dataset.readerTheme=theme;
    storage.setItem('archivist-reader-text-scale',String(scale));
    if(mode==='epub'){page=clamp(page,0,pageCount()-1);reader.scrollLeft=page*innerWidth;}refreshHud();
  }
  function handleCommand(event){
    let message=event?.data;try{if(typeof message==='string')message=JSON.parse(message);}catch{return;}
    if(!message||message.type!=='reader-command')return;
    if(message.command==='appearance')applyAppearance(message.value||{});
    if(message.command==='search')searchText(message.query||'');
    if(message.command==='goto'&&Number.isInteger(message.page)){const target=clamp(message.page,0,pageCount()-1);if(target!==page){page=target;if(mode==='comic'){resetComicZoom();showComic(page);}else reader.scrollLeft=page*innerWidth;refreshHud();reportPosition();}}
  }
  window.addEventListener('message',handleCommand);document.addEventListener('message',handleCommand);

  requestAnimationFrame(()=>{
    page=clamp(page,0,pageCount()-1);
    if(mode==='comic')showComic(page);
    else reader.scrollLeft=page*innerWidth;
    refreshHud();reportPosition();post({type:'reader-ready',page,count:pageCount()});
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

export function readerHostBridgeSource(){
  return `(function(){
    if(window.__archivistHostBridgeInstalled)return true;
    window.__archivistHostBridgeInstalled=true;
    const post=(payload)=>{try{window.ReactNativeWebView?.postMessage(JSON.stringify(payload));}catch{}};
    const applyAppearance=(value)=>{const scale=Math.max(.78,Math.min(1.5,Number(value?.scale)||1));document.documentElement.style.fontSize=(scale*100)+'%';const theme=value?.theme||'system';document.documentElement.dataset.archivistTheme=theme;if(theme==='paper'){document.documentElement.style.background='#FAF8F2';document.documentElement.style.color='#111111';}else if(theme==='sepia'){document.documentElement.style.background='#F3EAD8';document.documentElement.style.color='#352C22';}else if(theme==='dark'){document.documentElement.style.background='#111111';document.documentElement.style.color='#F5F5F5';}else{document.documentElement.style.background='';document.documentElement.style.color='';}};
    const search=(query)=>{const needle=String(query||'').trim().toLowerCase();let count=0,first=null;if(needle)document.querySelectorAll('p,li,blockquote,h1,h2,h3').forEach(el=>{if((el.textContent||'').toLowerCase().includes(needle)){count++;if(!first)first=el;}});if(first)first.scrollIntoView({block:'center'});post({type:'reader-search-results',count});};
    const handle=(event)=>{let m=event?.data;try{if(typeof m==='string')m=JSON.parse(m);}catch{return;}if(!m||m.type!=='reader-command')return;if(m.command==='appearance')applyAppearance(m.value||{});if(m.command==='search')search(m.query||'');if(m.command==='goto'&&Number.isInteger(m.page))post({type:'reader-goto-unsupported',page:m.page});};
    window.addEventListener('message',handle);document.addEventListener('message',handle);
    document.addEventListener('selectionchange',()=>{clearTimeout(window.__archivistHostSelection);window.__archivistHostSelection=setTimeout(()=>{const text=String(window.getSelection?.()||'').trim();if(text)post({type:'reader-selection',page:0,text:text.slice(0,4000)});},180);});
    const ready=()=>post({type:'reader-ready',page:0,count:0});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else setTimeout(ready,0);
    return true;
  })();true;`;
}
