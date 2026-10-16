(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pageSize = 80;
  const assistPageSize = 40;
  let assistOffset = 0, assistRequest = 0;
  const metadataFields = [
    ['title','Title','text'], ['author','Author / creator','text'],
    ['series','Series','text'], ['seriesNumber','Series / issue number','number'],
    ['genre','Genre','text'], ['publishedYear','Publication year','number'],
    ['narrator','Narrator','text'], ['publisher','Publisher','text'],
    ['isbn','ISBN','text'], ['asin','ASIN','text'],
    ['language','Language','text'], ['description','Description','textarea']
  ];
  let activeView='library', offset=0, rows=[], selected=new Set(), requestId=0, timer=0, editing=null, candidateGeneration=0, editorEpoch=0;
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
      const selectionCell=e('td'),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(item.id);check.setAttribute('aria-label','Select '+(item.title||'file'));check.onchange=()=>{choose(item,check.checked);updateSelected()};selectionCell.append(check);
      const title=e('td');const titleName=e('strong',item.title||'Untitled');title.append(titleName,e('span',item.author||'Unknown author','subtext'));
      const series=e('td');series.textContent=(item.series||'—')+(item.seriesNumber?' · #'+item.seriesNumber:'');
      const format=e('td',item.format||'Unknown');
      const space=e('td',item.space||'—');
      const status=e('td');const chip=e('span',item.needsReview?'Needs review':item.available?'Ready':'Unavailable','pill '+(item.needsReview?'warn':item.available?'ok':'muted'));status.append(chip);
      if(item.needsReview&&item.reviewReason)status.append(e('small',item.reviewReason,'reason'));
      const edit=e('td'),button=e('button','Edit','edit-button');button.type='button';button.setAttribute('aria-label','Edit metadata for '+(item.title||'file'));button.onclick=()=>openEditor(item);edit.append(button);
      tr.append(selectionCell,title,series,format,space,status,edit);body.append(tr);
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
    const target=editing;
    const generation=++candidateGeneration;
    const query=$('candidate-query').value.trim();
    if(query.length<2){notice('Enter at least two characters to search.',true);return}
    const button=$('candidate-search-button'),box=$('candidate-results');
    button.disabled=true;box.replaceChildren(e('p','Searching Open Library…','subtext'));
    try{
      const response=await api('./api/manage/metadata-candidates?q='+encodeURIComponent(query));
      // A previous title's late provider response cannot populate this editor.
      if(generation!==candidateGeneration||editing!==target)return;
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
    }catch(err){
      if(generation===candidateGeneration&&editing===target){
        box.replaceChildren(e('p','Provider search failed: '+err.message,'subtext'));
        notice(err.message,true);
      }
    }finally{if(generation===candidateGeneration)button.disabled=false}
  }
  function readSavedViews(){try{const x=JSON.parse(localStorage.getItem(savedViewsKey)||'[]');return Array.isArray(x)?x.filter(v=>v&&typeof v.name==='string'&&v.filters&&typeof v.filters==='object').slice(0,20):[]}catch{return []}}
  function updateViews(){const picker=$('saved-views');const views=readSavedViews();picker.replaceChildren(new Option('Choose saved view…',''));views.forEach((v,i)=>picker.add(new Option(v.name,String(i))))}
  function saveView(){const name=$('view-name').value.trim();if(!name){notice('Name the filter before saving.',true);$('view-name').focus();return}const filters={q:s('search'),space:s('space'),format:s('format'),availability:s('availability'),sort:s('sort'),review:activeView==='review'};const views=readSavedViews().filter(v=>v.name.toLowerCase()!==name.toLowerCase());views.unshift({name,filters});try{localStorage.setItem(savedViewsKey,JSON.stringify(views.slice(0,20)));$('view-name').value='';updateViews();notice('Saved filter: '+name)}catch{notice('This browser does not permit saving views.',true)}}
  function applyView(){const i=Number(s('saved-views'));const view=readSavedViews()[i];if(s('saved-views')===''||!view)return;const v=view.filters;activeView=v.review?'review':'library';$('view-library').hidden=false;$('view-health').hidden=true;for(const item of document.querySelectorAll('[data-view]')){item.classList.toggle('is-current',item.dataset.view===activeView);if(item.dataset.view===activeView)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')}for(const [id,key] of [['search','q'],['space','space'],['format','format'],['availability','availability'],['sort','sort']])$(id).value=v[key]||'';offset=0;loadCatalogue()}
  function exportSelected(){const items=[...selectedDetails.values()];if(!items.length)return;const columns=[['id','ID'],['title','Title'],['author','Author'],['series','Series'],['seriesNumber','Number'],['format','Format'],['space','Space'],['publishedYear','Year'],['genre','Genre'],['isbn','ISBN'],['metadataSource','Metadata source']];const cell=value=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text.trimStart()))text="'"+text;return '"'+text.replaceAll('"','""')+'"'};const lines=[columns.map(x=>cell(x[1])).join(','),...items.map(row=>columns.map(x=>cell(row[x[0]])).join(','))];const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'}));const anchor=e('a');anchor.href=url;anchor.download='archivist-selected-metadata.csv';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Exported '+items.length+' selected metadata records.')}
  function invalidateCandidateLookup(){
    ++candidateGeneration;
    $('candidate-search-button').disabled=false;
  }
  function openEditor(item){
    // Opening a new editor invalidates even a save request for the same
    // record from an earlier dialog lifetime.
    editorEpoch++;
    invalidateCandidateLookup();
    $('save-editor').disabled=false;
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
    const target=editing,startedEpoch=editorEpoch;
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
    if(!Object.keys(changes).length){closeEditor();return}
    if(!window.confirm('Save these metadata changes? The current server marks the entire file as manually reviewed.'))return;
    button.disabled=true;notice('Saving metadata…');
    try{
      await api('./api/assets/'+encodeURIComponent(String(target.id))+'/metadata','PATCH',changes);
      // PATCH always belongs to the originally edited work, even if the user
      // has since closed its dialog or opened a different title.
      selected.delete(target.id);selectedDetails.delete(target.id);
      const stillCurrent=editing===target&&editorEpoch===startedEpoch;
      if(stillCurrent)closeEditor();
      await Promise.all([loadCatalogue(),loadSummary(),...(activeView==='assist'?[loadAssist()]:[])]);
      // Never close or replace the message/fields of a newer editor.
      if(stillCurrent&&!editing)notice('Metadata saved and catalogue refreshed.');
    }catch(err){
      if(editing===target&&editorEpoch===startedEpoch)notice(err.message,true);
    }finally{
      if(editing===target&&editorEpoch===startedEpoch)button.disabled=false;
    }
  }
  async function loadAssist(){
    const generation=++assistRequest,location=assistOffset;
    const container=$('assist-works');
    $('assist-range').textContent='Finding books that need review…';
    try {
      const result=await api('./api/manage/review-works?'+new URLSearchParams({limit:String(assistPageSize),offset:String(location)}));
      if(generation!==assistRequest||activeView!=='assist')return;
      const works=Array.isArray(result.works)?result.works:[];
      container.replaceChildren();
      if(!works.length){
        container.append(e('p',location?'No more books to review.':'All grouped books have completed their identification review.','empty'));
      }
      for(const work of works){
        const article=e('article',undefined,'assist-work');
        const cover=e('div',undefined,'assist-cover');
        cover.append(e('span',(work.title||'Book').slice(0,2).toUpperCase()));
        const artwork=e('img');artwork.loading='lazy';artwork.alt='';
        artwork.src='./api/works/'+encodeURIComponent(String(work.id))+'/cover';
        artwork.addEventListener('load',()=>cover.classList.add('has-cover'));
        artwork.addEventListener('error',()=>artwork.remove());
        cover.append(artwork);
        const details=e('div',undefined,'assist-details');
        details.append(e('strong',work.title||'Untitled'));
        details.append(e('span',[work.author||'Unknown author',work.series,work.format,work.space].filter(Boolean).join(' · '),'subtext'));
        details.append(e('span',Number(work.reviewFiles)+' of '+work.files+' files need review','pill '+(work.reviewFiles?'warn':'ok')));
        details.append(e('span',work.publicationState==='published'?'Published – review reopened':'Awaiting explicit publication','subtext'));
        const controls=e('div',undefined,'assist-controls');
        const reveal=e('button','Review book files','quiet');reveal.type='button';reveal.setAttribute('aria-expanded','false');
        const filePanel=e('div',undefined,'assist-files');filePanel.hidden=true;
        let fileOffset=0, fileGeneration=0;
        async function loadFiles(reset=false) {
          if(reset){fileOffset=0;filePanel.replaceChildren();}
          const token=++fileGeneration;
          reveal.disabled=true;
          try {
            const data=await api('./api/manage/review-works/'+encodeURIComponent(String(work.id))+'/files?'+new URLSearchParams({limit:'60',offset:String(fileOffset)}));
            if(token!==fileGeneration||activeView!=='assist'||generation!==assistRequest)return;
            const files=Array.isArray(data.files)?data.files:[];
            for(const item of files){
              const row=e('div',undefined,'assist-file');
              const summary=e('div');
              summary.append(e('strong',item.title||'Untitled'));
              summary.append(e('small',[item.format,item.needsReview?'Needs review':'Reviewed',item.reviewReason].filter(Boolean).join(' · '),'subtext'));
              const edit=e('button',item.needsReview?'Review metadata':'Edit metadata','edit-button');
              edit.type='button';edit.onclick=()=>openEditor(item);
              row.append(summary,edit);filePanel.append(row);
            }
            fileOffset+=files.length;
            filePanel.querySelector('.assist-more')?.remove();
            if(data.hasMore){
              const more=e('button','Load more files','quiet assist-more');
              more.type='button';more.onclick=()=>void loadFiles();
              filePanel.append(more);
            }
            if(!filePanel.children.length)filePanel.append(e('p','No files are linked to this book.'));
          }catch(error){if(token===fileGeneration&&generation===assistRequest)notice(error.message,true)}
          finally{if(token===fileGeneration)reveal.disabled=false}
        }
        reveal.onclick=()=>{
          const opening=filePanel.hidden;
          filePanel.hidden=!opening;reveal.setAttribute('aria-expanded',String(opening));
          if(opening&&fileOffset===0)void loadFiles(true);
        };
        controls.append(reveal);
        if(work.publicationState!=='published'){
          const publish=e('button',work.reviewFiles?'Finish review before publishing':'Publish book','primary');
          publish.type='button';
          publish.disabled=!!work.reviewFiles;
          publish.title=work.reviewFiles?'Review every file before publishing':'Explicitly make this book visible in Library, Atlas and OPDS';
          publish.onclick=async()=>{
            if(!window.confirm('Publish '+work.title+' to Library, Atlas and family readers? Confirm its cover and metadata first.'))return;
            publish.disabled=true;
            try {
              const current=await api('./api/manage/works/'+encodeURIComponent(String(work.id))+'/publication');
              if(current.state!=='staged')throw Error('Publication changed. Refresh this book.');
              const result=await api('./api/manage/works/'+encodeURIComponent(String(work.id))+'/publication','POST',{
                action:'publish',confirm:true,expectedRevision:current.revision
              });
              if(result.state!=='published')throw Error('The server did not confirm publication.');
              await Promise.all([loadAssist(),loadSummary()]);
              notice('Published '+work.title+' to your library.');
            }catch(error){notice(error.message,true)}
            finally{publish.disabled=false}
          };
          controls.append(publish);
        }else{
          const unpublish=e('button','Unpublish book','quiet');
          unpublish.type='button';
          unpublish.onclick=async()=>{
            if(!window.confirm('Remove '+work.title+' from the published catalogue? Media, metadata and bookmarks are retained.'))return;
            unpublish.disabled=true;
            try{
              const current=await api('./api/manage/works/'+encodeURIComponent(String(work.id))+'/publication');
              if(current.state!=='published')throw Error('Publication changed. Refresh this book.');
              await api('./api/manage/works/'+encodeURIComponent(String(work.id))+'/publication','POST',{
                action:'unpublish',confirm:true,expectedRevision:current.revision
              });
              await Promise.all([loadAssist(),loadSummary()]);
              notice('Book unpublished; originals and progress retained.');
            }catch(error){notice(error.message,true)}
            finally{unpublish.disabled=false}
          };
          controls.append(unpublish);
        }
        article.append(cover,details,controls,filePanel);
        container.append(article);
      }
      $('assist-range').textContent=result.total+' books require review or publication · '+(works.length?location+1:0)+'–'+(location+works.length)+' shown';
      $('assist-page').textContent='Page '+(Math.floor(location/assistPageSize)+1);
      $('assist-previous').disabled=location===0;
      $('assist-next').disabled=location+works.length>=result.total;
      notice();
    }catch(error){
      if(generation===assistRequest){
        container.replaceChildren();
        $('assist-range').textContent='Unable to open Archivist Assist';
        notice(error.message,true);
      }
    }
  }
  async function loadSummary(){
    const [summary,sources]=await Promise.all([api('./api/library-summary'),api('./api/sources')]);
    $('metric-works').textContent=Number(summary.cataloguedWorks??summary.total??0).toLocaleString();
    $('metric-published').textContent=Number(summary.total||0).toLocaleString();
    $('metric-review').textContent=Number(summary.reviewWorks??0).toLocaleString();
    $('assist-badge').textContent=Number(summary.reviewWorks??0).toLocaleString();
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
    $('view-library').hidden=view==='health'||view==='assist';
    $('view-assist').hidden=view!=='assist';
    $('view-health').hidden=view!=='health';
    for(const item of document.querySelectorAll('[data-view]')){
      item.classList.toggle('is-current',item.dataset.view===view);
      if(item.dataset.view===view)item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    }
    if(view==='review'){$('sort').value='review';offset=0}
    if(view==='assist'){++requestId;assistOffset=0;void loadAssist();return}
    ++assistRequest;
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
  function closeEditor(){editorEpoch++;invalidateCandidateLookup();$('editor').close();editing=null}
  $('close-editor').onclick=closeEditor;
  $('cancel-editor').onclick=closeEditor;
  // Escape/native dialog close does not use either explicit close button.
  $('editor').addEventListener('close',()=>{
    if(!$('editor').open){editorEpoch++;invalidateCandidateLookup();editing=null}
  });
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
  $('refresh-assist').onclick=()=>void loadAssist();
  $('assist-previous').onclick=()=>{if(assistOffset>0){assistOffset=Math.max(0,assistOffset-assistPageSize);void loadAssist()}};
  $('assist-next').onclick=()=>{assistOffset+=assistPageSize;void loadAssist()};
  for(const item of document.querySelectorAll('[data-view]'))item.onclick=()=>showView(item.dataset.view);
  boot();
})();
