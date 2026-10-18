// Reading surfaces use the same authorised catalogue and progress as Library.
let experienceRequest=0;
async function loadExperience(next){
 const generation=++experienceRequest;
 if(next==='listen'){renderListening();return}
 if(next!=='shelf'&&next!=='stats')return;
 try{
  if(next==='shelf'){
   const groups=await Promise.all([
    api('./api/works?reading=in-progress&limit=12'),
    api('./api/works?favourite=1&limit=12'),
    api('./api/works?sort=recent&limit=18')]);
   if(generation!==experienceRequest)return;
   for(const [index,id] of ['shelf-continue','shelf-favourites','shelf-recent'].entries()){
    const box=$(id);box.replaceChildren();
    groups[index].forEach(work=>box.append(workCard(work)));
    if(!groups[index].length)box.append(element('p',index===0?'Open a book or audiobook to start.':index===1?'Your favourite books will appear here.':'Your imported books will appear here automatically.'));
   }
  }else{
   const [summary,activity]=await Promise.all([api('./api/library-summary'),api('./api/activity?limit=30')]);
   if(generation!==experienceRequest)return;
   const box=$('stats-summary');box.replaceChildren();
   for(const item of summary.reading||[]){const card=element('div');card.className='panel-card';card.append(element('strong',String(item.count)),element('p',item.name));box.append(card)}
   const list=$('stats-activity');list.replaceChildren();
   for(const item of activity){const row=element('div');row.className='panel-card';row.append(element('strong',item.title),element('p',item.kind+' · '+new Date(item.updatedAt*1000).toLocaleDateString()));list.append(row)}
   if(!activity.length)list.append(element('p','Your reading and listening activity will appear here.'));
  }
 }catch(error){if(generation===experienceRequest)message(error.message)}
}

function renderListening(){
 const art=$('player-art'),controls=$('player-controls');
 art.replaceChildren();controls.replaceChildren();
 $('player-empty').hidden=!!listening;
 if(!listening)return;
 const work=window.activeServerWork;
 if(work)art.append(coverFor(work));
 art.append(element('h2',listening.title));
 const transport=element('div');transport.className='tools';
 const back=element('button','Back 15 seconds'),play=element('button',playbackAudio.paused?'Play':'Pause'),forward=element('button','Forward 30 seconds');
 back.onclick=()=>{playbackAudio.currentTime=Math.max(0,playbackAudio.currentTime-15)};
 forward.onclick=()=>{if(Number.isFinite(playbackAudio.duration))playbackAudio.currentTime=Math.min(playbackAudio.duration,playbackAudio.currentTime+30)};
 play.onclick=()=>{if(playbackAudio.paused)playbackAudio.play().catch(e=>message(e.message));else playbackAudio.pause()};
 transport.append(back,play,forward);controls.append(transport);
 const speed=element('select');speed.setAttribute('aria-label','Playback speed');
 for(const rate of [0.75,1,1.25,1.5,1.75,2]){const option=element('option',rate+'×');option.value=rate;option.selected=rate===playbackAudio.playbackRate;speed.append(option)}
 speed.onchange=()=>{playbackAudio.playbackRate=Number(speed.value)};controls.append(element('label','Speed'),speed);
 const chapters=element('select');chapters.setAttribute('aria-label','Audiobook chapter');
 listening.tracks.forEach((track,index)=>{const option=element('option',(index+1)+'. '+track.title);option.value=index;option.disabled=!track.available;option.selected=index===listening.index;chapters.append(option)});
 chapters.onchange=async()=>{await saveListening();await loadListeningTrack(Number(chapters.value))};controls.append(element('label','Chapter'),chapters);
 const note=element('p','Use the audio controls below to seek or adjust volume. Your place is saved automatically.');controls.append(note);
}
for(const event of ['play','pause','loadedmetadata'])playbackAudio.addEventListener(event,()=>{if(page==='listen')renderListening()});
$('library-sort').onchange=()=>loadBooks(false);
$('library-view').onchange=()=>{$('books').classList.toggle('library-list',$('library-view').value==='list')};
const enrichLabel=element('label'),enrich=element('input');enrich.type='checkbox';enrich.checked=true;
enrichLabel.append(enrich,document.createTextNode(' Automatically fill missing book details'));
const enrichHelp=element('p','Uses book identifiers or title and author with Open Library and Audnexus. No files are uploaded. Existing details and your corrections are kept. Genre and publication year help organise Atlas.');
enrichHelp.className='note';$('sources').append(enrichLabel,enrichHelp);
enrich.onchange=async()=>{try{await api('./api/manage/automatic-metadata','PUT',{enabled:enrich.checked})}catch(e){enrich.checked=!enrich.checked;message(e.message)}};
window.addEventListener('archivist-ready',async()=>{if(currentProfile?.owner){try{enrich.checked=(await api('./api/manage/automatic-metadata')).enabled}catch(e){message(e.message)}}});
