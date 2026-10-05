(() => {
  const root=document.getElementById('organisation-settings');
  if(!root)return;

  const panel=document.createElement('section');panel.className='panel-card metadata-providers';
  const heading=document.createElement('div');heading.className='section-heading';
  const copy=document.createElement('div');
  copy.append(element('h2','Metadata sources'),element('p','Choose the online catalogues Archivist may use to fill uncertain book and comic details.'));
  heading.append(copy);panel.append(heading);

  const form=document.createElement('form');form.className='metadata-provider-form';
  const online=document.createElement('input');online.type='checkbox';online.id='metadata-online-enabled';
  const openLibrary=document.createElement('input');openLibrary.type='checkbox';openLibrary.id='metadata-openlibrary-enabled';
  const googleBooks=document.createElement('input');googleBooks.type='checkbox';googleBooks.id='metadata-googlebooks-enabled';
  const threshold=document.createElement('select');threshold.id='metadata-minimum-match';threshold.setAttribute('aria-label','Minimum metadata match');
  [['Balanced — 72',72],['Careful — 80',80],['Strict — 88',88]].forEach(([label,value])=>threshold.add(new Option(label,String(value))));

  const toggle=(input,title,detail)=>{
    const label=document.createElement('label');label.className='metadata-provider-choice';
    const body=document.createElement('span');body.append(element('strong',title),element('small',detail));
    label.append(input,body);return label;
  };
  form.append(
    toggle(online,'Online metadata','Allow server-side lookups when you request enrichment.'),
    toggle(openLibrary,'Open Library','Strong open catalogue coverage for books and editions.'),
    toggle(googleBooks,'Google Books','Additional book and graphic-novel matching.'),
  );
  const thresholdLabel=document.createElement('label');thresholdLabel.className='metadata-threshold';
  thresholdLabel.append(element('span','Automatic match confidence'),threshold);form.append(thresholdLabel);
  const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Save metadata sources';form.append(save);
  panel.append(form);

  const actions=document.createElement('div');actions.className='metadata-enrich-actions';
  const enrich=document.createElement('button');enrich.type='button';enrich.textContent='Enrich books & comics now';
  const result=element('p','');result.className='note';result.setAttribute('role','status');
  actions.append(enrich,result);panel.append(actions);
  const note=element('p','Online enrichment sends only the current title/author search terms to the enabled catalogue providers. Original media files are never modified.');
  note.className='note';panel.append(note);

  root.prepend(panel);

  async function loadSettings(){
    const settings=await api('./api/metadata/settings');
    online.checked=!!settings.onlineEnabled;
    openLibrary.checked=!!settings.openLibraryEnabled;
    googleBooks.checked=!!settings.googleBooksEnabled;
    threshold.value=String(settings.minimumMatch||72);
    syncDisabled();
  }
  function syncDisabled(){
    const disabled=!online.checked;
    openLibrary.disabled=disabled;googleBooks.disabled=disabled;threshold.disabled=disabled;enrich.disabled=disabled;
  }
  online.addEventListener('change',syncDisabled);

  form.onsubmit=async event=>{
    event.preventDefault();save.disabled=true;
    try{
      await api('./api/metadata/settings','PUT',{
        onlineEnabled:online.checked,
        openLibraryEnabled:openLibrary.checked,
        googleBooksEnabled:googleBooks.checked,
        minimumMatch:Number(threshold.value)
      });
      message('Metadata sources saved.');
    }catch(error){message(error.message)}
    finally{save.disabled=false;syncDisabled()}
  };

  enrich.onclick=async()=>{
    enrich.disabled=true;result.textContent='Matching uncertain books and comics…';activity('Enriching metadata','Online catalogues');
    try{
      const summary=await api('./api/metadata/enrich','POST',{limit:50});
      result.textContent=summary.examined
        ? `${summary.updated} updated · ${summary.skipped} left for review · ${summary.examined} checked`
        : 'Nothing currently needs online enrichment.';
      if(summary.errors?.length)result.textContent+=' · Some providers were unavailable; local metadata was kept.';
      await Promise.all([loadBooks(false),loadLibrarySummary()]);
      message(summary.updated?'Metadata enrichment complete.':'No confident metadata changes were applied.');
    }catch(error){result.textContent=error.message;message(error.message)}
    finally{activity('');enrich.disabled=!online.checked}
  };

  window.addEventListener('archivist-ready',()=>{
    panel.hidden=!currentProfile?.owner;
    if(currentProfile?.owner)loadSettings().catch(error=>{result.textContent=error.message});
  });
})();