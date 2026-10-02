const $=id=>document.getElementById(id);
let page='library',request=0,currentProfile=null,libraryOffset=0,libraryFormat='',summaryData=null;
const pageSize=60;

function message(text){$('status').textContent=text}
function activity(label,detail='',current=null,total=null){
  const box=$('activity'),bar=$('activity-progress');
  if(!label){box.hidden=true;bar.removeAttribute('value');bar.removeAttribute('max');return}
  box.hidden=false;$('activity-label').textContent=label;$('activity-detail').textContent=detail?(' · '+detail):'';
  if(Number.isFinite(current)&&Number.isFinite(total)&&total>0){bar.max=total;bar.value=Math.min(total,current)}else{bar.removeAttribute('value');bar.removeAttribute('max')}
}
async function api(url,method='GET',data){
  const res=await fetch(url,{method,headers:{'Content-Type':'application/json','X-Archivist-Action':'1'},body:data?JSON.stringify(data):undefined});
  if(!(res.headers.get('content-type')||'').includes('application/json'))throw Error('Archivist server response was not available.');
  const body=await res.json();if(!res.ok)throw Error(body.error||'Request failed');return body
}
function element(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}
const overlayFocus=new Map();
function showOverlay(id){
  const overlay=$(id);if(!overlay)return;
  if(overlay.hidden)overlayFocus.set(id,document.activeElement);
  overlay.hidden=false;
  requestAnimationFrame(()=>overlay.querySelector('[tabindex="-1"],button,[href],input,select,textarea')?.focus());
}
function hideOverlay(id){
  const overlay=$(id);if(!overlay)return;
  overlay.hidden=true;
  const previous=overlayFocus.get(id);overlayFocus.delete(id);
  if(previous&&typeof previous.focus==='function')requestAnimationFrame(()=>previous.focus());
}
document.addEventListener('keydown',event=>{
  const overlay=[...document.querySelectorAll('.picker-overlay:not([hidden]),.work-overlay:not([hidden])')].at(-1);
  if(!overlay)return;
  if(event.key==='Escape'){event.preventDefault();hideOverlay(overlay.id);return}
  if(event.key!=='Tab')return;
  const focusable=[...overlay.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
  if(!focusable.length){event.preventDefault();overlay.querySelector('[tabindex="-1"]')?.focus();return}
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});
function coverFor(work){
  const wrap=element('div');wrap.className='cover';
  let binding=2166136261;
  for(const char of (String(work.title||'Untitled')+'|'+String(work.author||'')).normalize('NFKC').toLowerCase())binding=Math.imul(binding^char.codePointAt(0),16777619);
  wrap.dataset.binding=String((binding>>>0)%5);
  const fallback=element('span');fallback.className='cover-fallback';
  const author=element('small',work.author&&work.author!=='Unknown author'?work.author:'Personal library');
  const title=element('strong',work.title||'Untitled');
  const imprint=element('small','ARCHIVIST');imprint.className='cover-imprint';
  fallback.append(author,title,imprint);
  const img=element('img');img.loading='lazy';img.alt='';img.decoding='async';img.src='./api/works/'+work.id+'/cover';
  img.addEventListener('load',()=>wrap.classList.add('has-cover'));
  img.addEventListener('error',()=>img.remove());
  wrap.append(fallback,img);return wrap;
}

function workCard(work){
  const button=element('button');button.className='book';button.dataset.work=work.id;button.type='button';
  button.setAttribute('aria-label',[work.title,work.author,work.format,work.available?'':'Unavailable'].filter(Boolean).join(' · '));
  button.append(coverFor(work));
  const meta=element('div');meta.className='book-meta';
  const title=element('strong',work.title);const sub=element('small');
  sub.textContent=work.author||'Unknown author';
  meta.append(title,sub);
  if(!work.available){const unavailable=element('small','Currently unavailable');meta.append(unavailable)}
  button.append(meta);button.onclick=()=>openWork(work);return button;
}

async function openWork(work){
  if(!work.available){message('This work is currently unavailable.');return}
  activity('Opening',work.title);
  try{
    const tracks=await api('./api/works/'+work.id+'/tracks');
    if(!tracks.length)throw Error('No readable files are available for this work.');
    const editions=[...new Set(tracks.map(t=>t.edition))];
    if(editions.length===1){
      const edition=editions[0],selected=tracks.filter(t=>t.edition===edition),format=selected[0]?.format;
      if(format==='Audio'){await openAudiobook(work.title,tracks,edition);return}
      if(selected.length===1){window.open('./reader.html?asset='+selected[0].id,'_blank','noopener');return}
    }
    const content=$('work-detail-content');content.replaceChildren();
    content.append(element('span',work.format));content.firstChild.className='eyebrow';
    content.append(element('h2',work.title));
    if(work.author)content.append(element('p',work.author+(work.series?' · '+work.series:'')));
    for(const edition of editions){
      const selected=tracks.filter(t=>t.edition===edition),format=selected[0]?.format||'Edition';
      const block=element('div');block.className='edition-card';block.append(element('strong',format+' edition'),element('p',selected.length+' file'+(selected.length===1?'':'s')));
      if(format==='Audio'){
        const play=element('button','Play audiobook');play.className='primary';play.onclick=()=>{hideOverlay('work-detail');openAudiobook(work.title,tracks,edition)};block.append(play);
      }else{
        for(const item of selected){
          const open=element('button','Open '+item.title);open.disabled=!item.available;open.onclick=()=>{hideOverlay('work-detail');window.open('./reader.html?asset='+item.id,'_blank','noopener')};block.append(open);
        }
      }
      content.append(block);
    }
    showOverlay('work-detail');
  }catch(e){message(e.message)}
  finally{activity('')}
}

async function loadBooks(append=false){
  const revision=++request;
  const box=$('books');box.setAttribute('aria-busy','true');$('load-more').disabled=true;
  syncFormatFilters();
  if(!append){
    libraryOffset=0;box.replaceChildren();
    for(let i=0;i<8;i++){
      const skeleton=element('div');skeleton.className='skeleton';skeleton.setAttribute('aria-hidden','true');
      for(const name of ['cover','skeleton-line','skeleton-line']){const part=element('div');part.className=name;skeleton.append(part)}
      box.append(skeleton);
    }
    $('count').textContent='Loading your library…';
  }
  try{
  const params=new URLSearchParams({q:$('search').value,space:$('space').value,limit:String(pageSize),offset:String(libraryOffset)});
  if(libraryFormat)params.set('format',libraryFormat);
  const items=await api('./api/works?'+params.toString());
  if(revision!==request)return;
  if(!append)box.replaceChildren();
  for(const work of items)$('books').append(workCard(work));
  libraryOffset+=items.length;
  const filtered=libraryFormat||$('space').value||$('search').value.trim();
  $('count').textContent=filtered?libraryOffset+' matching titles'+(items.length===pageSize?' loaded':''):(summaryData?.total??libraryOffset)+' titles';
  $('load-more').hidden=items.length<pageSize;
  $('clear-library-filter').hidden=!filtered;$('active-filter').hidden=!libraryFormat;
  if(libraryFormat){$('active-filter').textContent='Showing '+libraryFormat}
  if(!$('books').children.length){
    const empty=element('div');empty.className='empty-state';
    empty.append(element('strong',filtered?'No books found':'A home for your books'),element('p',filtered?'Try a different title, author or format.':currentProfile?.owner?'Add a source folder to begin your collection. Your original files stay where they are.':'Your library is waiting for its first books. Ask your server owner to add a source folder.'));
    if(filtered||currentProfile?.owner){
      const action=element('button',filtered?'Clear filters':'Add your first folder');action.className='primary';
      action.onclick=()=>filtered?$('clear-library-filter').click():show('settings');empty.append(action);
    }
    $('books').append(empty);
  }
  }catch(error){
    if(revision!==request)return;
    if(!append){
      box.replaceChildren();const state=element('div');state.className='empty-state';
      state.append(element('strong','Your library couldn’t load'),element('p',error.message));
      const retry=element('button','Try again');retry.className='primary';retry.onclick=()=>loadBooks(false);state.append(retry);box.append(state);
      $('count').textContent='Connection needs attention';
    }else message(error.message+' Choose Load more to retry.');
  }finally{if(revision===request){box.setAttribute('aria-busy','false');$('load-more').disabled=false}}
}

function syncFormatFilters(){
  for(const button of $('library-summary').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.format===libraryFormat));
}

