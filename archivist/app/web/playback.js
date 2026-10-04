// One controller owns grouped audiobook playback. Visual work stays in the browser; the Pi only streams bytes and persists state.
const playbackAudio=document.getElementById('audio');
let listening=null,saveChain=Promise.resolve(),lastSave=0,opening=0,chapters=[],currentSpeed=Number(localStorage.getItem('archivist-player-speed'))||1;
const playerEl=document.getElementById('player'),livingBook=document.getElementById('living-book'),playButton=document.getElementById('player-play');
const progressInput=document.getElementById('player-progress'),elapsedEl=document.getElementById('player-elapsed'),durationEl=document.getElementById('player-duration');
const speedSelect=document.getElementById('player-speed'),chapterSelect=document.getElementById('player-chapters'),chapterWrap=document.getElementById('player-chapters-wrap');
function timeLabel(seconds){seconds=Math.max(0,Number(seconds)||0);const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=Math.floor(seconds%60);return h?String(h)+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):String(m)+':'+String(s).padStart(2,'0');}
function remember(){if(!listening||listening.loading)return;const s=listening;s.seconds=Number.isFinite(playbackAudio.currentTime)?playbackAudio.currentTime:0;localStorage.setItem('archivist-progress-'+(currentProfile?.id??0)+'-'+s.edition,JSON.stringify({asset:s.tracks[s.index].id,seconds:s.seconds,revision:s.revision,complete:s.complete}));}
function saveListening(){if(!listening||listening.loading)return saveChain;remember();const session=listening,p={asset:session.tracks[session.index].id,seconds:session.seconds,complete:session.complete};saveChain=saveChain.then(async()=>{if(session.conflict)return;try{const res=await api('./api/editions/'+session.edition+'/progress','PUT',{...p,revision:session.revision});session.revision=res.revision;if(listening===session)remember()}catch(e){session.conflict=true;message('Your place is saved on this browser. '+e.message)}});return saveChain;}
function syncPlayerState(){
  const duration=Number(playbackAudio.duration)||0,current=Number(playbackAudio.currentTime)||0;
  elapsedEl.textContent=timeLabel(current);durationEl.textContent=timeLabel(duration);
  progressInput.value=duration?String(Math.round(current/duration*1000)):'0';
  const playing=!playbackAudio.paused&&!playbackAudio.ended;
  playButton.textContent=playing?'Ⅱ':'▶';playButton.setAttribute('aria-label',playing?'Pause':'Play');
  livingBook.classList.toggle('open',playing);
  if(chapters.length){
    const chapter=[...chapters].reverse().find(item=>current>=Number(item.start||0))||chapters[0];
    document.getElementById('playing-chapter').textContent=chapter?.title||'';
    const index=chapters.indexOf(chapter);if(index>=0)chapterSelect.value=String(index);
  }
  if('mediaSession' in navigator&&duration>0&&Number.isFinite(duration)){
    try{navigator.mediaSession.setPositionState({duration,playbackRate:playbackAudio.playbackRate,position:Math.min(current,duration)})}catch{}
  }
}
async function loadChapters(asset){
  chapters=[];chapterSelect.replaceChildren();chapterWrap.hidden=true;document.getElementById('playing-chapter').textContent='';
  try{
    const result=await api('./api/assets/'+asset+'/chapters');
    if(!Array.isArray(result)||!result.length)return;
    chapters=result;for(let i=0;i<chapters.length;i++)chapterSelect.add(new Option(chapters[i].title||('Chapter '+(i+1)),String(i)));
    chapterWrap.hidden=false;syncPlayerState();
  }catch{}
}
function updateMediaSession(){
  if(!('mediaSession' in navigator)||!listening)return;
  const work=listening.work||{},track=listening.tracks[listening.index];
  try{
    navigator.mediaSession.metadata=new MediaMetadata({
      title:listening.title,artist:work.author||'',album:work.series||track?.title||'Archivist',
      artwork:work.id?[{src:new URL('./api/works/'+work.id+'/cover',location.href).href,sizes:'512x512'}]:[]
    });
  }catch{}
}
async function loadListeningTrack(index,seconds=0){
  const s=listening;if(!s)return;
  if(index>=s.tracks.length){s.complete=true;await saveListening();message('Audiobook complete.');syncPlayerState();return}
  if(!s.tracks[index].available){message('The next track is unavailable. Playback stopped at your saved place.');return}
  s.index=index;s.seconds=seconds;s.loading=true;s.complete=false;
  const track=s.tracks[index];playbackAudio.src='./api/assets/'+track.id;
  document.getElementById('playing-title').textContent=s.title;
  const work=s.work||{};document.getElementById('playing-byline').textContent=[work.author,work.series,track.title].filter(Boolean).join(' · ');
  const cover=document.getElementById('player-cover'),fallback=document.getElementById('player-cover-fallback');
  if(work.id){cover.src='./api/works/'+work.id+'/cover';cover.hidden=false;fallback.hidden=true;cover.onerror=()=>{cover.hidden=true;fallback.hidden=false}}else{cover.hidden=true;fallback.hidden=false}
  playerEl.hidden=false;document.getElementById('now-empty').hidden=true;playbackAudio.playbackRate=currentSpeed;speedSelect.value=String(currentSpeed);
  updateMediaSession();void loadChapters(track.id);
  playbackAudio.onloadedmetadata=()=>{
    if(listening!==s)return;
    playbackAudio.currentTime=Number.isFinite(playbackAudio.duration)?Math.min(seconds,playbackAudio.duration):seconds;s.loading=false;remember();syncPlayerState();
    playbackAudio.play().catch(()=>message('Press Play to continue. Your browser may block autoplay.'));
  };
}
async function openAudiobook(title,tracks,edition,explicitAsset,work){
  const generation=++opening;await saveListening();playbackAudio.pause();if(generation!==opening)return;
  const selected=tracks.filter(t=>t.edition===edition&&t.format==='Audio');if(!selected.length)return;
  let server;try{server=await api('./api/editions/'+edition+'/progress')}catch(e){message(e.message);return}if(generation!==opening)return;
  let local;try{local=JSON.parse(localStorage.getItem('archivist-progress-'+(currentProfile?.id??0)+'-'+edition)||'null')}catch{}
  let point=server;if(local&&local.revision===server.revision)point=local;else if(local&&local.revision!==server.revision){message('Loaded the server position. A different browser checkpoint remains saved locally.');localStorage.setItem('archivist-conflict-'+(currentProfile?.id??0)+'-'+edition,JSON.stringify(local));}
  let index=selected.findIndex(t=>t.id===(explicitAsset||point.asset));if(index<0)index=0;
  listening={edition,title,tracks:selected,index,revision:server.revision,seconds:0,complete:false,loading:true,conflict:false,work:work||null};
  if(typeof show==='function')show('now');await loadListeningTrack(index,explicitAsset?0:point.seconds||0);
}
function seekBy(seconds){if(!listening||!Number.isFinite(playbackAudio.duration))return;playbackAudio.currentTime=Math.max(0,Math.min(playbackAudio.duration,playbackAudio.currentTime+seconds));remember();syncPlayerState();}
playButton.onclick=()=>{if(!listening)return;if(playbackAudio.paused)playbackAudio.play().catch(()=>message('Playback could not start.'));else playbackAudio.pause();};
document.getElementById('player-back-30').onclick=()=>seekBy(-30);
document.getElementById('player-back-15').onclick=()=>seekBy(-15);
document.getElementById('player-forward-15').onclick=()=>seekBy(15);
document.getElementById('player-forward-30').onclick=()=>seekBy(30);
progressInput.onchange=()=>{if(!Number.isFinite(playbackAudio.duration))return;playbackAudio.currentTime=Number(progressInput.value)/1000*playbackAudio.duration;remember();syncPlayerState();};
speedSelect.value=String(currentSpeed);speedSelect.onchange=()=>{currentSpeed=Number(speedSelect.value)||1;localStorage.setItem('archivist-player-speed',String(currentSpeed));playbackAudio.playbackRate=currentSpeed;syncPlayerState();};
chapterSelect.onchange=()=>{const chapter=chapters[Number(chapterSelect.value)];if(chapter){playbackAudio.currentTime=Number(chapter.start)||0;remember();syncPlayerState();}};
playbackAudio.addEventListener('play',syncPlayerState);playbackAudio.addEventListener('pause',()=>{syncPlayerState();saveListening()});
playbackAudio.addEventListener('timeupdate',()=>{syncPlayerState();if(Date.now()-lastSave>5000){lastSave=Date.now();saveListening()}});
playbackAudio.addEventListener('seeked',()=>saveListening());
playbackAudio.addEventListener('ratechange',syncPlayerState);
playbackAudio.addEventListener('ended',async()=>{if(!listening)return;await saveListening();await loadListeningTrack(listening.index+1)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveListening()});window.addEventListener('pagehide',remember);
document.getElementById('close-player').addEventListener('click',()=>{saveListening();listening=null;chapters=[];playbackAudio.onloadedmetadata=null;document.getElementById('now-empty').hidden=false;livingBook.classList.remove('open')},true);
document.getElementById('books').addEventListener('click',()=>{if(typeof selecting!=='undefined'&&selecting)return;saveListening();listening=null;playbackAudio.onloadedmetadata=null},true);
if('mediaSession' in navigator){
  for(const [action,handler] of [['play',()=>playbackAudio.play()],['pause',()=>playbackAudio.pause()],['seekbackward',details=>seekBy(-(details.seekOffset||15))],['seekforward',details=>seekBy(details.seekOffset||15)],['seekto',details=>{if(Number.isFinite(details.seekTime)){playbackAudio.currentTime=details.seekTime;syncPlayerState();}}]]){
    try{navigator.mediaSession.setActionHandler(action,handler)}catch{}
  }
}
