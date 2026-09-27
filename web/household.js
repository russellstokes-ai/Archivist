const household=element('section');household.hidden=true;household.className='panel-card household-panel';
const householdHead=element('div');householdHead.className='section-heading';
const householdCopy=element('div');householdCopy.append(
  element('h2','Family users'),
  element('p','Archivist has two roles only: Admin and User. Users can browse, read, listen, rate, favourite and download; only Admin can manage the server or library files.')
);
householdHead.append(householdCopy);
const profileList=element('div'),createBlock=element('div'),createForm=element('form'),nameField=element('input'),createButton=element('button','Add user');
createBlock.className='profile-create';createButton.className='primary';
nameField.placeholder='User name';nameField.required=true;nameField.maxLength=100;nameField.setAttribute('aria-label','User name');
createBlock.append(element('h3','Add a family user'),element('p','Every User can access the whole library. Personal progress, ratings, favourites and stats remain separate.'),createForm);
createForm.append(nameField,createButton);household.append(householdHead,createBlock,profileList);$('household-settings').append(household);

async function refreshHousehold(){
  if(!(currentProfile?.admin ?? currentProfile?.owner))return;
  household.hidden=false;
  const profiles=await api('./api/profiles');profileList.replaceChildren();
  if(!profiles.length){
    const empty=element('div');empty.className='empty-state';
    empty.append(element('strong','No family users yet'),element('p','Add one above when somebody else needs their own Archivist login.'));
    profileList.append(empty)
  }
  for(const p of profiles){
    const card=element('article');card.className='profile-card';
    const top=element('div');top.className='profile-head';
    const title=element('div');title.append(element('strong',p.name),element('p',p.revoked?'Access revoked':'User · whole library'));
    const state=element('span',p.revoked?'Revoked':'User');state.className='status-pill '+(p.revoked?'status-error':'status-ok');
    top.append(title,state);card.append(top);
    if(!p.revoked){
      const actions=element('div');actions.className='profile-actions';
      const rotate=element('button','Replace access key'),revoke=element('button','Revoke user');
      rotate.onclick=()=>rotateProfile(p);
      revoke.className='danger-quiet';revoke.onclick=async()=>{
        if(!confirm('Revoke '+p.name+'? Their access key will stop working.'))return;
        revoke.disabled=true;revoke.textContent='Revoking…';activity('Revoking family user',p.name);
        try{await api('./api/profiles/'+p.id,'DELETE');message(p.name+' access revoked.');await refreshHousehold()}
        catch(e){message(e.message)}
        finally{activity('');revoke.disabled=false;revoke.textContent='Revoke user'}
      };
      actions.append(rotate,revoke);card.append(actions);
    }
    profileList.append(card);
  }
}

createForm.onsubmit=async e=>{
  e.preventDefault();createButton.disabled=true;createButton.textContent='Creating…';activity('Creating family user',nameField.value||'New user');
  try{
    const p=await api('./api/profiles','POST',{name:nameField.value});
    const result=element('div');result.className='key-result';const key=element('textarea');key.readOnly=true;key.value=p.key;key.setAttribute('aria-label','New user access key');
    result.append(element('strong','User access key created'),element('p','Give this key to '+nameField.value+' when they connect Archivist. It is shown only now.'),key);
    household.append(result);await refreshHousehold();nameField.value='';message('User created.');
  }catch(e){message(e.message)}
  finally{activity('');createButton.disabled=false;createButton.textContent='Add user'}
};

const signout=element('button','Switch user');signout.hidden=true;
signout.onclick=async()=>{try{if(typeof saveListening==='function')await saveListening();await api('./logout','POST');location.reload()}catch(e){message(e.message)}};
document.querySelector('header').append(signout);
window.addEventListener('archivist-ready',()=>{
  signout.hidden=!!currentProfile?.ingress;
  signout.textContent=currentProfile.name+' · Switch user';
  refreshHousehold().catch(e=>message(e.message))
});