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
  reset(){}
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
const nav=['library','assist','review','health','overview','recovery'].map(view=>{const item=new Element('button');item.dataset.view=view;return item});
const calls=[];
const scanJobs=[
  {id:2,source_id:1,state:'failed',message:'Storage offline',progress:0,total:1},
  {id:1,source_id:1,state:'queued',message:'Waiting for scanner',progress:0,total:0},
  {id:3,source_id:1,state:'running',message:'Scanning',progress:2,total:10}
];
const reply=value=>({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>value});
const fieldNames=['title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description'];
const file={id:11,title:'Part 1',author:'Test Author',genre:'Adventure',format:'Audio',space:'Books',needsReview:true,reviewReason:'Check edition',available:true,metadataSource:'embedded'};
const workCalls=[];
const editionCalls=[];
const transferCalls=[];
let pauseTransfer=false,releaseTransfer=null;
let editionRev=0,editionSaved=false;
let editionFields={run:'',volume:'',issue:'',imprint:'',variant:'',year:'',notes:''};
let pauseWorkPreview=false,releaseWorkPreview=null,failNextWorkReload=false;
let workRevision=0,workFingerprint='a'.repeat(64),workTitle='Grouped audiobook',workYear='',workCoverHash='',workPublicationRevision=0;
const originalWorkTitle=workTitle;
const makeWorkState=()=>({
  workId:1,title:workTitle,space:'Books',automatic:true,
  revision:workRevision,fingerprint:workFingerprint,memberDigest:'d'.repeat(64),
  publicationState:'staged',publicationRevision:workPublicationRevision,coverHash:workCoverHash,files:3,
  editions:[{id:10,format:'Audio',files:3,available:3,reviewFiles:2}],
  fields:[
    {name:'title',value:workTitle,source:'catalogue',locked:false},
    {name:'author',value:'Test Author',source:'derived from files',locked:false},
    {name:'series',value:'',source:'missing',locked:false},
    {name:'seriesNumber',value:'',source:'missing from files',locked:false},
    {name:'genre',value:'Adventure',source:'derived from files',locked:false},
    {name:'publishedYear',value:workYear,source:workYear?'owner-selected Open Library suggestion (unverified)':'missing from files',locked:false},
    ...['narrator','publisher','isbn','asin','language','description'].map(name=>({
      name,value:'',source:'missing from files',locked:false
    }))
  ]
});
const makeComicWorkState=()=>({
  ...makeWorkState(),workId:2,title:'The Flash #12',revision:0,fingerprint:'f'.repeat(64),
  files:1,editions:[{id:20,format:'Comic',files:1,available:1,reviewFiles:0}],
  fields:makeWorkState().fields.map(field=>{
    switch(field.name){
      case 'title':return {...field,value:'The Flash #12'};
      case 'author':return {...field,value:'Comic Creator'};
      case 'series':return {...field,value:'The Flash'};
      case 'seriesNumber':return {...field,value:'12',source:'derived from files'};
      case 'publishedYear':return {...field,value:'2024',source:'derived from files'};
      default:return field;
    }
  })
});
const fetchFake=async (url,options={})=>{
  calls.push(url);
  if(url==='./api/me')return reply({owner:true});
  if(url==='./api/manage/operations'){
    return reply({
      indexedSources:2,watchedSources:1,indexedFiles:227,indexedWorks:85,
      publishedWorks:17,stagedWorks:68,reviewFiles:19,unavailableFileFlags:2,
      jobs:{queued:1,running:0,committing:0,cancelling:0,failed:2,cancelled:1},
      backup:{databasePresent:true,databaseBytes:1572864,stagedRestore:true,restoreInFlight:false,
        recoverySnapshot:true,localOnly:true},
      caveats:['Indexed availability is not a physical NAS probe.',
        'Database snapshot is not independently verified recovery.',
        'A staged restore may be applied on restart.']
    });
  }
  if(url==='./api/manage/operations/integrity'){
    assert.equal(options.method,'POST','SQLite quick check must be a deliberate owner action');
    assert.equal(options.headers['X-Archivist-Action'],'1','SQLite check must send CSRF marker');
    return reply({result:'ok',performedAt:1790000000,durationMillis:61,
      scope:'SQLite quick_check(1) only; no media bytes, NAS mounts or restore test'});
  }
  if(url==='./api/manage/comic-edition-transfer/inspect'){
    const body=JSON.parse(options.body);
    transferCalls.push(body);
    assert.equal(body.sourceWorkId,2);
    assert.equal(body.targetWorkId,1);
    assert.equal(body.editionId,20);
    assert.equal(body.expectedSourceFingerprint,'f'.repeat(64));
    const response=reply({readOnly:true,preflightClear:false,
      editionId:20,member:{assetId:21,title:'The Flash #12',issue:12},
      source:{workId:2,title:'The Flash #12',fingerprint:'f'.repeat(64)},
      target:{workId:1,title:'Grouped audiobook'},
      blockers:[{code:'source-empty',explanation:'Source must retain at least one edition.'}],
      warnings:[{code:'apply-not-enabled',explanation:'No transfer Apply endpoint exists.'}]
    });
    if(pauseTransfer)return await new Promise(resolve=>{releaseTransfer=()=>resolve(response)});
    return response;
  }
  if(url==='./api/manage/works/2/comic-editions'){
    editionCalls.push({url,method:'GET'});
    return reply({workId:2,workFingerprint:'f'.repeat(64),publicationState:'staged',editions:[
      {workId:2,editionId:20,workFingerprint:'f'.repeat(64),
       revision:editionRev,fields:{...editionFields},stored:editionSaved,
       files:1,available:1,editable:true,warnings:[]}
    ]});
  }
  if(url.startsWith('./api/manage/works/2/comic-editions/20/')){
    editionCalls.push({url,method:options.method||'GET',body:options.body?JSON.parse(options.body):null});
    const incoming=options.body?JSON.parse(options.body):{};
    if(url.endsWith('/preview')){
      assert.equal(incoming.expectedRevision,editionRev);
      assert.equal(incoming.expectedWorkFingerprint,'f'.repeat(64));
      const diff=Object.keys(editionFields).filter(name=>incoming.fields[name]!==editionFields[name])
        .map(name=>({name,from:editionFields[name],to:incoming.fields[name],source:'owner-verified edition label'}));
      assert(diff.length,'edition edits must not preview without a changed field');
      return reply({action:'save',workId:2,editionId:20,
        expectedRevision:editionRev,expectedWorkFingerprint:'f'.repeat(64),
        before:{...editionFields},after:{...incoming.fields},diff,
        expiresAt:1790000000,receipt:'signed-edition-identity'});
    }
    if(url.endsWith('/apply')){
      assert.equal(incoming.confirm,true);
      assert.equal(incoming.preview.receipt,'signed-edition-identity');
      assert.equal(incoming.preview.expectedRevision,editionRev);
      editionFields={...incoming.preview.after};editionRev++;editionSaved=true;
      return reply({workId:2,editionId:20,revision:editionRev,
        workFingerprint:'f'.repeat(64),fields:{...editionFields}});
    }
    if(url.endsWith('/undo-preview')){
      assert.equal(editionRev,1);
      const previous={run:'',volume:'',issue:'',imprint:'',variant:'',year:'',notes:''};
      const diff=Object.keys(editionFields).filter(name=>previous[name]!==editionFields[name])
        .map(name=>({name,from:editionFields[name],to:previous[name],source:'owner-verified edition label'}));
      return reply({action:'undo',workId:2,editionId:20,expectedRevision:editionRev,
        expectedWorkFingerprint:'f'.repeat(64),before:{...editionFields},
        after:previous,diff,historyId:1,expiresAt:1790000000,
        receipt:'signed-edition-undo'});
    }
    if(url.endsWith('/undo')){
      assert.equal(incoming.confirm,true);
      assert.equal(incoming.preview.receipt,'signed-edition-undo');
      editionFields={...incoming.preview.after};editionRev++;
      return reply({workId:2,editionId:20,revision:editionRev,
        workFingerprint:'f'.repeat(64),fields:{...editionFields}});
    }
    throw Error('Unexpected edition route: '+url);
  }
  if(url==='./api/manage/works/2/metadata')return reply(makeComicWorkState());
  if(url==='./api/manage/works/2/metadata/history')return reply({workId:2,events:[]});
  if(url.startsWith('./api/manage/works/2/media?')){
    return reply({workId:2,fingerprint:'f'.repeat(64),hasMore:false,files:[
      {id:21,title:'The Flash #12',position:0,editionId:20,format:'Comic',
       available:true,relativePath:'Flash12.cbz',metadataSource:'embedded'}
    ]});
  }
  if(url==='./api/manage/works/2/comic-audit'){
    return reply({workId:2,fingerprint:'f'.repeat(64),series:'The Flash',
      issueNumber:'12',issueSource:'derived from files',fileEvidenceTruncated:false,
      peersTruncated:false,possibleGaps:[11],warnings:['Volume not independently verified'],
      peers:[{workId:2,title:'The Flash #12',issueNumber:12,year:2024}],
      fileEvidence:[{assetId:21,editionId:20,title:'The Flash #12',series:'The Flash',
        issueNumber:12,year:2024,metadataSource:'embedded',available:true,needsReview:false}]});
  }
  if(url.startsWith('./api/manage/works/1/metadata')){
    workCalls.push({url,method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined});
    if(url==='./api/manage/works/1/metadata'&&(!options.method||options.method==='GET')){
      if(failNextWorkReload){
        failNextWorkReload=false;
        return {ok:false,status:503,headers:{get:()=> 'application/json'},
          json:async()=>({error:'Simulated transient refresh outage'})};
      }
      return reply(makeWorkState());
    }
    if(url==='./api/manage/works/1/metadata/history'){
      return reply({workId:1,events:workRevision?[{id:1,action:'edit',revisionAfter:workRevision,
        recordedAt:1700000000,changes:[{name:'publishedYear',from:'',to:workYear,source:'owner-selected candidate'}]}]:[]});
    }
    if(url==='./api/manage/works/1/metadata/preview'){
      const input=JSON.parse(options.body);
      assert.equal(input.expectedRevision,workRevision);
      assert.equal(input.expectedFingerprint,workFingerprint);
      assert.equal(input.changes.length,1);
      assert.equal(input.changes[0].name,'publishedYear');
      const year=pauseWorkPreview?'2023':'2021';
      assert.equal(input.changes[0].value,year);
      assert.equal(input.changes[0].origin,pauseWorkPreview?'manual':'open-library');
      const result=reply({workId:1,expectedRevision:workRevision,
        expectedFingerprint:workFingerprint,changes:input.changes,
        diff:[{name:'publishedYear',from:workYear,to:year,source:'owner-selected value'}],
        expiresAt:1790000000,receipt:'signed-work-preview'});
      if(pauseWorkPreview){
        return await new Promise(resolve=>{releaseWorkPreview=()=>resolve(result)});
      }
      return result;
    }
    if(url==='./api/manage/works/1/metadata/apply'){
      const input=JSON.parse(options.body);
      assert.equal(input.confirm,true);
      assert.equal(input.preview.receipt,'signed-work-preview');
      workYear='2021';workRevision++;
      workFingerprint=['a','b','c','d','e'][workRevision].repeat(64);
      return reply(makeWorkState());
    }
    if(url==='./api/manage/works/1/metadata/undo-preview'){
      assert.equal(workRevision,1);
      return reply({workId:1,expectedRevision:1,expectedFingerprint:workFingerprint,
        historyId:1,expiresAt:1790000000,receipt:'signed-undo-preview',
        diff:[{name:'publishedYear',from:'2021',to:'',source:'restore saved prior value'}]});
    }
    if(url==='./api/manage/works/1/metadata/undo'){
      const input=JSON.parse(options.body);
      assert.equal(input.confirm,true);
      assert.equal(input.preview.receipt,'signed-undo-preview');
      workYear='';workRevision=2;workFingerprint='c'.repeat(64);
      return reply(makeWorkState());
    }
    throw Error('Unhandled workbench endpoint: '+url);
  }
  if(url.startsWith('./api/manage/works/1/media?')){
    return reply({workId:1,fingerprint:workFingerprint,hasMore:false,files:[
      {id:11,title:'Part 1',author:'Test Author',position:0,editionId:10,format:'Audio',
        available:true,relativePath:'Aerial/Part 1.mp3',metadataSource:'embedded'},
      {id:12,title:'Part 2',author:'Test Author',position:1,editionId:10,format:'Audio',
        available:true,relativePath:'Aerial/Part 2.mp3',metadataSource:'embedded'}
    ]});
  }
  if(url==='./api/manage/works/1/cover'&&options.method==='DELETE'){
    workCalls.push({url,method:'DELETE'});
    assert(workCoverHash,'cover deletion requires an existing selected book cover');
    workCoverHash='';workPublicationRevision++;workFingerprint='f'.repeat(64);
    return reply({ok:true});
  }
  if(url.startsWith('./api/manage/metadata-candidates?q=')){
    if(url.includes('format=comic')){
      return reply({provider:'Open Library + Google Books',candidates:[
        {workId:'matching',title:'The Flash #12',source:'Google Books',publisher:'Comic House',
          comicSeriesMatch:'match',comicIssueMatch:'match',tier:'possible comic issue',
          yearType:'edition publication',publishedYear:2024,
          reasons:['Exact explicit comic issue number']},
        {workId:'wrong',title:'The Flash #13',source:'Google Books',publisher:'Other House',
          comicSeriesMatch:'match',comicIssueMatch:'mismatch',tier:'check carefully',
          warnings:['Different comic issue number']}
      ]});
    }
    return reply({provider:'Open Library',candidates:[
      {workId:'/works/test',title:'Aerial Archive',author:'Test Author',publishedYear:2021,
       isbn:'1234567890',publisher:'Example Press',source:'Open Library',yearType:'first publication',
       tier:'strong candidate',reasons:['Exact title','Exact creator']},
      {workId:'google-books:test-edition',title:'Aerial Archive',author:'Test Author',
       publishedYear:2024,publisher:'Edition House',source:'Google Books',yearType:'edition publication',
       tier:'possible candidate',warnings:['Edition year is not first publication']}
    ]});
  }

  if(url.startsWith('./api/manage/relink-groups/works/')){
    const id=Number(url.split('/').pop());
    const original=id===1;
    assert([1,4].includes(id),'unexpected group work identity');
    return reply({workId:id,sourceId:1,format:'Audio',title:original?'Original audiobook':'Renamed audiobook',
      tracks:[0,1,2].map(i=>({position:i,identity:{
        assetId:(original?11:41)+i,format:'Audio',available:!original,
        sizeBytes:512+i,path:(original?'Old/':'New/')+'Chapter '+(i+1)+'.mp3'
      }}))
    });
  }
  if(url==='./api/manage/relink-groups/preview'){
    const request=JSON.parse(options.body);
    assert.equal(request.pairs.length,3,'owner must submit every chapter');
    for(let i=0;i<3;i++){
      assert.equal(request.pairs[i].oldAssetId,11+i);
      assert.equal(request.pairs[i].candidateAssetId,41+i);
    }
    return reply({receipt:'server-signed-preview',requiresAttestation:true,oldWorkId:1,candidateWorkId:4,
      important:'Verify each chapter independently',pairs:request.pairs.map((item,i)=>({
        old:{position:i,identity:{assetId:item.oldAssetId}},
        candidate:{position:i,identity:{assetId:item.candidateAssetId}},
        sha256:'a'.repeat(64)
      }))});
  }
  if(url==='./api/manage/relink-groups/apply'){
    const request=JSON.parse(options.body);
    assert.equal(request.confirm,true);
    assert.equal(request.attestation,'all-chapter-mappings-verified-by-owner');
    assert.equal(request.preview.receipt,'server-signed-preview');
    return reply({ok:true,workId:1,editionId:100,tracks:3});
  }
  if(url==='./api/library-health')return reply({
    summary:{offlineSources:0,indexedFiles:4,indexedWorks:3,publishedWorks:1,
      missingAuthor:1,missingGenre:2,missingYear:3,lowConfidence:2,needsReview:2,offlineFiles:0},
    sources:[{id:1,online:true,indexedFiles:4,indexedWorks:3,needsReview:2,
      missingGenre:2,missingYear:3,offlineFiles:0}],
    note:'Read-only scanner metadata coverage'
  });
  if(url==='./api/jobs')return reply(scanJobs.map(job=>({...job})));
  if(url==='./api/jobs/1/cancel'&&options.method==='POST'){
    scanJobs.find(x=>x.id===1).state='cancelled';
    return reply({ok:true,id:1,state:'cancelled'});
  }
  if(url==='./api/jobs/2/retry'&&options.method==='POST'){
    scanJobs.find(x=>x.id===2).state='cancelled';
    scanJobs.unshift({id:4,source_id:1,state:'queued',message:'Retry queued',progress:0,total:0});
    return reply({ok:true,job_id:4,state:'queued'});
  }
  if(url.startsWith('./api/manage/assets/')&&url.endsWith('/fields')){
    const id=Number(url.split('/')[4]);
    const row=id===11?file:{...file,id,title:'Part 2'};
    return reply({assetId:id,revision:0,fingerprint:'b'.repeat(64),fields:fieldNames.map(name=>({
      name,value:row[name]===undefined?(name==='seriesNumber'||name==='publishedYear'?'0':''):String(row[name]),
      source:'embedded',locked:false,updatedAt:0
    }))});
  }
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
  if(url.endsWith('/api/manage/works/3/publication')){
    if(options.method==='POST'){
      const body=JSON.parse(options.body);
      assert.equal(body.action,'unpublish');
      assert.equal(body.expectedRevision,1);
      assert.equal(body.confirm,true);
      return reply({state:'staged',revision:2});
    }
    return reply({state:'published',revision:1});
  }
  if(url==='./api/library-summary')return reply({total:3,needsReview:3,reviewWorks:2,spaces:[{name:'Books',count:3}],availability:[]});
  if(url==='./api/sources')return reply([{id:1,space:'Books',status:'Ready',works:3,files:4}]);
  if(url.startsWith('./api/books?'))return reply([]);
  if(url.startsWith('./api/manage/review-works/1/files?'))return reply({files:[file,{...file,id:12,title:'Part 2'}],hasMore:false});
  if(url.startsWith('./api/manage/review-works?')){
    if(url.includes('state=published'))return reply({total:1,state:'published',works:[
      {id:3,title:'Completed classic',author:'Test Author',format:'Ebook',space:'Books',files:1,reviewFiles:0,publicationState:'published',revision:1}
    ]});
    return reply({total:2,state:'staged',works:[
      {id:1,title:'Grouped audiobook',author:'Test Author',format:'Audio',space:'Books',files:3,reviewFiles:2,publicationState:'staged',revision:0},
      {id:2,title:'Comic issue',format:'Comic',space:'Books',files:1,reviewFiles:0,publicationState:'staged',revision:0}
    ]});
  }
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
  for(const view of ['overview','library','assist','review','health','recovery']){
    assert(html.includes('data-view="'+view+'"'),'server owner workspace missing '+view+' navigation');
  }
  for(const destination of ['./#settings/organisation','./#settings/household',
    './#settings/server','./#atlas']){
    assert(html.includes('href="'+destination+'"'),
      'unified workspace must connect to existing functional route '+destination);
  }
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
  elements.get('close-editor').onclick();
  assert.equal(typeof elements.get('assist-published').onclick,'function','published queue navigation must work');
  elements.get('assist-published').onclick();
  await settle();
  assert.equal(elements.get('assist-published').attributes['aria-pressed'],'true');
  assert.match(elements.get('assist-range').textContent,/1 published books/);
  assert.equal(elements.get('assist-works').children.length,1);
  assert.equal(elements.get('assist-works').children[0].children[1].children[0].textContent,'Completed classic');
  const publishedCard=elements.get('assist-works').children[0];
  const unpublish=publishedCard.children[2].children.find(button=>button.tagName==='BUTTON'&&button.textContent==='Unpublish book');
  assert(unpublish,'owner needs a reachable Unpublish action for a reviewed published work');
  unpublish.onclick();
  await settle();
  assert(calls.some(url=>url.endsWith('/api/manage/works/3/publication')),'Unpublish must call owner action endpoint');
  assert.equal(elements.get('assist-published').attributes['aria-pressed'],'true','published view must remain selected after action');
  elements.get('assist-staged').onclick();
  await settle();
  assert.equal(elements.get('assist-staged').attributes['aria-pressed'],'true');
  assert.equal(elements.get('assist-works').children.length,2);

  // A real grouped relink is reachable from a logical audiobook card. Three
  // individual chapter attestations are mandatory before the server preview.
  const audioCard=elements.get('assist-works').children[0];
  const repair=audioCard.children[2].children.find(button=>
    button.tagName==='BUTTON'&&button.textContent==='Reconnect audiobook');
  assert(repair,'grouped audiobook must link to actual recovery');
  repair.onclick();await settle();
  assert.equal(elements.get('group-relink-dialog').open,true,'grouped recovery modal did not open');
  assert.equal(elements.get('group-relink-old').value,'1');
  elements.get('group-relink-new').value='4';
  elements.get('group-relink-load').onclick();
  await settle();
  assert(calls.includes('./api/manage/relink-groups/works/1'),'old grouped work was not inspected');
  assert(calls.includes('./api/manage/relink-groups/works/4'),'replacement grouped work was not inspected');
  assert.equal(elements.get('group-relink-pairs').children.length,4,'three mapped chapters must be individually visible');
  assert.equal(elements.get('group-relink-preview').disabled,true,'preview must require each chapter confirmation');
  for(let i=0;i<3;i++){
    const check=elements.get('group-relink-pairs').children[i+1].children[0];
    check.checked=true;check.onchange();
  }
  assert.equal(elements.get('group-relink-preview').disabled,false);
  elements.get('group-relink-preview').onclick();
  await settle();
  assert(calls.includes('./api/manage/relink-groups/preview'),'group preview must hash via server');
  assert.equal(elements.get('group-relink-apply').disabled,true,'hash preview cannot substitute for final attestation');
  elements.get('group-relink-attest').checked=true;
  elements.get('group-relink-attest').onchange();
  assert.equal(elements.get('group-relink-apply').disabled,false);
  elements.get('group-relink-apply').onclick();
  await settle();
  assert(calls.includes('./api/manage/relink-groups/apply'),'confirmed group action must call server');
  assert.equal(elements.get('group-relink-dialog').open,false,'success should close the recovery dialog');

  // Assist 2.0 book editor: real book-level metadata load, edition details,
  // optional owner-selected candidate, HMAC-backed preview, explicit save
  // and signed undo. No publish or physical file operation is implied.
  const bookEdit=audioCard.children[2].children.find(button=>
    button.tagName==='BUTTON'&&button.textContent==='Edit book');
  assert(bookEdit,'every logical work needs a book-level metadata action');
  bookEdit.onclick();await settle();
  assert.equal(elements.get('work-dialog').open,true,'book workbench modal should be accessible');
  assert.equal(elements.get('work-dialog-title').textContent,'Grouped audiobook');
  assert.equal(elements.get('work-editions').children.length,1,'real audio edition summary required');
  assert.equal(elements.get('work-media').children.length,2,'book must display individual chapter records');
  const bookFields=elements.get('work-fields');
  assert.equal(bookFields.children.length,12,'book editor must include fractional comic/series positions');
  elements.get('work-candidate-query').value='Aerial Archive';
  elements.get('work-candidate-search').onclick();await settle();
  const multiCall=calls.find(x=>x.startsWith('./api/manage/metadata-candidates?q=')&&x.includes('mode=multi'));
  assert(multiCall&&multiCall.includes('title=')&&multiCall.includes('author='),
    'only explicit book-level search sends source metadata to opt-in multi-provider endpoint');
  const suggestion=elements.get('work-candidates').children[0];
  assert(suggestion,'provider candidates must render without changing saved metadata');
  const useYear=suggestion.children[2].children.find(button=>button.textContent==='Use Year');
  assert(useYear,'candidate fields need deliberate acceptance controls');
  useYear.onclick();
  assert.equal(bookFields.children[5].children[0].value,'2021');
  assert.equal(bookFields.children[5].children[0].dataset.origin,'open-library');
  const googleSuggestion=elements.get('work-candidates').children[1];
  assert(googleSuggestion,'a second provider should appear as its own candidate');
  assert(!googleSuggestion.children[2].children.some(btn=>btn.textContent==='Use Year'),
    'edition-year results must not overwrite work-level first publication');
  assert(googleSuggestion.children[2].children.some(btn=>btn.textContent==='Use Publisher'),
    'book workbench may explicitly select a provider-edition publisher for review');
  assert(googleSuggestion.children.some(node=>String(node.textContent||'').includes('Edition year')),
    'edition semantic warnings must remain visible');
  assert.equal(elements.get('work-apply-button').disabled,true,'unreviewed suggestion must not save');
  elements.get('work-preview-button').onclick();await settle();
  assert(workCalls.some(x=>x.url.endsWith('/metadata/preview')),'work-level preview must reach versioned backend');
  assert.equal(elements.get('work-preview-diff').children.length,1,'show old and new field values');
  assert.equal(elements.get('work-apply-button').disabled,false,'signed confirmed preview enables Apply');
  elements.get('work-apply-button').onclick();await settle();
  assert(workCalls.some(x=>x.url.endsWith('/metadata/apply')),'confirmed work edit must use dedicated atomic API');
  assert.equal(elements.get('work-dialog').open,true,'successful metadata Save must not close book editor');
  assert.equal(workRevision,1);
  assert.equal(elements.get('work-fields').children[5].children[0].value,'2021');
  elements.get('work-undo-preview').onclick();await settle();
  assert.equal(elements.get('work-undo-apply').disabled,false,'signed undo preview enables explicit Apply');
  elements.get('work-undo-apply').onclick();await settle();
  assert(workCalls.some(x=>x.url.endsWith('/metadata/undo')),'undo must call durable history API');
  assert.equal(workRevision,2);
  assert.equal(workYear,'','undo must recover the original derived edition year');
  assert.equal(elements.get('work-dialog').open,true,'undo must not close book editor');
  // A late preview cannot reactivate Apply after the owner has changed the
  // proposed value in the same modal.
  const draft=elements.get('work-fields').children[5].children[0];
  draft.value='2023';draft.listeners.input();
  pauseWorkPreview=true;
  elements.get('work-preview-button').onclick();await settle();
  assert.equal(typeof releaseWorkPreview,'function','test must intercept an in-flight preview response');
  draft.value='2024';draft.listeners.input();
  releaseWorkPreview();pauseWorkPreview=false;await settle();
  assert.equal(elements.get('work-apply-button').disabled,true,
    'stale preview must never enable a signed Apply after user changes the value');

  // When a confirmed write succeeds but reloading fails, the message must
  // reflect durable server success, not falsely claim that nothing was saved.
  elements.get('work-refresh').onclick();await settle();
  assert.equal(elements.get('work-fields').children[5].children[0].value,'');
  elements.get('work-candidate-query').value='Aerial Archive';
  elements.get('work-candidate-search').onclick();await settle();
  const nextSuggestion=elements.get('work-candidates').children[0];
  nextSuggestion.children[2].children.find(button=>button.textContent==='Use Year').onclick();
  elements.get('work-preview-button').onclick();await settle();
  failNextWorkReload=true;
  elements.get('work-apply-button').onclick();await settle();
  assert.equal(workRevision,3,'server-side success must be durable despite failed refresh');
  assert.match(elements.get('work-status').textContent,/Save confirmed by server; refresh failed/,
    'UI must not label a committed mutation as rejected');
  elements.get('work-refresh').onclick();await settle();
  assert.equal(elements.get('work-fields').children[5].children[0].value,'2021',
    'owner must be able to recover a book editor after a refresh outage');
  // The book editor should also own its cover *removal*, rather than forcing
  // the administrator to leave the unified workbench to use the old card.
  // The server owns the delete and the cover is not changed until it replies.
  workCoverHash='e'.repeat(64);workFingerprint='e'.repeat(64);
  elements.get('work-refresh').onclick();await settle();
  const clearCover=elements.get('work-cover-clear');
  assert.equal(clearCover.disabled,false,'selected cover should have a functional remove control');
  clearCover.onclick();await settle();
  assert(workCalls.some(c=>c.url==='./api/manage/works/1/cover'&&c.method==='DELETE'),
    'book-level cover deletion must use owner-only server endpoint');
  assert.equal(workCoverHash,'','selected cover should disappear only after server confirmation');
  assert.equal(clearCover.disabled,true,'cover reset control must disable after deletion');

  elements.get('work-close').onclick();
  assert.equal(elements.get('work-dialog').open,false);
  assert.equal(workTitle,originalWorkTitle);

  // Comic files open a read-only issue/series audit, never an automatic rename
  // or an implicit Internet lookup. Public provider actions require BOTH
  // matching explicit issue number and series.
  const comicCard=elements.get('assist-works').children[1];
  const comicEdit=comicCard.children[2].children.find(button=>
    button.tagName==='BUTTON'&&button.textContent==='Edit book');
  assert(comicEdit,'comic books must have the same workbench access as audiobooks');
  comicEdit.onclick();await settle();
  assert.equal(elements.get('work-dialog').open,true);
  assert.equal(elements.get('work-comic-panel').hidden,false,'comic evidence panel should be visible only for comics');
  assert(calls.includes('./api/manage/works/2/comic-audit'),'comic evidence must come from indexed server catalogue');
  const comicEvidence=elements.get('work-comic-audit');
  assert(comicEvidence.children.some(node=>String(node.textContent||'').includes('The Flash · issue 12')),
    'effective series and issue should be shown as actual source evidence');
  assert(comicEvidence.children.some(node=>String(node.textContent||'').includes('Possible gaps')),
    'bounded same-year issue gap warning should be visible and explicitly qualified');
  const noPreviousExternalRequest=calls.filter(url=>url.includes('mode=multi')).length;
  elements.get('work-candidate-query').value='The Flash #12';
  elements.get('work-candidate-search').onclick();await settle();
  const comicQuery=calls.find(url=>url.includes('mode=multi')&&url.includes('format=comic'));
  assert(comicQuery&&comicQuery.includes('series=The+Flash')&&comicQuery.includes('issue=12'),
    'explicit comic comparison must include indexed series and issue identity');
  assert.equal(calls.filter(url=>url.includes('mode=multi')).length,noPreviousExternalRequest+1,
    'no provider query may be triggered by opening a comic book');
  const comicCandidates=elements.get('work-candidates').children;
  assert.equal(comicCandidates.length,2);
  assert(comicCandidates[0].children[2].children.some(button=>button.textContent==='Use Publisher'),
    'exact issue plus series can be manually selected for signed work preview');
  assert.equal(comicCandidates[1].children[2].children.length,0,
    'mismatched comic issue must not offer ANY provider field selections');
  assert.equal(elements.get('work-apply-button').disabled,true,
    'rendering comic candidates must not change or save book metadata');

  // Independent edition identity uses a persistent revision and guarded
  // owner preview; no regrouping, file rename or automatic publishing.
  assert(editionCalls.some(x=>x.url==='./api/manage/works/2/comic-editions'),
    'the existing comic edition labels must be read from the server');
  assert.equal(transferCalls.length,0,'opening a comic must never inspect or transfer it automatically');
  elements.get('comic-transfer-target').value='1';
  elements.get('comic-transfer-target').listeners.input();
  elements.get('comic-transfer-inspect').onclick();await settle();
  assert.equal(transferCalls.length,1,'owner clicking Inspect must invoke the read-only preflight');
  assert.match(elements.get('comic-transfer-status').textContent,/1 blockers found/);
  assert(elements.get('comic-transfer-findings').children.some(row=>
    String(row.children[0]?.textContent||'').includes('source-empty')),
    'preflight must show the specific blocking identity problem');
  assert.equal(elements.has('comic-transfer-apply'),false,
    'no editable/apply control should be invented before a proven safe transaction');
  pauseTransfer=true;
  elements.get('comic-transfer-inspect').onclick();await settle();
  assert.equal(typeof releaseTransfer,'function','preflight must support an in-flight request');
  elements.get('comic-transfer-target').value='3';
  elements.get('comic-transfer-target').listeners.input();
  releaseTransfer();await settle();pauseTransfer=false;releaseTransfer=null;
  assert.equal(elements.get('comic-transfer-findings').children.length,0,
    'late transfer inspection cannot overwrite a newer destination');
  assert.match(elements.get('comic-transfer-status').textContent,/Destination changed/);
  assert.equal(elements.get('comic-profile-edition').value,'20');
  const editionInputs=elements.get('comic-profile-fields').children;
  assert.equal(editionInputs.length,7,'comic edition run/volume/issue/variant/imprint/year/notes are editable');
  const runInput=editionInputs[0].children[0],volumeInput=editionInputs[1].children[0];
  assert.equal(elements.get('comic-profile-preview').disabled,false);
  runInput.value='1971 volume run';
  runInput.listeners.input();
  volumeInput.value='2';
  volumeInput.listeners.input();
  assert.equal(elements.get('comic-profile-apply').disabled,true,'changed values must require signed preview');
  elements.get('comic-profile-preview').onclick();await settle();
  assert(editionCalls.some(x=>x.url.endsWith('/comic-editions/20/preview')),
    'edition-level preview must hit the dedicated signed endpoint');
  assert.equal(elements.get('comic-profile-apply').disabled,false,'valid signed plan enables manual confirmation');
  assert.equal(elements.get('comic-profile-diff').children.length,2,'only two edited labels should be previewed');
  const auditCallsBeforeEditionSave=calls.filter(url=>url==='./api/manage/works/2/comic-audit').length;
  elements.get('comic-profile-apply').onclick();await settle();
  assert(calls.filter(url=>url==='./api/manage/works/2/comic-audit').length>auditCallsBeforeEditionSave,
    'saving a run or volume must refresh the indexed issue-gap audit');
  assert.equal(editionRev,1,'confirmed Save should advance the per-edition revision');
  assert.equal(editionFields.run,'1971 volume run');
  assert.equal(editionFields.volume,'2');
  assert.equal(elements.get('work-dialog').open,true,'saving edition identity must leave book editor open');
  assert.equal(elements.get('comic-profile-fields').children[0].children[0].value,'1971 volume run');
  assert.equal(elements.get('work-fields').children[2].children[0].value,'The Flash',
    'edition labels must not overwrite the existing comic work-level series');
  assert.equal(elements.get('comic-profile-undo-preview').disabled,false);
  elements.get('comic-profile-undo-preview').onclick();await settle();
  assert.equal(elements.get('comic-profile-undo').disabled,false,'last Save undo requires preview');
  const auditCallsBeforeEditionUndo=calls.filter(url=>url==='./api/manage/works/2/comic-audit').length;
  elements.get('comic-profile-undo').onclick();await settle();
  assert(calls.filter(url=>url==='./api/manage/works/2/comic-audit').length>auditCallsBeforeEditionUndo,
    'undo must refresh volume-aware issue-gap analysis');
  assert.equal(editionRev,2,'undo creates a new monotonic edition revision');
  assert.equal(editionFields.run,'');
  assert.equal(editionFields.volume,'');
  assert.equal(elements.get('comic-profile-fields').children[0].children[0].value,'',
    'editor must refresh after confirmed undo');
  elements.get('work-close').onclick();

  const health=nav.find(item=>item.dataset.view==='health');
  health.onclick();
  await settle();
  const list=elements.get('jobs-health');
  assert.equal(list.children.length,3,'server manager must show the three persisted scan states');
  const sourceCards=elements.get('source-health').children;
  const scanAction=sourceCards.flatMap(node=>node.children||[]).find(node=>node.tagName==='BUTTON'&&
    node.textContent==='Scan / refresh source');
  assert(scanAction,'scanner view must expose a real source-level scan action');
  assert.equal(scanAction.disabled,true,'a source with queued/running jobs must not permit a duplicate scan');
  const buttons=(row)=>row.children.filter(x=>x.tagName==='BUTTON');
  const failed=list.children[0];
  const queued=list.children[1];
  const running=list.children[2];
  assert.equal(buttons(failed)[0]?.textContent,'Retry scan','failed jobs need a real retry control');
  assert.equal(buttons(queued)[0]?.textContent,'Cancel queued scan','queued jobs need safe cancellation');
  assert.equal(buttons(running).length,0,'running jobs must not expose an unsafe cancel button');
  buttons(queued)[0].onclick();
  await settle();
  assert(calls.includes('./api/jobs/1/cancel'),'cancel action must reach the server');
  const retryRow=elements.get('jobs-health').children.find(item=>
    item.children[0]?.textContent==='Source 1 · failed');
  assert(retryRow,'failed row must remain accessible after cancelling queued work');
  buttons(retryRow)[0].onclick();
  await settle();
  assert(calls.includes('./api/jobs/2/retry'),'retry action must reach the server');
  assert(elements.get('jobs-health').children.some(item=>
    item.children[0]?.textContent==='Source 1 · queued'),'new queued retry must be shown on the workbench');
  const coverage=elements.get('scanner-coverage');
  assert.equal(coverage.children.length,6,'scanner health must offer six meaningful coverage categories');
  const genre=coverage.children.find(item=>item.children[1]?.textContent==='Missing genre');
  assert(genre,'Atlas genre coverage must be an actionable review category');
  assert.equal(genre.children[0].textContent,'2','coverage must display actual stored file counts');
  genre.onclick();
  await settle();
  assert.equal(elements.get('metadata-gap').value,'genre','genre gap selection must be preserved in the library filter');
  assert.equal(elements.get('view-library').hidden,false,'review action must navigate to the actual library table');
  assert(calls.some(url=>url.startsWith('./api/books?')&&url.includes('metadataGap=genre')),
    'genre coverage must request real server-side filtered catalogue rows');
  assert.equal(elements.get('scanner-coverage-note').textContent,'Read-only scanner metadata coverage');

  // The server operations pages must use real admin APIs, never static mock
  // "all green" badges. Nothing triggers a SQLite quick check on navigation.
  const overview=nav.find(item=>item.dataset.view==='overview');
  const recovery=nav.find(item=>item.dataset.view==='recovery');
  assert(overview&&recovery,'Overview and Recovery must be reachable in admin navigation');
  assert.equal(calls.filter(url=>url==='./api/manage/operations/integrity').length,0,
    'integrity checking must never run on page load');
  overview.onclick();await settle();
  assert.equal(elements.get('view-overview').hidden,false);
  assert.equal(elements.get('view-library').hidden,true);
  assert.equal(elements.get('view-health').hidden,true);
  assert(calls.includes('./api/manage/operations'),'Overview must load an owner-only operations snapshot');
  assert(elements.get('overview-collection').children.some(item=>item.children[0].textContent==='Logical works'&&
    item.children[1].textContent==='85'),'Overview counts actual logical books');
  assert.match(elements.get('overview-note').textContent,/not a physical NAS probe/);
  assert.equal(calls.filter(url=>url==='./api/manage/operations/integrity').length,0,
    'overview navigation must not trigger an integrity check');

  elements.get('overview-recovery').onclick();await settle();
  assert.equal(elements.get('view-recovery').hidden,false);
  assert(elements.get('recovery-backup').children.some(item=>
    item.children[0].textContent==='Verified restore upload pending'&&
    item.children[1].textContent.includes('Marker present')),
    'pending restore marker must be surfaced without claiming a successful recovery');
  assert.equal(calls.filter(url=>url==='./api/manage/operations/integrity').length,0,
    'navigating to Recovery must never execute an implicit SQLite integrity check');
  elements.get('recovery-integrity').onclick();await settle();
  assert(calls.includes('./api/manage/operations/integrity'),
    'only an explicit action may execute SQLite quick_check');
  assert.match(elements.get('recovery-integrity-result').textContent,/SQLite quick check: OK/);
  assert.match(elements.get('recovery-integrity-result').textContent,/NAS and recovery remain unverified/);
  assert(elements.get('recovery-warnings').children.some(item=>
    String(item.textContent||'').includes('staged restore')),
    'recovery panel must show specific risk flags');

  elements.get('recovery-scanner').onclick();await settle();
  assert.equal(elements.get('view-health').hidden,false,
    'recovery page must link back to actionable scanner/source diagnostics');
  console.log('PASS: Assist, scanner, source diagnostics and owner-only Overview/Recovery');
})().catch(error=>{console.error(error);process.exitCode=1});
