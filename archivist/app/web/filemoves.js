(() => {
  const panel=element('section');panel.className='panel-card sort-panel';panel.hidden=true;
  const heading=element('div');heading.className='section-heading';
  const headText=element('div');headText.append(element('h2','Organise & sort library'),element('p','Choose a structure, preview exactly what will change, then apply only that preview.'));
  const badge=element('span','Safe preview first');badge.className='status-pill';heading.append(headText,badge);

  const controls=element('div');controls.className='sort-controls';
  const templateWrap=element('label','Folder structure');
  const template=element('select');template.setAttribute('aria-label','Sorting template');
  [
    ['author-title','Author / Title'],
    ['author-series-title','Author / Series / Title'],
    ['format-author-title','Format / Author / Title'],
    ['format-author-series-title','Format / Author / Series / Title']
  ].forEach(([v,l])=>template.append(new Option(l,v)));
  templateWrap.append(template);

  const scopeWrap=element('label','Scope');
  const scope=element('select');scope.setAttribute('aria-label','Sort scope');
  scope.append(new Option('All loaded files','all'));
  scopeWrap.append(scope);

  const previewAll=element('button','Preview organisation');previewAll.className='primary';previewAll.type='button';
  controls.append(templateWrap,scopeWrap,previewAll);

  const readiness=element('div');readiness.className='sort-readiness';
  const previewSummary=element('div');previewSummary.className='sort-summary';previewSummary.hidden=true;
  const previewList=element('div');previewList.className='sort-preview';
  const actions=element('div');actions.className='sort-actions';
  const selectReady=element('button','Select all Ready');selectReady.type='button';selectReady.disabled=true;
  const clearSelection=element('button','Clear selection');clearSelection.type='button';clearSelection.disabled=true;
  const apply=element('button','Apply selected');apply.className='primary';apply.type='button';apply.disabled=true;
  const clear=element('button','Clear preview');clear.type='button';clear.disabled=true;
  actions.append(selectReady,clearSelection,apply,clear);

  const advanced=element('details');advanced.className='advanced-sort';
  const advSummary=element('summary','Advanced: move one file manually');
  const manualForm=element('form');
  const asset=element('select');asset.setAttribute('aria-label','File');
  const target=element('input');target.setAttribute('aria-label','Relative destination path');target.placeholder='Author/Series/Title.ext';
  const manualPreview=element('button','Preview this move');manualPreview.type='submit';
  manualForm.append(asset,target,manualPreview);advanced.append(advSummary,manualForm);

  panel.append(heading,controls,readiness,previewSummary,previewList,actions,advanced);
  $('organisation-settings').append(panel);

  let items=[],previewItems=[],previewReadyIds=[],selectedIds=new Set();

  function rebuildScope(){
    const current=scope.value;
    scope.replaceChildren(new Option('All loaded files','all'));
    const spaces=[...new Set(items.map(x=>x.space).filter(Boolean))].sort();
    for(const s of spaces)scope.append(new Option('Space: '+s,'space:'+s));
    const formats=[...new Set(items.map(x=>x.format).filter(Boolean))].sort();
    for(const f of formats)scope.append(new Option('Format: '+f,'format:'+f));
    if([...scope.options].some(o=>o.value===current))scope.value=current;
  }
  function selectedItems(){
    if(scope.value.startsWith('space:'))return items.filter(x=>x.space===scope.value.slice(6));
    if(scope.value.startsWith('format:'))return items.filter(x=>x.format===scope.value.slice(7));
    return items;
  }
  function updateReadiness(){
    const selected=selectedItems();
    const noAuthor=selected.filter(x=>!x.author).length,noSeries=selected.filter(x=>!x.series).length;
    readiness.replaceChildren();
    const total=element('div');total.className='metric';total.append(element('strong',String(selected.length)),element('span','Files in scope'));
    const author=element('div');author.className='metric';author.append(element('strong',String(selected.length-noAuthor)),element('span','With author'));
    const series=element('div');series.className='metric';series.append(element('strong',String(selected.length-noSeries)),element('span','With series'));
    readiness.append(total,author,series);
  }
  function previewStatus(item){
    if(item.status)return item.status;
    if(item.move)return 'ready';
    if((item.error||'').toLowerCase().includes('review metadata'))return 'review';
    return 'conflict';
  }
  function syncPreviewActions(){
    const selected=[...selectedIds].filter(id=>previewReadyIds.includes(id));
    apply.disabled=!selected.length;
    selectReady.disabled=!previewReadyIds.length;
    clearSelection.disabled=!selected.length;
    clear.disabled=!previewReadyIds.length;
    apply.textContent=selected.length?'Apply selected ('+selected.length+')':'Apply selected';
  }
  function renderPreview(previews){
    previewItems=previews||[];
    previewReadyIds=previewItems.flatMap(item=>previewStatus(item)==='ready'&&item.move?.id?[item.move.id]:[]);
    selectedIds=new Set(previewReadyIds);
    previewList.replaceChildren();
    const counts={ready:0,review:0,conflict:0,same:0};
    for(const item of previewItems)counts[previewStatus(item)]++;
    previewSummary.hidden=false;
    previewSummary.replaceChildren(
      element('strong',counts.ready+' ready · '+counts.review+' review · '+counts.conflict+' conflicts · '+counts.same+' already organised'),
      element('span','Only selected Ready items can be applied.')
    );
    if(!previewItems.length)previewList.append(element('p','Nothing needs moving for this structure.'));
    for(const item of previewItems.slice(0,100)){
      const state=previewStatus(item),move=item.move||{};
      const card=element('article');card.className='move-preview';
      const heading=element('div');heading.className='preview-state';
      const title=element('strong',item.title||('File '+(item.asset||move.asset||'')));
      const label=state==='ready'?'Ready':state==='review'?'Review recommended':state==='same'?'Already organised':'Conflict';
      const status=element('span',label);status.className='status-pill';
      heading.append(title,status);
      if(state==='ready'&&move.id){
        const choice=element('input');choice.type='checkbox';choice.value=move.id;choice.dataset.moveId=move.id;choice.checked=selectedIds.has(move.id);choice.setAttribute('aria-label','Select '+(item.title||'file'));
        choice.onchange=()=>{if(choice.checked)selectedIds.add(move.id);else selectedIds.delete(move.id);syncPreviewActions()};
        heading.prepend(choice);
      }
      const from=element('div');from.append(element('small','CURRENT'),element('p',item.from||move.from||'—'));
      const arrow=element('span','→');arrow.className='move-arrow';
      const to=element('div');to.append(element('small','PROPOSED'),element('p',item.to||move.to||'—'));
      const metadata=element('p',[item.author?'Author: '+item.author:'',item.series?'Series: '+item.series+(item.seriesNumber?' #'+item.seriesNumber:''):'',item.format?'Format: '+item.format:''].filter(Boolean).join(' · ')||'No additional metadata');
      metadata.className='meta';
      card.append(heading,from,arrow,to,metadata);
      if(item.error){const error=element('p',item.error);error.className='meta';card.append(error)}
      previewList.append(card);
    }
    if(previewItems.length>100)previewList.append(element('p','Showing first 100 of '+previewItems.length+' preview items.'));
    syncPreviewActions();
  }

  async function refreshItems(){
    items=await api('./api/books');asset.replaceChildren(...items.map(b=>new Option([b.title,b.author,b.series,b.space].filter(Boolean).join(' · '),String(b.id))));
    rebuildScope();updateReadiness();
  }
  async function refreshMoves(){
    const moves=await api('./api/file-moves?state=pending&limit=500');
    renderPreview(moves.map(move=>({asset:move.asset,status:'ready',from:move.from,to:move.to,move})));
  }
  scope.onchange=updateReadiness;template.onchange=updateReadiness;
  previewAll.onclick=async()=>{
    const selected=selectedItems();
    if(!selected.length){message('No files in this scope.');return}
    previewAll.disabled=true;previewAll.textContent='Building preview…';
    const previews=[];
    try{
      const batchSize=100;
      for(let i=0;i<selected.length;i+=batchSize){
        const batch=selected.slice(i,i+batchSize),done=Math.min(i+batch.length,selected.length),pct=Math.round(done/selected.length*100);
        activity('Building sort preview',done+' / '+selected.length+' files · '+pct+'%',done,selected.length);
        previewSummary.hidden=false;previewSummary.replaceChildren(element('strong','Building preview…'),element('span',done+' / '+selected.length+' · '+pct+'%'));
        const result=await api('./api/file-moves/preview-template-batch','POST',{assets:batch.map(item=>item.id),template:template.value});
        previews.push(...(result.items||[]));
      }
      renderPreview(previews);
      const ready=previews.filter(item=>previewStatus(item)==='ready').length;
      const blocked=previews.length-ready;
      message('Preview ready: '+ready+' Ready, '+blocked+' require no move or review.');
    }catch(e){message(e.message)}
    finally{activity('');previewAll.disabled=false;previewAll.textContent='Preview organisation'}
  };
  selectReady.onclick=()=>{
    selectedIds=new Set(previewReadyIds);
    renderPreviewSelectionOnly();
  };
  clearSelection.onclick=()=>{
    selectedIds.clear();
    renderPreviewSelectionOnly();
  };
  function renderPreviewSelectionOnly(){
    const boxes=previewList.querySelectorAll('input[type="checkbox"]');
    boxes.forEach(box=>{box.checked=selectedIds.has(box.dataset?.moveId||box.value||'')});
    syncPreviewActions();
  }
  apply.onclick=async()=>{
    const ids=[...selectedIds].filter(id=>previewReadyIds.includes(id));
    if(!ids.length)return;
    if(!confirm('Apply these '+ids.length+' selected Ready file moves? Archivist verifies each file before changing it.'))return;
    apply.disabled=true;apply.textContent='Applying selected…';
    try{
      activity('Applying organisation','0 / '+ids.length,0,ids.length);
      const result=await api('./api/file-moves/apply-batch','POST',{ids});
      const ok=Number(result.ok)||0,failed=Number(result.failed)||0;
      message('Organisation complete: '+ok+' moved, '+failed+' need review.');
      selectedIds.clear();
      await loadBooks();await refreshItems();await refreshMoves();
    }catch(e){message(e.message)}
    finally{activity('');apply.textContent='Apply selected';syncPreviewActions()}
  };
  clear.onclick=async()=>{
    clear.disabled=true;clear.textContent='Clearing…';const ids=[...previewReadyIds];
    try{
      for(let i=0;i<ids.length;i++){
        const done=i+1,pct=Math.round(done/ids.length*100);
        activity('Clearing sort preview',done+' / '+ids.length+' files · '+pct+'%',done,ids.length);
        await api('./api/file-moves/'+ids[i]+'/cancel','POST');
      }
      message('Preview cleared. No files were changed.');await refreshMoves();
    }catch(e){message(e.message)}
    finally{activity('');clear.disabled=false;clear.textContent='Clear preview'}
  };
  manualForm.onsubmit=async e=>{
    e.preventDefault();if(!target.value.trim()){message('Enter a destination path.');return}
    manualPreview.disabled=true;manualPreview.textContent='Building preview…';activity('Building manual move preview');
    try{await api('./api/file-moves/preview','POST',{asset:Number(asset.value),to:target.value});message('Manual move added to preview.');await refreshMoves()}
    catch(e){message(e.message)}
    finally{activity('');manualPreview.disabled=false;manualPreview.textContent='Preview this move'}
  };
  window.addEventListener('archivist-ready',async()=>{
    panel.hidden=!currentProfile?.owner;
    if(currentProfile?.owner){try{await refreshItems();await refreshMoves()}catch(e){message(e.message)}}
  });
})();