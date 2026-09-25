(() => {
  const panel=document.createElement('details');
  const heading=document.createElement('summary');heading.textContent='Edit book details';panel.append(heading);
  const form=document.createElement('form'),choice=document.createElement('select'),title=document.createElement('input'),author=document.createElement('input'),series=document.createElement('input'),save=document.createElement('button');
  choice.setAttribute('aria-label','Book to edit');title.setAttribute('aria-label','Corrected title');author.setAttribute('aria-label','Author');series.setAttribute('aria-label','Series');
  title.required=true;for(const field of [title,author,series])field.maxLength=1000;author.placeholder='Author';series.placeholder='Series';save.textContent='Save details';
  form.append(choice,title,author,series,save);panel.append(form);document.getElementById('organisation-settings').append(panel);
  panel.hidden=true;let items=[];
  panel.addEventListener('toggle',async()=>{
    if(!panel.open)return;
    try {items=await api('./api/books?q='+encodeURIComponent($('search').value)+'&space='+encodeURIComponent($('space').value));choice.replaceChildren(...items.map(b=>new Option(b.title,String(b.id))));const first=items[0]||{};title.value=first.title||'';author.value=first.author||'';series.value=first.series||'';save.disabled=!items.length;}
    catch(e){message(e.message);}
  });
  choice.onchange=()=>{const selected=items.find(b=>String(b.id)===choice.value)||{};title.value=selected.title||'';author.value=selected.author||'';series.value=selected.series||'';};
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('./api/assets/'+choice.value+'/metadata','PATCH',{title:title.value,author:author.value,series:series.value});await loadBooks();panel.open=false;message('Details saved. Original file unchanged.');}catch(e){message(e.message);}finally{save.disabled=false;}};
  window.addEventListener('archivist-ready',()=>{panel.hidden=!currentProfile?.owner;});
})();
