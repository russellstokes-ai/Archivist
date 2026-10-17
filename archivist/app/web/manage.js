(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pageSize = 80;
  const assistPageSize = 40;
  let assistOffset = 0, assistRequest = 0, assistMode='staged';
  const metadataFields = [
    ['title','Title','text'], ['author','Author / creator','text'],
    ['series','Series','text'], ['seriesNumber','Series / issue number','number'],
    ['genre','Genre','text'], ['publishedYear','Publication year','number'],
    ['narrator','Narrator','text'], ['publisher','Publisher','text'],
    ['isbn','ISBN','text'], ['asin','ASIN','text'],
    ['language','Language','text'], ['description','Description','textarea']
  ];
  let activeView='library', offset=0, rows=[], selected=new Set(), requestId=0, timer=0, editing=null, candidateGeneration=0, editorEpoch=0;
  let editingRevision=null,editingFingerprint=null,editingFieldReady=false,editingFieldConflict=false,editingFieldBusy=false;
  const editorDecorations=new Map();
  const selectedDetails=new Map();
  const savedViewsKey='archivist-manager-v1-views';
  const bulkFields=['narrator','publisher','publishedYear','isbn','asin','language'];
  let bulkGeneration=0,bulkPlan=null,bulkSelectedIds=[],bulkBusy=false;
  let relinkGeneration=0,relinkSelection=null,relinkPlan=null,relinkBusy=false;
  let groupEpoch=0,groupPlan=null,groupCandidates=null,groupPairs=[],groupChecks=[],groupBusy=false;
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
    const mappings=[['q',s('search').trim()],['space',s('space')],['format',s('format')],['availability',s('availability')],['metadataGap',s('metadata-gap')]];
    for(const [key,value] of mappings){if(value)query.set(key,value)}
    if(activeView==='review')query.set('review','1');
    return query;
  }
  function choose(item,checked){if(checked){selected.add(item.id);selectedDetails.set(item.id,item)}else{selected.delete(item.id);selectedDetails.delete(item.id)}}
  function updateSelected(){
    $('selected-count').textContent=selected.size+' selected';
    $('clear-selection').disabled=selected.size===0;
    $('export-selection').disabled=selected.size===0;
    $('bulk-open').disabled=selected.size===0;
    $('relink-open').disabled=selected.size!==2;
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
          const field=$('editor-fields').querySelector('[name="'+key+'"]');if(!field||field.readOnly)continue;
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
  function saveView(){const name=$('view-name').value.trim();if(!name){notice('Name the filter before saving.',true);$('view-name').focus();return}const filters={q:s('search'),space:s('space'),format:s('format'),availability:s('availability'),metadataGap:s('metadata-gap'),sort:s('sort'),review:activeView==='review'};const views=readSavedViews().filter(v=>v.name.toLowerCase()!==name.toLowerCase());views.unshift({name,filters});try{localStorage.setItem(savedViewsKey,JSON.stringify(views.slice(0,20)));$('view-name').value='';updateViews();notice('Saved filter: '+name)}catch{notice('This browser does not permit saving views.',true)}}
  function applyView(){const i=Number(s('saved-views'));const view=readSavedViews()[i];if(s('saved-views')===''||!view)return;const v=view.filters;activeView=v.review?'review':'library';$('view-library').hidden=false;$('view-health').hidden=true;for(const item of document.querySelectorAll('[data-view]')){item.classList.toggle('is-current',item.dataset.view===activeView);if(item.dataset.view===activeView)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')}for(const [id,key] of [['search','q'],['space','space'],['format','format'],['availability','availability'],['metadata-gap','metadataGap'],['sort','sort']])$(id).value=v[key]||'';offset=0;loadCatalogue()}

  function resetBulkPlan(){
    ++bulkGeneration;
    bulkPlan=null;
    $('bulk-apply').disabled=true;
    $('bulk-preview').replaceChildren();
    $('bulk-status').textContent='No preview generated.';
  }
  function openBulkEditor(){
    if(selected.size===0){notice('Select files to edit first.',true);return}
    if(selected.size>40){notice('Bulk edits are limited to 40 files at a time. Reduce the selection.',true);return}
    bulkSelectedIds=[...selected].map(Number).sort((a,b)=>a-b);
    resetBulkPlan();
    bulkBusy=false;
    $('bulk-form').reset();
    $('bulk-context').textContent=bulkSelectedIds.length+' selected files. Review each change before applying. Unreviewed or locked fields will block the entire operation.';
    $('bulk-dialog').showModal();
    $('bulk-use-narrator').focus();
  }
  function closeBulkEditor(){
    resetBulkPlan();
    bulkSelectedIds=[];
    $('bulk-dialog').close();
  }
  function bulkEditedFields(){
    const changes={};
    for(const name of bulkFields){
      if(!$('bulk-use-'+name).checked)continue;
      const raw=$('bulk-'+name).value.trim();
      if(name==='publishedYear'){
        if(raw&&!/^\d{4}$/.test(raw))throw Error('Use a four-digit publication year or leave it blank to clear.');
        changes.publishedYear=raw?Number(raw):0;
      }else changes[name]=raw;
    }
    if(Object.keys(changes).length<1||Object.keys(changes).length>4)throw Error('Choose 1–4 fields to edit in a single preview.');
    return changes;
  }
  function displayBulkPreview(result){
    const host=$('bulk-preview');host.replaceChildren();
    for(const item of result.items||[]){
      const card=e('article',undefined,'bulk-preview-item');
      const top=e('div',undefined,'bulk-preview-top');
      top.append(e('strong',item.title||'Untitled'),e('span',item.status||'Unknown','pill '+(item.status==='ready'?'ok':item.status==='blocked'?'warn':'muted')));
      card.append(top);
      if(item.reason)card.append(e('p',item.reason,'reason'));
      if(Array.isArray(item.diff)){
        for(const diff of item.diff){
          const row=e('div',undefined,'bulk-diff');
          row.append(e('strong',diff.name),e('span',String(diff.from||'—')+' → '+String(diff.to||'—')));
          card.append(row);
        }
      }
      host.append(card);
    }
  }
  async function previewBulk(event){
    event.preventDefault();
    if(bulkBusy||!bulkSelectedIds.length)return;
    resetBulkPlan();
    let changes;
    try{changes=bulkEditedFields()}catch(error){$('bulk-status').textContent=error.message;return}
    const generation=bulkGeneration;
    bulkBusy=true;$('bulk-preview-button').disabled=true;
    $('bulk-status').textContent='Checking current file values, manual locks and revisions…';
    try{
      const result=await api('./api/manage/bulk-metadata/preview','POST',{ids:bulkSelectedIds,changes});
      if(generation!==bulkGeneration||!$('bulk-dialog').open)return;
      if(!Array.isArray(result.items)||result.items.length!==bulkSelectedIds.length)throw Error('Invalid server preview.');
      displayBulkPreview(result);
      bulkPlan=result;
      const ready=Number(result.ready||0),blocked=Number(result.blocked||0);
      $('bulk-status').textContent=ready+' files ready · '+blocked+' blocked · '+(result.items.length-ready-blocked)+' already unchanged. '+(blocked?'Resolve blocking files and preview again.':'No changes have been written.');
      $('bulk-apply').disabled=blocked>0||ready===0||!result.receipt;
    }catch(error){if(generation===bulkGeneration)$('bulk-status').textContent=error.message}
    finally{bulkBusy=false;$('bulk-preview-button').disabled=false}
  }
  async function applyBulk(){
    if(bulkBusy||!bulkPlan||!bulkPlan.receipt)return;
    if(!window.confirm('Apply the previewed metadata changes to '+bulkPlan.ready+' reviewed files? This does not move media or publish books.'))return;
    const generation=bulkGeneration;
    bulkBusy=true;$('bulk-apply').disabled=true;$('bulk-preview-button').disabled=true;
    $('bulk-status').textContent='Applying the approved batch transaction…';
    try{
      const result=await api('./api/manage/bulk-metadata/apply','POST',{
        items:bulkPlan.items,changes:bulkPlan.changes,receipt:bulkPlan.receipt,confirm:true
      });
      if(generation!==bulkGeneration||!$('bulk-dialog').open)return;
      if(!result.ok||!Number.isInteger(result.updated))throw Error('Server did not confirm the batch.');
      const updated=result.updated;
      selected.clear();selectedDetails.clear();
      closeBulkEditor();
      await Promise.all([loadCatalogue(),loadSummary()]);
      notice('Bulk metadata saved to '+updated+' reviewed files. Originals, identities and progress were retained.');
    }catch(error){
      if(generation===bulkGeneration){$('bulk-status').textContent='Bulk apply failed: '+error.message+' No further action can use this preview; preview again.';bulkPlan=null}
    }finally{
      bulkBusy=false;$('bulk-preview-button').disabled=false;
    }
  }

  function relinkUpdateAction(){
    $('relink-apply').disabled=!relinkPlan||!relinkPlan.receipt||!$('relink-attest').checked||relinkBusy;
  }
  function relinkRender(result){
    const content=$('relink-details');content.replaceChildren();
    const pair=[
      ['Missing original',result.old],['Available replacement',result.candidate]
    ];
    for(const [label,item] of pair){
      const node=e('section',undefined,'relink-identity');
      node.append(e('small',label,'eyebrow'),e('strong',item.workTitle||item.title||'Untitled'));
      node.append(e('p',(item.path||'')+' · '+(item.format||'')+' · '+Number(item.sizeBytes||0).toLocaleString()+' bytes','subtext'));
      content.append(node);
    }
    const hash=e('p','SHA-256 of available replacement: '+String(result.sha256||''),'relink-sha');
    const warning=e('p',result.important||'The old file cannot be verified against the replacement.','relink-warning');
    content.append(hash,warning);
  }
  function resetRelinkPreview(){
    ++relinkGeneration;relinkPlan=null;
    $('relink-attest').checked=false;
    $('relink-apply').disabled=true;
    $('relink-details').replaceChildren();
  }
  function closeRelink(){
    resetRelinkPreview();relinkSelection=null;
    $('relink-dialog').close();
  }
  async function getRelinkPreview(){
    if(!relinkSelection||relinkBusy)return;
    resetRelinkPreview();
    const request=relinkSelection,generation=relinkGeneration;
    relinkBusy=true;$('relink-refresh').disabled=true;
    $('relink-status').textContent='Inspecting catalogues and hashing the complete replacement file…';
    try{
      const result=await api('./api/manage/relink/preview','POST',request);
      if(generation!==relinkGeneration||!$('relink-dialog').open)return;
      if(!result.requiresAttestation||!result.receipt||result.old?.assetId!==request.oldAssetId||
        result.candidate?.assetId!==request.candidateAssetId){
        throw Error('Unexpected relink preview returned by the server.');
      }
      relinkPlan=result;relinkRender(result);
      $('relink-status').textContent='Review the exact identities below before attesting. No catalogue changes have been made.';
    }catch(error){
      if(generation===relinkGeneration)$('relink-status').textContent='Relink unavailable: '+error.message;
    }finally{
      if(generation===relinkGeneration){relinkBusy=false;$('relink-refresh').disabled=false;relinkUpdateAction()}
    }
  }
  function openRelink(){
    const options=[...selectedDetails.values()];
    if(options.length!==2){notice('Select the missing original and exactly one available replacement.',true);return}
    const missing=options.filter(item=>!item.available),available=options.filter(item=>item.available);
    if(missing.length!==1||available.length!==1){
      notice('Relinking requires one unavailable original and one available replacement.',true);return
    }
    if(missing[0].space!==available[0].space||missing[0].format!==available[0].format){
      notice('Select files with the same library and media format.',true);return
    }
    relinkSelection={oldAssetId:Number(missing[0].id),candidateAssetId:Number(available[0].id)};
    resetRelinkPreview();$('relink-dialog').showModal();
    void getRelinkPreview();
  }
  async function applyRelink(){
    if(relinkBusy||!relinkPlan||!$('relink-attest').checked)return;
    if(!window.confirm('Permanently reconnect the unavailable book identity to this new file? The existing bookmarks and work metadata will be retained.'))return;
    const generation=relinkGeneration,plan=relinkPlan;
    relinkBusy=true;$('relink-refresh').disabled=true;$('relink-apply').disabled=true;
    $('relink-status').textContent='Checking the file again and applying the confirmed database transaction…';
    try{
      const result=await api('./api/manage/relink/apply','POST',{
        preview:plan,confirm:true,attestation:'same-file-verified-by-owner'
      });
      if(generation!==relinkGeneration||!$('relink-dialog').open)return;
      if(!result.ok||result.assetId!==plan.old.assetId||result.workId!==plan.old.workId){
        throw Error('Server did not confirm the original book identity.');
      }
      selected.clear();selectedDetails.clear();closeRelink();
      await Promise.all([loadCatalogue(),loadSummary()]);
      notice('Book reconnected. Original work, edition, metadata and household bookmarks have been retained.');
    }catch(error){
      if(generation===relinkGeneration){
        relinkPlan=null;$('relink-apply').disabled=true;
        $('relink-status').textContent='Relink was not applied: '+error.message+' Refresh the preview before trying again.';
      }
    }finally{
      relinkBusy=false;$('relink-refresh').disabled=false;
      relinkUpdateAction();
    }
  }

  function resetGroupPreview(){
    ++groupEpoch;groupPlan=null;
    $('group-relink-hashes').replaceChildren();
    $('group-relink-attest').checked=false;$('group-relink-attest').disabled=true;
    $('group-relink-apply').disabled=true;
  }
  function groupReady(){
    const all=groupCandidates&&groupPairs.length>=2&&groupChecks.length===groupPairs.length&&
      groupChecks.every(box=>box.checked);
    $('group-relink-preview').disabled=!all||groupBusy;
    $('group-relink-apply').disabled=!all||!groupPlan||!groupPlan.receipt||
      !$('group-relink-attest').checked||groupBusy;
  }
  function openGroupedRelink(originalId){
    groupCandidates=null;groupPairs=[];groupChecks=[];groupBusy=false;
    resetGroupPreview();
    $('group-relink-pairs').replaceChildren();
    $('group-relink-old').value=originalId?String(originalId):'';
    $('group-relink-new').value='';
    $('group-relink-status').textContent='Enter both book IDs and inspect every chapter.';
    $('group-relink-dialog').showModal();
    $('group-relink-new').focus();
    groupReady();
  }
  function closeGroupedRelink(){
    resetGroupPreview();groupCandidates=null;groupPairs=[];groupChecks=[];
    $('group-relink-dialog').close();
  }
  function groupIDs(){
    const original=Number($('group-relink-old').value);
    const replacement=Number($('group-relink-new').value);
    if(!Number.isSafeInteger(original)||!Number.isSafeInteger(replacement)||
       original<1||replacement<1||original===replacement){
      throw Error('Enter two distinct positive book IDs.');
    }
    return [original,replacement];
  }
  async function loadGroupedTracks(){
    if(groupBusy)return;
    resetGroupPreview();groupCandidates=null;groupPairs=[];groupChecks=[];
    $('group-relink-pairs').replaceChildren();
    let ids;
    try{ids=groupIDs()}catch(error){$('group-relink-status').textContent=error.message;groupReady();return}
    const epoch=groupEpoch;
    groupBusy=true;$('group-relink-load').disabled=true;groupReady();
    $('group-relink-status').textContent='Inspecting both audiobook identities and playback order…';
    try{
      const [original,replacement]=await Promise.all(ids.map(id=>
        api('./api/manage/relink-groups/works/'+encodeURIComponent(String(id)))));
      if(epoch!==groupEpoch||!$('group-relink-dialog').open)return;
      const oldTracks=original.tracks||[],newTracks=replacement.tracks||[];
      if(original.format!=='Audio'||replacement.format!=='Audio'||oldTracks.length<2||
        oldTracks.length!==newTracks.length||oldTracks.length>32||
        original.sourceId!==replacement.sourceId){
        throw Error('Choose two complete 2–32-track audiobook groups from the same source.');
      }
      groupCandidates={original,replacement};
      const summary=e('p',(original.title||'Original')+' → '+(replacement.title||'Replacement')+
        ' · '+oldTracks.length+' chapters','group-relink-summary');
      const area=$('group-relink-pairs');area.append(summary);
      let incompatible=0;
      for(let i=0;i<oldTracks.length;i++){
        const from=oldTracks[i],to=newTracks[i];
        if(from.position!==i||to.position!==i||from.identity?.format!==to.identity?.format||
            from.identity?.sizeBytes!==to.identity?.sizeBytes||
            from.identity?.available!==false||to.identity?.available!==true){incompatible++}
        const pair={oldAssetId:from.identity.assetId,candidateAssetId:to.identity.assetId};
        groupPairs.push(pair);
        const row=e('label',undefined,'group-relink-pair');
        const check=e('input');check.type='checkbox';check.checked=false;
        check.setAttribute('aria-label','Independently verify audiobook chapter '+(i+1));
        const textBlock=e('div');
        textBlock.append(e('strong','Chapter '+(i+1)),e('span',from.identity.path+' → '+to.identity.path,'subtext'));
        textBlock.append(e('small',Number(to.identity.sizeBytes).toLocaleString()+' bytes · '+(from.identity.sizeBytes===to.identity.sizeBytes?'same indexed length':'length mismatch'),'subtext'));
        row.append(check,textBlock);area.append(row);groupChecks.push(check);
        check.onchange=()=>{resetGroupPreview();groupReady()};
      }
      if(incompatible)throw Error(incompatible+' chapters have mismatched positions, sizes or availability. No relink can be previewed.');
      $('group-relink-status').textContent='Review every pair above individually, then select all confirmation boxes to verify file hashes.';
    }catch(error){
      if(epoch===groupEpoch){groupCandidates=null;groupPairs=[];groupChecks=[];
        $('group-relink-status').textContent='Chapter inspection failed: '+error.message;
      }
    }finally{
      if(epoch===groupEpoch){groupBusy=false;$('group-relink-load').disabled=false;groupReady()}
    }
  }
  async function previewGroupedRelink(){
    if(!groupCandidates||groupBusy||groupChecks.some(box=>!box.checked))return;
    resetGroupPreview();
    const epoch=groupEpoch;
    groupBusy=true;groupReady();
    $('group-relink-status').textContent='Hashing the complete replacement chapters in playback order…';
    try{
      const result=await api('./api/manage/relink-groups/preview','POST',{pairs:groupPairs});
      if(epoch!==groupEpoch||!$('group-relink-dialog').open)return;
      if(!result.requiresAttestation||!result.receipt||!Array.isArray(result.pairs)||
        result.pairs.length!==groupPairs.length)throw Error('Invalid server-side group preview.');
      for(let i=0;i<result.pairs.length;i++){
        if(result.pairs[i].old.identity.assetId!==groupPairs[i].oldAssetId||
            result.pairs[i].candidate.identity.assetId!==groupPairs[i].candidateAssetId||
            !/^[0-9a-f]{64}$/.test(result.pairs[i].sha256)){
          throw Error('Server track mapping or hash differs from the reviewed pairing.');
        }
      }
      groupPlan=result;
      const area=$('group-relink-hashes');area.replaceChildren();
      area.append(e('p',result.important||'Original media is unavailable; owner identity verification is required.','relink-warning'));
      for(let i=0;i<result.pairs.length;i++)area.append(e('small','Chapter '+(i+1)+' SHA-256: '+result.pairs[i].sha256,'relink-sha'));
      $('group-relink-attest').disabled=false;
      $('group-relink-status').textContent='All replacement tracks hashed. Review the hashes and the final owner attestation.';
    }catch(error){
      if(epoch===groupEpoch)$('group-relink-status').textContent='Full-file preview rejected: '+error.message;
    }finally{if(epoch===groupEpoch){groupBusy=false;groupReady()}}
  }
  async function applyGroupedRelink(){
    if(groupBusy||!groupPlan||groupChecks.some(box=>!box.checked)||
      !$('group-relink-attest').checked)return;
    if(!window.confirm('Confirm all chapter mappings? The original audiobook, tracks and household bookmarks will be preserved. No media files will be changed.'))return;
    const epoch=groupEpoch,plan=groupPlan;
    groupBusy=true;groupReady();
    $('group-relink-status').textContent='Rechecking complete media hashes and applying atomic audiobook relink…';
    try{
      const result=await api('./api/manage/relink-groups/apply','POST',{
        preview:plan,confirm:true,attestation:'all-chapter-mappings-verified-by-owner'
      });
      if(epoch!==groupEpoch||!$('group-relink-dialog').open)return;
      if(!result.ok||result.workId!==plan.oldWorkId||result.tracks!==groupPairs.length){
        throw Error('Server did not confirm preservation of all old chapter identities.');
      }
      closeGroupedRelink();
      selected.clear();selectedDetails.clear();
      await Promise.all([loadAssist(),loadSummary(),loadCatalogue()]);
      notice('Audiobook reconnected: all '+result.tracks+' original chapters and household positions retained.');
    }catch(error){
      if(epoch===groupEpoch){
        groupPlan=null;$('group-relink-attest').disabled=true;
        $('group-relink-status').textContent='Group relink not accepted: '+error.message+'. Inspect and preview again.';
      }
    }finally{groupBusy=false;groupReady()}
  }
  function exportSelected(){const items=[...selectedDetails.values()];if(!items.length)return;const columns=[['id','ID'],['title','Title'],['author','Author'],['series','Series'],['seriesNumber','Number'],['format','Format'],['space','Space'],['publishedYear','Year'],['genre','Genre'],['isbn','ISBN'],['metadataSource','Metadata source']];const cell=value=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text.trimStart()))text="'"+text;return '"'+text.replaceAll('"','""')+'"'};const lines=[columns.map(x=>cell(x[1])).join(','),...items.map(row=>columns.map(x=>cell(row[x[0]])).join(','))];const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'}));const anchor=e('a');anchor.href=url;anchor.download='archivist-selected-metadata.csv';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Exported '+items.length+' selected metadata records.')}
  function invalidateCandidateLookup(){
    ++candidateGeneration;
    $('candidate-search-button').disabled=false;
  }
  function editorHasChanges(){
    return [...$('editor-fields').querySelectorAll('input,textarea')].some(input=>input.value!==input.dataset.initial);
  }
  function setEditorFieldLock(name,locked,source){
    const item=editorDecorations.get(name);if(!item)return;
    item.input.readOnly=locked;
    item.lock.textContent=locked?'Unlock':'Lock';
    item.lock.setAttribute('aria-pressed',String(locked));
    item.lock.setAttribute('aria-label',(locked?'Unlock ':'Lock ')+name+' metadata');
    item.lock.dataset.locked=String(locked);
    item.provenance.textContent=(source||'Unverified source')+' · '+(locked?'Locked':'Editable');
  }
  async function loadEditorFieldControls(target,epoch){
    if(editing!==target||editorEpoch!==epoch)return;
    editingFieldReady=false;editingFieldConflict=false;editingRevision=null;editingFingerprint=null;
    $('save-editor').disabled=true;
    $('retry-field-status').hidden=true;
    $('editor-lock-status').textContent='Checking field provenance and revision…';
    try{
      const response=await api('./api/manage/assets/'+encodeURIComponent(String(target.id))+'/fields');
      if(editing!==target||editorEpoch!==epoch)return;
      if(!Number.isSafeInteger(response.revision)||response.revision<0||
        !/^[0-9a-f]{64}$/.test(response.fingerprint||'')||!Array.isArray(response.fields)){
        throw Error('Invalid metadata state returned by the server.');
      }
      const values=new Map(response.fields.map(item=>[item.name,item]));
      let stale=false;
      for(const [name,controls] of editorDecorations){
        const actual=values.get(name);if(!actual)throw Error('The server is missing '+name+' metadata controls.');
        const current=String(actual.value??'');
        const input=controls.input;
        if(input.value===input.dataset.initial){
          input.value=current;input.dataset.initial=current;
        }else if(current!==input.dataset.initial){
          stale=true;
        }
        if(actual.locked&&input.value!==current)stale=true;
        setEditorFieldLock(name,Boolean(actual.locked),actual.source);
        controls.lock.disabled=false;
      }
      editingRevision=response.revision;
      editingFingerprint=response.fingerprint;
      for(const row of response.fields){
        const control=editorDecorations.get(row.name);
        if(control)control.provenance.dataset.source=row.source||'Unverified source';
      }
      editingFieldConflict=stale;
      editingFieldReady=!stale;
      $('save-editor').disabled=stale;
      $('editor-lock-status').textContent=stale?
        'Another edit changed this file. Close and reopen the editor to avoid overwriting it.':
        'Field provenance loaded · revision '+response.revision+'. Locked fields cannot be overwritten.';
      if(stale)notice('Metadata changed while the editor was loading. Reopen before saving.',true);
    }catch(error){
      if(editing!==target||editorEpoch!==epoch)return;
      editingFieldReady=false;$('save-editor').disabled=true;
      $('retry-field-status').hidden=false;
      $('editor-lock-status').textContent='Field controls unavailable: '+error.message;
      notice('Metadata controls unavailable; retry before saving.',true);
    }
  }
  async function toggleEditorField(target,epoch,name){
    if(editing!==target||editorEpoch!==epoch||!editingFieldReady||editingFieldBusy)return;
    if(editorHasChanges()){
      notice('Save or discard your pending edits before changing a field lock.',true);
      return;
    }
    const controls=editorDecorations.get(name);if(!controls)return;
    const next=controls.lock.dataset.locked!=='true';
    editingFieldBusy=true;controls.lock.disabled=true;$('save-editor').disabled=true;
    try{
      const answer=await api('./api/manage/assets/'+encodeURIComponent(String(target.id))+'/fields/'+encodeURIComponent(name),
        'PUT',{locked:next,expectedRevision:editingRevision});
      if(editing!==target||editorEpoch!==epoch)return;
      if(!Number.isSafeInteger(answer.revision)||answer.locked!==next)throw Error('Server did not confirm the field lock.');
      editingRevision=answer.revision;
      setEditorFieldLock(name,Boolean(answer.locked),controls.provenance.dataset.source);
      $('editor-lock-status').textContent='Field '+name+(next?' locked.':' unlocked.')+' Revision '+answer.revision+'.';
      notice(name+(next?' locked against further edits.':' unlocked for editing.'));
    }catch(error){
      if(editing===target&&editorEpoch===epoch)notice(error.message,true);
    }finally{
      if(editing===target&&editorEpoch===epoch){
        editingFieldBusy=false;controls.lock.disabled=false;
        $('save-editor').disabled=!editingFieldReady||editingFieldConflict;
      }
    }
  }
  function openEditor(item){
    // Opening a new editor invalidates even a save request for the same
    // record from an earlier dialog lifetime.
    editorEpoch++;
    invalidateCandidateLookup();
    editingFieldReady=false;editingFieldConflict=false;editingFieldBusy=false;editingRevision=null;editingFingerprint=null;
    editorDecorations.clear();
    $('save-editor').disabled=true;
    editing=item;
    $('candidate-query').value=[item.title,item.author].filter(Boolean).join(' ');
    $('candidate-results').replaceChildren();
    $('editor-title').textContent='Edit '+(item.title||'metadata');
    $('editor-context').textContent=[item.format,item.space,'Source: '+(item.metadataSource||'not identified'),item.identificationConfidence?item.identificationConfidence+' confidence':null].filter(Boolean).join(' · ');
    const grid=$('editor-fields');grid.replaceChildren();
    const openedEpoch=editorEpoch;
    for(const [name,caption,kind] of metadataFields){
      const label=e('label',caption);let field;
      if(kind==='textarea'){field=document.createElement('textarea');field.rows=3}
      else{field=document.createElement('input');field.type=kind;if(kind==='number'){field.step='any';field.inputMode='decimal'}}
      field.name=name;field.value=item[name]==null?'':String(item[name]);field.dataset.initial=field.value;
      const actions=e('div',undefined,'metadata-field-control');
      const provenance=e('small','Loading provenance…','metadata-field-provenance');
      const lock=e('button','Lock','metadata-field-lock quiet');lock.type='button';lock.disabled=true;
      actions.append(provenance,lock);label.append(field,actions);grid.append(label);
      editorDecorations.set(name,{input:field,provenance,lock});
      lock.onclick=()=>void toggleEditorField(item,openedEpoch,name);
    }
    $('editor').showModal();
    grid.querySelector('input')?.focus();
    $('retry-field-status').onclick=()=>void loadEditorFieldControls(item,openedEpoch);
    void loadEditorFieldControls(item,openedEpoch);
  }
  async function saveEditor(event){
    event.preventDefault();
    if(!editing)return;
    if(!editingFieldReady||editingFieldConflict||editingFieldBusy||editingRevision===null||!editingFingerprint){
      notice('Load and verify the current field metadata before saving.',true);return;
    }
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
    changes.expectedRevision=editingRevision;
    changes.expectedFingerprint=editingFingerprint;
    if(!window.confirm('Save the reviewed metadata changes? This saves the file, not the book publication state.'))return;
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
  // Work-wide metadata is deliberately separate from physical-file editing.
  // Every mutation is previewed against a signed, versioned server snapshot.
  let workEpoch=0,workCandidateEpoch=0,workState=null,workPlan=null,workUndoPlan=null;
  // Read-only safety review: an Apply endpoint is deliberately absent.
  let comicTransferVersion=0,comicTransferBusy=false;
  function clearComicTransfer(message){
    ++comicTransferVersion;
    comicTransferBusy=false;
    $('comic-transfer-inspect').disabled=false;
    $('comic-transfer-findings').replaceChildren();
    $('comic-transfer-status').textContent=message||
      'Select an existing destination book. No reassignment action is enabled.';
  }
  async function inspectComicTransfer(){
    if(comicTransferBusy||!workState||!comicProfileActive)return;
    if(workBusy||comicProfileBusy||comicProfileDirty()||comicProfileBookDirty()){
      clearComicTransfer('Save or discard unsaved book/edition changes before inspection.');
      return;
    }
    const target=Number($('comic-transfer-target').value),edition=Number(comicProfileActive);
    const source=workState,epoch=workEpoch,inputVersion=workEditEpoch;
    if(!Number.isSafeInteger(target)||target<1||target===source.workId){
      clearComicTransfer('Enter a different existing destination book ID.');
      return;
    }
    clearComicTransfer('Checking current edition membership, identity and household references…');
    const version=comicTransferVersion;
    comicTransferBusy=true;$('comic-transfer-inspect').disabled=true;
    try{
      const report=await api('./api/manage/comic-edition-transfer/inspect','POST',{
        sourceWorkId:source.workId,targetWorkId:target,editionId:edition,
        expectedSourceFingerprint:source.fingerprint
      });
      if(epoch!==workEpoch||source!==workState||version!==comicTransferVersion||
         inputVersion!==workEditEpoch||edition!==comicProfileActive||
         target!==Number($('comic-transfer-target').value))return;
      if(report.readOnly!==true||report.source?.workId!==source.workId||
         report.source?.fingerprint!==source.fingerprint||
         report.target?.workId!==target||report.editionId!==edition||
         !Array.isArray(report.blockers)||!Array.isArray(report.warnings)){
        throw Error('Server returned an unsafe or stale inspection.');
      }
      const area=$('comic-transfer-findings');area.replaceChildren();
      const summary=e('article',undefined,'comic-transfer-finding');
      summary.append(e('strong',String(report.source.title||'Source')+' → '+String(report.target.title||'Destination')),
        e('p','Book #'+report.source.workId+' → #'+report.target.workId+
          ' · edition #'+report.editionId+' · asset #'+report.member.assetId+
          '. Read-only assessment; no files or bookmarks were changed.'));
      area.append(summary);
      for(const [list,blocked] of [[report.blockers,true],[report.warnings,false]]){
        for(const finding of list.slice(0,60)){
          const node=e('article',undefined,'comic-transfer-finding'+(blocked?' is-blocked':''));
          node.append(e('strong',(blocked?'Blocker: ':'Note: ')+String(finding.code||'Unclassified')),
            e('p',String(finding.explanation||'')));
          area.append(node);
        }
      }
      $('comic-transfer-status').textContent=report.blockers.length?
        report.blockers.length+' blockers found. No reassignment attempted.':
        'No preflight blockers found. Reassignment still disabled pending separate move/undo acceptance.';
    }catch(error){
      if(epoch===workEpoch&&version===comicTransferVersion){
        $('comic-transfer-findings').replaceChildren();
        $('comic-transfer-status').textContent='Safety inspection unavailable: '+error.message;
      }
    }finally{
      if(epoch===workEpoch&&version===comicTransferVersion){
        comicTransferBusy=false;
        $('comic-transfer-inspect').disabled=false;
      }
    }
  }

  // A separate, owner-confirmed identity ledger is keyed to EXISTING comic
  // edition IDs. It never changes catalogue grouping or original media.
  const comicProfileNames=[
    ['run','Series run / publication era','text'],
    ['volume','Volume number','text'],['issue','Issue number','text'],
    ['imprint','Publisher / imprint','text'],['variant','Printing / cover variant','text'],
    ['year','Edition year','text'],['notes','Edition notes','textarea']
  ];
  let comicProfileState=null,comicProfileActive=null,comicProfileFields=new Map();
  let comicProfilePlan=null,comicProfileUndoPlan=null,comicProfileBusy=false;
  let comicProfileVersion=0,comicProfileRequest=0;
  function comicProfileDirty(){
    for(const item of comicProfileFields.values()){
      if(String(item.value)!==String(item.dataset.initial))return true;
    }
    return false;
  }
  function comicProfileResetPlans(){
    ++comicProfileVersion;
    comicProfilePlan=null;comicProfileUndoPlan=null;
    $('comic-profile-diff').replaceChildren();
    $('comic-profile-apply').disabled=true;
    $('comic-profile-undo').disabled=true;
  }
  function comicProfileReset(){
    clearComicTransfer();
    ++comicProfileRequest;comicProfileState=null;comicProfileActive=null;
    comicProfileBusy=false;comicProfileFields.clear();comicProfileResetPlans();
    $('comic-profile-edition').replaceChildren();
    $('comic-profile-fields').replaceChildren();
    $('comic-profile-preview').disabled=true;
    $('comic-profile-undo-preview').disabled=true;
    $('comic-profile-status').textContent='No edition identity selected.';
  }
  function comicProfileBookDirty(){
    for(const item of workInputs.values()){
      if(String(item.input.value)!==String(item.input.dataset.initial))return true;
    }
    return false;
  }
  function comicProfileMessage(value){$('comic-profile-status').textContent=String(value)}
  function comicProfileSelected(){
    return comicProfileState?.editions?.find(item=>
      item.editionId===comicProfileActive)||null;
  }
  function comicProfileBusyControls(busy){
    for(const field of comicProfileFields.values()){field.readOnly=busy||!comicProfileSelected()?.editable}
    $('comic-profile-edition').disabled=busy;
    $('comic-profile-preview').disabled=busy||!comicProfileSelected()?.editable;
    $('comic-profile-undo-preview').disabled=busy||!comicProfileSelected()?.editable;
    if(busy){$('comic-profile-apply').disabled=true;$('comic-profile-undo').disabled=true}
  }
  function comicProfileRenderEdition(id){
    clearComicTransfer('Edition selected. Inspect a destination before reassignment.');
    const item=comicProfileState?.editions?.find(ed=>ed.editionId===id);
    comicProfileActive=item?.editionId||null;comicProfileFields.clear();comicProfileResetPlans();
    const holder=$('comic-profile-fields');holder.replaceChildren();
    if(!item){comicProfileMessage('No comic edition found.');return}
    $('comic-profile-edition').value=String(item.editionId);
    for(const [name,label,type] of comicProfileNames){
      const node=e('label',label);
      const input=e(type==='textarea'?'textarea':'input');
      if(type!=='textarea')input.type='text';else input.rows=3;
      input.value=String(item.fields?.[name]??'');
      input.dataset.initial=input.value;
      input.readOnly=!item.editable;
      input.addEventListener('input',()=>{
        comicProfileResetPlans();
        workClearPlans();
        comicProfileMessage('Unsaved edition labels. Preview changes before any Save.');
      });
      node.append(input);holder.append(node);comicProfileFields.set(name,input);
    }
    $('comic-profile-preview').disabled=!item.editable;
    $('comic-profile-undo-preview').disabled=!item.editable||item.revision===0;
    const warnings=(item.warnings||[]).join(' · ');
    comicProfileMessage('Edition #'+item.editionId+' · revision '+item.revision+
      ' · '+item.available+'/'+item.files+' files available. '+
      (item.stored?'Owner labels saved. ':'No saved owner labels. ')+
      (warnings?warnings:'Identity edits remain separate from work metadata.'));
  }
  async function workLoadComicProfiles(epoch){
    const state=workState,request=++comicProfileRequest;
    comicProfileReset();
    // comicProfileReset invalidates previous requests; the new token belongs
    // exclusively to this particular book snapshot.
    const token=comicProfileRequest;
    const panel=$('work-comic-panel');
    if(!state||epoch!==workEpoch||panel.hidden)return;
    comicProfileMessage('Loading edition labels and source revision…');
    try{
      const data=await api('./api/manage/works/'+encodeURIComponent(String(state.workId))+'/comic-editions');
      if(epoch!==workEpoch||token!==comicProfileRequest||workState!==state)return;
      if(data.workId!==state.workId||data.workFingerprint!==state.fingerprint||
        !Array.isArray(data.editions)||!data.editions.length){
        throw Error('Server returned an outdated or invalid comic edition snapshot.');
      }
      comicProfileState=data;
      const picker=$('comic-profile-edition');picker.replaceChildren();
      for(const item of data.editions){
        picker.add(new Option('Edition #'+item.editionId+' · '+item.files+' indexed file(s)',String(item.editionId)));
      }
      comicProfileRenderEdition(data.editions[0].editionId);
    }catch(error){
      if(epoch===workEpoch&&token===comicProfileRequest&&workState===state){
        comicProfileMessage('Edition registry unavailable: '+error.message);
      }
    }
  }
  function comicProfileValues(){
    const out={};
    for(const [name,node] of comicProfileFields){out[name]=String(node.value).trim()}
    return out;
  }
  function comicProfilePath(item){
    return './api/manage/works/'+encodeURIComponent(String(item.workId))+
      '/comic-editions/'+encodeURIComponent(String(item.editionId));
  }
  async function comicProfilePreviewEdit(){
    const item=comicProfileSelected();
    if(!item||comicProfileBusy||workBusy)return;
    if(comicProfileBookDirty()){comicProfileMessage('Preview or discard book-level edits before editing its edition.');return}
    comicProfileResetPlans();
    const epoch=workEpoch,version=comicProfileVersion,active=comicProfileActive;
    comicProfileBusy=true;comicProfileBusyControls(true);
    try{
      const preview=await api(comicProfilePath(item)+'/preview','POST',{
        expectedRevision:item.revision,expectedWorkFingerprint:item.workFingerprint,
        fields:comicProfileValues()
      });
      if(epoch!==workEpoch||version!==comicProfileVersion||active!==comicProfileActive)return;
      if(preview.action!=='save'||preview.editionId!==item.editionId||
        preview.expectedRevision!==item.revision||
        preview.expectedWorkFingerprint!==item.workFingerprint||
        !preview.receipt||!preview.diff?.length)throw Error('Invalid signed edition preview.');
      comicProfilePlan=preview;
      workRenderDiff('comic-profile-diff',preview.diff);
      $('comic-profile-apply').disabled=false;
      comicProfileMessage('Review '+preview.diff.length+' edition label change(s). No files, work IDs or bookmarks have changed.');
    }catch(error){
      if(epoch===workEpoch&&version===comicProfileVersion)comicProfileMessage('Preview unavailable: '+error.message);
    }finally{
      comicProfileBusy=false;if(epoch===workEpoch)comicProfileBusyControls(false);
    }
  }
  async function comicProfileApply(undo=false){
    const item=comicProfileSelected(),plan=undo?comicProfileUndoPlan:comicProfilePlan;
    if(!item||!plan||comicProfileBusy||workBusy)return;
    if(comicProfileBookDirty()){comicProfileMessage('Save or discard book-level edits before confirming edition labels.');return}
    if(!window.confirm(undo?'Undo the last saved identity labels for this existing edition?':'Save the previewed identity labels on this edition ID? Original files, grouping and reading progress will not change.'))return;
    const epoch=workEpoch,version=comicProfileVersion,active=comicProfileActive;
    comicProfileBusy=true;comicProfileBusyControls(true);
    let committed=false;
    try{
      const result=await api(comicProfilePath(item)+(undo?'/undo':'/apply'),'POST',{preview:plan,confirm:true});
      if(epoch!==workEpoch||version!==comicProfileVersion||active!==comicProfileActive)return;
      if(result.editionId!==item.editionId||result.revision!==item.revision+1){
        throw Error('Server did not confirm the next edition revision.');
      }
      committed=true;
      // The comic audit now knows which volume/run was owner-verified. Refresh
      // it immediately; never leave old cross-volume gap suggestions visible.
      ++workCandidateEpoch;
      $('work-candidates').replaceChildren(e('p','Edition identity changed. Search providers again before selecting book metadata.','subtext'));
      await Promise.all([workLoadComicProfiles(epoch),workLoadComicAudit(epoch)]);
      if(epoch===workEpoch)comicProfileMessage((undo?'Previous saved edition labels restored.':'Edition labels saved.')+
        ' No original files, covers, publication or bookmarks were changed.');
    }catch(error){
      if(epoch===workEpoch){
        comicProfileResetPlans();
        comicProfileMessage((committed?'Save confirmed by server; refresh failed: ':'Save not confirmed: ')+error.message+
          '. Reload this book before trying again.');
      }
    }finally{
      comicProfileBusy=false;
      if(epoch===workEpoch)comicProfileBusyControls(false);
    }
  }
  async function comicProfilePreviewUndo(){
    const item=comicProfileSelected();
    if(!item||comicProfileBusy||workBusy)return;
    if(comicProfileDirty()||comicProfileBookDirty()){
      comicProfileMessage('Discard or save unsaved edits before previewing edition undo.');return;
    }
    comicProfileResetPlans();
    const epoch=workEpoch,version=comicProfileVersion,active=comicProfileActive;
    comicProfileBusy=true;comicProfileBusyControls(true);
    try{
      const preview=await api(comicProfilePath(item)+'/undo-preview','POST');
      if(epoch!==workEpoch||version!==comicProfileVersion||active!==comicProfileActive)return;
      if(preview.action!=='undo'||preview.editionId!==item.editionId||
        preview.expectedRevision!==item.revision||!preview.receipt||!preview.diff?.length){
        throw Error('Invalid signed edition undo preview.');
      }
      comicProfileUndoPlan=preview;workRenderDiff('comic-profile-diff',preview.diff);
      $('comic-profile-undo').disabled=false;
      comicProfileMessage('Review the exact earlier edition labels before confirming undo.');
    }catch(error){
      if(epoch===workEpoch&&version===comicProfileVersion)comicProfileMessage('Undo unavailable: '+error.message);
    }finally{comicProfileBusy=false;if(epoch===workEpoch)comicProfileBusyControls(false)}
  }

  let workInputs=new Map(),workBusy=false,workMediaOffset=0,workEditEpoch=0;
  const workFieldLabels=[
    ['title','Book title'],['author','Author / creator'],['series','Series'],
    ['seriesNumber','Series / issue number'],['genre','Genre / Atlas category'],['publishedYear','First publication year'],
    ['narrator','Narrator'],['publisher','Publisher'],['isbn','ISBN'],
    ['asin','ASIN'],['language','Language'],['description','Description']
  ];
  function workMessage(value){$('work-status').textContent=value}
  function workClearPlans(){
    clearComicTransfer('Book metadata changed. Inspect any edition transfer again.');
    workEditEpoch++;
    workPlan=null;workUndoPlan=null;
    comicProfileResetPlans();
    $('work-apply-button').disabled=true;$('work-undo-apply').disabled=true;
    $('work-preview-diff').replaceChildren();$('work-undo-diff').replaceChildren();
    $('work-preview-status').textContent='Preview required before any changes are applied.';
    $('work-undo-status').textContent='Preview undo to inspect exactly which fields will be restored.';
  }
  function workDirty(){
    for(const item of workInputs.values()){
      if(item.input.value!==item.input.dataset.initial)return true;
    }
    return comicProfileDirty();
  }
  function workSetInputBusy(busy){
    for(const item of workInputs.values()){
      item.input.readOnly=busy||workState?.publicationState!=='staged'||Boolean(item.definition.locked);
      item.lock.disabled=busy||workState?.publicationState!=='staged';
    }
    $('work-preview-button').disabled=busy||workState?.publicationState!=='staged';
    $('work-candidate-search').disabled=busy||workState?.publicationState!=='staged';
    $('work-candidate-query').disabled=busy||workState?.publicationState!=='staged';
  }
  function workRenderDiff(target,details){
    const host=$(target);host.replaceChildren();
    for(const item of details||[]){
      const card=e('article',undefined,'work-diff');
      card.append(e('strong',item.name),
        e('span',String(item.from||'—')+'  →  '+String(item.to||'—')+' · '+String(item.source||'')));
      host.append(card);
    }
  }
  function workRenderFields(state){
    const holder=$('work-fields');holder.replaceChildren();workInputs.clear();
    const editable=state.publicationState==='staged';
    const defs=new Map(workFieldLabels);
    for(const field of state.fields||[]){
      const label=e('label',defs.get(field.name)||field.name);
      if(field.name==='description')label.className='work-full';
      const input=field.name==='description'?e('textarea'):e('input');
      if(field.name==='description')input.rows=4;
      else{input.type=(field.name==='publishedYear'||field.name==='seriesNumber')?'number':'text';if(input.type==='number'){
        if(field.name==='publishedYear'){input.min=1000;input.max=3000;input.step=1}
        else{input.min=-10000;input.max=100000;input.step='any'}
      }}
      input.value=field.value??'';input.dataset.initial=input.value;input.dataset.origin='manual';
      input.readOnly=!editable||Boolean(field.locked)||workBusy;
      const line=e('div',undefined,'work-field-line');
      const source=e('small',(field.source||'Unverified')+(field.conflicting?' · Conflicting chapter values':''));
      const lock=e('button',field.locked?'Unlock':'Lock','quiet');
      lock.type='button';lock.disabled=!editable||workBusy;
      lock.setAttribute('aria-pressed',String(Boolean(field.locked)));
      lock.setAttribute('aria-label',(field.locked?'Unlock ':'Lock ')+(defs.get(field.name)||field.name));
      lock.onclick=()=>void workToggleLock(field.name,!field.locked);
      line.append(source,lock);
      if(field.conflicting)line.append(e('span','Review file values','work-flag'));
      label.append(input,line);
      holder.append(label);
      workInputs.set(field.name,{input,lock,definition:field,source});
      input.addEventListener('input',()=>{
        input.dataset.origin='manual';
        ++workCandidateEpoch;
        $('work-candidates').replaceChildren(e('p','Book details changed. Search again to compare current metadata.','subtext'));
        workClearPlans();
      });
    }
    $('work-preview-button').disabled=!editable||workBusy;
    $('work-candidate-search').disabled=!editable||workBusy;
    $('work-candidate-query').disabled=!editable||workBusy;
  }
  function workRenderSummary(state){
    $('work-dialog-title').textContent=state.title||'Book workbench';
    $('work-context').textContent='Book #'+state.workId+' · '+state.space+' · '+state.files+
      ' media files · revision '+state.revision;
    const editionHost=$('work-editions');editionHost.replaceChildren();
    for(const edition of state.editions||[]){
      const row=e('div');
      row.append(e('strong',edition.format+' · edition #'+edition.id),
        e('span',edition.available+'/'+edition.files+' available · '+edition.reviewFiles+' need review'));
      editionHost.append(row);
    }
    $('work-publication').textContent=state.publicationState==='published'?
      'Published to household readers. Unpublish explicitly before editing book metadata.':
      'Staged and private. Editing or saving does not publish this book.';
    const action=$('work-publish-toggle');
    action.textContent=state.publicationState==='published'?'Unpublish book':'Publish reviewed book';
    action.disabled=workBusy;
    $('work-cover-upload').disabled=state.publicationState==='published'||workBusy;
    $('work-cover-clear').disabled=state.publicationState==='published'||workBusy||!state.coverHash;
    const cover=$('work-cover');cover.replaceChildren();
    const img=e('img');img.alt='Selected cover for '+state.title;
    img.src='./api/works/'+encodeURIComponent(String(state.workId))+'/cover'+
       (state.coverHash?'?v='+encodeURIComponent(state.coverHash):'');
    img.addEventListener('error',()=>{
      if(cover.contains?.(img)){cover.replaceChildren(e('span','Cover not yet available','subtext'))}
    });
    cover.append(img);
  }
  function closeWorkEditor(){
    workEpoch++;workCandidateEpoch++;workState=null;
    comicProfileReset();workInputs.clear();workClearPlans();
    $('work-dialog').close();
  }
  function workResetMedia(){
    workMediaOffset=0;$('work-media').replaceChildren();
    $('work-more-media').hidden=true;
  }
  async function workLoadMedia(epoch){
    const state=workState;
    if(!state||epoch!==workEpoch)return;
    const offset=workMediaOffset;
    $('work-more-media').disabled=true;
    try{
      const data=await api('./api/manage/works/'+encodeURIComponent(String(state.workId))+
        '/media?'+new URLSearchParams({limit:'40',offset:String(offset)}));
      if(epoch!==workEpoch||workState!==state)return;
      if(data.fingerprint!==state.fingerprint){
        workMessage('Book files changed. Refresh the editor before editing an edition.');
        return;
      }
      const list=$('work-media');
      for(const item of data.files||[]){
        const row=e('div',undefined,'work-media-item');
        const content=e('div');
        content.append(e('strong',(item.position+1)+'. '+(item.title||item.relativePath||'Untitled')),
          e('small',item.format+' · edition #'+item.editionId+' · '+(item.available?'Available':'Unavailable')+
            ' · '+(item.metadataSource||'unknown source')),
          e('small',item.relativePath||''));
        const button=e('button','Edit file','quiet');button.type='button';
        button.onclick=()=>{
          if(workDirty()&&!window.confirm('Discard unsaved book changes before editing this file?'))return;
          closeWorkEditor();openEditor(item);
        };
        row.append(content,button);list.append(row);
      }
      workMediaOffset=offset+(data.files?.length||0);
      $('work-more-media').hidden=!data.hasMore;
    }catch(error){
      if(epoch===workEpoch)workMessage('Unable to load edition details: '+error.message);
    }finally{if(epoch===workEpoch)$('work-more-media').disabled=false}
  }
  async function workLoadHistory(epoch){
    const state=workState;
    if(!state||epoch!==workEpoch)return;
    try{
      const data=await api('./api/manage/works/'+encodeURIComponent(String(state.workId))+'/metadata/history');
      if(epoch!==workEpoch||workState!==state)return;
      const host=$('work-history');host.replaceChildren();
      const events=Array.isArray(data.events)?data.events:[];
      if(!events.length){host.append(e('p','No confirmed book-wide edits yet.','subtext'));return}
      for(const item of events){
        const row=e('div',undefined,'work-history-item');
        row.append(e('strong',item.action+' · revision '+item.revisionAfter),
          e('small',new Date(Number(item.recordedAt)*1000).toLocaleString()));
        for(const diff of item.changes||[]){
          row.append(e('small',diff.name+': '+String(diff.from||'—')+' → '+String(diff.to||'—')));
        }
        host.append(row);
      }
    }catch(error){if(epoch===workEpoch)workMessage('Change history unavailable: '+error.message)}
  }
  // Indexed comic evidence is local and read-only; never invoke a public
  // provider or mutate any series, edition, bookmark or selected cover here.
  async function workLoadComicAudit(epoch){
    const state=workState,host=$('work-comic-audit'),panel=$('work-comic-panel');
    const isComic=Boolean(state?.editions?.length)&&state.editions.every(ed=>ed.format==='Comic');
    panel.hidden=!isComic;
    host.replaceChildren();
    if(!isComic||epoch!==workEpoch)return;
    host.append(e('p','Inspecting indexed series and issue evidence…','subtext'));
    try{
      const data=await api('./api/manage/works/'+encodeURIComponent(String(state.workId))+'/comic-audit');
      if(epoch!==workEpoch||workState!==state)return;
      host.replaceChildren();
      if(data.workId!==state.workId||data.fingerprint!==state.fingerprint){
        host.append(e('p','Comic evidence changed while the editor was open. Reload the book.','work-flag'));
        return;
      }
      host.append(e('strong',(data.series||'Series unknown')+' · issue '+(data.issueNumber||'not identified')),
        e('small',(data.issueSource||'unknown provenance')+' · '+Number(data.peers?.length||0)+' same-series catalogue entries','subtext'));
      for(const warning of (data.warnings||[]).slice(0,12)){
        host.append(e('p',warning,'work-flag'));
      }
      if(data.possibleGaps?.length){
        host.append(e('p','Possible gaps between observed issues: '+data.possibleGaps.join(', ')+'. Not evidence of missing or purchased comics.','comic-gap-note'));
      }
      const members=e('div',undefined,'comic-evidence-list');
      for(const item of (data.fileEvidence||[]).slice(0,40)){
        members.append(e('p',[
          'File #'+item.assetId,item.title,
          item.series?'Series '+item.series:'',
          item.issueNumber?'#'+item.issueNumber:'Issue unknown',
          item.metadataSource||'source unknown',
          item.available?'Available':'Offline'
        ].filter(Boolean).join(' · '),'subtext'));
      }
      host.append(members);
      if(data.fileEvidenceTruncated||data.peersTruncated){
        host.append(e('p','Evidence is bounded; no conclusions from unlisted files.','work-flag'));
      }
      host.append(e('p','Read-only analysis of existing catalogue records. Verify ComicInfo, series volume and issue before using public metadata.','subtext'));
    }catch(error){
      if(epoch===workEpoch&&workState===state){
        host.replaceChildren(e('p','Comic evidence unavailable: '+error.message,'work-flag'));
      }
    }
  }
  async function workReload(epoch){
    if(epoch!==workEpoch||!$('work-dialog').open)return;
    const id=workState?.workId;
    if(!id)return;
    const data=await api('./api/manage/works/'+encodeURIComponent(String(id))+'/metadata');
    if(epoch!==workEpoch||!$('work-dialog').open)return;
    if(data.workId!==id||typeof data.fingerprint!=='string'||!Array.isArray(data.fields)){
      throw Error('Server returned an invalid book metadata snapshot.');
    }
    ++workCandidateEpoch; // invalidate searches ranked against an older book revision
    $('work-candidates').replaceChildren();
    workState=data;workClearPlans();workRenderSummary(data);workRenderFields(data);
    workResetMedia();
    await Promise.all([workLoadMedia(epoch),workLoadHistory(epoch),workLoadComicAudit(epoch),workLoadComicProfiles(epoch)]);
  }
  function openWorkEditor(id){
    const parsed=Number(id);
    if(!Number.isSafeInteger(parsed)||parsed<=0){notice('Choose a real book identity.',true);return}
    ++workEpoch;++workCandidateEpoch;
    const epoch=workEpoch;
    comicProfileReset();workInputs.clear();workState={workId:parsed};workBusy=false;workClearPlans();workResetMedia();
    $('work-candidates').replaceChildren();
    $('work-candidate-query').value='';
    $('work-dialog-title').textContent='Book #'+parsed;
    workMessage('Loading the actual book, editions, locks and history…');
    $('work-dialog').showModal();
    void workReload(epoch).then(()=>{
      if(epoch===workEpoch&&workState){
        const title=workInputs.get('title')?.input.value||'';
        const author=workInputs.get('author')?.input.value||'';
        $('work-candidate-query').value=[title,author].filter(Boolean).join(' ');
        workMessage('Book details loaded. Select individual edits and preview them before saving.');
      }
    }).catch(error=>{
      if(epoch===workEpoch)workMessage('Unable to open book workbench: '+error.message);
    });
  }
  function workChanges(){
    const changes=[];
    for(const [name,item] of workInputs){
      const current=item.input.value;
      if(current===item.input.dataset.initial)continue;
      if(item.input.readOnly)throw Error('Field '+name+' is locked; unlock before editing.');
      changes.push({name,value:current.trim(),origin:item.input.dataset.origin||'manual'});
    }
    if(!changes.length)throw Error('Change at least one book field before requesting a preview.');
    return changes;
  }
  async function workToggleLock(name,locked){
    if(!workState||workBusy)return;
    if(workDirty()){workMessage('Save or discard unsaved book edits before changing field locks.');return}
    const state=workState,epoch=workEpoch;
    if(!window.confirm((locked?'Lock':'Unlock')+' the book-level '+name+' field?'))return;
    workBusy=true;
    try{
      const answer=await api('./api/manage/works/'+state.workId+'/metadata/fields/'+encodeURIComponent(name),
        'PUT',{locked,expectedRevision:state.revision,expectedFingerprint:state.fingerprint});
      if(epoch!==workEpoch)return;
      if(answer.workId!==state.workId||answer.revision!==state.revision+1){
        throw Error('Server did not confirm the new book revision.');
      }
      await workReload(epoch);
      workMessage('Book field '+name+(locked?' locked and pinned.':' unlocked.')+' Revision '+answer.revision+'.');
    }catch(error){if(epoch===workEpoch)workMessage('Field control rejected: '+error.message)}
    finally{workBusy=false;if(epoch===workEpoch&&workState)workRenderFields(workState)}
  }
  async function workFindCandidates(){
    if(!workState||workBusy||workState.publicationState!=='staged')return;
    const epoch=workEpoch,generation=++workCandidateEpoch,inputVersion=workEditEpoch;
    const query=$('work-candidate-query').value.trim();
    if(query.length<2){workMessage('Enter a title, author or ISBN to search.');return}
    const box=$('work-candidates');box.replaceChildren(e('p','Searching optional public suggestions…','subtext'));
    $('work-candidate-search').disabled=true;
    try{
      const hints=new URLSearchParams({
        q:query,mode:'multi',
        title:workInputs.get('title')?.input.value||'',
        author:workInputs.get('author')?.input.value||'',
        isbn:workInputs.get('isbn')?.input.value||'',
        format:workState.editions?.length&&workState.editions.every(item=>item.format==='Comic')?'comic':'book',
        series:workInputs.get('series')?.input.value||'',
        issue:workInputs.get('seriesNumber')?.input.value||''
      });
      const response=await api('./api/manage/metadata-candidates?'+hints.toString());
      if(epoch!==workEpoch||generation!==workCandidateEpoch||inputVersion!==workEditEpoch)return;
      box.replaceChildren();
      const candidates=Array.isArray(response.candidates)?response.candidates:[];
      const isComic=workState?.editions?.length&&workState.editions.every(item=>item.format==='Comic');
      for(const warning of response.warnings||[]){
        box.append(e('p',warning,'work-flag'));
      }
      if(!candidates.length){box.append(e('p','No candidates. The existing book metadata was not changed.','subtext'));return}
      for(const candidate of candidates){
        const card=e('article',undefined,'work-candidate');
        card.append(e('strong',candidate.title||'Unnamed result'),
          e('small',[
            candidate.source||'Public source',candidate.tier||'unverified',
            candidate.author,candidate.publishedYear,
            candidate.publisher,candidate.isbn
          ].filter(Boolean).join(' · '),'subtext'));
        const buttons=e('div',undefined,'work-candidate-fields');
        for(const [name,label] of [['title','Title'],['author','Author'],['publishedYear','Year'],['isbn','ISBN'],['publisher','Publisher']]){
          const item=workInputs.get(name),value=candidate[name];
          if(!item||item.input.readOnly||value===undefined||value===null||value==='')continue;
          // A Google Books edition date cannot populate the book-wide first
          // publication year. Mixed editions cannot safely share one ISBN.
          if(name==='publishedYear'&&candidate.yearType==='edition publication')continue;
          if(name==='isbn'&&(candidate.identifierMismatch||(workState.editions?.length||0)>1))continue;
          // A matching title/ISBN cannot prove the correct comic issue. Keep
          // all provider field actions disabled until series AND explicit
          // issue token agree. Manual workbench editing remains available.
          if(isComic&&(candidate.comicSeriesMatch!=='match'||candidate.comicIssueMatch!=='match'))continue;
          const button=e('button','Use '+label,'quiet');button.type='button';
          button.title='Compare and select this '+label+' suggestion';
          button.onclick=()=>{
            item.input.value=String(value);
            item.input.dataset.origin=candidate.source==='Google Books'?'google-books':'open-library';
            workClearPlans();
            workMessage('Selected unverified '+(candidate.source||'public')+' '+label+' suggestion. Preview before saving.');
          };
          buttons.append(button);
        }
        card.append(buttons);
        if(isComic&&(candidate.comicSeriesMatch!=='match'||candidate.comicIssueMatch!=='match')){
          card.append(e('small','Suggestions disabled: series and explicit issue must both agree. Check volume, imprint and variant manually.','work-flag'));
        }
        if(candidate.yearType==='edition publication'&&candidate.publishedYear){
          card.append(e('small','Edition year shown for comparison only; first publication year must be independently checked.','subtext'));
        }
        for(const reason of candidate.reasons||[]){card.append(e('small','Match evidence: '+reason,'subtext'))}
        for(const warning of candidate.warnings||[]){card.append(e('small','Review: '+warning,'work-flag'))}
        box.append(card);
      }
    }catch(error){if(epoch===workEpoch&&generation===workCandidateEpoch&&inputVersion===workEditEpoch){
      box.replaceChildren(e('p','Provider unavailable: '+error.message,'subtext'));
    }}finally{if(epoch===workEpoch)$('work-candidate-search').disabled=workState?.publicationState!=='staged'}
  }
  async function workPreview(){
    if(!workState||workBusy)return;
    if(comicProfileDirty()){workMessage('Save or discard unsaved edition labels before editing the book.');return}
    const state=workState,epoch=workEpoch;
    workClearPlans();
    const inputVersion=workEditEpoch;
    let changes;
    try{changes=workChanges()}catch(error){workMessage(error.message);return}
    workBusy=true;$('work-preview-button').disabled=true;
    workMessage('Validating field locks, chapters, publication state and revision…');
    try{
      const preview=await api('./api/manage/works/'+state.workId+'/metadata/preview','POST',{
        expectedRevision:state.revision,expectedFingerprint:state.fingerprint,changes
      });
      if(epoch!==workEpoch||workState!==state||inputVersion!==workEditEpoch)return;
      if(preview.workId!==state.workId||preview.expectedFingerprint!==state.fingerprint||
         !preview.receipt||!Array.isArray(preview.diff)||!preview.diff.length){
        throw Error('Server did not return a valid signed preview.');
      }
      workPlan=preview;workRenderDiff('work-preview-diff',preview.diff);
      $('work-preview-status').textContent=preview.diff.length+' book-level field(s) ready. No changes have been written.';
      $('work-apply-button').disabled=false;
      workMessage('Compare the old and new values. Apply only if they are correct.');
    }catch(error){if(epoch===workEpoch)workMessage('Book preview rejected: '+error.message)}
    finally{workBusy=false;if(epoch===workEpoch)$('work-preview-button').disabled=workState?.publicationState!=='staged'}
  }
  async function workApply(){
    if(!workState||!workPlan||workBusy)return;
    const state=workState,plan=workPlan,epoch=workEpoch;
    if(!window.confirm('Apply exactly '+plan.diff.length+' previewed field changes to book #'+state.workId+'? Media and household progress will remain untouched.'))return;
    workBusy=true;workSetInputBusy(true);$('work-apply-button').disabled=true;
    let committed=false;
    workMessage('Applying the signed, revision-checked book transaction…');
    try{
      const result=await api('./api/manage/works/'+state.workId+'/metadata/apply','POST',{preview:plan,confirm:true});
      if(epoch!==workEpoch)return;
      if(result.workId!==state.workId||result.revision!==state.revision+1)throw Error('Server did not confirm updated book revision.');
      committed=true;
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Saved book metadata. Files and progress retained; publication remains explicit.');
    }catch(error){if(epoch===workEpoch){
      workPlan=null;$('work-apply-button').disabled=true;
      workMessage((committed?'Save confirmed by server; refresh failed: ':'Save was not confirmed: ')+error.message+'. Reload before trying again.');
    }}
    finally{
      workBusy=false;
      if(epoch===workEpoch)workSetInputBusy(false);
    }
  }
  async function workUndoPreview(){
    if(!workState||workBusy)return;
    const state=workState,epoch=workEpoch;
    if(workDirty()){workMessage('Discard or save unsaved edits before reviewing undo.');return}
    workUndoPlan=null;$('work-undo-apply').disabled=true;$('work-undo-diff').replaceChildren();
    const inputVersion=workEditEpoch;
    workBusy=true;
    try{
      const preview=await api('./api/manage/works/'+state.workId+'/metadata/undo-preview','POST');
      if(epoch!==workEpoch||workState!==state||inputVersion!==workEditEpoch)return;
      if(!preview.receipt||preview.expectedFingerprint!==state.fingerprint||!Array.isArray(preview.diff)){
        throw Error('Invalid signed undo preview.');
      }
      workUndoPlan=preview;workRenderDiff('work-undo-diff',preview.diff);
      $('work-undo-status').textContent='Undo previewed; confirm only after checking each restored value.';
      $('work-undo-apply').disabled=false;
    }catch(error){if(epoch===workEpoch)$('work-undo-status').textContent='Undo unavailable: '+error.message}
    finally{workBusy=false}
  }
  async function workApplyUndo(){
    if(!workState||!workUndoPlan||workBusy)return;
    const state=workState,preview=workUndoPlan,epoch=workEpoch;
    if(!window.confirm('Restore the book fields from before the last confirmed save? No media or progress changes.'))return;
    workBusy=true;workSetInputBusy(true);$('work-undo-apply').disabled=true;
    let committed=false;
    try{
      const result=await api('./api/manage/works/'+state.workId+'/metadata/undo','POST',{preview,confirm:true});
      if(epoch!==workEpoch)return;
      if(result.workId!==state.workId||result.revision!==state.revision+1)throw Error('Server did not confirm a new undo revision.');
      committed=true;
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Previous book metadata values restored. All files and bookmarks retained.');
    }catch(error){if(epoch===workEpoch){
      workUndoPlan=null;$('work-undo-apply').disabled=true;
      workMessage((committed?'Undo confirmed by server; refresh failed: ':'Undo was not confirmed: ')+error.message)
    }}
    finally{workBusy=false;if(epoch===workEpoch)workSetInputBusy(false)}
  }
  async function workTogglePublication(){
    if(!workState||workBusy)return;
    if(workDirty()){workMessage('Save or discard unsaved book edits before changing publication.');return}
    const state=workState,epoch=workEpoch,action=state.publicationState==='published'?'unpublish':'publish';
    if(!window.confirm((action==='publish'?'Publish book to the household after verifying all files and cover?':'Unpublish book from household Library and Atlas?')+' Originals and progress remain unchanged.'))return;
    workBusy=true;workSetInputBusy(true);$('work-publish-toggle').disabled=true;
    let committed=false;
    try{
      const current=await api('./api/manage/works/'+state.workId+'/publication');
      if(epoch!==workEpoch||current.state!==state.publicationState)throw Error('Publication state changed; reopen the book.');
      const next=await api('./api/manage/works/'+state.workId+'/publication','POST',{
        action,confirm:true,expectedRevision:current.revision
      });
      if(epoch!==workEpoch)return;
      if(next.state!==(action==='publish'?'published':'staged'))throw Error('Server did not confirm publication change.');
      committed=true;
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Book '+(action==='publish'?'published.':'unpublished.')+' Metadata and progress retained.');
    }catch(error){if(epoch===workEpoch)workMessage((committed?'Publication changed; refresh failed: ':'Publication was not confirmed: ')+error.message)}
    finally{workBusy=false;if(epoch===workEpoch){workSetInputBusy(false);if(workState)workRenderSummary(workState)}}
  }
  async function workUploadCover(){
    if(!workState||workBusy)return;
    const input=$('work-cover-upload'),file=input.files?.[0];if(!file)return;
    if(workDirty()){workMessage('Save or discard book edits before changing its cover.');input.value='';return}
    if(workState.publicationState==='published'){workMessage('Unpublish before replacing selected cover.');input.value='';return}
    if(file.size>4*1024*1024){workMessage('Cover must be smaller than 4 MB.');input.value='';return}
    const state=workState,epoch=workEpoch;workBusy=true;workSetInputBusy(true);input.disabled=true;
    let committed=false;
    try{
      const answer=await fetch('./api/manage/works/'+encodeURIComponent(String(state.workId))+'/cover',{
        method:'POST',credentials:'same-origin',headers:{'X-Archivist-Action':'1',
          'Content-Type':file.type||'application/octet-stream'},body:file
      });
      const body=await answer.json();
      if(!answer.ok)throw Error(body.error||'Cover upload was rejected.');
      if(epoch!==workEpoch)return;
      if(!/^[0-9a-f]{64}$/.test(body.sha256))throw Error('The server did not verify the saved cover.');
      committed=true;
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Cover stored with the book and its database backup. Publication remains separate.');
    }catch(error){if(epoch===workEpoch)workMessage((committed?'Cover stored; refresh failed: ':'Cover was not confirmed: ')+error.message)}
    finally{workBusy=false;input.value='';if(epoch===workEpoch){
      workSetInputBusy(false);input.disabled=workState?.publicationState!=='staged'
    }}
  }
  async function workClearCover(){
    if(!workState||workBusy||!workState.coverHash)return;
    if(workDirty()){workMessage('Save or discard unsaved book edits before clearing a cover.');return}
    if(workState.publicationState==='published'){workMessage('Unpublish this book before clearing its selected cover.');return}
    const state=workState,epoch=workEpoch;
    if(!window.confirm('Clear this selected book cover? Original media artwork, edition metadata and progress will not be changed.'))return;
    workBusy=true;workSetInputBusy(true);$('work-cover-clear').disabled=true;
    let committed=false;
    try{
      const answer=await api('./api/manage/works/'+encodeURIComponent(String(state.workId))+'/cover','DELETE');
      if(!answer.ok)throw Error('Cover removal was not confirmed.');
      committed=true;
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Selected cover cleared. The media and household positions are unchanged.');
    }catch(error){if(epoch===workEpoch)workMessage((committed?'Cover cleared; refresh failed: ':'Cover change was not confirmed: ')+error.message)}
    finally{
      workBusy=false;
      if(epoch===workEpoch){workSetInputBusy(false);if(workState)workRenderSummary(workState)}
    }
  }
  async function loadAssist(){
    const generation=++assistRequest,location=assistOffset,mode=assistMode;
    const container=$('assist-works');
    for(const [id,state] of [['assist-staged','staged'],['assist-published','published']]){
      $(''+id).setAttribute('aria-pressed',String(mode===state));
    }
    $('assist-range').textContent=mode==='published'?'Loading your published books…':'Finding books awaiting publication…';
    try {
      const query=new URLSearchParams({limit:String(assistPageSize),offset:String(location),state:mode});
      for(const [param,id] of [['q','assist-query'],['space','assist-space'],
        ['format','assist-format'],['reason','assist-reason']]){
        const value=String($(id).value||'').trim();
        if(value)query.set(param,value);
      }
      const result=await api('./api/manage/review-works?'+query);
      if(generation!==assistRequest||activeView!=='assist'||mode!==assistMode)return;
      const works=Array.isArray(result.works)?result.works:[];
      container.replaceChildren();
      if(!works.length){
        container.append(e('p',location?'No more books on this page.':mode==='published'?'Nothing published yet. Publish reviewed books to make them visible to readers.':'No books require publication or review.','empty'));
      }
      for(const work of works){
        const article=e('article',undefined,'assist-work');
        const cover=e('div',undefined,'assist-cover');
        cover.append(e('span',(work.title||'Book').slice(0,2).toUpperCase()));
        const artwork=e('img');artwork.loading='lazy';artwork.alt='';
        artwork.src='./api/works/'+encodeURIComponent(String(work.id))+'/cover'+(work.coverHash?'?v='+encodeURIComponent(work.coverHash):'');
        artwork.addEventListener('load',()=>cover.classList.add('has-cover'));
        artwork.addEventListener('error',()=>artwork.remove());
        cover.append(artwork);
        const details=e('div',undefined,'assist-details');
        details.append(e('strong',work.title||'Untitled'));
        details.append(e('span',[work.author||'Unknown author',work.series,work.format,work.space].filter(Boolean).join(' · '),'subtext'));
        details.append(e('small','Book ID '+work.id+' · '+work.files+' indexed media files','subtext'));
        details.append(e('span',Number(work.reviewFiles)+' of '+work.files+' files need review','pill '+(work.reviewFiles?'warn':'ok')));
        details.append(e('span',work.publicationState==='published'?
          'Published to family':'Awaiting explicit publication or review','subtext'));
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
        const bookEditor=e('button','Edit book','primary');
        bookEditor.type='button';bookEditor.setAttribute('aria-label','Edit book metadata for '+work.title);
        bookEditor.onclick=()=>openWorkEditor(work.id);
        controls.append(bookEditor);
        if(work.format==='Audio'&&Number(work.files)>1){
          const repair=e('button','Reconnect audiobook','quiet');repair.type='button';
          repair.onclick=()=>openGroupedRelink(work.id);
          controls.append(repair);
        }
        const uploadLabel=e('label','Choose cover (JPEG or PNG)','assist-cover-picker');
        const upload=e('input');upload.type='file';upload.accept='image/jpeg,image/png';
        upload.setAttribute('aria-label','Choose cover for '+work.title);
        upload.onchange=async()=>{
          const file=upload.files?.[0];if(!file)return;
          if(file.size>4*1024*1024){notice('Choose an image no larger than 4 MB.',true);return}
          upload.disabled=true;
          try{
            const response=await fetch('./api/manage/works/'+encodeURIComponent(String(work.id))+'/cover',{
              method:'POST',credentials:'same-origin',
              headers:{'X-Archivist-Action':'1','Content-Type':file.type||'application/octet-stream'},
              body:file
            });
            const data=await response.json();
            if(!response.ok)throw Error(data.error||'Unable to save the cover.');
            if(!/^[0-9a-f]{64}$/.test(data.sha256))throw Error('Server did not confirm a stored cover.');
            artwork.src='./api/works/'+encodeURIComponent(String(work.id))+'/cover?v='+encodeURIComponent(data.sha256);
            cover.append(artwork);
            await Promise.all([loadAssist(),loadSummary()]);
            notice('Selected cover saved for '+work.title+'. Publishing is a separate action.');
          }catch(error){notice(error.message,true)}
          finally{upload.disabled=false;upload.value=''}
        };
        uploadLabel.append(upload);controls.append(uploadLabel);
        if(work.coverHash&&work.publicationState!=='published'){
          const reset=e('button','Clear selected cover','quiet');reset.type='button';
          reset.onclick=async()=>{
            if(!window.confirm('Clear the selected cover for '+work.title+'? The media files are not changed.'))return;
            reset.disabled=true;
            try{
              await api('./api/manage/works/'+encodeURIComponent(String(work.id))+'/cover','DELETE');
              await Promise.all([loadAssist(),loadSummary()]);
              notice('Selected cover cleared; original artwork remains untouched.');
            }catch(error){notice(error.message,true)}finally{reset.disabled=false}
          };
          controls.append(reset);
        }
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
      $('assist-range').textContent=result.total+(mode==='published'?' published books':' books require review or publication')+' · '+(works.length?location+1:0)+'–'+(location+works.length)+' shown';
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
    const organisePicker=$('organise-space'),organiseBefore=organisePicker.value;
    organisePicker.replaceChildren(new Option('All spaces',''));
    for(const item of sources){
      if(item.space&&!Array.from(organisePicker.options).some(x=>x.value===item.space))
        organisePicker.add(new Option(item.space,item.space));
    }
    organisePicker.value=Array.from(organisePicker.options).some(x=>x.value===organiseBefore)?
      organiseBefore:'';
    const reviewPicker=$('assist-space'),previous=reviewPicker.value;
    reviewPicker.replaceChildren(new Option('All spaces',''));
    for(const item of sources){
      if(item.space&&!Array.from(reviewPicker.options).some(x=>x.value===item.space)){
        reviewPicker.add(new Option(item.space,item.space));
      }
    }
    reviewPicker.value=Array.from(reviewPicker.options).some(x=>x.value===previous)?previous:'';
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
      card.append(e('small',(live?.indexedWorks??item.works??0)+' works · '+(live?.indexedFiles??item.files??0)+' indexed files · '+(live?.needsReview??0)+' need review','subtext'));
      if(live)card.append(e('small',Number(live.missingGenre||0)+' missing genres · '+Number(live.missingYear||0)+' missing years · '+Number(live.offlineFiles||0)+' unavailable flags','subtext'));
      // A scanner action lives next to its real source and is disabled for
      // known disconnected roots or already-active source jobs. Rechecking
      // online state at the server remains the source of truth.
      const busy=jobs.some(job=>Number(job.source_id)===Number(item.id)&&
        ['queued','running','committing','cancelling'].includes(job.state));
      const scan=e('button','Scan / refresh source','quiet edit-button');
      scan.type='button';
      scan.disabled=live?.online!==true||busy;
      scan.title=live?.online!==true?'Source is not confirmed connected':
        busy?'A scan is already queued or running':'Queue a safe scan; never automatically publish';
      scan.onclick=async()=>{
        if(scan.disabled)return;
        if(!window.confirm('Queue a metadata scan for '+(item.space||'this library')+'? Existing book edits, progress and published state remain protected.'))return;
        scan.disabled=true;
        try{
          const result=await api('./api/sources/'+encodeURIComponent(String(item.id))+'/scan','POST');
          notice('Source scan queued as job '+result.job_id+'.');
          await Promise.all([loadHealth(),loadSummary()]);
        }catch(error){notice('Scan could not be queued: '+error.message,true);scan.disabled=false}
      };
      card.append(scan);
      list.append(card);
    }
    const coverage=$('scanner-coverage');coverage.replaceChildren();
    const summary=health.summary||{};
    const groups=[
      ['Missing author','author',summary.missingAuthor],
      ['Missing genre','genre',summary.missingGenre],
      ['Missing year','year',summary.missingYear],
      ['Low confidence','confidence',summary.lowConfidence],
      ['Needs review','review',summary.needsReview],
      ['Unavailable files','unavailable',summary.offlineFiles]
    ];
    for(const [label,key,amount] of groups){
      const count=Math.max(0,Number(amount||0));
      const button=e('button',undefined,'coverage-tile');
      button.type='button';
      button.setAttribute('aria-label','Show '+count+' files: '+label);
      button.append(e('strong',count.toLocaleString()),e('span',label),e('small','Review indexed files →','subtext'));
      button.onclick=()=>{
        showView('library');
        $('metadata-gap').value=key;
        offset=0;
        void loadCatalogue();
      };
      coverage.append(button);
    }
    $('scanner-coverage-note').textContent=health.note||'Read-only indexed-file coverage; root connectivity is checked separately.';
    const tasks=$('jobs-health');tasks.replaceChildren();
    if(!jobs.length)tasks.append(e('p','No recent scan jobs.','subtext'));
    for(const job of jobs.slice(0,15)){
      const row=e('article',undefined,'health-row');
      row.append(e('strong','Source '+job.source_id+' · '+job.state),e('span',job.message||'','subtext'));
      const done=Number(job.progress||0),total=Number(job.total||0);
      if(total>0){const bar=e('progress');bar.max=total;bar.value=Math.min(total,done);row.append(bar)}
      // Only staging is cancellable. COMMITTING is an atomic stop barrier.
      if((job.state==='queued'||(job.state==='running'&&job.canCancel))||
          job.state==='failed'||job.state==='cancelled'){
        const action=(job.state==='queued'||job.state==='running')?'cancel':'retry';
        const button=e('button',action==='cancel'?(job.state==='running'?'Request safe stop':'Cancel queued scan'):'Retry scan','quiet edit-button');
        button.type='button';
        button.onclick=async()=>{
          if(action==='cancel'&&!window.confirm(job.state==='running'?
             'Request a safe stop before the catalogue commit? Already staged files will be discarded.':
             'Cancel this queued scan before it starts? No library files will change.'))return;
          button.disabled=true;
          try{
            const response=await api('./api/jobs/'+encodeURIComponent(String(job.id))+'/'+action,'POST');
            notice(action==='cancel'?(response.state==='cancelling'?'Safe stop requested; scanner will acknowledge before catalogue commit.':'Queued scan cancelled.'):'Scan queued as job '+response.job_id+'.');
            await Promise.all([loadHealth(),loadSummary()]);
          }catch(err){notice(err.message,true);button.disabled=false}
        };
        row.append(button);
      }else if(job.state==='committing'){
        row.append(e('small','Committing verified catalogue; safe cancellation no longer possible.','subtext'));
      }
      tasks.append(row);
    }
  }
  // Family and Settings are native admin views over the existing protected
  // server endpoints. Keys remain memory-only, visible exactly once, and are
  // never written to localStorage, URLs, logs or regular catalogue metadata.
  let familyEpoch=0,familyBusy=false,familySecret=null;
  let settingsEpoch=0,settingsBusy=false;
  function familyStatus(message){$('family-status').textContent=String(message)}
  function renderFamilySecret(){
    const present=Boolean(familySecret);
    $('family-key-result').hidden=!present;
    $('family-no-key').hidden=present;
    $('family-key').value=present?familySecret.key:'';
    $('family-key-context').textContent=present?
      'Access key for '+familySecret.name+' · user #'+familySecret.id+
        '. Copy it now. It cannot be retrieved after dismissal or refresh.':'';
    $('family-create-button').disabled=familyBusy||present;
  }
  function familyKeyValid(answer){
    return Boolean(answer&&Number.isSafeInteger(Number(answer.id))&&
      Number(answer.id)>0&&typeof answer.name==='string'&&
      typeof answer.key==='string'&&/^[a-f0-9]{64}$/i.test(answer.key));
  }
  async function loadFamily(){
    const epoch=++familyEpoch;
    $('family-refresh').disabled=true;
    if(activeView==='family')familyStatus('Loading household accounts…');
    try{
      const result=await api('./api/profiles');
      if(epoch!==familyEpoch||activeView!=='family')return;
      if(!Array.isArray(result))throw Error('Invalid household response.');
      const host=$('family-profiles');host.replaceChildren();
      if(!result.length)host.append(e('p','No family users configured. Add one to create a private access key.','subtext'));
      for(const profile of result){
        const id=Number(profile.id);
        if(!Number.isSafeInteger(id)||id<1||typeof profile.name!=='string'){
          throw Error('Invalid household user identity.');
        }
        const card=e('article',undefined,'family-user'),content=e('div');
        const spaces=Array.isArray(profile.spaces)?profile.spaces.length:0;
        content.append(e('strong',profile.name),
          e('small',profile.revoked?'Access revoked':
            'User #'+id+' · all-library access · '+spaces+' indexed library space(s)'));
        card.append(content);
        if(!profile.revoked){
          const actions=e('div',undefined,'operations-actions');
          const rotate=e('button','Replace key','quiet');
          rotate.type='button';rotate.disabled=familyBusy||Boolean(familySecret);
          rotate.onclick=()=>void rotateFamilyKey(id,profile.name);
          const revoke=e('button','Revoke access','quiet');
          revoke.type='button';revoke.disabled=familyBusy||Boolean(familySecret);
          revoke.onclick=()=>void revokeFamilyUser(id,profile.name);
          actions.append(rotate,revoke);card.append(actions);
        }
        host.append(card);
      }
      familyStatus(result.filter(p=>!p.revoked).length+
        ' active users. Every active User currently has access to all library spaces.');
      renderFamilySecret();
    }catch(error){
      if(epoch===familyEpoch&&activeView==='family')
        familyStatus('Unable to read household accounts: '+error.message);
    }finally{
      if(epoch===familyEpoch)$('family-refresh').disabled=false;
    }
  }
  function presentFamilyKey(answer){
    familySecret={id:Number(answer.id),name:answer.name,key:answer.key};
    renderFamilySecret();
    familyStatus('Access changed. Save the one-time access key before doing anything else.');
  }
  async function createFamilyUser(event){
    event.preventDefault();
    if(familyBusy||familySecret)return;
    const name=String($('family-name').value||'').trim();
    if(!name||name.length>100){familyStatus('Enter a display name of 1–100 characters.');return}
    if(!window.confirm('Create '+name+' with access to every library space? The key will be shown only once.'))return;
    familyBusy=true;renderFamilySecret();familyStatus('Creating user…');
    let committed=false;
    try{
      const answer=await api('./api/profiles','POST',{name});
      committed=true;
      if(!familyKeyValid(answer)||answer.name!==name)
        throw Error('Account may be created, but its one-time key was not returned safely. Inspect and rotate the user key.');
      presentFamilyKey(answer);
      $('family-name').value='';
      await loadFamily();
      familyStatus('User '+name+' created. Save the displayed one-time key securely.');
    }catch(error){
      familyStatus((committed?'Server change may be committed: ':'User not created: ')+error.message);
    }finally{
      familyBusy=false;renderFamilySecret();
    }
  }
  async function rotateFamilyKey(id,name){
    if(familyBusy||familySecret){familyStatus('Dismiss the previous one-time key before changing another account.');return}
    if(!window.confirm('Replace '+name+' access key? Existing sessions will be revoked immediately.'))return;
    familyBusy=true;renderFamilySecret();familyStatus('Replacing access key…');
    let committed=false;
    try{
      const answer=await api('./api/profiles/'+encodeURIComponent(String(id))+'/rotate-key','POST');
      committed=true;
      if(typeof answer.key!=='string'||!/^[a-f0-9]{64}$/i.test(answer.key))
        throw Error('Key may be rotated but was not returned safely. Reopen the user and rotate again.');
      presentFamilyKey({id,name,key:answer.key});
      await loadFamily();
      familyStatus('Access key rotated. All earlier user sessions are revoked. Save the new key.');
    }catch(error){
      familyStatus((committed?'Rotation may be committed: ':'Rotation failed: ')+error.message);
    }finally{
      familyBusy=false;renderFamilySecret();
    }
  }
  async function revokeFamilyUser(id,name){
    if(familyBusy||familySecret){familyStatus('Dismiss the displayed one-time key before changing accounts.');return}
    if(!window.confirm('Revoke '+name+' immediately? Existing sessions will stop, but the user’s private progress is retained.'))return;
    familyBusy=true;renderFamilySecret();familyStatus('Revoking user access…');
    let committed=false;
    try{
      const answer=await api('./api/profiles/'+encodeURIComponent(String(id)),'DELETE');
      if(answer?.ok!==true)throw Error('Server did not confirm revocation.');
      committed=true;
      await loadFamily();
      familyStatus('Access revoked for '+name+'. Personal progress was not deleted.');
    }catch(error){
      familyStatus((committed?'Access revoked, but refreshing users failed: ':'Access was not confirmed revoked: ')+error.message);
    }finally{familyBusy=false;renderFamilySecret()}
  }
  function dismissFamilyKey(){
    if(familyBusy||!familySecret)return;
    if(!window.confirm('Clear this one-time access key now? You cannot retrieve it later.'))return;
    $('family-key').value='';
    familySecret=null;
    renderFamilySecret();
    familyStatus('One-time key cleared from this browser session.');
    if(activeView==='family')void loadFamily();
  }
  function serverStatus(message){$('settings-status').textContent=String(message)}
  async function loadServerSettings(){
    const epoch=++settingsEpoch;
    $('settings-refresh').disabled=true;
    serverStatus('Loading connection state and owner sessions…');
    try{
      const [info,sessions]=await Promise.all([
        api('./api/server-info'),api('./api/sessions')
      ]);
      if(epoch!==settingsEpoch||activeView!=='settings')return;
      if(!info||typeof info!=='object'||!Array.isArray(sessions))
        throw Error('Invalid server or session response.');
      const host=$('settings-info');host.replaceChildren();
      const data=[
        ['Current connection',String(info.address||'Unknown')],
        ['Owner access configured',info.configured?'Yes':'No'],
        ['Source folders',operationsCount(info.sources)],
        ['Watched folders',operationsCount(info.watchedSources)],
        ['Active scan jobs',operationsCount(info.activeJobs)],
        ['Active server sessions',operationsCount(info.sessions)],
        ['Local DB size',operationsSize(info.databaseBytes)]
      ];
      for(const [name,value] of data)operationsLine('settings-info',name,value);
      const list=$('settings-sessions');list.replaceChildren();
      if(!sessions.length)list.append(e('p','No active administrator sessions returned.','subtext'));
      for(const sess of sessions.slice(0,100)){
        const id=Number(sess.id),created=Number(sess.created),expires=Number(sess.expires);
        if(!Number.isSafeInteger(id)||id<1||!Number.isFinite(expires))
          throw Error('Invalid session record.');
        const card=e('article',undefined,'server-session'),details=e('div');
        details.append(e('strong','Session #'+id),
          e('small','Started '+new Date(created*1000).toLocaleString()+
            ' · expires '+new Date(expires*1000).toLocaleString()));
        const action=e('button','End session','quiet');
        action.type='button';action.disabled=settingsBusy;
        action.onclick=()=>void endServerSession(id);
        card.append(details,action);list.append(card);
      }
      serverStatus('Current admin connection and '+sessions.length+' active owner session(s) loaded.');
    }catch(error){
      if(epoch===settingsEpoch&&activeView==='settings')
        serverStatus('Unable to load server settings: '+error.message);
    }finally{
      if(epoch===settingsEpoch)$('settings-refresh').disabled=false;
    }
  }
  async function endServerSession(id){
    if(settingsBusy)return;
    if(!window.confirm('End session #'+id+'? This may end your current administrator session and require signing in again.'))return;
    settingsBusy=true;serverStatus('Revoking selected session…');
    try{
      const result=await api('./api/sessions/'+encodeURIComponent(String(id)),'DELETE');
      if(result?.ok!==true)throw Error('Server did not confirm session termination.');
      await loadServerSettings();
      if(activeView==='settings')serverStatus('Session ended. If this was your current login, sign in again.');
    }catch(error){
      serverStatus('Session change uncertain: '+error.message+'. Refresh or sign in again.');
    }finally{settingsBusy=false}
  }
  // S7 Organise: deliberately small, paginated owner selections. All media
  // hashing, path safety, collision checks, copy/verify and journalling are
  // delegated to the existing server file-move engine.
  const organisePageSize=40,organiseSelectionCap=100;
  let organiseOffset=0,organiseJournalOffset=0;
  let organiseListEpoch=0,organisePlanEpoch=0,organiseJournalEpoch=0;
  let organiseFiles=[],organiseSelected=new Map(),organisePlan=[],organiseApproved=new Set();
  let organiseBusy=false;
  const organiseMoveID=id=>typeof id==='string'&&/^[0-9a-f]{32}$/.test(id);
  function organiseStatus(message){$('organise-preview-status').textContent=String(message)}
  function organiseSelectionStatus(){
    $('organise-selected-count').textContent=organiseSelected.size+' / '+organiseSelectionCap+' files chosen';
    $('organise-preview').disabled=organiseBusy||organiseSelected.size===0;
    $('organise-clear-selection').disabled=organiseBusy||organiseSelected.size===0;
  }
  function organisePlanButtons(){
    const ready=organisePlan.filter(item=>item.status==='ready'&&organiseMoveID(item.move?.id));
    const valid=new Set(ready.map(item=>item.move.id));
    const checked=[...organiseApproved].filter(id=>valid.has(id));
    $('organise-apply').disabled=organiseBusy||!checked.length;
    $('organise-apply').textContent=checked.length?'Apply chosen verified moves ('+checked.length+')':'Apply chosen verified moves';
    $('organise-select-ready').disabled=organiseBusy||!ready.length;
    $('organise-clear-ready').disabled=organiseBusy||!checked.length;
    $('organise-cancel-preview').disabled=organiseBusy||!ready.length;
  }
  function organiseResetPlan(message){
    ++organisePlanEpoch;
    organisePlan=[];organiseApproved.clear();
    $('organise-preview-items').replaceChildren();
    organiseStatus(message||'No move preview yet.');
    organisePlanButtons();
  }
  function organiseSetBusy(value){
    organiseBusy=Boolean(value);
    for(const id of ['organise-preview','organise-clear-selection','organise-manual-preview',
      'organise-refresh','organise-find','organise-clear-search','organise-journal-refresh',
      'organise-template','organise-search','organise-space','organise-format',
      'organise-previous','organise-next','organise-journal-prev','organise-journal-next']){
      const control=$(id);
      if(control)control.disabled=organiseBusy;
    }
    organiseSelectionStatus();organisePlanButtons();
  }
  function organiseFileList(){
    const container=$('organise-files');container.replaceChildren();
    if(!organiseFiles.length){
      const tr=e('tr'),td=e('td','No indexed media on this page. Try a narrower search or earlier page.','empty');
      td.colSpan=6;tr.append(td);container.append(tr);
    }
    for(const item of organiseFiles){
      const tr=e('tr');
      const id=Number(item.id);
      const td=e('td'),box=e('input');
      box.type='checkbox';box.checked=organiseSelected.has(id);
      box.disabled=organiseBusy||!item.available||!Number.isSafeInteger(id)||id<1;
      box.setAttribute('aria-label','Select indexed file '+id+' '+String(item.title||'Untitled'));
      box.onchange=()=>{
        if(organiseBusy){box.checked=organiseSelected.has(id);return}
        if(box.checked){
          if(organiseSelected.size>=organiseSelectionCap&&!organiseSelected.has(id)){
            box.checked=false;
            $('organise-list-status').textContent='Selection capped at 100 files. Preview this batch before choosing more.';
            return;
          }
          organiseSelected.set(id,item);
        }else{organiseSelected.delete(id)}
        organiseResetPlan('File selection changed. Earlier journal previews remain accessible below.');
        organiseSelectionStatus();
      };
      td.append(box);
      const name=e('td');name.append(e('strong',item.title||'Untitled'),e('small',item.author||'Unknown author','subtext'));
      const series=e('td',(item.series||'—')+(item.seriesNumber?' · #'+item.seriesNumber:''));
      const format=e('td',item.format||'Unknown'),space=e('td',item.space||'—');
      const state=e('td',item.available?item.needsReview?'Review required':'Available':'Unavailable');
      tr.append(td,name,series,format,space,state);
      container.append(tr);
    }
    $('organise-page').textContent='Page '+(Math.floor(organiseOffset/organisePageSize)+1);
    $('organise-previous').disabled=organiseBusy||organiseOffset===0;
    $('organise-next').disabled=organiseBusy||organiseFiles.length<organisePageSize;
    organiseSelectionStatus();
  }
  async function loadOrganiseFiles(){
    const generation=++organiseListEpoch,offset=organiseOffset;
    $('organise-list-status').textContent='Loading a bounded page of indexed files…';
    try{
      const query=new URLSearchParams({limit:String(organisePageSize),offset:String(offset),sort:'title'});
      const filters=[['q','organise-search'],['space','organise-space'],['format','organise-format']];
      for(const [name,id] of filters){
        const value=String($(id).value||'').trim();
        if(value)query.set(name,value);
      }
      const items=await api('./api/books?'+query);
      if(generation!==organiseListEpoch||activeView!=='organise')return;
      if(!Array.isArray(items)||items.length>organisePageSize){
        throw Error('Invalid or unbounded catalogue page.');
      }
      organiseFiles=items;organiseFileList();
      $('organise-list-status').textContent=
        'Showing '+(items.length?offset+1:0)+'–'+(offset+items.length)+
        ' indexed files on this page. '+organiseSelected.size+' selected across pages; total library size is not inferred.';
    }catch(error){
      if(generation===organiseListEpoch&&activeView==='organise'){
        organiseFiles=[];organiseFileList();
        $('organise-list-status').textContent='Unable to list indexed files: '+error.message;
      }
    }
  }
  function organisePaths(item){
    const container=e('div',undefined,'organise-move-paths');
    const a=e('code',item.from||item.move?.from||'Not recorded');
    const arrow=e('span','→');
    const b=e('code',item.to||item.move?.to||'Not recorded');
    container.append(a,arrow,b);return container;
  }
  function organiseRenderPlan(){
    const area=$('organise-preview-items');area.replaceChildren();
    let ready=0,blocked=0,unchanged=0;
    for(const item of organisePlan.slice(0,organiseSelectionCap)){
      const state=String(item.status||'conflict'),move=item.move;
      if(state==='ready'&&organiseMoveID(move?.id))ready++;
      else if(state==='same')unchanged++;
      else blocked++;
      const card=e('article',undefined,'organise-move-item '+(state==='ready'?'organise-move-ready':'organise-move-risk'));
      const heading=e('div',undefined,'organise-move-header');
      heading.append(e('strong',String(item.title||'File #'+String(item.asset||move?.asset||'?'))),
        e('span',state==='ready'?'Ready (hash verified during preview)':state==='same'?'Already organised':state==='review'?'Review first':'Conflict','pill '+(state==='ready'?'ok':'warn')));
      card.append(heading,organisePaths(item));
      if(item.error)card.append(e('p',String(item.error)));
      if(state==='ready'&&organiseMoveID(move?.id)){
        const choice=e('label',undefined,'organise-choice'),box=e('input');
        box.type='checkbox';box.checked=organiseApproved.has(move.id);
        box.disabled=organiseBusy;
        box.setAttribute('aria-label','Approve move '+String(move.from||'')+' to '+String(move.to||''));
        box.onchange=()=>{
          if(organiseBusy){box.checked=organiseApproved.has(move.id);return}
          if(box.checked)organiseApproved.add(move.id);
          else organiseApproved.delete(move.id);
          organisePlanButtons();
        };
        choice.append(box,e('span','Approve this exact journaled move'));
        card.append(choice);
      }
      area.append(card);
    }
    if(organisePlan.length>organiseSelectionCap)area.append(e('p','Some previews were omitted; no omitted item can be applied.','subtext'));
    organisePlanButtons();
    return {ready,blocked,unchanged};
  }
  async function previewOrganise(){
    if(organiseBusy||organiseSelected.size===0)return;
    const selected=[...organiseSelected.keys()];
    if(selected.length>organiseSelectionCap){organiseStatus('Selection exceeds the server batch cap.');return}
    const epoch=++organisePlanEpoch,template=$('organise-template').value;
    organisePlan=[];organiseApproved.clear();organiseRenderPlan();
    organiseSetBusy(true);
    organiseStatus('Preparing verified, non-moving previews for '+selected.length+' explicitly selected files…');
    try{
      const result=await api('./api/file-moves/preview-template-batch','POST',{assets:selected,template});
      if(epoch!==organisePlanEpoch)return;
      const data=Array.isArray(result?.items)?result.items:[];
      if(data.length>organiseSelectionCap||!Number.isSafeInteger(Number(result.ok))||!Number.isSafeInteger(Number(result.failed))){
        throw Error('Unexpected batch preview response.');
      }
      organisePlan=data;
      const tally=organiseRenderPlan();
      organiseStatus(tally.ready+' Ready, '+tally.blocked+' conflicts/reviews, '+tally.unchanged+
        ' already organised. No media moved. Tick the exact Ready moves you approve.');
      void loadOrganiseJournal();
    }catch(error){
      if(epoch===organisePlanEpoch){
        organisePlan=[];organiseApproved.clear();organiseRenderPlan();
        organiseStatus('Preview incomplete: '+error.message+
          '. Some journal records may have been created. Inspect Move journal before retrying.');
      }
    }finally{
      if(epoch===organisePlanEpoch){
        organiseSetBusy(false);organiseRenderPlan();organiseFileList();
      }
    }
  }
  async function applyOrganise(){
    if(organiseBusy)return;
    const ready=organisePlan.filter(item=>item.status==='ready'&&organiseMoveID(item.move?.id));
    const active=new Set(ready.map(item=>item.move.id));
    const ids=[...organiseApproved].filter(id=>active.has(id));
    if(!ids.length||ids.length>organiseSelectionCap)return;
    if(!window.confirm('Apply '+ids.length+' explicitly approved hash-verified file moves? Each move will be checked again. A failed batch can partially succeed, so check the journal afterwards.'))return;
    const epoch=++organisePlanEpoch;organiseSetBusy(true);
    organiseStatus('Applying '+ids.length+' selected journal moves. No unselected file is authorised…');
    // Never permit a client retry of the same unverified response: a network
    // error may arrive after a successful server-side move.
    organiseApproved.clear();organisePlan=[];organiseRenderPlan();
    try{
      const result=await api('./api/file-moves/apply-batch','POST',{ids});
      if(epoch!==organisePlanEpoch)return;
      if(!Number.isSafeInteger(Number(result?.ok))||!Number.isSafeInteger(Number(result?.failed))){
        throw Error('Server did not provide a reliable per-batch result.');
      }
      const lines=Array.isArray(result.items)?result.items:[];
      const failures=lines.filter(x=>x.error).slice(0,8).map(x=>x.error);
      organiseStatus(result.ok+' move(s) completed, '+result.failed+' failed or need review. '+
        (failures.length?failures.join(' · ')+' · ':'')+
        'Inspect the journal before any retry.');
      organiseSelected.clear();
      void loadOrganiseFiles();
      void loadOrganiseJournal();
    }catch(error){
      if(epoch===organisePlanEpoch)organiseStatus(
        'Move outcome unverified: '+error.message+'. Do not retry blindly. Refresh the move journal first.');
    }finally{
      if(epoch===organisePlanEpoch){organiseSetBusy(false);organiseFileList()}
    }
  }
  async function cancelOrganisePlan(){
    if(organiseBusy)return;
    const ids=organisePlan.filter(x=>x.status==='ready'&&organiseMoveID(x.move?.id)).map(x=>x.move.id);
    if(!ids.length)return;
    if(!window.confirm('Cancel '+ids.length+' staged previews? No original media will be changed. Already applying or completed moves cannot be cancelled.'))return;
    const epoch=++organisePlanEpoch;
    organiseSetBusy(true);
    const failed=[];
    let canceled=0;
    for(const id of ids){
      try{
        const result=await api('./api/file-moves/'+encodeURIComponent(id)+'/cancel','POST');
        if(result.ok===true)canceled++;else failed.push(id);
      }catch(error){failed.push(id)}
    }
    if(epoch===organisePlanEpoch){
      organisePlan=organisePlan.filter(x=>failed.includes(x.move?.id));
      organiseApproved.clear();
      organiseRenderPlan();
      organiseStatus(canceled+' previews cancelled, '+failed.length+
        ' could not be cancelled. Unresolved moves remain in the persistent journal.');
      void loadOrganiseJournal();
      organiseSetBusy(false);organiseRenderPlan();organiseFileList();
    }
  }
  async function previewOrganiseManual(event){
    event.preventDefault();
    if(organiseBusy)return;
    const id=Number($('organise-manual-id').value),to=String($('organise-manual-path').value||'').trim();
    if(!Number.isSafeInteger(id)||id<1||!to||to.length>500){
      organiseStatus('Choose a valid indexed file ID and a relative destination path.');return;
    }
    const epoch=++organisePlanEpoch;organiseSetBusy(true);
    organiseStatus('Validating exact source and relative destination; no file will be moved…');
    try{
      const move=await api('./api/file-moves/preview','POST',{asset:id,to});
      if(epoch!==organisePlanEpoch)return;
      if(!organiseMoveID(move?.id)||move.asset!==id||move.to!==to||move.state!=='preview')
        throw Error('Server returned an invalid or stale manual preview.');
      organisePlan=[{asset:id,title:'File #'+id,from:move.from,to:move.to,status:'ready',move}];
      organiseApproved.clear();
      organiseRenderPlan();
      organiseStatus('Manual move preview created. Review exact paths and tick Approve to apply.');
      void loadOrganiseJournal();
    }catch(error){
      if(epoch===organisePlanEpoch)organiseStatus('Manual preview unavailable: '+error.message+
        '. Check the move journal before retrying.');
    }finally{
      if(epoch===organisePlanEpoch){
        organiseSetBusy(false);organiseRenderPlan();organiseFileList();
      }
    }
  }
  async function loadOrganiseJournal(){
    const epoch=++organiseJournalEpoch,offset=organiseJournalOffset;
    $('organise-journal-status').textContent='Reading recent journal records…';
    try{
      const moves=await api('./api/file-moves?'+new URLSearchParams({limit:'40',offset:String(offset)}));
      if(epoch!==organiseJournalEpoch||activeView!=='organise')return;
      if(!Array.isArray(moves)||moves.length>40)throw Error('Invalid or oversized move history.');
      const area=$('organise-journal-items');area.replaceChildren();
      if(!moves.length)area.append(e('p','No move journal entries on this page.','subtext'));
      for(const move of moves){
        if(!organiseMoveID(move.id))continue;
        const state=String(move.state||'unknown');
        const card=e('article',undefined,'organise-move-item '+(state==='done'?'organise-move-ready':''));
        const heading=e('div',undefined,'organise-move-header');
        heading.append(e('strong','File #'+String(move.asset)),
          e('span',state,'pill '+(state==='done'?'ok':'warn')));
        card.append(heading,organisePaths(move));
        const actions=e('div',undefined,'operations-actions');
        if(state==='preview'){
          const cancel=e('button','Cancel this preview','quiet');
          cancel.type='button';cancel.disabled=organiseBusy;
          cancel.onclick=async()=>{
            if(!window.confirm('Cancel this staged file-move preview?'))return;
            cancel.disabled=true;
            try{
              const result=await api('./api/file-moves/'+encodeURIComponent(move.id)+'/cancel','POST');
              if(result.ok!==true)throw Error('Server did not confirm cancellation.');
              $('organise-journal-status').textContent='Preview cancelled. Originals unchanged.';
              await loadOrganiseJournal();
            }catch(error){
              $('organise-journal-status').textContent='Cancellation not confirmed: '+error.message;
            }finally{cancel.disabled=false}
          };
          actions.append(cancel);
        }else if(state==='done'){
          const undo=e('button','Preview verified undo','quiet');
          undo.type='button';undo.disabled=organiseBusy;
          undo.onclick=async()=>{
            undo.disabled=true;
            try{
              const reverse=await api('./api/file-moves/'+encodeURIComponent(move.id)+'/undo-preview','POST');
              if(!organiseMoveID(reverse?.id)||reverse.asset!==move.asset||
                 reverse.from!==move.to||reverse.to!==move.from||reverse.state!=='preview'){
                throw Error('Undo preview does not match the original completed move.');
              }
              if(!window.confirm('Reverse this completed move?\n\nCurrent: '+reverse.from+
                '\nRestore to: '+reverse.to+
                '\n\nArchivist will verify original file hash and path before applying.')){
                $('organise-journal-status').textContent='Undo not applied. A reverse preview is present in the journal.';
                await loadOrganiseJournal();return;
              }
              const result=await api('./api/file-moves/'+encodeURIComponent(reverse.id)+'/apply','POST');
              if(result.state!=='done'||result.asset!==move.asset)
                throw Error('Server did not confirm the reverse move.');
              $('organise-journal-status').textContent='Verified reverse move completed; inspect the refreshed history.';
              await Promise.all([loadOrganiseJournal(),loadOrganiseFiles()]);
            }catch(error){
              $('organise-journal-status').textContent='Undo uncertain or unavailable: '+error.message+
                '. Do not retry until the journal is refreshed.';
            }finally{undo.disabled=false}
          };
          actions.append(undo);
        }else if(state==='applying'||state==='linked'){
          card.append(e('p','Recovery in progress. Do not delete or manually move source/destination files.'));
        }
        if(actions.children.length)card.append(actions);
        area.append(card);
      }
      $('organise-journal-page').textContent='Journal page '+(Math.floor(offset/40)+1);
      $('organise-journal-prev').disabled=offset===0;
      $('organise-journal-next').disabled=moves.length<40;
      $('organise-journal-status').textContent='Showing '+moves.length+
        ' bounded journal entries. Recent order is not proof that a move completed.';
    }catch(error){
      if(epoch===organiseJournalEpoch&&activeView==='organise'){
        $('organise-journal-items').replaceChildren();
        $('organise-journal-status').textContent='Unable to read journal: '+error.message;
      }
    }
  }
  function organiseChangeScope(){
    if(organiseBusy){
      $('organise-list-status').textContent='Complete the current preview or move before changing filters.';
      return;
    }
    organiseOffset=0;
    organiseSelected.clear();organiseResetPlan('Filters changed; existing previews remain in the journal.');
    organiseSelectionStatus();
    void loadOrganiseFiles();
  }
  function openOrganise(){
    if(activeView!=='organise')return;
    void loadOrganiseFiles();
    void loadOrganiseJournal();
  }
  // Operational views are intentionally lazy: opening Library or reading
  // a book must not trigger NAS probes or database integrity checks.
  let operationsEpoch=0,integrityEpoch=0,integrityBusy=false;
  function operationsCount(value){
    const n=Number(value);
    return Number.isSafeInteger(n)&&n>=0?n.toLocaleString():'Unknown';
  }
  function operationsLine(id,label,value){
    const row=e('div',undefined,'operations-line');
    row.append(e('span',label),e('strong',String(value)));
    $(id).append(row);
  }
  function operationsSize(value){
    const n=Number(value);
    if(!Number.isFinite(n)||n<0)return 'Unknown';
    if(n<1024)return Math.floor(n)+' bytes';
    const unit=n<1048576?'KiB':n<1073741824?'MiB':'GiB';
    const factor=unit==='KiB'?1024:unit==='MiB'?1048576:1073741824;
    return (n/factor).toFixed(1)+' '+unit;
  }
  function renderOperations(view,data){
    const jobs=data.jobs||{},backup=data.backup||{};
    if(view==='overview'){
      $('overview-collection').replaceChildren();$('overview-jobs').replaceChildren();
      for(const [name,value] of [
        ['Indexed sources',data.indexedSources],
        ['Watched folders',data.watchedSources],
        ['Logical works',data.indexedWorks],
        ['Indexed media files',data.indexedFiles],
        ['Published books',data.publishedWorks],
        ['Staged works',data.stagedWorks],
        ['Files needing review',data.reviewFiles],
        ['Unavailable file flags',data.unavailableFileFlags]
      ])operationsLine('overview-collection',name,operationsCount(value));
      for(const [name,value] of [
        ['Waiting',jobs.queued],['Scanning',jobs.running],
        ['Committing',jobs.committing],['Cancelling',jobs.cancelling],
        ['Failed (historical)',jobs.failed],['Cancelled (historical)',jobs.cancelled]
      ])operationsLine('overview-jobs',name,operationsCount(value));
      $('overview-note').textContent='Read-only indexed snapshot. '+String((data.caveats||[])[0]||
        'Source mounts and physical media were not verified.');
    }
    if(view==='recovery'){
      $('recovery-backup').replaceChildren();$('recovery-warnings').replaceChildren();
      operationsLine('recovery-backup','Database file',
        backup.databasePresent===true?operationsSize(backup.databaseBytes):'Unverified');
      operationsLine('recovery-backup','Verified restore upload pending',
        backup.stagedRestore?'Marker present · confirm before restart':'No pending marker found');
      operationsLine('recovery-backup','Restore transaction marker',
        backup.restoreInFlight?'Present · investigate before restart':'None detected');
      operationsLine('recovery-backup','Local pre-restore snapshot',
        backup.recoverySnapshot?'Local marker present':'None detected');
      for(const line of data.caveats||[]){
        $('recovery-warnings').append(e('p',String(line),'subtext'));
      }
      if(Number(data.unavailableFileFlags||0)>0){
        $('recovery-warnings').append(e('p',
          operationsCount(data.unavailableFileFlags)+' indexed files are marked unavailable. Do not purge or rescan a disconnected mount.',
          'work-flag'));
      }
      if(Number(jobs.failed||0)>0){
        $('recovery-warnings').append(e('p',
          operationsCount(jobs.failed)+' failed scan jobs are recorded. Review their source states before retrying.',
          'work-flag'));
      }
    }
  }
  async function loadOperations(view){
    const generation=++operationsEpoch;
    const button=$(view==='overview'?'overview-refresh':'recovery-refresh');
    button.disabled=true;
    if(view==='overview')$('overview-note').textContent='Reading indexed catalogue and job counts…';
    try{
      const data=await api('./api/manage/operations');
      if(generation!==operationsEpoch||activeView!==view)return;
      if(!data||typeof data.indexedWorks!=='number'||!data.backup||
        !Array.isArray(data.caveats))throw Error('Invalid server operations report.');
      renderOperations(view,data);
    }catch(error){
      if(generation===operationsEpoch&&activeView===view){
        const status=view==='overview'?'overview-note':'recovery-integrity-result';
        $(status).textContent='Unable to read server status: '+error.message;
      }
    }finally{
      if(generation===operationsEpoch)button.disabled=false;
    }
  }
  async function checkSQLiteIntegrity(){
    if(integrityBusy||activeView!=='recovery')return;
    integrityBusy=true;$('recovery-integrity').disabled=true;
    const generation=++integrityEpoch,currentOperationsEpoch=operationsEpoch;
    $('recovery-integrity-result').textContent='Checking local SQLite structures (never media files)…';
    try{
      const data=await api('./api/manage/operations/integrity','POST');
      if(generation!==integrityEpoch||currentOperationsEpoch!==operationsEpoch||
        activeView!=='recovery')return;
      const duration=Number(data.durationMillis);
      if(!['ok','problems reported'].includes(data.result)||!Number.isFinite(duration)){
        throw Error('Unrecognised server integrity response.');
      }
      $('recovery-integrity-result').textContent=data.result==='ok'?
        'SQLite quick check: OK · '+Math.max(0,Math.floor(duration))+' ms. NAS and recovery remain unverified.':
        'SQLite quick check reported problems. Stop write operations and investigate using a verified backup.';
    }catch(error){
      if(generation===integrityEpoch&&currentOperationsEpoch===operationsEpoch&&
        activeView==='recovery'){
        $('recovery-integrity-result').textContent='Integrity unverified: '+error.message;
      }
    }finally{
      integrityBusy=false;
      if(generation===integrityEpoch)$('recovery-integrity').disabled=false;
    }
  }
  function showView(view){
    activeView=view;++operationsEpoch;++integrityEpoch;
    $('view-library').hidden=view!=='library'&&view!=='review';
    $('view-assist').hidden=view!=='assist';
    $('view-health').hidden=view!=='health';
    $('view-overview').hidden=view!=='overview';
    $('view-recovery').hidden=view!=='recovery';
    $('view-family').hidden=view!=='family';
    $('view-settings').hidden=view!=='settings';
    $('view-organise').hidden=view!=='organise';
    for(const item of document.querySelectorAll('[data-view]')){
      item.classList.toggle('is-current',item.dataset.view===view);
      if(item.dataset.view===view)item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    }
    if(view==='review'){$('sort').value='review';offset=0}
    if(view==='assist'){++requestId;assistOffset=0;void loadAssist();return}
    ++assistRequest;
    if(view==='health'){++requestId;loadHealth().catch(err=>notice(err.message,true));return}
    if(view==='family'){++requestId;++settingsEpoch;void loadFamily();return}
    if(view==='settings'){++requestId;++familyEpoch;void loadServerSettings();return}
    if(view==='organise'){
      ++requestId;++familyEpoch;++settingsEpoch;
      openOrganise();return;
    }
    ++familyEpoch;++settingsEpoch;
    if(view==='overview'||view==='recovery'){
      ++requestId;
      void loadOperations(view);
      return;
    }
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
  $('work-close').onclick=closeWorkEditor;
  $('work-refresh').onclick=()=>{
    if(workBusy||!workState)return;
    if(workDirty()&&!window.confirm('Discard your unsaved book changes and reload server metadata?'))return;
    const epoch=workEpoch;
    workMessage('Reloading the latest book revision…');
    void workReload(epoch).then(()=>{
      if(epoch===workEpoch)workMessage('Current book details and history reloaded.');
    }).catch(error=>{
      if(epoch===workEpoch)workMessage('Book reload failed: '+error.message);
    });
  };
  $('work-dialog').addEventListener('close',()=>{
    workEpoch++;workCandidateEpoch++;workState=null;comicProfileReset();workInputs.clear();workClearPlans();
  });
  $('work-preview-button').onclick=()=>void workPreview();
  $('work-apply-button').onclick=()=>void workApply();
  $('work-candidate-search').onclick=()=>void workFindCandidates();
  $('work-candidate-query').onkeydown=event=>{
    if(event.key==='Enter'){event.preventDefault();void workFindCandidates()}
  };
  $('work-undo-preview').onclick=()=>void workUndoPreview();
  $('work-undo-apply').onclick=()=>void workApplyUndo();
  $('work-publish-toggle').onclick=()=>void workTogglePublication();
  $('work-cover-upload').onchange=()=>void workUploadCover();
  $('work-cover-clear').onclick=()=>void workClearCover();
  $('work-more-media').onclick=()=>void workLoadMedia(workEpoch);
  $('candidate-search-button').onclick=findCandidates;
  $('candidate-query').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();findCandidates()}};
  $('comic-transfer-target').addEventListener('input',()=>clearComicTransfer('Destination changed. Inspect again.'));
  $('comic-transfer-inspect').onclick=()=>void inspectComicTransfer();
  $('comic-profile-edition').onchange=()=>{
    const previous=comicProfileActive,chosen=Number($('comic-profile-edition').value);
    if(comicProfileDirty()&&!window.confirm('Discard unsaved edition identity labels before changing editions?')){
      $('comic-profile-edition').value=String(previous);return;
    }
    comicProfileRenderEdition(chosen);
  };
  $('comic-profile-preview').onclick=()=>void comicProfilePreviewEdit();
  $('comic-profile-apply').onclick=()=>void comicProfileApply(false);
  $('comic-profile-undo-preview').onclick=()=>void comicProfilePreviewUndo();
  $('comic-profile-undo').onclick=()=>void comicProfileApply(true);
  $('editor-form').addEventListener('submit',saveEditor);
  function closeEditor(){editorEpoch++;invalidateCandidateLookup();$('editor').close();editing=null;editingFieldReady=false;editingRevision=null;editingFingerprint=null;editorDecorations.clear()}
  $('close-editor').onclick=closeEditor;
  $('cancel-editor').onclick=closeEditor;
  // Escape/native dialog close does not use either explicit close button.
  $('editor').addEventListener('close',()=>{
    if(!$('editor').open){editorEpoch++;invalidateCandidateLookup();editing=null;editingFieldReady=false;editingRevision=null;editingFingerprint=null;editorDecorations.clear()}
  });
  $('filters').onsubmit=event=>{event.preventDefault();offset=0;loadCatalogue()};
  $('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{offset=0;loadCatalogue()},260)});
  for(const key of ['space','format','availability','metadata-gap','sort'])$(key).addEventListener('change',()=>{offset=0;loadCatalogue()});
  $('reset').onclick=()=>{offset=0;$('filters').reset();loadCatalogue()};
  $('previous').onclick=()=>{if(offset){offset=Math.max(0,offset-pageSize);loadCatalogue()}};
  $('next').onclick=()=>{if(rows.length===pageSize){offset+=pageSize;loadCatalogue()}};
  $('select-page').onchange=event=>{for(const item of rows)choose(item,event.target.checked);renderRows()};
  $('clear-selection').onclick=()=>{selected.clear();selectedDetails.clear();renderRows()};
  $('export-selection').onclick=exportSelected;
  $('bulk-open').onclick=openBulkEditor;
  $('relink-open').onclick=openRelink;
  $('relink-close').onclick=closeRelink;
  $('relink-refresh').onclick=()=>void getRelinkPreview();
  $('relink-apply').onclick=()=>void applyRelink();
  $('relink-attest').onchange=relinkUpdateAction;
  $('relink-dialog').addEventListener('close',()=>{
    resetRelinkPreview();relinkSelection=null;
  });
  $('group-relink-open').onclick=()=>openGroupedRelink(null);
  $('group-relink-close').onclick=closeGroupedRelink;
  $('group-relink-load').onclick=()=>void loadGroupedTracks();
  $('group-relink-preview').onclick=()=>void previewGroupedRelink();
  $('group-relink-apply').onclick=()=>void applyGroupedRelink();
  $('group-relink-attest').onchange=groupReady;
  for(const id of ['group-relink-old','group-relink-new']){
    $(id).addEventListener('input',()=>{
      groupCandidates=null;groupPairs=[];groupChecks=[];resetGroupPreview();
      $('group-relink-pairs').replaceChildren();
      $('group-relink-status').textContent='Work IDs changed; inspect both audiobook groups again.';
      groupReady();
    });
  }
  $('group-relink-dialog').addEventListener('close',()=>{
    resetGroupPreview();groupCandidates=null;groupPairs=[];groupChecks=[];
  });
  $('bulk-close').onclick=closeBulkEditor;
  $('bulk-form').addEventListener('submit',previewBulk);
  $('bulk-apply').onclick=()=>void applyBulk();
  for(const name of bulkFields){
    $('bulk-'+name).addEventListener('input',resetBulkPlan);
    $('bulk-use-'+name).addEventListener('change',resetBulkPlan);
  }
  $('bulk-dialog').addEventListener('close',()=>{
    resetBulkPlan();bulkSelectedIds=[];
  });
  $('save-view').onclick=saveView;
  $('saved-views').onchange=applyView;
  updateViews();
  $('refresh-health').onclick=()=>loadHealth().catch(err=>notice(err.message,true));
  $('family-create').onsubmit=event=>void createFamilyUser(event);
  $('family-refresh').onclick=()=>void loadFamily();
  $('family-key-dismiss').onclick=dismissFamilyKey;
  $('settings-refresh').onclick=()=>void loadServerSettings();
  $('settings-scanner').onclick=()=>showView('health');
  $('settings-family').onclick=()=>showView('family');
  $('organise-filters').onsubmit=event=>{event.preventDefault();organiseChangeScope()};
  $('organise-clear-search').onclick=()=>{
    for(const id of ['organise-search','organise-space','organise-format'])$(id).value='';
    organiseChangeScope();
  };
  $('organise-refresh').onclick=()=>void loadOrganiseFiles();
  $('organise-previous').onclick=()=>{
    if(organiseBusy)return;
    if(organiseOffset>0){organiseOffset-=organisePageSize;void loadOrganiseFiles()}
  };
  $('organise-next').onclick=()=>{
    if(organiseBusy)return;
    if(organiseFiles.length===organisePageSize){
      organiseOffset+=organisePageSize;void loadOrganiseFiles();
    }
  };
  $('organise-template').onchange=()=>{
    if(organiseBusy)return;
    organiseResetPlan('Template changed. Old staged previews remain in the journal.');
  };
  $('organise-preview').onclick=()=>void previewOrganise();
  $('organise-clear-selection').onclick=()=>{
    if(organiseBusy)return;
    organiseSelected.clear();organiseResetPlan('File selection cleared. Existing journaled previews are still available below.');
    organiseFileList();
  };
  $('organise-select-ready').onclick=()=>{
    if(organiseBusy)return;
    organiseApproved=new Set(organisePlan.filter(x=>x.status==='ready'&&organiseMoveID(x.move?.id))
      .map(x=>x.move.id));organiseRenderPlan();
  };
  $('organise-clear-ready').onclick=()=>{
    if(organiseBusy)return;
    organiseApproved.clear();organiseRenderPlan();
  };
  $('organise-apply').onclick=()=>void applyOrganise();
  $('organise-cancel-preview').onclick=()=>void cancelOrganisePlan();
  $('organise-manual-form').onsubmit=event=>void previewOrganiseManual(event);
  $('organise-journal-refresh').onclick=()=>void loadOrganiseJournal();
  $('organise-journal-prev').onclick=()=>{
    if(organiseJournalOffset>0){organiseJournalOffset-=40;void loadOrganiseJournal()}
  };
  $('organise-journal-next').onclick=()=>{
    if(!$('organise-journal-next').disabled){
      organiseJournalOffset+=40;void loadOrganiseJournal();
    }
  };
  $('overview-refresh').onclick=()=>void loadOperations('overview');
  $('overview-assist').onclick=()=>showView('assist');
  $('overview-scanner').onclick=()=>showView('health');
  $('overview-recovery').onclick=()=>showView('recovery');
  $('recovery-refresh').onclick=()=>void loadOperations('recovery');
  $('recovery-integrity').onclick=()=>void checkSQLiteIntegrity();
  $('recovery-scanner').onclick=()=>showView('health');
  $('refresh-assist').onclick=()=>void loadAssist();
  $('assist-filters').onsubmit=event=>{
    event.preventDefault();assistOffset=0;void loadAssist();
  };
  $('assist-filter-clear').onclick=()=>{
    for(const id of ['assist-query','assist-space','assist-format','assist-reason'])$(id).value='';
    assistOffset=0;void loadAssist();
  };
  for(const [id,state] of [['assist-staged','staged'],['assist-published','published']]){
    $(''+id).onclick=()=>{
      if(assistMode===state)return;
      assistMode=state;assistOffset=0;
      void loadAssist();
    };
  }
  $('assist-previous').onclick=()=>{if(assistOffset>0){assistOffset=Math.max(0,assistOffset-assistPageSize);void loadAssist()}};
  $('assist-next').onclick=()=>{assistOffset+=assistPageSize;void loadAssist()};
  for(const item of document.querySelectorAll('[data-view]'))item.onclick=()=>showView(item.dataset.view);
  boot();
})();
