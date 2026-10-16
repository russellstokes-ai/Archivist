// Exercise the actual server manager script with a minimal, deterministic DOM.
// Catch runtime handler bugs that HTML/text-presence contracts cannot detect.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'web/manage.html'),'utf8');
const script=fs.readFileSync(path.join(root,'web/manage.js'),'utf8');

class FakeElement{
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();
    this.children=[];
    this.dataset={};
    this.checked=false;
    this.value='';
    this.disabled=false;
    this.hidden=false;
    this.classList={toggle(){}};
  }
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=[...items]}
  add(item){this.children.push(item)}
  get options(){return this.children}
  setAttribute(name,value){(this.attributes??={})[name]=value}
  removeAttribute(name){if(this.attributes)delete this.attributes[name]}
  addEventListener(name,listener){(this.listeners??={})[name]=listener}
  querySelector(){return null}
  querySelectorAll(){return []}
}
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,new FakeElement()]));
elements.get('sort').value='review';

const data=[
  {id:11,title:'Illustrated Atlas',author:'Author A',format:'Comic',space:'Comics',available:true,needsReview:false},
  {id:12,title:'Another Comic',author:'Author B',format:'Comic',space:'Comics',available:true,needsReview:true},
];
const fetchPaths=[];
const document={
  getElementById:id=>elements.get(id),
  createElement:tag=>new FakeElement(tag),
  querySelectorAll:()=>[],
  body:new FakeElement('body'),
};
const responses={
  './api/me':{owner:true},
  './api/library-summary':{total:2,needsReview:1,spaces:['Comics'],availability:[]},
  './api/sources':[{space:'Comics'}],
};
async function fetchFake(url){
  fetchPaths.push(url);
  const body=url.startsWith('./api/books?')?data:responses[url];
  if(!body)throw Error('Unexpected manager API request: '+url);
  return {
    ok:true,
    status:200,
    headers:{get:()=> 'application/json'},
    json:async()=>body,
  };
}

const sandbox={
  document,fetch:fetchFake,
  Option:class extends FakeElement{constructor(label,value){super('option');this.label=label;this.value=value}},
  localStorage:{getItem:()=>null,setItem:()=>undefined},
  URLSearchParams,URL,Blob,Promise,Map,Set,Number,String,Array,JSON,Math,
  setTimeout,clearTimeout,
  window:{confirm:()=>true},
};
vm.runInNewContext(script,sandbox,{filename:'web/manage.js'});
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};

(async()=>{
  await flush();
  assert(fetchPaths.some(x=>x.startsWith('./api/books?')),'admin boot must request the live catalogue');
  const records=elements.get('records');
  assert.equal(records.children.length,2,'fixture must render both records');
  const rowCheckbox=index=>records.children[index].children[0].children[0];
  const first=rowCheckbox(0);
  first.checked=true;
  assert.doesNotThrow(()=>first.onchange(),'individual row selection must not throw');
  assert.equal(elements.get('selected-count').textContent,'1 selected');
  assert.equal(elements.get('export-selection').disabled,false);
  assert.equal(elements.get('clear-selection').disabled,false);
  assert.equal(elements.get('select-page').checked,false);

  const second=rowCheckbox(1);
  second.checked=true;
  assert.doesNotThrow(()=>second.onchange(),'selecting additional rows must not throw');
  assert.equal(elements.get('selected-count').textContent,'2 selected');
  assert.equal(elements.get('select-page').checked,true);

  first.checked=false;
  assert.doesNotThrow(()=>first.onchange(),'individual row deselection must not throw');
  assert.equal(elements.get('selected-count').textContent,'1 selected');
  assert.equal(elements.get('select-page').checked,false);
  assert.equal(elements.get('select-page').indeterminate,true);

  elements.get('clear-selection').onclick();
  assert.equal(elements.get('selected-count').textContent,'0 selected');
  assert.equal(elements.get('export-selection').disabled,true);
  assert.equal(rowCheckbox(0).checked,false);
  assert.equal(rowCheckbox(1).checked,false);

  elements.get('select-page').onchange({target:{checked:true}});
  assert.equal(elements.get('selected-count').textContent,'2 selected');
  assert.equal(rowCheckbox(0).checked,true);
  assert.equal(rowCheckbox(1).checked,true);

  console.log('PASS: admin manager individual/bulk selection, deselection, selection counters and export controls');
})().catch(error=>{console.error(error);process.exitCode=1});
