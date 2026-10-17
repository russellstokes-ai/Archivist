// Execute the real legacy browser organiser. Synthetic indexed pages prove
// that >500 files cannot silently become a bulk preview of the first 500.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/filemoves.js'),'utf8');

class FakeElement{
 constructor(tag='div',text){
  this.tagName=tag.toUpperCase();this.children=[];this.hidden=false;
  this.disabled=false;this.value='';this.dataset={};this.textContent=text===undefined?'':String(text);
 }
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=[...nodes]}
 get options(){return this.children}
 setAttribute(key,value){this[key]=String(value)}
 querySelectorAll(){return []}
}

async function testDataset(count){
 const holders={'organisation-settings':new FakeElement(),'search':new FakeElement(),'space':new FakeElement()};
 const calls=[],messages=[],events={};
 const assets=Array.from({length:count},(_,i)=>({id:i+1,title:'Title '+String(i+1).padStart(6,'0'),author:'Artist',series:'Serial',format:'Comic',space:'Comics',available:true}));
 const element=(tag,text)=>new FakeElement(tag,text);
 const api=async(url,method,payload)=>{
  calls.push({url,method:method||'GET',payload});
  if(url.startsWith('./api/books?')){
   const q=new URL(url,'http://local.invalid').searchParams;
   assert.equal(q.get('sort'),'title');
   const limit=Number(q.get('limit')),offset=Number(q.get('offset'));
   assert(limit>=1&&limit<=200,'legacy list must use bounded pages');
   return assets.slice(offset,offset+limit);
  }
  if(url==='./api/file-moves?state=pending&limit=500')return [];
  if(url==='./api/file-moves/preview-template-batch'){
   return {ok:0,failed:0,items:payload.assets.map(asset=>({asset,status:'same',title:'Already sorted'}))};
  }
  throw Error('Unexpected legacy organiser HTTP request: '+url);
 };
 const sandbox={
  element,api,
  $:id=>holders[id],
  Option:class extends FakeElement{constructor(label,value){super('option',label);this.value=value}},
  window:{addEventListener:(name,fn)=>events[name]=fn},
  currentProfile:{owner:true},
  activity(){},message:v=>messages.push(String(v)),
  loadBooks:async()=>{},URLSearchParams,
  Set,Map,Array,Number,String,Promise,Math,console
 };
 vm.runInNewContext(source,sandbox,{filename:'web/filemoves.js'});
 assert.equal(typeof events['archivist-ready'],'function');
 await events['archivist-ready']();
 const panel=holders['organisation-settings'].children[0];
 assert(panel,'legacy organiser panel must exist');
 // This pane's controls are structural in existing source; no brittle CSS
 // selectors or snapshot images are required to verify real behaviour.
 const heading=panel.children[0],controls=panel.children[1],note=panel.children[2];
 const previewButton=controls.children[2];
 const fileQueries=calls.filter(x=>x.url.startsWith('./api/books?'));
 const rowsTotal=count>500?501:count;
 assert(fileQueries.length>=1);
 assert.equal(fileQueries.reduce((n,x)=>n+Number(new URL(x.url,'http://local').searchParams.get('limit')),0)>=rowsTotal,true);
 if(count>500){
  assert.equal(previewButton.disabled,true,'partial legacy list must block bulk move preview');
  assert.match(note.textContent,/more than 500 indexed files/);
  previewButton.onclick();await Promise.resolve();
  assert(calls.every(x=>x.url!=='./api/file-moves/preview-template-batch'),
   'legacy preview must never submit an incomplete subset of a large library');
  assert(messages.some(x=>x.includes('has not proved a complete library selection')));
 }else if(count===0){
  assert.equal(previewButton.disabled,true,'empty library cannot launch a mass preview');
  assert.match(note.textContent,/Indexed selection complete: 0/);
 }else{
  assert.equal(previewButton.disabled,false,'small complete legacy library may be previewed');
  assert.match(note.textContent,/Indexed selection complete/);
  await previewButton.onclick();
  const batches=calls.filter(x=>x.url==='./api/file-moves/preview-template-batch');
  assert.equal(batches.length,Math.ceil(count/100));
  const assetsSubmitted=batches.flatMap(x=>x.payload.assets);
  assert.equal(assetsSubmitted.length,count);
  assert.equal(new Set(assetsSubmitted).size,count,'each indexed file previewed at most once');
 }
}

(async()=>{
 await testDataset(503);
 await testDataset(300);
 await testDataset(0);
 console.log('PASS: legacy file organiser detects >500 assets; refuses partial preview; pages complete smaller libraries in bounded batches');
})().catch(error=>{console.error(error);process.exitCode=1});
