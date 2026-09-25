(() => {
  const panel=element('details'),summary=element('summary','Organise & sort library'),form=element('form');
  const asset=element('select'),template=element('select'),target=element('input'),preview=element('button','Preview move'),templatePreview=element('button','Preview template'),batchPreview=element('button','Preview all with template'),batchApply=element('button','Apply all previews'),history=element('div');
  asset.setAttribute('aria-label','File');
  template.setAttribute('aria-label','Sorting template');
  [['author-title','Author / Title'],['author-series-title','Author / Series / Title'],['format-author-title','Format / Author / Title']].forEach(([value,label])=>template.append(new Option(label,value)));
  target.setAttribute('aria-label','Relative destination path');target.placeholder='Author/Book/Track 01.mp3';
  preview.type='submit';templatePreview.type='button';batchPreview.type='button';batchApply.type='button';
  const help=element('p','Choose a sorting template, preview the result, then apply only when you are happy. Originals are not overwritten.');form.append(asset,template,templatePreview,batchPreview,target,preview,batchApply);panel.append(summary,help,form,history);$('sources').append(panel);panel.hidden=true;panel.open=true;
  let currentItems=[];
  async function refresh(){
    history.replaceChildren();let previewCount=0;
    for(const m of await api('./api/file-moves')){
      const row=element('article'),description=element('p',m.from+' -> '+m.to+' ('+m.state+')');row.append(description);
      if(['preview','applying','linked'].includes(m.state)){previewCount++;
        const apply=element('button',m.state==='preview'?'Apply move':'Resume move');
        apply.onclick=async()=>{if(!confirm('Move '+m.from+' to '+m.to+'?'))return;apply.disabled=true;try{await api('./api/file-moves/'+m.id+'/apply','POST');await loadBooks();await refresh();}catch(e){message(e.message);}finally{apply.disabled=false;}};row.append(apply);
        if(m.state!=='linked'){const cancel=element('button','Cancel');cancel.onclick=async()=>{try{await api('./api/file-moves/'+m.id+'/cancel','POST');await refresh();}catch(e){message(e.message);}};row.append(cancel);}
      }
      if(m.state==='done'){const undo=element('button','Preview undo');undo.onclick=async()=>{try{await api('./api/file-moves/'+m.id+'/undo-preview','POST');await refresh();}catch(e){message(e.message);}};row.append(undo);}
      history.append(row);
    }
    batchApply.disabled=previewCount===0;
  }
  async function previewRequest(body){preview.disabled=true;templatePreview.disabled=true;batchPreview.disabled=true;try{const m=await api(body.template?'./api/file-moves/preview-template':'./api/file-moves/preview','POST',body);target.value=m.to;await refresh();}catch(e){message(e.message);}finally{preview.disabled=false;templatePreview.disabled=false;batchPreview.disabled=false;}}
  async function batchPreviewRequest(){if(!currentItems.length){message('No files loaded to sort.');return}if(!confirm('Preview sorting for '+currentItems.length+' loaded files? Nothing is moved until you apply.'))return;batchPreview.disabled=true;try{const out=await api('./api/file-moves/preview-template-batch','POST',{assets:currentItems.map(b=>b.id),template:template.value});message('Batch preview: '+out.ok+' ready, '+out.failed+' skipped.');await refresh();}catch(e){message(e.message);}finally{batchPreview.disabled=false;}}
  async function batchApplyRequest(){if(!confirm('Apply every pending file move preview?'))return;batchApply.disabled=true;try{const out=await api('./api/file-moves/apply-batch','POST',{ids:[]});message('Batch apply: '+out.ok+' moved, '+out.failed+' need review.');await loadBooks();await refresh();}catch(e){message(e.message);}finally{batchApply.disabled=false;}}
  panel.addEventListener('toggle',async()=>{if(!panel.open)return;try{currentItems=await api('./api/books');asset.replaceChildren(...currentItems.map(b=>new Option([b.title,b.author,b.series,b.space].filter(Boolean).join(' · '),String(b.id))));await refresh();}catch(e){message(e.message);}});
  form.onsubmit=e=>{e.preventDefault();if(!target.value.trim()){message('Enter a destination path or use a sorting template.');return;}void previewRequest({asset:Number(asset.value),to:target.value});};
  templatePreview.onclick=()=>void previewRequest({asset:Number(asset.value),template:template.value});
  batchPreview.onclick=()=>void batchPreviewRequest();
  batchApply.onclick=()=>void batchApplyRequest();
  window.addEventListener('archivist-ready',()=>panel.hidden=!currentProfile?.owner);
})();
