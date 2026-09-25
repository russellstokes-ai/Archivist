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
  const apply=element('button','Apply previewed changes');apply.className='primary';apply.type='button';apply.disabled=true;
  const clear=element('button','Clear preview');clear.type='button';clear.disabled=true;
  actions.append(apply,clear);

  const advanced=element('details');advanced.className='advanced-sort';
  const advSummary=element('summary','Advanced: move one file manually');
  const manualForm=element('form');
  const asset=element('select');asset.setAttribute('aria-label','File');
  const target=element('input');target.setAttribute('aria-label','Relative destination path');target.placeholder='Author/Series/Title.ext';
  const manualPreview=element('button','Preview this move');manualPreview.type='submit';
  manualForm.append(asset,target,manualPreview);advanced.append(advSummary,manualForm);

  panel.append(heading,controls,readiness,previewSummary,previewList,actions,advanced);
  $('organisation-settings').append(panel);

  let items=[],previewIds=[];

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
  function renderPreview(moves){
    previewIds=moves.filter(m=>m.state==='preview').map(m=>m.id);
    previewList.replaceChildren();
    const active=moves.filter(m=>m.state==='preview');
    previewSummary.hidden=false;
    previewSummary.replaceChildren(element('strong',active.length+' proposed changes'),element('span','Review these paths before applying.'));
    if(!active.length)previewList.append(element('p','Nothing needs moving for this structure.'));
    for(const m of active.slice(0,100)){
      const card=element('article');card.className='move-preview';
      const from=element('div');from.append(element('small','CURRENT'),element('p',m.from));
      const arrow=element('span','→');arrow.className='move-arrow';
      const to=element('div');to.append(element('small','PROPOSED'),element('p',m.to));
      card.append(from,arrow,to);previewList.append(card);
    }
    if(active.length>100)previewList.append(element('p','Showing first 100 of '+active.length+' changes.'));
    apply.disabled=!previewIds.length;clear.disabled=!previewIds.length;
  }
  async function refreshItems(){
    items=await api('./api/books');asset.replaceChildren(...items.map(b=>new Option([b.title,b.author,b.series,b.space].filter(Boolean).join(' · '),String(b.id))));
    rebuildScope();updateReadiness();
  }
  async function refreshMoves(){
    const moves=await api('./api/file-moves');renderPreview(moves);
  }
  scope.onchange=updateReadiness;template.onchange=updateReadiness;
  previewAll.onclick=async()=>{
    const selected=selectedItems();
    if(!selected.length){message('No files in this scope.');return}
    previewAll.disabled=true;previewAll.textContent='Building preview…';
    let ok=0,failed=0;
    previewList.replaceChildren();previewSummary.hidden=false;
    try{
      for(let i=0;i<selected.length;i++){
        const item=selected[i],done=i+1,pct=Math.round(done/selected.length*100);
        activity('Building sort preview',done+' / '+selected.length+' files · '+pct+'%',done,selected.length);
        previewSummary.replaceChildren(element('strong','Building preview…'),element('span',done+' / '+selected.length+' · '+pct+'%'));
        try{await api('./api/file-moves/preview-template','POST',{asset:item.id,template:template.value});ok++}
        catch(e){failed++}
      }
      message('Preview ready: '+ok+' changes, '+failed+' skipped.');
      await refreshMoves();
    }catch(e){message(e.message)}
    finally{activity('');previewAll.disabled=false;previewAll.textContent='Preview organisation'}
  };
  apply.onclick=async()=>{
    if(!previewIds.length)return;
    if(!confirm('Apply these '+previewIds.length+' previewed file moves? Archivist verifies each file before changing it.'))return;
    apply.disabled=true;apply.textContent='Applying changes…';
    let ok=0,failed=0;const ids=[...previewIds];
    try{
      for(let i=0;i<ids.length;i++){
        const done=i+1,pct=Math.round(done/ids.length*100);
        activity('Applying organisation',done+' / '+ids.length+' files · '+pct+'%',done,ids.length);
        try{await api('./api/file-moves/'+ids[i]+'/apply','POST');ok++}catch(e){failed++}
      }
      message('Organisation complete: '+ok+' moved, '+failed+' need review.');
      await loadBooks();await refreshItems();await refreshMoves();
    }catch(e){message(e.message)}
    finally{activity('');apply.disabled=false;apply.textContent='Apply previewed changes'}
  };
  clear.onclick=async()=>{
    clear.disabled=true;clear.textContent='Clearing…';const ids=[...previewIds];
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