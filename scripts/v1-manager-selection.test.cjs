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
  reset(){}
  showModal(){this.open=true}
  close(){this.open=false;this.listeners?.close?.() }
  focus(){}
}
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,new FakeElement()]));
elements.get('sort').value='review';

const data=[
  {id:11,title:'Illustrated Atlas',author:'Author A',format:'Comic',space:'Comics',available:true,needsReview:false},
  {id:12,title:'Another Comic',author:'Author B',format:'Comic',space:'Comics',available:true,needsReview:true},
];
const fetchPaths=[],bulkCalls=[],relinkCalls=[];
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
async function fetchFake(url,options={}){
  fetchPaths.push(url);
  if(url==='./api/manage/relink/preview'){
    const request=JSON.parse(options.body);relinkCalls.push({phase:'preview',request});
    assert.equal(request.oldAssetId,12);assert.equal(request.candidateAssetId,11);
    return {ok:true,status:200,headers:{get:()=> 'application/json'},
      json:async()=>({
        old:{assetId:12,workId:120,title:'Missing Atlas',workTitle:'Missing Atlas',path:'Missing Atlas.cbz',format:'Comic',sizeBytes:201},
        candidate:{assetId:11,workId:110,title:'Replacement Atlas',workTitle:'Replacement Atlas',path:'Replacement Atlas.cbz',format:'Comic',sizeBytes:201},
        sha256:'a'.repeat(64),receipt:'synthetic-server-signed',
        important:'Original bytes unavailable; only owner can attest identity.',requiresAttestation:true
      })
    };
  }
  if(url==='./api/manage/relink/apply'){
    const request=JSON.parse(options.body);relinkCalls.push({phase:'apply',request});
    assert.equal(request.confirm,true);
    assert.equal(request.attestation,'same-file-verified-by-owner');
    assert.equal(request.preview.receipt,'synthetic-server-signed');
    return {ok:true,status:200,headers:{get:()=> 'application/json'},
      json:async()=>({ok:true,workId:120,assetId:12,editionId:1200,status:'relinked'})
    };
  }
  if(url==='./api/manage/bulk-metadata/preview'){
    const request=JSON.parse(options.body);bulkCalls.push({phase:'preview',request});
    assert.equal(request.ids.length,2);
    assert.equal(request.changes.publisher,'Test Publisher');
    return {ok:true,status:200,headers:{get:()=> 'application/json'},
      json:async()=>({items:request.ids.map(id=>({
        id,title:'Synthetic '+id,revision:1,digest:'f'.repeat(64),status:'ready',
        diff:[{name:'publisher',from:'Old publisher',to:'Test Publisher'}]
      })),changes:request.changes,receipt:'synthetic-receipt',ready:2,blocked:0})};
  }
  if(url==='./api/manage/bulk-metadata/apply'){
    const request=JSON.parse(options.body);bulkCalls.push({phase:'apply',request});
    assert.equal(request.confirm,true);assert.equal(request.receipt,'synthetic-receipt');
    assert.equal(request.items.length,2);
    return {ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({ok:true,updated:2,unchanged:0})};
  }
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
const flush=async()=>{for(let i=0;i<6;i++){await new Promise(setImmediate);await Promise.resolve();}};

(async()=>{
  await flush();
  assert(fetchPaths.some(x=>x.startsWith('./api/books?')),'admin boot must request the live catalogue; calls='+JSON.stringify(fetchPaths)+'; notice='+elements.get('notice').textContent);
  const records=elements.get('records');
  assert.equal(records.children.length,2,'fixture must render both records');
  const rowCheckbox=index=>records.children[index].children[0].children[0];
  const first=rowCheckbox(0);
  assert.equal(first.attributes?.['aria-label'],'Select Illustrated Atlas','individual row action must retain an accessible label');
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

  const openBulk=elements.get('bulk-open');
  assert.equal(openBulk.disabled,false,'selected items must unlock the bulk metadata editor');
  openBulk.onclick();
  assert.equal(elements.get('bulk-dialog').open,true,'bulk manager must actually open');
  elements.get('bulk-use-publisher').checked=true;
  elements.get('bulk-publisher').value='Test Publisher';
  const preview=elements.get('bulk-form').listeners.submit({preventDefault(){}});
  await preview;await flush();
  assert.equal(bulkCalls.length,1,'preview must call a server API rather than simulate changes');
  assert.equal(bulkCalls[0].phase,'preview');
  assert.equal(elements.get('bulk-apply').disabled,false,'approved preview enables a separate apply');
  assert.equal(elements.get('bulk-preview').children.length,2,'preview displays affected files');
  await elements.get('bulk-apply').onclick();
  await flush();
  assert.equal(bulkCalls.length,2,'apply must execute the confirmed server transaction');
  assert.equal(bulkCalls[1].phase,'apply');
  assert.equal(elements.get('bulk-dialog').open,false,'successful batch should close the dialog');
  assert.equal(elements.get('selected-count').textContent,'0 selected','completed batch must clear stale row selection');
  // The same manager must expose the actual external-rename relink workflow.
  // No action may apply before the owner independently attests the identity.
  data[1].available=false;
  const live=elements.get('records').children;
  for(const index of [0,1]){
    const control=live[index].children[0].children[0];
    control.checked=true;control.onchange();
  }
  assert.equal(elements.get('relink-open').disabled,false,'two-file selection enables relink preview');
  elements.get('relink-open').onclick();
  await flush();
  assert.equal(elements.get('relink-dialog').open,true,'relink preview opens');
  assert.equal(relinkCalls.length,1,'must query verified server preview');
  assert.equal(elements.get('relink-apply').disabled,true,'apply disabled without explicit attestation');
  assert.equal(elements.get('relink-details').children.length,4,'review shows both identity cards, hash and warning');
  elements.get('relink-attest').checked=true;
  elements.get('relink-attest').onchange();
  assert.equal(elements.get('relink-apply').disabled,false,'explicit checkbox enables confirmed apply');
  elements.get('relink-apply').onclick();
  await flush();
  assert.equal(relinkCalls.length,2,'relink action must use the signed preview and server');
  assert.equal(relinkCalls[1].phase,'apply');
  assert.equal(elements.get('relink-dialog').open,false,'relink success closes dialog');
  assert.equal(elements.get('selected-count').textContent,'0 selected','relink completion clears stale selection');
  console.log('PASS: manager selection, bulk preview/confirm and owner-attested safe relink controls');
})().catch(error=>{console.error(error);process.exitCode=1});