function atlasButton(item,type){
  const b=element('button');b.className='atlas-item';b.append(element('strong',item.name),element('span',String(item.count)));
  b.onclick=()=>{
    if(type==='format'){libraryFormat=item.name;$('search').value=''}
    if(type==='space'){$('space').value=item.name;libraryFormat='';$('search').value=''}
    if(type==='author'){$('search').value=item.name;libraryFormat=''}
    show('library');loadBooks(false).catch(e=>message(e.message));
  };
  return b;
}

async function loadLibrarySummary(){
  summaryData=await api('./api/library-summary');
  $('library-total').replaceChildren(document.createTextNode(String(summaryData.total||0)),element('span','works'));
  $('library-summary').replaceChildren();
  for(const item of [{name:'All',count:summaryData.total},...(summaryData.formats||[])]){
    const card=element('button');card.className='summary-card';card.dataset.format=item.name==='All'?'':item.name;card.append(document.createTextNode(item.name),element('span',String(item.count||0)));
    card.onclick=()=>{libraryFormat=card.dataset.format;show('library');loadBooks(false).catch(e=>message(e.message))};$('library-summary').append(card)
  }
  syncFormatFilters();
  const fill=(id,items,type)=>{const box=$(id);box.replaceChildren();if(!items.length)box.append(element('p','Nothing here yet.'));for(const item of items)box.append(atlasButton(item,type))};
  fill('atlas-formats',summaryData.formats||[],'format');fill('atlas-spaces',summaryData.spaces||[],'space');fill('atlas-authors',summaryData.authors||[],'author');
}

