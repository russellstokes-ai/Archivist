(() => {
  const root=document.getElementById('organisation-settings');
  if(!root)return;

  const panel=document.createElement('details');panel.className='panel-card';
  const heading=document.createElement('summary');heading.textContent='Metadata workshop';panel.append(heading);
  panel.append(element('p','Review uncertain scans, find metadata gaps, and correct the full book record without renaming the original file.'));

  const tools=document.createElement('div');tools.className='tools';
  const gap=document.createElement('select');gap.setAttribute('aria-label','Metadata gap');
  [
    ['','All scanned files'],['review','Needs review'],['conflicts','Metadata conflicts'],['incomplete','Any missing details'],
    ['author','Missing author'],['series','Missing series'],['seriesNumber','Missing series order'],
    ['genre','Missing genre'],['identifier','Missing ISBN or ASIN'],['description','Missing description'],
  ].forEach(([value,label])=>gap.append(new Option(label,value)));
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Refresh';
  tools.append(gap,refresh);panel.append(tools);
  const health=element('p','Open this panel to inspect metadata.');health.className='note';panel.append(health);

  const form=document.createElement('form');
  const choice=document.createElement('select');choice.setAttribute('aria-label','Book to edit');form.append(choice);
  const fields={};
  const field=(key,label,type='text',max=1000)=>{
    const wrap=document.createElement('label');wrap.textContent=label;
    const input=type==='textarea'?document.createElement('textarea'):document.createElement('input');
    if(type!=='textarea')input.type=type;
    input.setAttribute('aria-label',label);
    if(max)input.maxLength=max;
    if(type==='number')input.step='any';
    wrap.append(input);form.append(wrap);fields[key]=input;return input;
  };
  field('title','Title','text',1000).required=true;
  field('author','Author');
  field('series','Series');
  field('seriesNumber','Series number','number',0);
  field('genre','Genre');
  field('publishedYear','Publication year','number',0);
  field('narrator','Narrator');
  field('publisher','Publisher');
  field('isbn','ISBN','text',100);
  field('asin','ASIN','text',100);
  field('language','Language','text',100);
  field('description','Description','textarea',20000);
  const evidence=element('p','');evidence.className='note';form.append(evidence);
  const save=document.createElement('button');save.textContent='Save metadata';form.append(save);
  panel.append(form);

  let items=[];
  const numberOrZero=value=>{const n=Number(String(value||'').trim());return Number.isFinite(n)?n:0};
  const selectedItem=()=>items.find(item=>String(item.id)===choice.value)||null;
  const fill=item=>{
    item=item||{};
    Object.entries(fields).forEach(([key,input])=>input.value=item[key]===undefined||item[key]===null?'':String(item[key]));
    const confidence=item.identificationConfidence?item.identificationConfidence+' confidence':'confidence unavailable';
    const source=item.metadataSource||'unknown source';
    evidence.textContent=(item.needsReview?(item.reviewReason||'Needs review'):'Looks consistent')+' · '+confidence+' · '+source;
    save.disabled=!item.id;
  };
  const load=async()=>{
    const query=new URLSearchParams({q:$('search')?.value||'',space:$('space')?.value||'',metadataGap:gap.value,limit:'500'});
    items=await api('./api/books?'+query.toString());
    choice.replaceChildren(...items.map(book=>new Option((book.needsReview?'Review · ':'')+book.title+(book.author?' — '+book.author:''),String(book.id))));
    fill(items[0]);
    health.textContent=items.length
      ? items.length+' matching file'+(items.length===1?'':'s')+' · choose a record below to inspect every metadata field.'
      : 'No scanned files match this metadata filter.';
    renderBulkList();
  };
  panel.addEventListener('toggle',()=>{if(panel.open)load().catch(e=>message(e.message))});
  gap.onchange=()=>load().catch(e=>message(e.message));
  refresh.onclick=()=>load().catch(e=>message(e.message));
  choice.onchange=()=>fill(selectedItem());
  form.onsubmit=async event=>{
    event.preventDefault();const item=selectedItem();if(!item)return;
    save.disabled=true;
    const payload={
      title:fields.title.value.trim(),author:fields.author.value.trim(),series:fields.series.value.trim(),
      seriesNumber:numberOrZero(fields.seriesNumber.value),genre:fields.genre.value.trim(),
      publishedYear:numberOrZero(fields.publishedYear.value),narrator:fields.narrator.value.trim(),
      publisher:fields.publisher.value.trim(),isbn:fields.isbn.value.trim(),asin:fields.asin.value.trim(),
      language:fields.language.value.trim(),description:fields.description.value.trim(),
    };
    try{
      await api('./api/assets/'+item.id+'/metadata','PATCH',payload);
      await load();await loadBooks();message('Metadata saved. Manual corrections are protected on future rescans.');
    }catch(e){message(e.message)}finally{save.disabled=false}
  };
  root.append(panel);

  const bulk=document.createElement('details');bulk.className='panel-card';
  const bulkHeading=document.createElement('summary');bulkHeading.textContent='Bulk metadata & series order';bulk.append(bulkHeading);
  bulk.append(element('p','Apply one author, series, genre or narrator to many files at once, and optionally number a selected series in sequence. Only fields you enter are changed.'));
  const bulkForm=document.createElement('form');
  const bulkFields={};
  const bulkField=(key,label)=>{
    const wrap=document.createElement('label');wrap.textContent=label;
    const input=document.createElement('input');input.maxLength=1000;input.setAttribute('aria-label',label);wrap.append(input);bulkForm.append(wrap);bulkFields[key]=input;
  };
  bulkField('author','Author');
  bulkField('series','Series');
  bulkField('genre','Genre');
  bulkField('narrator','Narrator');
  const sequentialWrap=document.createElement('label');
  const sequential=document.createElement('input');sequential.type='checkbox';
  sequentialWrap.append(sequential,document.createTextNode(' Number selected files as a series'));
  bulkForm.append(sequentialWrap);
  const startWrap=document.createElement('label');startWrap.textContent='Start series number';
  const start=document.createElement('input');start.type='number';start.step='any';start.value='1';startWrap.append(start);bulkForm.append(startWrap);
  const selectTools=document.createElement('div');selectTools.className='tools';
  const selectAll=document.createElement('button');selectAll.type='button';selectAll.textContent='Select visible';
  const clear=document.createElement('button');clear.type='button';clear.textContent='Clear selection';
  selectTools.append(selectAll,clear);bulkForm.append(selectTools);
  const bulkList=document.createElement('div');bulkList.setAttribute('aria-label','Files for bulk metadata');bulkForm.append(bulkList);
  const apply=document.createElement('button');apply.textContent='Apply to selected';bulkForm.append(apply);
  bulk.append(bulkForm);root.append(bulk);

  function renderBulkList(){
    bulkList.replaceChildren();
    items.forEach(item=>{
      const row=document.createElement('label');
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=String(item.id);checkbox.dataset.metadataSelect='1';
      const summary=(item.title||'Untitled')+(item.author?' — '+item.author:'')+(item.series?' · '+item.series+(item.seriesNumber?' #'+item.seriesNumber:''):'');
      row.append(checkbox,document.createTextNode(' '+summary));bulkList.append(row);
    });
    if(!items.length)bulkList.append(element('p','No matching files. Open Metadata workshop and adjust the filter.'));
  }
  bulk.addEventListener('toggle',()=>{if(bulk.open&&!items.length)load().catch(e=>message(e.message))});
  selectAll.onclick=()=>bulkList.querySelectorAll('input[data-metadata-select]').forEach(input=>input.checked=true);
  clear.onclick=()=>bulkList.querySelectorAll('input[data-metadata-select]').forEach(input=>input.checked=false);
  bulkForm.onsubmit=async event=>{
    event.preventDefault();
    const selected=[...bulkList.querySelectorAll('input[data-metadata-select]:checked')].map(input=>Number(input.value)).filter(Number.isFinite);
    if(!selected.length){message('Select at least one file first.');return}
    const patch={};
    for(const [key,input] of Object.entries(bulkFields))if(input.value.trim())patch[key]=input.value.trim();
    if(!Object.keys(patch).length&&!sequential.checked){message('Enter a metadata change or enable series numbering.');return}
    const first=Number(start.value);if(sequential.checked&&!Number.isFinite(first)){message('Enter a valid starting series number.');return}
    apply.disabled=true;activity('Updating metadata',selected.length+' files');
    try{
      for(let index=0;index<selected.length;index++){
        const payload={...patch};
        if(sequential.checked)payload.seriesNumber=first+index;
        await api('./api/assets/'+selected[index]+'/metadata','PATCH',payload);
      }
      await load();await loadBooks();message('Bulk metadata saved for '+selected.length+' file'+(selected.length===1?'':'s')+'.');
    }catch(e){message(e.message)}finally{activity('');apply.disabled=false}
  };

  window.addEventListener('archivist-ready',()=>{
    panel.hidden=!currentProfile?.owner;
    bulk.hidden=!currentProfile?.owner;
  });
})();
