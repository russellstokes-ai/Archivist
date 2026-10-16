// Exercise the real server manager against controllable, delayed metadata responses.
// An older Open Library lookup must never populate the editor for another work.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'web/manage.html'),'utf8');
const source=fs.readFileSync(path.join(root,'web/manage.js'),'utf8');

class Element{
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();this.children=[];this.dataset={};
    this.value='';this.disabled=false;this.hidden=false;this.checked=false;
    this.classList={toggle(){}};this.open=false;
  }
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=[...children]}
  add(child){this.children.push(child)}
  get options(){return this.children}
  setAttribute(name,value){(this.attributes??={})[name]=value}
  removeAttribute(name){if(this.attributes)delete this.attributes[name]}
  addEventListener(name,callback){(this.listeners??={})[name]=callback}
  showModal(){this.open=true}
  close(){this.open=false}
  focus(){}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  querySelectorAll(selector){
    const all=[];
    const visit=node=>{for(const child of node.children||[]){all.push(child);visit(child)}};
    visit(this);
    if(selector==='input')return all.filter(el=>el.tagName==='INPUT');
    if(selector==='input,textarea')return all.filter(el=>el.tagName==='INPUT'||el.tagName==='TEXTAREA');
    const field=selector.match(/^\[name="([a-zA-Z]+)"\]$/);
    if(field)return all.filter(el=>el.name===field[1]);
    return [];
  }
}
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,new Element()]));
elements.get('sort').value='review';
const works=[
  {id:10,title:'Book Alpha',author:'Author Alpha',format:'Ebook',space:'Books',available:true,needsReview:true},
  {id:11,title:'Book Beta',author:'Author Beta',format:'Ebook',space:'Books',available:true,needsReview:true},
];
const requests=[];
const reply=body=>({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>body});
const fetchStub=async url=>{
  if(url.startsWith('./api/manage/metadata-candidates?')){
    return new Promise((resolve,reject)=>requests.push({url,resolve,reject}));
  }
  if(url.startsWith('./api/books?'))return reply(works);
  if(url==='./api/me')return reply({owner:true});
  if(url==='./api/sources')return reply([{space:'Books'}]);
  if(url==='./api/library-summary')return reply({total:2,needsReview:2,spaces:['Books'],availability:[]});
  throw Error('Unexpected API call '+url);
};
const document={
  getElementById:id=>elements.get(id),createElement:tag=>new Element(tag),
  querySelectorAll:()=>[],body:new Element('body'),
};
const sandbox={
  document,fetch:fetchStub,
  Option:class extends Element{constructor(label,value){super('option');this.label=label;this.value=value}},
  localStorage:{getItem:()=>null,setItem:()=>undefined},
  URLSearchParams,URL,Blob,Promise,Map,Set,Number,String,Array,JSON,Math,
  setTimeout,clearTimeout,
  window:{confirm:()=>true},
};
vm.runInNewContext(source,sandbox,{filename:'web/manage.js'});
const settle=async()=>{for(let i=0;i<5;i++){await new Promise(setImmediate);await Promise.resolve()}};
const lookupResponse=(title)=>reply({candidates:[{title,author:'Candidate author',publishedYear:2000,publisher:'Vendor'}]});
(async()=>{
  await settle();
  const rows=elements.get('records').children;
  assert.equal(rows.length,2,'manager must complete normal owner-only boot and render two works');
  const open=index=>rows[index].children[6].children[0].onclick();
  const close=()=>elements.get('close-editor').onclick();
  const search=()=>elements.get('candidate-search-button').onclick();
  const results=()=>elements.get('candidate-results').children;
  const titleField=()=>elements.get('editor-fields').querySelector('[name="title"]');
  
  open(0);
  assert(elements.get('editor').open,'first book editor must open');
  assert.equal(titleField().value,'Book Alpha');
  const older=search();
  assert.equal(requests.length,1);
  assert.equal(elements.get('candidate-search-button').disabled,true);
  close();
  open(1);
  assert.equal(titleField().value,'Book Beta');
  assert.equal(results().length,0,'switching books must clear previous suggestions');
  requests[0].resolve(lookupResponse('WRONG: candidate for Book Alpha'));
  await older;await settle();
  assert.equal(results().length,0,'stale Alpha lookup must not attach to newly opened Beta editor');
  assert.equal(titleField().value,'Book Beta','stale lookup must not change current book metadata');
  assert.equal(elements.get('candidate-search-button').disabled,false,'search should be usable in new editor');

  // A fresh query for Beta still works normally and can apply individual fields.
  const current=search();
  assert.equal(requests.length,2);
  requests[1].resolve(lookupResponse('Correct Beta Candidate'));
  await current;await settle();
  assert.equal(results().length,1,'current editor must receive its own candidates');
  const choices=results()[0].children[2].children;
  const useTitle=choices.find(el=>el.textContent==='Use Title');
  assert(useTitle,'current candidate must retain a field-by-field selection control');
  useTitle.onclick();
  assert.equal(titleField().value,'Correct Beta Candidate');

  // A network error after closing a lookup must not contaminate the next editor.
  close();
  open(0);
  const last=search();
  assert.equal(requests.length,3);
  close();
  open(1);
  const previousNotice=elements.get('notice').textContent;
  requests[2].reject(Error('A previous book lookup failed'));
  await last;await settle();
  assert.equal(results().length,0,'stale failed lookup must not inject a message into the new editor');
  assert.equal(elements.get('notice').textContent,previousNotice,'stale search must not overwrite the new editor status');
  assert.equal(elements.get('candidate-search-button').disabled,false);

  console.log('PASS: outdated server metadata searches and errors cannot contaminate a later editor; fresh field selection still works');
})().catch(error=>{console.error(error);process.exitCode=1});
