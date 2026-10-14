(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pageSize = 80;
  const metadataFields = [
    ['title','Title','text'], ['author','Author / creator','text'],
    ['series','Series','text'], ['seriesNumber','Series / issue number','number'],
    ['genre','Genre','text'], ['publishedYear','Publication year','number'],
    ['narrator','Narrator','text'], ['publisher','Publisher','text'],
    ['isbn','ISBN','text'], ['asin','ASIN','text'],
    ['language','Language','text'], ['description','Description','textarea']
  ];
  let activeView='library', offset=0, rows=[], selected=new Set(), requestId=0, timer=0, editing=null;
  const selectedDetails=new Map();
  const savedViewsKey='archivist-manager-v1-views';
  const e=(tag,text,className)=>{
    const node=document.createElement(tag);
    if(text!==undefined)node.textContent=String(text);
    if(className)node.className=className;
    return node;
  };
  async function api(path, method='GET', payload) {
    const response=await fetch(path,{method,headers:{'Content-Type':'application/json','X-Archivist-Action':'1'},credentials:'same-origin',body:payload===undefined?undefined:JSON.stringify(payload)});
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.includes('application/json'))throw Error('Server response unavailable. Sign in to Archivist and retry.');
    const body=await response.json();
    if(!response.ok)throw Error(typeof body.error==='string'?body.error:'Request failed ('+response.status+')');
    return body;
  }
  function notice(message='',error=false){
    const n=$('notice');n.textContent=message;n.hidden=!message;n.classList.toggle('is-error',error);
  }
  const s=id=>$(id).value;
  function params(){
    const query=new URLSearchParams({limit:String(pageSize),offset:String(offset),sort:s('sort')});
    const mappings=[['q',s('search').trim()],['space',s('space')],['format',s('format')],['availability',s('availability')]];
    for(const [key,value] of mappings){if(value)query.set(key,value)}
    if(activeView==='review')query.set('review','1');
    return query;
  }
  function choose(item,checked){if(checked){selected.add(item.id);selectedDetails.set(item.id,item)}else{selected.delete(item.id);selectedDetails.delete(item.id)}}
  function updateSelected(){
    $('selected-count').textContent=selected.size+' selected';
    $('clear-selection').disabled=selected.size===0;
    $('export-selection').disabled=selected.size===0;
    $('select-page').checked=rows.length>0&&rows.every(item=>selected.has(item.id));
    $('select-page').indeterminate=rows.some(item=>selected.has(item.id))&&!$('select-page').checked;
  }
  function renderRows(){
    const body=$('records');body.replaceChildren();
    if(!rows.length){
      const tr=e('tr'),td=e('td','No matching files. Try clearing the filters.','empty');
      td.colSpan=7;tr.append(td);body.append(tr);
    }
    for(const item of rows){
      const tr=e('tr');tr.dataset.id=String(item.id);
      const choose=e('td'),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(item.id);check.setAttribute('aria-label','Select '+(item.title||'file'));check.onchange=()=>{choose(item,check.checked);updateSelected()};choose.append(check);
      const title=e('td');const titleName=e('strong',item.title||'Untitled');title.append(titleName,e('span',item.author||'Unknown author','subtext'));
      const series=e('td');series.textContent=(item.series||'—')+(item.seriesNumber?' · #'+item.seriesNumber:'');
      const format=e('td',item.format||'Unknown');
      const space=e('td',item.space||'—');
      const status=e('td');const chip=e('span',item.needsReview?'Needs review':item.available?'Ready':'Unavailable','pill '+(item.needsReview?'warn':item.available?'ok':'muted'));status.append(chip);
      if(item.needsReview&&item.reviewReason)status.append(e('small',item.reviewReason,'reason'));
      const edit=e('td'),button=e('button','Edit','edit-button');button.type='button';button.setAttribute('aria-label','Edit metadata for '+(item.title||'file'));button.onclick=()=>openEditor(item);edit.append(button);
      tr.append(choose,title,series,format,space,status,edit);body.append(tr);
    }
    $('range').textContent=rows.length?'Showing '+(offset+1)+'–'+(offset+rows.length)+' matching files':'No matching files';
    $('page-label').textContent='Page '+(Math.floor(offset/pageSize)+1);
    $('previous').disabled=offset===0;
    $('next').disabled=rows.length<pageSize;
    updateSelected();
  }
  async function loadCatalogue(){
    const id=++requestId;
    $('range').textContent='Loading…';
    try{
      const results=await api('./api/books?'+params());
      if(id!==requestId)return;
      if(!Array.isArray(results))throw Error('Invalid catalogue response.');
      rows=results;renderRows();notice();
    }catch(err){if(id===requestId){rows=[];renderRows();notice(err.message,true)}}
  }
  async function findCandidates(){
    if(!editing)return;
    const query=$('candidate-query').value.trim();
    if(query.length<2){notice('Enter at least two characters to search.',true);return}
    const button=$('candidate-search-button'),box=$('candidate-results');
    button.disabled=true;box.replaceChildren(e('p','Searching Open Library…','subtext'));
    try{
      const response=await api('./api/manage/metadata-candidates?q='+encodeURIComponent(query));
      box.replaceChildren();
      const candidates=Array.isArray(response.candidates)?response.candidates:[];
      if(!candidates.length){box.append(e('p','No matches found. Your current metadata has not changed.','subtext'));return}
      for(const candidate of candidates){
        const card=e('article',undefined,'candidate-card');
        card.append(e('strong',candidate.title||'Untitled'),e('small',[candidate.author,candidate.publishedYear,candidate.publisher].filter(Boolean).join(' · '),'subtext'));
        const buttons=e('div',undefined,'candidate-fields');
        for(const [key,label] of [['title','Title'],['author','Author'],['publishedYear','Year'],['isbn','ISBN'],['publisher','Publisher']]){
          if(!candidate[key])continue;
          const field=$('editor-fields').querySelector('[name="'+key+'"]');if(!field)continue;
          const choose=e('button','Use '+label,'quiet');choose.type='button';choose.title='Replace '+label+': '+field.value+' → '+String(candidate[key]);
          choose.onclick=()=>{field.value=String(candidate[key]);field.focus();notice('Selected '+label+' from Open Library. Review your changes before saving.')};
          buttons.append(choose);
        }
        card.append(buttons);box.append(card);
      }
    }catch(err){box.replaceChildren(e('p','Provider search failed: '+err.message,'subtext'));notice(err.message,true)}
    finally{button.disabled=false}
  }
  function readSavedViews(){try{const x=JSON.parse(localStorage.getItem(savedViewsKey)||'[]');return Array.isArray(x)?x.filter(v=>v&&typeof v.name==='string'&&v.filters&&typeof v.filters==='object').slice(0,20):[]}catch{return []}}
  function updateViews(){const picker=$('saved-views');const views=readSavedViews();picker.replaceChildren(new Option('Choose saved view…',''));views.forEach((v,i)=>picker.add(new Option(v.name,String(i))))}
  function saveView(){const name=$('view-name').value.trim();if(!name){notice('Name the filter before saving.',true);$('view-name').focus();return}const filters={q:s('search'),space:s('space'),format:s('format'),availability:s('availability'),sort:s('sort'),review:activeView==='review'};const views=readSavedViews().filter(v=>v.name.toLowerCase()!==name.toLowerCase());views.unshift({name,filters});try{localStorage.setItem(savedViewsKey,JSON.stringify(views.slice(0,20)));$('view-name').value='';updateViews();notice('Saved filter: '+name)}catch{notice('This browser does not permit saving views.',true)}}
  function applyView(){const i=Number(s('saved-views'));const view=readSavedViews()[i];if(s('saved-views')===''||!view)return;const v=view.filters;activeView=v.review?'review':'library';$('view-library').hidden=false;$('view-health').hidden=true;for(const item of document.querySelectorAll('[data-view]')){item.classList.toggle('is-current',item.dataset.view===activeView);if(item.dataset.view===activeView)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')}for(const [id,key] of [['search','q'],['space','space'],['format','format'],['availability','availability'],['sort','sort']])$(id).value=v[key]||'';offset=0;loadCatalogue()}
  function exportSelected(){const items=[...selectedDetails.values()];if(!items.length)return;const columns=[['id','ID'],['title','Title'],['author','Author'],['series','Series'],['seriesNumber','Number'],['format','Format'],['space','Space'],['publishedYear','Year'],['genre','Genre'],['isbn','ISBN'],['metadataSource','Metadata source']];const cell=value=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text.trimStart()))text="'"+text;return '"'+text.replaceAll('"','""')+'"'};const lines=[columns.map(x=>cell(x[1])).join(','),...items.map(row=>columns.map(x=>cell(row[x[0]])).join(','))];const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'}));const anchor=e('a');anchor.href=url;anchor.download='archivist-selected-metadata.csv';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Exported '+items.length+' selected metadata records.')}
  function openEditor(item){
    editing=item;
    $('candidate-query').value=[item.title,item.author].filter(Boolean).join(' ');
    $('candidate-results').replaceChildren();
    $('editor-title').textContent='Edit '+(item.title||'metadata');
    $('editor-context').textContent=[item.format,item.space,'Source: '+(item.metadataSource||'not identified'),item.identificationConfidence?item.identificationConfidence+' confidence':null].filter(Boolean).join(' · ');
    const grid=$('editor-fields');grid.replaceChildren();
    for(const [name,caption,kind] of metadataFields){
      const label=e('label',caption);let field;
      if(kind==='textarea'){field=document.createElement('textarea');field.rows=3}
      else{field=document.createElement('input');field.type=kind;if(kind==='number'){field.step='any';field.inputMode='decimal'}}
      field.name=name;field.value=item[name]==null?'':String(item[name]);field.dataset.initial=field.value;label.append(field);grid.append(label);
    }
    $('editor').showModal();
    grid.querySelector('input')?.focus();
  }
  async function saveEditor(event){
    event.preventDefault();
    if(!editing)return;
    const button=$('save-editor'),changes={};
    for(const input of $('editor-fields').querySelectorAll('input,textarea')){
      if(input.value===input.dataset.initial)continue;
      const key=input.name;
      if(key==='seriesNumber'||key==='publishedYear'){
        if(!input.value.trim()){changes[key]=0;continue}
        const number=Number(input.value);if(!Number.isFinite(number)||key==='publishedYear'&&!Number.isInteger(number)){notice('Enter a valid '+key+'.',true);input.focus();return}
        changes[key]=number;
      }else{changes[key]=input.value.trim()}
    }
    if(!Object.keys(changes).length){$('editor').close();return}
    if(!window.confirm('Save these metadata changes? The current server marks the entire file as manually reviewed.'))return;
    button.disabled=true;notice('Saving metadata…');
    try{
      await api('./api/assets/'+encodeURIComponent(String(editing.id))+'/metadata','PATCH',changes);
      $('editor').close();selected.delete(editing.id);selectedDetails.delete(editing.id);editing=null;
      await Promise.all([loadCatalogue(),loadSummary()]);
      notice('Metadata saved and catalogue refreshed.');
    }catch(err){notice(err.message,true)}finally{button.disabled=false}
  }
  async function loadSummary(){
    const [summary,sources]=await Promise.all([api('./api/library-summary'),api('./api/sources')]);
    $('metric-works').textContent=Number(summary.total||0).toLocaleString();
    $('metric-review').textContent=Number(summary.needsReview||0).toLocaleString();
    $('metric-spaces').textContent=Array.isArray(summary.spaces)?summary.spaces.length:0;
    const unavailable=(summary.availability||[]).find(x=>x.name==='Unavailable');
    $('metric-unavailable').textContent=Number(unavailable?.count||0).toLocaleString();
    const picker=$('space'),before=picker.value;
    picker.replaceChildren(new Option('All spaces',''));
    for(const item of sources){if(item.space&&!Array.from(picker.options).some(o=>o.value===item.space))picker.add(new Option(item.space,item.space))}
    picker.value=Array.from(picker.options).some(o=>o.value===before)?before:'';
  }
  async function loadHealth(){
    const [sources,health,jobs]=await Promise.all([api('./api/sources'),api('./api/library-health'),api('./api/jobs')]);
    const list=$('source-health');list.replaceChildren();
    if(!sources.length)list.append(e('p','No source folders configured.','subtext'));
    const healthById=new Map((health.sources||[]).map(item=>[Number(item.id),item]));
    if((health.summary?.offlineSources||0)>0)list.append(e('p',health.summary.offlineSources+' source folder(s) disconnected. The indexed catalogue is preserved.','subtext'));
    for(const item of sources){
      const live=healthById.get(Number(item.id));
      const card=e('article',undefined,'health-row');
      const mount=live?.online===false?'Storage unavailable':live?.online===true?'Storage connected':'Storage not checked';
      card.append(e('strong',item.space||'Unnamed source'),e('span',mount+' · '+(item.status||'Not scanned'),'subtext'));
      card.append(e('small',(item.works||0)+' works · '+(live?.indexedFiles??item.files??0)+' indexed files · '+(live?.needsReview??0)+' need review','subtext'));list.append(card);
    }
    const tasks=$('jobs-health');tasks.replaceChildren();
    if(!jobs.length)tasks.append(e('p','No recent scan jobs.','subtext'));
    for(const job of jobs.slice(0,15)){
      const row=e('article',undefined,'health-row');
      row.append(e('strong','Source '+job.source_id+' · '+job.state),e('span',job.message||'','subtext'));
      const done=Number(job.progress||0),total=Number(job.total||0);
      if(total>0){const bar=e('progress');bar.max=total;bar.value=Math.min(total,done);row.append(bar)}
      tasks.append(row);
    }
  }
  function showView(view){
    activeView=view;
    $('view-library').hidden=view==='health';
    $('view-health').hidden=view!=='health';
    for(const item of document.querySelectorAll('[data-view]')){
      item.classList.toggle('is-current',item.dataset.view===view);
      if(item.dataset.view===view)item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    }
    if(view==='review'){$('sort').value='review';offset=0}
    if(view==='health'){loadHealth().catch(err=>notice(err.message,true));return}
    if(view==='library'){offset=0;$('filters').reset()}
    loadCatalogue();
  }
  async function boot(){
    try{
      const me=await api('./api/me');
      if(!me.owner){notice('Library Manager is available to the server administrator. Return to Archivist to access your own library.',true);return}
      $('app').hidden=false;
      notice();
      await loadSummary();
      await loadCatalogue();
    }catch(err){notice(err.message,true)}
  }
  $('candidate-search-button').onclick=findCandidates;
  $('candidate-query').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();findCandidates()}};
  $('editor-form').addEventListener('submit',saveEditor);
  $('close-editor').onclick=()=>{$('editor').close();editing=null};
  $('cancel-editor').onclick=()=>{$('editor').close();editing=null};
  $('filters').onsubmit=event=>{event.preventDefault();offset=0;loadCatalogue()};
  $('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{offset=0;loadCatalogue()},260)});
  for(const key of ['space','format','availability','sort'])$(key).addEventListener('change',()=>{offset=0;loadCatalogue()});
  $('reset').onclick=()=>{offset=0;$('filters').reset();loadCatalogue()};
  $('previous').onclick=()=>{if(offset){offset=Math.max(0,offset-pageSize);loadCatalogue()}};
  $('next').onclick=()=>{if(rows.length===pageSize){offset+=pageSize;loadCatalogue()}};
  $('select-page').onchange=event=>{for(const item of rows)choose(item,event.target.checked);renderRows()};
  $('clear-selection').onclick=()=>{selected.clear();selectedDetails.clear();renderRows()};
  $('export-selection').onclick=exportSelected;
  $('save-view').onclick=saveView;
  $('saved-views').onchange=applyView;
  updateViews();
  $('refresh-health').onclick=()=>loadHealth().catch(err=>notice(err.message,true));
  for(const item of document.querySelectorAll('[data-view]'))item.onclick=()=>showView(item.dataset.view);
  boot();
})();
