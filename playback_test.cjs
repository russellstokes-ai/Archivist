const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class ClassList{constructor(){this.values=new Set()}toggle(n,on){if(on)this.values.add(n);else this.values.delete(n)}remove(n){this.values.delete(n)}contains(n){return this.values.has(n)}}
class Element{
  constructor(){this.handlers={};this.currentTime=0;this.duration=300;this.hidden=true;this.value='';this.textContent='';this.classList=new ClassList();this.options=[];this.paused=true;this.ended=false;this.playbackRate=1;this.src='';}
  addEventListener(n,f){(this.handlers[n]??=[]).push(f)}
  async emit(n){for(const f of this.handlers[n]||[])await f()}
  pause(){this.paused=true}
  play(){this.paused=false;return Promise.resolve()}
  load(){}
  setAttribute(){}
  removeAttribute(){}
  replaceChildren(){this.options=[]}
  add(option){this.options.push(option)}
}
const ids=['audio','player','living-book','player-play','player-progress','player-elapsed','player-duration','player-speed','player-chapters','player-chapters-wrap','playing-chapter','playing-title','playing-byline','player-cover','player-cover-fallback','player-back-30','player-back-15','player-forward-15','player-forward-30','close-player','books','now-empty'];
const elements=Object.fromEntries(ids.map(k=>[k,new Element()]));elements.audio.hidden=false;
const storage=new Map();let stored={asset:1,seconds:42,revision:0,complete:false},shown='';
const context={
  currentProfile:{id:0},console,Date,JSON,Number,Promise,URL,
  Option:function(text,value){this.text=text;this.value=value},
  MediaMetadata:function(v){Object.assign(this,v)},
  navigator:{mediaSession:{setActionHandler(){},setPositionState(){},metadata:null}},
  document:{getElementById:k=>elements[k],addEventListener(){}},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  $:k=>elements[k],message:()=>{},show:p=>{shown=p},
  location:{href:'https://library.example/'},
  api:async(url,method,payload)=>{
    if(url.includes('/chapters'))return [];
    if(method==='PUT'){assert.equal(payload.revision,stored.revision);stored={...payload,revision:payload.revision+1};return stored}
    return {...stored};
  }
};
vm.createContext(context);vm.runInContext(fs.readFileSync('web/playback.js','utf8'),context);
(async()=>{
  context.tracks=[{id:1,edition:7,format:'Audio',available:true,title:'One'},{id:2,edition:7,format:'Audio',available:true,title:'Two'}];
  await vm.runInContext("openAudiobook('Test',tracks,7,undefined,{id:9,author:'Author',series:'Series'})",context);
  assert.equal(shown,'now');elements.audio.onloadedmetadata();assert.equal(elements.audio.currentTime,42);
  assert.equal(elements['playing-byline'].textContent,'Author · Series · One');
  elements.audio.currentTime=300;await elements.audio.emit('ended');assert.equal(new URL(elements.audio.src,'https://library.example/').pathname,'/api/assets/2');
  elements.audio.onloadedmetadata();assert.equal(elements.audio.currentTime,0);
  elements.audio.currentTime=100;await elements.audio.emit('pause');assert.equal(stored.asset,2);assert.equal(stored.seconds,100);
  await vm.runInContext("openAudiobook('Test',tracks,7,undefined,{id:9,author:'Author'})",context);elements.audio.onloadedmetadata();assert.equal(elements.audio.currentTime,100);
  elements.audio.currentTime=50;elements['player-forward-15'].onclick();assert.equal(elements.audio.currentTime,65);
  elements['player-back-30'].onclick();assert.equal(elements.audio.currentTime,35);
  elements['player-speed'].value='1.5';elements['player-speed'].onchange();assert.equal(elements.audio.playbackRate,1.5);
  console.log('PASS: resume, auto-advance, persistence, timed seek, metadata and speed controls');
})().catch(e=>{console.error(e);process.exitCode=1});