async function loadSources(){
  const sources=await api('./api/sources'),value=$('space').value;
  $('space').replaceChildren(new Option('All spaces',''));$('spaces').replaceChildren();
  for(const name of [...new Set(sources.map(s=>s.space))]){$('space').add(new Option(name,name));$('spaces').append(new Option(name,name))}
  if([...$('space').options].some(o=>o.value===value))$('space').value=value;
  $('source-list').replaceChildren();
  if(!sources.length){const empty=element('div');empty.className='empty-state';empty.append(element('strong','No source folders yet'),element('p','Add a folder above to start building your Shelf.'));$('source-list').append(empty)}
  for(const s of sources){
    const row=element('article');row.className='source source-card';
    const head=element('div');head.className='source-head';const title=element('div');title.append(element('strong',s.space),element('p',s.path));
    const stats=element('div');stats.className='source-stats';
    for(const [label,value] of [['Works',s.works],['Audiobooks',s.audiobooks],['Comics',s.comics],['Ebooks',s.ebooks],['PDFs',s.pdfs]]){if(Number(value)>0){const chip=element('span',value+' '+label);stats.append(chip)}}
    if(stats.children.length)title.append(stats);
    const state=element('span',s.status||'Not scanned');state.className='status-pill';head.append(title,state);
    const actions=element('div');actions.className='source-actions';
    const scan=element('button','Scan / refresh');scan.className='primary';scan.onclick=async()=>{
      scan.disabled=true;scan.textContent='Starting scan…';activity('Starting scan',s.space);
      try{await api('./api/sources/'+s.id+'/scan','POST');message('Scan started. Shelf updates automatically when it completes.');pollJobs()}
      catch(e){message(e.message)}finally{activity('');scan.disabled=false;scan.textContent='Scan / refresh'}
    };
    const watchWrap=element('span');watchWrap.className='watch-controls';
    const watchEvery=element('select');watchEvery.setAttribute('aria-label','Automatic scan interval for '+s.space);
    for(const [label,minutes] of [['15 min',15],['1 hour',60],['6 hours',360],['Daily',1440],['Weekly',10080]])watchEvery.add(new Option(label,String(minutes)));
    watchEvery.value=String(s.watchMinutes||60);
    const watch=element('button',s.watched?'Stop watching':'Watch automatically');watch.type='button';
    watch.onclick=async()=>{
      watch.disabled=true;activity(s.watched?'Disabling watched folder':'Enabling watched folder',s.space);
      try{
        await api('./api/sources/'+s.id+'/watch','PATCH',{enabled:!s.watched,minutes:Number(watchEvery.value)});
        message(s.watched?'Automatic scans disabled.':'Automatic scans enabled. Archivist will only wake this source on the interval you chose.');
        await loadSources();await loadConfig();
      }catch(e){message(e.message)}finally{activity('');watch.disabled=false}
    };
    watchWrap.append(watchEvery,watch);
    const remove=element('button','Remove');remove.className='danger-quiet';remove.onclick=async()=>{
      if(!confirm('Remove this source and its catalogue entries? Original files will remain untouched.'))return;
      remove.disabled=true;remove.textContent='Removing…';activity('Removing source',s.space);
      try{await api('./api/sources/'+s.id,'DELETE');await loadSources();await loadLibrarySummary();await loadBooks(false);message('Source removed. Original files were not changed.')}
      catch(e){message(e.message)}finally{activity('');remove.disabled=false;remove.textContent='Remove'}
    };
    actions.append(scan,watchWrap,remove);row.append(head,actions);$('source-list').append(row)
  }
}

