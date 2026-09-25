const household=element('section');household.hidden=true;household.className='panel-card household-panel';
const householdHead=element('div');householdHead.className='section-heading';
const householdCopy=element('div');householdCopy.append(element('h2','Household profiles'),element('p','Create a separate access key for each person and choose which library spaces they can see.'));
householdHead.append(householdCopy);
const profileList=element('div'),createBlock=element('div'),createForm=element('form'),nameField=element('input'),spaceChoices=element('div'),createButton=element('button','Create profile');
createBlock.className='profile-create';spaceChoices.className='access-choice-grid';createButton.className='primary';
nameField.placeholder='Profile name';nameField.required=true;nameField.maxLength=100;nameField.setAttribute('aria-label','Profile name');
createBlock.append(element('h3','Add a person'),element('p','Select the library spaces this person can access. A space can contain one or more source folders.'),createForm);
createForm.append(nameField,spaceChoices,createButton);household.append(householdHead,createBlock,profileList);$('household-settings').append(household);

async function refreshHousehold(){
  if(!currentProfile?.owner)return;
  household.hidden=false;spaceChoices.replaceChildren();
  const sources=await api('./api/sources');
  const spaces=[...new Set(sources.map(s=>s.space))].sort();
  for(const space of spaces){
    const label=element('label');label.className='access-choice';
    const check=element('input');check.type='checkbox';check.value=space;
    const text=element('span');text.append(element('strong',space),element('small','Allow access to this library space'));
    label.append(check,text);spaceChoices.append(label);
  }
  if(!spaces.length)spaceChoices.append(element('p','Add and scan a source folder first. Library spaces will appear here.'));
  const profiles=await api('./api/profiles');profileList.replaceChildren();
  if(!profiles.length){const empty=element('div');empty.className='empty-state';empty.append(element('strong','No household profiles yet'),element('p','Create one above when another person needs their own Archivist access.'));profileList.append(empty)}
  for(const p of profiles){
    const card=element('article');card.className='profile-card';
    const top=element('div');top.className='profile-head';
    const title=element('div');title.append(element('strong',p.name),element('p',p.revoked?'Access revoked':'Active profile'));
    const state=element('span',p.revoked?'Revoked':'Active');state.className='status-pill '+(p.revoked?'status-error':'status-ok');
    top.append(title,state);card.append(top);
    const access=element('div');access.className='profile-access';
    access.append(element('small','LIBRARY ACCESS'));
    const granted=Array.isArray(p.spaces)?p.spaces:[];
    if(granted.length){const chips=element('div');chips.className='access-chips';for(const s of granted){const chip=element('span',s);chip.className='access-chip';chips.append(chip)}access.append(chips)}
    else access.append(element('p','No library spaces selected.'));
    card.append(access);
    if(!p.revoked){
      const actions=element('div');actions.className='profile-actions';
      const edit=element('button','Change library access'),rotate=element('button','Replace access key'),revoke=element('button','Revoke profile');
      edit.onclick=()=>editAccess(p);
      rotate.onclick=()=>rotateProfile(p);
      revoke.className='danger-quiet';revoke.onclick=async()=>{
        if(!confirm('Revoke '+p.name+'? Their access key will stop working.'))return;
        revoke.disabled=true;revoke.textContent='Revoking…';activity('Revoking household profile',p.name);
        try{await api('./api/profiles/'+p.id,'DELETE');message(p.name+' access revoked.');await refreshHousehold()}
        catch(e){message(e.message)}
        finally{activity('');revoke.disabled=false;revoke.textContent='Revoke profile'}
      };
      actions.append(edit,rotate,revoke);card.append(actions);
    }
    profileList.append(card);
  }
}

createForm.onsubmit=async e=>{
  e.preventDefault();createButton.disabled=true;createButton.textContent='Creating…';activity('Creating household profile',nameField.value||'New profile');
  try{
    const p=await api('./api/profiles','POST',{name:nameField.value,spaces:[...spaceChoices.querySelectorAll('input:checked')].map(c=>c.value)});
    const result=element('div');result.className='key-result';const key=element('textarea');key.readOnly=true;key.value=p.key;key.setAttribute('aria-label','New profile access key');
    result.append(element('strong','Access key created'),element('p','Give this key to the household member when they add this server. It is shown only now.'),key);
    household.append(result);await refreshHousehold();nameField.value='';message('Profile created.');
  }catch(e){message(e.message)}
  finally{activity('');createButton.disabled=false;createButton.textContent='Create profile'}
};

const signout=element('button','Switch profile');signout.hidden=true;signout.onclick=async()=>{try{if(typeof saveListening==='function')await saveListening();await api('./logout','POST');location.reload()}catch(e){message(e.message)}};document.querySelector('header').append(signout);
window.addEventListener('archivist-ready',()=>{signout.hidden=!!currentProfile?.ingress;signout.textContent=currentProfile.name+' · Switch profile';refreshHousehold().catch(e=>message(e.message))});