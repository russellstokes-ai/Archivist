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
function initials(title){return title.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'A'}

function coverFor(work){
  const wrap=element('div');wrap.className='cover';
  const fallback=element('span',initials(work.title));fallback.className='cover-initials';
  const img=element('img');img.loading='lazy';img.alt='';img.decoding='async';img.src='./api/works/'+work.id+'/cover';
  img.addEventListener('load',()=>wrap.classList.add('has-cover'));
  img.addEventListener('error',()=>img.remove());
  wrap.append(fallback,img);return wrap;
}

function workCard(work){
  const button=element('button');button.className='book';button.dataset.work=work.id;button.type='button';
  button.append(coverFor(work));
  const meta=element('div');meta.className='book-meta';
  const title=element('strong',work.title);const sub=element('small');
  sub.textContent=[work.author,work.series,work.format,work.space].filter(Boolean).join(' · ');
  meta.append(title,sub);
  if(work.files>1){const files=element('span',work.files+' files');files.className='file-count';meta.append(files)}
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
        const play=element('button','Play audiobook');play.className='primary';play.onclick=()=>{$('work-detail').hidden=true;openAudiobook(work.title,tracks,edition)};block.append(play);
      }else{
        for(const item of selected){
          const open=element('button','Open '+item.title);open.disabled=!item.available;open.onclick=()=>window.open('./reader.html?asset='+item.id,'_blank','noopener');block.append(open);
        }
      }
      content.append(block);
    }
    $('work-detail').hidden=false;
  }catch(e){message(e.message)}
  finally{activity('')}
}

async function loadBooks(append=false){
  const revision=++request;if(!append){libraryOffset=0;$('books').replaceChildren()}
  const params=new URLSearchParams({q:$('search').value,space:$('space').value,limit:String(pageSize),offset:String(libraryOffset)});
  if(libraryFormat)params.set('format',libraryFormat);
  const items=await api('./api/works?'+params.toString());
  if(revision!==request)return;
  for(const work of items)$('books').append(workCard(work));
  libraryOffset+=items.length;
  $('count').textContent=(summaryData?.total??libraryOffset)+' works in your library'+(libraryFormat?' · '+libraryFormat:'');
  $('load-more').hidden=items.length<pageSize;
  const filtered=libraryFormat||$('space').value||$('search').value.trim();
  $('clear-library-filter').hidden=!filtered;$('active-filter').hidden=!libraryFormat;
  if(libraryFormat){$('active-filter').textContent='Showing '+libraryFormat}
  if(!$('books').children.length){
    const empty=element('div');empty.className='empty-state';
    empty.append(element('strong',summaryData?.total?'No matches':'Your Shelf is ready for its first scan'),element('p',summaryData?.total?'Try another search or filter.':'Open Settings → Library & storage, add a folder and scan it. Sorting is optional.'));
    $('books').append(empty);
  }
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
  for(const item of (summaryData.formats||[]).slice(0,4)){
    const card=element('button');card.className='summary-card';card.append(element('strong',String(item.count)),element('span',item.name));
    card.onclick=()=>{libraryFormat=item.name;show('library');loadBooks(false).catch(e=>message(e.message))};$('library-summary').append(card)
  }
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
    const state=element('span',s.status||'Not scanned');state.className='status-pill';head.append(title,state);
    const actions=element('div');actions.className='source-actions';
    const scan=element('button','Scan / refresh');scan.className='primary';scan.onclick=async()=>{
      scan.disabled=true;scan.textContent='Starting scan…';activity('Starting scan',s.space);
      try{await api('./api/sources/'+s.id+'/scan','POST');message('Scan started. Shelf updates automatically when it completes.');pollJobs()}
      catch(e){message(e.message)}finally{activity('');scan.disabled=false;scan.textContent='Scan / refresh'}
    };
    const remove=element('button','Remove');remove.className='danger-quiet';remove.onclick=async()=>{
      if(!confirm('Remove this source and its catalogue entries? Original files will remain untouched.'))return;
      remove.disabled=true;remove.textContent='Removing…';activity('Removing source',s.space);
      try{await api('./api/sources/'+s.id,'DELETE');await loadSources();await loadLibrarySummary();await loadBooks(false);message('Source removed. Original files were not changed.')}
      catch(e){message(e.message)}finally{activity('');remove.disabled=false;remove.textContent='Remove'}
    };
    actions.append(scan,remove);row.append(head,actions);$('source-list').append(row)
  }
}