async function loadConfig(){
  if(!currentProfile?.owner)return;
  const [info,sessions]=await Promise.all([api('./api/server-info'),api('./api/sessions')]);
  $('config-summary').replaceChildren();
  const bytes=Number(info.databaseBytes||0),databaseSize=bytes<1024?'—':bytes<1024*1024?Math.round(bytes/1024)+' KB':(bytes/1024/1024).toFixed(1)+' MB';
  for(const [label,value] of [['Server address',info.address],['Owner access',info.configured?'Ready':'Not set'],['Source folders',String(info.sources)],['Watched folders',String(info.watchedSources||0)],['Active scans',String(info.activeJobs)],['Signed-in sessions',String(info.sessions)],['Database',databaseSize],['Dashboard media probes',info.mediaProbe?'Enabled':'Off']]){
    const row=element('p');row.append(element('strong',label+': '),document.createTextNode(value));$('config-summary').append(row)
  }
  $('owner-access-save').textContent=info.configured?'Replace access key':'Set access key';
  $('session-list').replaceChildren();if(!sessions.length)$('session-list').append(element('p','No active sessions.'));
  for(const s of sessions){const row=element('article');row.className='source';row.append(element('strong','Session '+s.id),element('p','Created '+new Date(s.created*1000).toLocaleString()),element('p','Expires '+new Date(s.expires*1000).toLocaleString()));$('session-list').append(row)}
}

function showSettings(name){
  document.querySelectorAll('[data-settings-panel]').forEach(p=>p.hidden=p.dataset.settingsPanel!==name);
  document.querySelectorAll('[data-settings]').forEach(b=>{
    const selected=b.dataset.settings===name;
    b.setAttribute('aria-selected',selected?'true':'false');
    b.tabIndex=selected?0:-1;
  });
  if(name==='server')loadConfig().catch(e=>message(e.message));
}
function show(next){
  page=next;for(const p of ['library','atlas','settings'])$(p).hidden=p!==next;
  document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',b.dataset.page===next?'page':'false'));
  message('');if(next==='atlas'){loadLibrarySummary().catch(e=>message(e.message));loadAtlasUniverse().catch(e=>{$('atlas-map-status').textContent=e.message;});}if(next==='settings')showSettings('library');
}

async function start(){
  currentProfile=await api('./api/me');
  await loadSources();await loadLibrarySummary();await loadBooks(false);
  $('setup').hidden=true;$('unlock').hidden=true;$('nav').hidden=false;
  document.querySelector('[data-page="settings"]').hidden=!currentProfile.owner;
  show('library');window.dispatchEvent(new Event('archivist-ready'))
}
async function boot(){try{await start()}catch(e){try{const setup=await api('./setup/status');$('setup').hidden=setup.configured;$('unlock').hidden=!setup.configured}catch(err){message(err.message)}}}

