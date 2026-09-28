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