async function loadConfig(){
  if(!currentProfile?.owner)return;
  const [info,sessions]=await Promise.all([api('./api/server-info'),api('./api/sessions')]);
  $('config-summary').replaceChildren();
  for(const [label,value] of [['Server address',info.address],['Owner access',info.configured?'Ready':'Not set'],['Source folders',String(info.sources)],['Active scans',String(info.activeJobs)],['Signed-in sessions',String(info.sessions)]]){
    const row=element('p');row.append(element('strong',label+': '),document.createTextNode(value));$('config-summary').append(row)
  }
  $('owner-access-save').textContent=info.configured?'Replace access key':'Set access key';
  $('session-list').replaceChildren();if(!sessions.length)$('session-list').append(element('p','No active sessions.'));
  for(const s of sessions){const row=element('article');row.className='source';row.append(element('strong','Session '+s.id),element('p','Created '+new Date(s.created*1000).toLocaleString()),element('p','Expires '+new Date(s.expires*1000).toLocaleString()));$('session-list').append(row)}
}

function showSettings(name){
  document.querySelectorAll('[data-settings-panel]').forEach(p=>p.hidden=p.dataset.settingsPanel!==name);
  document.querySelectorAll('[data-settings]').forEach(b=>b.setAttribute('aria-current',b.dataset.settings===name?'page':'false'));
  if(name==='server')loadConfig().catch(e=>message(e.message));
}
function show(next){
  page=next;for(const p of ['library','atlas','settings'])$(p).hidden=p!==next;
  document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',b.dataset.page===next?'page':'false'));
  message('');if(next==='atlas')loadLibrarySummary().catch(e=>message(e.message));if(next==='settings')showSettings('library');
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
$('add').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button'),label=b.textContent;b.disabled=true;b.textContent='Adding…';activity('Adding source folder',$('new-space').value);try{await api('./api/sources','POST',{path:$('path').value,space:$('new-space').value});$('path').value='';await loadSources();message('Folder added. Scan it to build the Shelf.')}catch(e){message(e.message)}finally{activity('');b.disabled=false;b.textContent=label}};

let searchTimer;
$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadBooks(false).catch(e=>message(e.message)),180)};
$('space').onchange=()=>loadBooks(false).catch(e=>message(e.message));
$('load-more').onclick=()=>loadBooks(true).catch(e=>message(e.message));
$('clear-library-filter').onclick=()=>{libraryFormat='';$('search').value='';$('space').value='';loadBooks(false).catch(e=>message(e.message))};
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>show(b.dataset.page));
document.querySelectorAll('[data-settings]').forEach(b=>b.onclick=()=>showSettings(b.dataset.settings));
$('work-close').onclick=()=>{$('work-detail').hidden=true};
$('work-detail').addEventListener('click',e=>{if(e.target===$('work-detail'))$('work-detail').hidden=true});
$('close-player').onclick=()=>{$('audio').pause();$('audio').removeAttribute('src');$('audio').load();$('player').hidden=true};
$('audio').onerror=()=>message('Unable to play this file. Check availability and browser codec support.');

$('theme').value=localStorage.getItem('archivist-theme')||'system';
function theme(){document.documentElement.style.colorScheme=$('theme').value==='system'?'light dark':$('theme').value;localStorage.setItem('archivist-theme',$('theme').value)}
$('theme').onchange=theme;theme();

let folder='',parent='',jobTimer,jobSignature='';
async function browse(p=''){
  activity('Loading server folders',p||'Available roots');$('picker').hidden=false;$('folder-location').textContent='Loading folders…';$('folder-items').replaceChildren();$('folder-up').disabled=true;$('folder-use').disabled=true;
  try{
    const data=await api('./api/folders?path='+encodeURIComponent(p));folder=data.path||'';parent=data.parent||'';$('folder-location').textContent=folder||'Choose a starting folder';$('folder-up').disabled=!parent;$('folder-use').disabled=!folder;
    const items=Array.isArray(data.folders)?data.folders:[];
    for(const f of items){const row=element('div'),name=element('strong',f.name),open=element('button','Open'),use=element('button','Use folder');row.className='folder-row';open.type=use.type='button';open.onclick=()=>browse(f.path);use.onclick=()=>{$('path').value=f.path;$('picker').hidden=true;message('Folder selected. Choose Add folder to continue.')};row.append(name,element('p',f.path),open,use);$('folder-items').append(row)}
    if(!items.length)$('folder-items').append(element('p','No readable folders are available here.'));
  }catch(e){folder='';parent='';$('folder-location').textContent='Unable to browse server folders';$('folder-items').replaceChildren(element('p',e.message));message(e.message)}
  finally{activity('')}
}
const browseButton=element('button','Browse server folders');browseButton.type='button';browseButton.onclick=()=>browse($('path').value);$('add').append(browseButton);
$('folder-up').onclick=()=>browse(parent);$('folder-use').onclick=()=>{$('path').value=folder;$('picker').hidden=true};$('folder-close').onclick=()=>{$('picker').hidden=true};

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