$('setup-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;b.textContent='Creating…';try{await api('./setup','POST',{token:$('setup-key').value});$('setup-key').value='';await start()}catch(e){message(e.message)}finally{b.disabled=false;b.textContent='Create access'}};
$('login').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;b.textContent='Unlocking…';try{await api('./unlock','POST',{token:$('key').value});$('key').value='';await start()}catch(e){message(e.message)}finally{b.disabled=false;b.textContent='Unlock'}};
$('owner-access-form').onsubmit=async e=>{e.preventDefault();const button=$('owner-access-save'),label=button.textContent;button.disabled=true;button.textContent='Saving…';activity('Saving server access key');try{await api('./api/owner-access','POST',{token:$('owner-access-key').value});$('owner-access-key').value='';message('Server access key saved.');await loadConfig()}catch(e){message(e.message)}finally{activity('');button.disabled=false;button.textContent=label}};
$('restore-button').onclick=async()=>{
  const file=$('restore-file').files?.[0];if(!file){message('Choose an Archivist backup file first.');return}
  if(!confirm('Stage this backup for restore? Archivist will apply it on the next server restart.'))return;
  const button=$('restore-button');button.disabled=true;activity('Checking backup',file.name);
  try{
    const res=await fetch('./api/restore',{method:'POST',headers:{'X-Archivist-Action':'1'},body:file});
    const body=await res.json();if(!res.ok)throw Error(body.error||'Restore could not be staged.');
    $('restore-file').value='';message('Backup verified and staged. Restart the Archivist add-on to apply it.');
  }catch(e){message(e.message)}finally{activity('');button.disabled=false}
};
$('add').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button'),label=b.textContent;b.disabled=true;b.textContent='Adding…';activity('Adding source folder',$('new-space').value);try{await api('./api/sources','POST',{path:$('path').value,space:$('new-space').value});$('path').value='';await loadSources();message('Folder added. Scan it to build the Shelf.')}catch(e){message(e.message)}finally{activity('');b.disabled=false;b.textContent=label}};

let searchTimer;
$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadBooks(false).catch(e=>message(e.message)),180)};
$('space').onchange=()=>loadBooks(false).catch(e=>message(e.message));
$('load-more').onclick=()=>loadBooks(true).catch(e=>message(e.message));
$('clear-library-filter').onclick=()=>{libraryFormat='';$('search').value='';$('space').value='';loadBooks(false).catch(e=>message(e.message))};
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>show(b.dataset.page));
document.querySelectorAll('[data-settings]').forEach(b=>{
  b.onclick=()=>showSettings(b.dataset.settings);
  b.onkeydown=event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...document.querySelectorAll('[data-settings]')],index=tabs.indexOf(b);
    let next=index;
    if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    event.preventDefault();showSettings(tabs[next].dataset.settings);tabs[next].focus();
  };
});
$('work-close').onclick=()=>hideOverlay('work-detail');
$('work-detail').addEventListener('click',e=>{if(e.target===$('work-detail'))hideOverlay('work-detail')});
$('close-player').onclick=()=>{$('audio').pause();$('audio').removeAttribute('src');$('audio').load();$('player').hidden=true};
$('audio').onerror=()=>message('Unable to play this file. Check availability and browser codec support.');

$('theme').value=localStorage.getItem('archivist-theme')||'system';
function theme(){document.documentElement.style.colorScheme=$('theme').value==='system'?'light dark':$('theme').value;localStorage.setItem('archivist-theme',$('theme').value)}
$('theme').onchange=theme;theme();

let folder='',parent='',jobTimer,jobSignature='';
async function browse(p=''){
  activity('Loading server folders',p||'Available roots');showOverlay('picker');$('folder-location').textContent='Loading folders…';$('folder-items').replaceChildren();$('folder-up').disabled=true;$('folder-use').disabled=true;
  try{
    const data=await api('./api/folders?path='+encodeURIComponent(p));folder=data.path||'';parent=data.parent||'';$('folder-location').textContent=folder||'Choose a starting folder';$('folder-up').disabled=!parent;$('folder-use').disabled=!folder;
    const items=Array.isArray(data.folders)?data.folders:[];
    for(const f of items){const row=element('div'),name=element('strong',f.name),open=element('button','Open'),use=element('button','Use folder');row.className='folder-row';open.type=use.type='button';open.onclick=()=>browse(f.path);use.onclick=()=>{$('path').value=f.path;hideOverlay('picker');message('Folder selected. Choose Add folder to continue.')};row.append(name,element('p',f.path),open,use);$('folder-items').append(row)}
    if(!items.length)$('folder-items').append(element('p','No readable folders are available here.'));
  }catch(e){folder='';parent='';$('folder-location').textContent='Unable to browse server folders';$('folder-items').replaceChildren(element('p',e.message));message(e.message)}
  finally{activity('')}
}
const browseButton=element('button','Browse server folders');browseButton.type='button';browseButton.onclick=()=>browse($('path').value);$('add').append(browseButton);
$('folder-up').onclick=()=>browse(parent);$('folder-use').onclick=()=>{$('path').value=folder;hideOverlay('picker')};$('folder-close').onclick=()=>hideOverlay('picker');

