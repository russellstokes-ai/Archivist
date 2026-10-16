// Browser manager work-centric Assist contract against a deterministic fake DOM.
// Real server access and media are never required for this test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'web/manage.html'),'utf8');
const source=fs.readFileSync(path.join(root,'web/manage.js'),'utf8');
class Element {
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();this.children=[];this.dataset={};
    this.disabled=false;this.hidden=false;this.value='';this.checked=false;
    this.open=false;this.classList={toggle(){}};
  }
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=[...items]}
  get options(){return this.children}
  add(item){this.children.push(item)}
  setAttribute(key,value){(this.attributes??={})[key]=value}
  removeAttribute(key){if(this.attributes)delete this.attributes[key]}
  addEventListener(name,fn){(this.listeners??={})[name]=fn}
  showModal(){this.open=true}
  close(){this.open=false}
  focus(){}
  remove(){}
  querySelector(selector){
    const stack=[...this.children];
    while(stack.length){
      const node=stack.shift();
      if(!node||typeof node!=='object')continue;
      if(selector==='input'&&node.tagName==='INPUT')return node;
      if(selector.startsWith('[name="')&&node.name===selector.slice(7,-2))return node;
      stack.unshift(...node.children||[]);
    }
    return null;
  }
  querySelectorAll(){return []}
}
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,new Element()]));
elements.get('sort').value='review';
const nav=['library','assist','review','health'].map(view=>{const item=new Element('button');item.dataset.view=view;return item});
const calls=[];
const reply=value=>({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>value});
const file={id:11,title:'Part 1',author:'Test Author',genre:'Adventure',format:'Audio',space:'Books',needsReview:true,reviewReason:'Check edition',available:true,metadataSource:'embedded'};
const fetchFake=async (url,options={})=>{
  calls.push(url);
  if(url==='./api/me')return reply({owner:true});
  if(url.endsWith('/api/manage/works/2/publication')){
    if(options.method==='POST'){
      const body=JSON.parse(options.body);
      assert.equal(body.action,'publish');
      assert.equal(body.expectedRevision,0);
      assert.equal(body.confirm,true);
      return reply({state:'published',revision:1});
    }
    return reply({state:'staged',revision:0});
  }
  if(url==='./api/library-summary')return reply({total:3,needsReview:3,reviewWorks:2,spaces:[{name:'Books',count:3}],availability:[]});
  if(url==='./api/sources')return reply([{space:'Books'}]);
  if(url.startsWith('./api/books?'))return reply([]);
  if(url.startsWith('./api/manage/review-works/1/files?'))return reply({files:[file,{...file,id:12,title:'Part 2'}],hasMore:false});
  if(url.startsWith('./api/manage/review-works?'))return reply({total:2,works:[
    {id:1,title:'Grouped audiobook',author:'Test Author',format:'Audio',space:'Books',files:3,reviewFiles:2},
    {id:2,title:'Comic issue',format:'Comic',space:'Books',files:1,reviewFiles:0,publicationState:'staged',revision:0}
  ]});
  throw Error('Unexpected endpoint '+url);
};
const document={
  getElementById:id=>elements.get(id),
  createElement:tag=>new Element(tag),
  querySelectorAll:selector=>selector==='[data-view]'?nav:[],
  body:new Element('body')
};
const sandbox={
  document,fetch:fetchFake,Option:class extends Element{constructor(label,value){super('option');this.label=label;this.value=value}},
  localStorage:{getItem:()=>null,setItem:()=>undefined},
  URLSearchParams,URL,Blob,Promise,Map,Set,Number,String,Array,JSON,Math,setTimeout,clearTimeout,
  window:{confirm:()=>true}
};
vm.runInNewContext(source,sandbox,{filename:'web/manage.js'});
const settle=async()=>{for(let i=0;i<8;i++){await new Promise(setImmediate);await Promise.resolve()}};
(async()=>{
  await settle();
  assert.equal(elements.get('metric-review').textContent,'2','sidebar metric must count logical books, not files');
  const assist=nav.find(item=>item.dataset.view==='assist');
  assert.equal(typeof assist.onclick,'function','Assist navigation must be connected');
  assist.onclick();
  await settle();
  assert.equal(elements.get('view-assist').hidden,false);
  assert.equal(elements.get('view-library').hidden,true);
  assert.equal(elements.get('assist-works').children.length,2,'Assist shows logical books rather than three files');
  assert.match(elements.get('assist-range').textContent,/2 books require review or publication/);
  const first=elements.get('assist-works').children[0];
  const expand=first.children[2].children[0];
  expand.onclick();
  await settle();
  assert(calls.some(url=>url.startsWith('./api/manage/review-works/1/files?')),'book must request bounded per-file detail');
  const files=first.children[3];
  assert.equal(files.hidden,false);
  assert.equal(files.children.length,2,'two matching files share one logical book');
  files.children[0].children[1].onclick();
  assert.equal(elements.get('editor').open,true,'existing metadata editor opens from Assist');
  assert.equal(elements.get('editor-title').textContent,'Edit Part 1');
  const second=elements.get('assist-works').children[1];
  const publish=second.children[2].children.find(button=>button.tagName==='BUTTON'&&button.textContent==='Publish book');
  assert.equal(publish.textContent,'Publish book','reviewed book must expose separate publish action');
  publish.onclick();
  await settle();
  assert(calls.some(url=>url.endsWith('/api/manage/works/2/publication')),'Publish requires owner route rather than metadata save');

  const field=elements.get('editor-fields').querySelector('input');
  assert(field&&field.name==='title'&&field.value==='Part 1','existing metadata fields remain editable');
  console.log('PASS: Assist book count, bounded grouped file fetch, navigation and real metadata editor linkage');
})().catch(error=>{console.error(error);process.exitCode=1});
