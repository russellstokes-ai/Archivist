async function editAccess(profile){
  try{
    activity('Loading library access',profile.name);
    const [sources,grants]=await Promise.all([api('./api/sources'),api('./api/profiles/'+profile.id+'/spaces')]);
    const panel=element('form');panel.className='access-editor panel-card';
    panel.append(element('h3','Library access · '+profile.name),element('p','Choose which library spaces this person can see. Spaces group one or more source folders; you do not need to manage individual folder paths here.'));
    const choices=element('div');choices.className='access-choice-grid';
    for(const space of [...new Set(sources.map(s=>s.space))].sort()){
      const label=element('label');label.className='access-choice';
      const box=element('input');box.type='checkbox';box.value=space;box.checked=grants.includes(space);
      const text=element('span');text.append(element('strong',space),element('small',box.checked?'Currently allowed':'Not currently allowed'));
      label.append(box,text);choices.append(label);
    }
    panel.append(choices);
    const actions=element('div');actions.className='profile-actions';
    const save=element('button','Save library access'),cancel=element('button','Cancel');save.className='primary';cancel.type='button';cancel.onclick=()=>panel.remove();
    actions.append(save,cancel);panel.append(actions);
    panel.onsubmit=async e=>{
      e.preventDefault();save.disabled=true;save.textContent='Saving…';activity('Saving library access',profile.name);
      try{
        await api('./api/profiles/'+profile.id+'/spaces','PUT',{spaces:[...panel.querySelectorAll('input:checked')].map(x=>x.value)});
        panel.remove();message(profile.name+' library access updated.');await refreshHousehold();
      }catch(e){message(e.message)}
      finally{activity('');save.disabled=false;save.textContent='Save library access'}
    };
    household.append(panel);
  }catch(e){message(e.message)}
  finally{activity('')}
}
async function rotateProfile(profile){
  if(!confirm('Replace '+profile.name+'’s access key and invalidate their current sessions?'))return;
  activity('Replacing access key',profile.name);
  try{
    const data=await api('./api/profiles/'+profile.id+'/rotate-key','POST');
    const result=element('div');result.className='key-result';const key=element('textarea');key.readOnly=true;key.value=data.key;key.setAttribute('aria-label','Replacement access key');
    result.append(element('strong','Replacement key created'),element('p','Give this key to '+profile.name+'. Their old key and sessions no longer work.'),key);household.append(result);message('Access key replaced.');
  }catch(e){message(e.message)}
  finally{activity('')}
}
const sessionPanel=element('section'),sessionsButton=element('button','My sessions');sessionPanel.hidden=true;document.querySelector('main').append(sessionPanel);sessionsButton.hidden=true;document.querySelector('header').append(sessionsButton);
async function listSessions(){
  activity('Loading sessions');
  try{
    const sessions=await api('./api/sessions');sessionPanel.hidden=false;sessionPanel.replaceChildren(element('h2','My sessions'));
    for(const s of sessions){
      const row=element('p','Signed in '+new Date(s.created*1000).toLocaleString()),revoke=element('button','Sign out this session');
      revoke.onclick=async()=>{revoke.disabled=true;revoke.textContent='Signing out…';activity('Signing out session');try{await api('./api/sessions/'+s.id,'DELETE');await listSessions()}catch(e){location.reload()}finally{activity('')}};
      row.append(revoke);sessionPanel.append(row)
    }
  }catch(e){message(e.message)}
  finally{activity('')}
}
sessionsButton.onclick=listSessions;window.addEventListener('archivist-ready',()=>{sessionsButton.hidden=!!currentProfile?.ingress});