async function pollJobs(){
  clearTimeout(jobTimer);
  try{
    if(!currentProfile?.owner)return;
    const jobs=await api('./api/jobs');$('scan-jobs').hidden=jobs.length===0;$('jobs').replaceChildren();
    for(const j of jobs.slice(0,5)){
      const row=element('article');row.className='scan-card';const top=element('div');top.className='scan-head';const name=element('strong','Scan '+j.id);const state=element('span',j.state);state.className='status-pill '+(j.state==='failed'?'status-error':j.state==='complete'?'status-ok':'status-active');top.append(name,state);row.append(top,element('p',j.message||'Preparing scan…'));
      if(j.state==='queued'||j.state==='running'){const done=Number(j.progress||0),total=Number(j.total||0),pct=total>0?Math.min(100,Math.round(done/total*100)):0;const meta=element('div');meta.className='progress-meta';meta.append(element('span',total?done+' / '+total+' files':'Counting files…'),element('strong',total?pct+'%':'…'));const bar=element('progress');bar.max=total||1;bar.value=total?done:0;row.append(meta,bar)}
      $('jobs').append(row)
    }
    const signature=JSON.stringify(jobs);
    if(signature!==jobSignature){jobSignature=signature;await loadSources();await loadLibrarySummary();await loadBooks(false)}
  }catch(e){if(!$('unlock').hidden)return;message(e.message)}
  finally{jobTimer=setTimeout(pollJobs,2000)}
}

boot();pollJobs();

