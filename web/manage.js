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
  let workInputs=new Map(),workBusy=false,workMediaOffset=0;
  const workFieldLabels=[
    ['title','Book title'],['author','Author / creator'],['series','Series'],
    ['seriesNumber','Series / issue number'],['genre','Genre / Atlas category'],['publishedYear','First publication year'],
    ['narrator','Narrator'],['publisher','Publisher'],['isbn','ISBN'],
    ['asin','ASIN'],['language','Language'],['description','Description']
  ];
  function workMessage(value){$('work-status').textContent=value}
  function workClearPlans(){
    workPlan=null;workUndoPlan=null;
    $('work-apply-button').disabled=true;$('work-undo-apply').disabled=true;
    $('work-preview-diff').replaceChildren();$('work-undo-diff').replaceChildren();
    $('work-preview-status').textContent='Preview required before any changes are applied.';
    $('work-undo-status').textContent='Preview undo to inspect exactly which fields will be restored.';
  }
  function workDirty(){
    for(const item of workInputs.values()){
      if(item.input.value!==item.input.dataset.initial)return true;
    }
    return false;
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
      input.readOnly=!editable||Boolean(field.locked);
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
    workInputs.clear();workClearPlans();
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
  async function workReload(epoch){
    if(epoch!==workEpoch||!$('work-dialog').open)return;
    const id=workState?.workId;
    if(!id)return;
    const data=await api('./api/manage/works/'+encodeURIComponent(String(id))+'/metadata');
    if(epoch!==workEpoch||!$('work-dialog').open)return;
    if(data.workId!==id||typeof data.fingerprint!=='string'||!Array.isArray(data.fields)){
      throw Error('Server returned an invalid book metadata snapshot.');
    }
    workState=data;workClearPlans();workRenderSummary(data);workRenderFields(data);
    workResetMedia();
    await Promise.all([workLoadMedia(epoch),workLoadHistory(epoch)]);
  }
  function openWorkEditor(id){
    const parsed=Number(id);
    if(!Number.isSafeInteger(parsed)||parsed<=0){notice('Choose a real book identity.',true);return}
    ++workEpoch;++workCandidateEpoch;
    const epoch=workEpoch;
    workInputs.clear();workState={workId:parsed};workBusy=false;workClearPlans();workResetMedia();
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
    const epoch=workEpoch,generation=++workCandidateEpoch;
    const query=$('work-candidate-query').value.trim();
    if(query.length<2){workMessage('Enter a title, author or ISBN to search.');return}
    const box=$('work-candidates');box.replaceChildren(e('p','Searching optional public suggestions…','subtext'));
    $('work-candidate-search').disabled=true;
    try{
      const response=await api('./api/manage/metadata-candidates?q='+encodeURIComponent(query));
      if(epoch!==workEpoch||generation!==workCandidateEpoch)return;
      box.replaceChildren();
      const candidates=Array.isArray(response.candidates)?response.candidates:[];
      if(!candidates.length){box.append(e('p','No candidates. The existing book metadata was not changed.','subtext'));return}
      for(const candidate of candidates){
        const card=e('article',undefined,'work-candidate');
        card.append(e('strong',candidate.title||'Unnamed result'),
          e('small',[candidate.author,candidate.publishedYear,candidate.publisher,candidate.isbn].filter(Boolean).join(' · '),'subtext'));
        const buttons=e('div',undefined,'work-candidate-fields');
        for(const [name,label] of [['title','Title'],['author','Author'],['publishedYear','Year'],['isbn','ISBN'],['publisher','Publisher']]){
          const item=workInputs.get(name),value=candidate[name];
          if(!item||item.input.readOnly||value===undefined||value===null||value==='')continue;
          const button=e('button','Use '+label,'quiet');button.type='button';
          button.title='Compare and select this '+label+' suggestion';
          button.onclick=()=>{
            item.input.value=String(value);
            item.input.dataset.origin='open-library';
            workClearPlans();
            workMessage('Selected an unverified Open Library '+label+' suggestion. Preview before saving.');
          };
          buttons.append(button);
        }
        card.append(buttons);box.append(card);
      }
    }catch(error){if(epoch===workEpoch&&generation===workCandidateEpoch){
      box.replaceChildren(e('p','Provider unavailable: '+error.message,'subtext'));
    }}finally{if(epoch===workEpoch)$('work-candidate-search').disabled=workState?.publicationState!=='staged'}
  }
  async function workPreview(){
    if(!workState||workBusy)return;
    const state=workState,epoch=workEpoch;
    workClearPlans();
    let changes;
    try{changes=workChanges()}catch(error){workMessage(error.message);return}
    workBusy=true;$('work-preview-button').disabled=true;
    workMessage('Validating field locks, chapters, publication state and revision…');
    try{
      const preview=await api('./api/manage/works/'+state.workId+'/metadata/preview','POST',{
        expectedRevision:state.revision,expectedFingerprint:state.fingerprint,changes
      });
      if(epoch!==workEpoch||workState!==state)return;
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
    workBusy=true;$('work-apply-button').disabled=true;
    workMessage('Applying the signed, revision-checked book transaction…');
    try{
      const result=await api('./api/manage/works/'+state.workId+'/metadata/apply','POST',{preview:plan,confirm:true});
      if(epoch!==workEpoch)return;
      if(result.workId!==state.workId||result.revision!==state.revision+1)throw Error('Server did not confirm updated book revision.');
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Saved book metadata. Files and progress retained; publication remains explicit.');
    }catch(error){if(epoch===workEpoch){workPlan=null;$('work-apply-button').disabled=true;workMessage('No confirmed save: '+error.message+'. Reload and preview before retrying.')}}
    finally{
      workBusy=false;
      if(epoch===workEpoch&&workState){
        $('work-preview-button').disabled=workState.publicationState!=='staged';
        // A rejected network/SQL operation must NOT discard the user's draft.
        // Only workReload() after a confirmed save replaces editor values.
        for(const item of workInputs.values()){
          item.lock.disabled=workState.publicationState!=='staged';
        }
      }
    }
  }
  async function workUndoPreview(){
    if(!workState||workBusy)return;
    const state=workState,epoch=workEpoch;
    if(workDirty()){workMessage('Discard or save unsaved edits before reviewing undo.');return}
    workUndoPlan=null;$('work-undo-apply').disabled=true;$('work-undo-diff').replaceChildren();
    workBusy=true;
    try{
      const preview=await api('./api/manage/works/'+state.workId+'/metadata/undo-preview','POST');
      if(epoch!==workEpoch||workState!==state)return;
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
    workBusy=true;$('work-undo-apply').disabled=true;
    try{
      const result=await api('./api/manage/works/'+state.workId+'/metadata/undo','POST',{preview,confirm:true});
      if(epoch!==workEpoch)return;
      if(result.workId!==state.workId||result.revision!==state.revision+1)throw Error('Server did not confirm a new undo revision.');
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Previous book metadata values restored. All files and bookmarks retained.');
    }catch(error){if(epoch===workEpoch){workUndoPlan=null;workMessage('Undo rejected: '+error.message)}}
    finally{workBusy=false;if(epoch===workEpoch&&workState)workRenderFields(workState)}
  }
  async function workTogglePublication(){
    if(!workState||workBusy)return;
    if(workDirty()){workMessage('Save or discard unsaved book edits before changing publication.');return}
    const state=workState,epoch=workEpoch,action=state.publicationState==='published'?'unpublish':'publish';
    if(!window.confirm((action==='publish'?'Publish book to the household after verifying all files and cover?':'Unpublish book from household Library and Atlas?')+' Originals and progress remain unchanged.'))return;
    workBusy=true;$('work-publish-toggle').disabled=true;
    try{
      const current=await api('./api/manage/works/'+state.workId+'/publication');
      if(epoch!==workEpoch||current.state!==state.publicationState)throw Error('Publication state changed; reopen the book.');
      const next=await api('./api/manage/works/'+state.workId+'/publication','POST',{
        action,confirm:true,expectedRevision:current.revision
      });
      if(epoch!==workEpoch)return;
      if(next.state!==(action==='publish'?'published':'staged'))throw Error('Server did not confirm publication change.');
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Book '+(action==='publish'?'published.':'unpublished.')+' Metadata and progress retained.');
    }catch(error){if(epoch===workEpoch)workMessage('Publication rejected: '+error.message)}
    finally{workBusy=false;if(epoch===workEpoch&&workState)workRenderSummary(workState)}
  }
  async function workUploadCover(){
    if(!workState||workBusy)return;
    const input=$('work-cover-upload'),file=input.files?.[0];if(!file)return;
    if(workDirty()){workMessage('Save or discard book edits before changing its cover.');input.value='';return}
    if(workState.publicationState==='published'){workMessage('Unpublish before replacing selected cover.');input.value='';return}
    if(file.size>4*1024*1024){workMessage('Cover must be smaller than 4 MB.');input.value='';return}
    const state=workState,epoch=workEpoch;workBusy=true;input.disabled=true;
    try{
      const answer=await fetch('./api/manage/works/'+encodeURIComponent(String(state.workId))+'/cover',{
        method:'POST',credentials:'same-origin',headers:{'X-Archivist-Action':'1',
          'Content-Type':file.type||'application/octet-stream'},body:file
      });
      const body=await answer.json();
      if(!answer.ok)throw Error(body.error||'Cover upload was rejected.');
      if(epoch!==workEpoch)return;
      if(!/^[0-9a-f]{64}$/.test(body.sha256))throw Error('The server did not verify the saved cover.');
      await workReload(epoch);
      await Promise.all([loadAssist(),loadSummary()]);
      if(epoch===workEpoch)workMessage('Cover stored with the book and its database backup. Publication remains separate.');
    }catch(error){if(epoch===workEpoch)workMessage('Cover not saved: '+error.message)}
    finally{workBusy=false;input.value='';if(epoch===workEpoch)input.disabled=workState?.publicationState!=='staged'}
  }
  async function loadAssist(){
    const generation=++assistRequest,location=assistOffset,mode=assistMode;
    const container=$('assist-works');
    for(const [id,state] of [['assist-staged','staged'],['assist-published','published']]){
      $(''+id).setAttribute('aria-pressed',String(mode===state));
    }
    $('assist-range').textContent=mode==='published'?'Loading your published books…':'Finding books awaiting publication…';
    try {
      const result=await api('./api/manage/review-works?'+new URLSearchParams({limit:String(assistPageSize),offset:String(location),state:mode}));
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
  $('work-close').onclick=closeWorkEditor;
  $('work-dialog').addEventListener('close',()=>{
    workEpoch++;workCandidateEpoch++;workState=null;workInputs.clear();workClearPlans();
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
  $('work-more-media').onclick=()=>void workLoadMedia(workEpoch);
  $('candidate-search-button').onclick=findCandidates;
  $('candidate-query').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();findCandidates()}};
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
  $('refresh-assist').onclick=()=>void loadAssist();
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
