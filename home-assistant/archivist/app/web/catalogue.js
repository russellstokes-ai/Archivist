(() => {
  const panel=element('details');panel.className='panel-card advanced-grouping';
  const summary=element('summary','Advanced: combine scanned files into one work');panel.append(summary);
  const intro=element('p','Use this only when Archivist has not grouped related files correctly. Your original files are not changed.');
  const controls=element('div');controls.className='advanced-group-controls';
  const search=element('input');search.type='search';search.placeholder='Filter scanned files';search.setAttribute('aria-label','Filter scanned files');
  const load=element('button','Load scanned files');load.type='button';
  const title=element('input');title.placeholder='Work title';title.maxLength=1000;title.setAttribute('aria-label','Work title');
  const create=element('button','Create work');create.className='primary';create.type='button';create.disabled=true;
  controls.append(search,load,title,create);
  const status=element('p');status.className='note';
  const list=element('div');list.className='raw-file-list';
  panel.append(intro,controls,status,list);$('organisation-settings').append(panel);

  let items=[],chosen=new Set();

  function render(){
    const q=search.value.trim().toLowerCase();list.replaceChildren();
    const visible=items.filter(x=>!q||[x.title,x.author,x.series,x.format,x.space].some(v=>(v||'').toLowerCase().includes(q))).slice(0,250);
    for(const item of visible){
      const label=element('label');label.className='raw-file-row';
      const box=element('input');box.type='checkbox';box.checked=chosen.has(item.id);box.onchange=()=>{box.checked?chosen.add(item.id):chosen.delete(item.id);create.disabled=!chosen.size;status.textContent=chosen.size+' selected'};
      const copy=element('span');copy.append(element('strong',item.title),element('small',[item.author,item.series,item.format,item.space].filter(Boolean).join(' · ')));
      label.append(box,copy);list.append(label);
    }
    if(items.length>250)list.append(element('p','Showing the first 250 matching files. Narrow the filter to find others.'));
  }

  load.onclick=async()=>{
    load.disabled=true;load.textContent='Loading…';activity('Loading scanned files');
    try{items=await api('./api/books');chosen.clear();status.textContent=items.length+' scanned files available';render()}
    catch(e){message(e.message)}
    finally{activity('');load.disabled=false;load.textContent='Load scanned files'}
  };
  search.oninput=render;
  create.onclick=async()=>{
    if(!chosen.size)return;
    const name=title.value.trim();if(!name){message('Enter a work title.');return}
    create.disabled=true;create.textContent='Creating…';activity('Creating work',name);
    try{
      await api('./api/works/group','POST',{title:name,ids:[...chosen]});
      chosen.clear();title.value='';message('Work created. Original files are unchanged.');
      await loadLibrarySummary();await loadBooks(false);if(panel.open)await load.click();
    }catch(e){message(e.message)}
    finally{activity('');create.disabled=false;create.textContent='Create work'}
  };
})();