// Atlas uses catalogue identities and the canonical relationship endpoint for inspection.
let atlasLoadVersion=0;
async function loadAtlasUniverse(){
  const version=++atlasLoadVersion;
  $('atlas-map-status').textContent='Opening your reading universe…';
  const works=await api('./api/works?limit=200&offset=0');
  if(version!==atlasLoadVersion)return;
  const nodes=[],edges=[],byId=new Map();
  const hash=text=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
  const node=(id,label,kind,work)=>{if(byId.has(id))return byId.get(id);const seed=hash(id),angle=(seed%6283)/1000,r=100+seed%230;const n={id,label,kind,work,x:550+Math.cos(angle)*r,y:380+Math.sin(angle)*r};byId.set(id,n);nodes.push(n);return n;};
  for(const work of works){const w=node('work:'+work.id,work.title,'work',work);for(const kind of ['author','series','genre']){if(!work[kind])continue;const n=node(kind+':'+work[kind],work[kind],kind);edges.push({from:w,to:n});}}
  for(let iteration=0;iteration<65;iteration++){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.max(16,Math.hypot(dx,dy)),force=Math.min(4,1000/(d*d));a.x+=dx/d*force;a.y+=dy/d*force;b.x-=dx/d*force;b.y-=dy/d*force;}
    for(const {from:a,to:b} of edges){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-105)*.018;a.x+=dx/d*f;a.y+=dy/d*f;b.x-=dx/d*f;b.y-=dy/d*f;}
    for(const n of nodes){n.x=Math.max(70,Math.min(1030,n.x));n.y=Math.max(65,Math.min(695,n.y));}
  }
  const svg=$('atlas-graph'),camera=$('atlas-camera');camera.replaceChildren();
  const make=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
  let selected=null,selectionVersion=0,dragged=false,transform={x:0,y:0,k:1};
  const edgeEls=edges.map(e=>{const line=make('line',{x1:e.from.x,y1:e.from.y,x2:e.to.x,y2:e.to.y,class:'universe-edge'});camera.append(line);return line;});
  const nodeEls=[];
  async function select(n){
    selected=n;const requestVersion=++selectionVersion;
    const connected=new Set([n.id]);edges.forEach(e=>{if(e.from===n)connected.add(e.to.id);if(e.to===n)connected.add(e.from.id);});
    nodeEls.forEach(({node,el})=>{el.style.opacity=connected.has(node.id)?'1':'.18';el.classList.toggle('selected',node===n);});
    edgeEls.forEach((el,i)=>el.classList.toggle('connected',edges[i].from===n||edges[i].to===n));
    const inspector=$('atlas-inspector');inspector.replaceChildren(element('small',n.kind.toUpperCase()),element('h2',n.label));
    if(n.work){inspector.append(element('p',[n.work.author,n.work.series,n.work.format].filter(Boolean).join(' · ')));const button=element('button','Open book');button.onclick=()=>openWork(n.work);inspector.append(button);return;}
    const loading=element('p','Finding connections…');inspector.append(loading);
    try{const data=await api('./api/atlas-relationships?'+new URLSearchParams({kind:n.kind,value:n.label}));if(requestVersion!==selectionVersion)return;loading.textContent=(data.workCount||0)+' connected works';for(const work of (data.works||[]).slice(0,30)){const button=element('button',work.title);button.onclick=()=>openWork(work);inspector.append(button);}}
    catch(e){if(requestVersion===selectionVersion)loading.textContent=e.message;}
  }
  for(const n of nodes){const g=make('g',{class:'universe-node '+n.kind,transform:`translate(${n.x} ${n.y})`,tabindex:0,role:'button','aria-label':n.kind+' '+n.label});g.append(make('circle',{r:22,class:'node-target'}),make('circle',{r:n.kind==='work'?4.5:8,class:'node-dot'}));const label=make('text',{y:23,'text-anchor':'middle'});label.textContent=n.label.length>30?n.label.slice(0,29)+'…':n.label;if(n.kind==='work'&&nodes.some(other=>other!==n&&Math.abs(other.y-n.y)<24&&Math.abs(other.x-n.x)<145))label.classList.add('crowded-label');const title=make('title',{});title.textContent=n.label;g.append(label,title);g.onclick=()=>{if(!dragged)void select(n);};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();void select(n);}};camera.append(g);nodeEls.push({node:n,el:g});}
  const apply=()=>camera.setAttribute('transform',`translate(${transform.x} ${transform.y}) scale(${transform.k})`);
  const zoom=(factor,x=550,y=380)=>{const k=Math.max(.45,Math.min(3.5,transform.k*factor)),ratio=k/transform.k;transform={x:x-(x-transform.x)*ratio,y:y-(y-transform.y)*ratio,k};apply();};
  $('atlas-fit').onclick=()=>{transform={x:0,y:0,k:1};apply();};$('atlas-in').onclick=()=>zoom(1.2);$('atlas-out').onclick=()=>zoom(1/1.2);
  const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
  svg.onwheel=e=>{e.preventDefault();const p=point(e);zoom(e.deltaY>0?.9:1.1,p.x,p.y);};
  const pointers=new Map();let distance=0;
  svg.onpointerdown=e=>{dragged=false;pointers.set(e.pointerId,point(e));if(pointers.size===2){const [a,b]=[...pointers.values()];distance=Math.hypot(a.x-b.x,a.y-b.y);}};
  svg.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const [a,b]=[...pointers.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(distance>0)zoom(next/distance,(a.x+b.x)/2,(a.y+b.y)/2);distance=next;dragged=true;}else{const dx=p.x-old.x,dy=p.y-old.y;if(Math.abs(dx)+Math.abs(dy)>1){dragged=true;svg.setPointerCapture(e.pointerId);}transform.x+=dx;transform.y+=dy;apply();}};
  svg.onpointerup=svg.onpointercancel=e=>{pointers.delete(e.pointerId);};
  $('atlas-search').oninput=e=>{const q=e.target.value.trim().toLowerCase();nodeEls.forEach(({node,el})=>el.style.opacity=!q||node.label.toLowerCase().includes(q)?'1':'.12');};
  $('atlas-search').onkeydown=e=>{if(e.key==='Enter'){const q=e.target.value.trim().toLowerCase(),n=nodes.find(n=>n.label.toLowerCase().includes(q));if(n){void select(n);transform={x:550-n.x*1.4,y:380-n.y*1.4,k:1.4};apply();}}};
  $('atlas-map-status').textContent=works.length?`${works.length} works shown${summaryData?.total>works.length?' of '+summaryData.total:''} · drag to pan · pinch or scroll to zoom`:'Add books to begin your reading universe.';
}
