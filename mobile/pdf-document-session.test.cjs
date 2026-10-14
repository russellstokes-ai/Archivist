const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

const source=fs.readFileSync(path.join(__dirname,'pdfDocumentSession.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
}}).outputText;
const exports={};
vm.runInNewContext(code,{exports,module:{exports},Number,String,Math});
const {openPdfSession,pdfSessionReducer,visiblePdfImage,safePdfPage}=exports;
const reduce=(s,a)=>pdfSessionReducer(s,a);
const image=(uri,page,width,request,dataUri='data:image/png;base64,AQID')=>({
  type:'render-success',uri,generation:1,page,width,request,dataUri,
});

let a=openPdfSession('content://library/old.pdf',5,1);
assert.equal(a.page,5);
assert.equal(a.count,0);
assert.equal(a.image,null);
assert.equal(a.loading,true);
a=reduce(a,{type:'count',uri:a.uri,generation:1,total:12});
assert.equal(a.page,5,'restore document-specific saved page, not zero');
a=reduce(a,{type:'render-start',uri:a.uri,generation:1,page:5,request:1});
a=reduce(a,image(a.uri,5,720,1));
assert.equal(visiblePdfImage(a,a.uri,5,720),'data:image/png;base64,AQID');
assert.equal(visiblePdfImage(a,'content://library/new.pdf',5,720),'','a different document cannot show old image');
assert.equal(visiblePdfImage(a,a.uri,5,800),'','a resized Fold viewport cannot show stale-size render');
assert.equal(visiblePdfImage(a,a.uri,0,720),'','a different page cannot show old image');

// Switching URI must reset count, saved page and image atomically.
const old=a;
a=reduce(a,{type:'open',uri:'content://library/new.pdf',initialPage:2,generation:2});
assert.equal(a.uri,'content://library/new.pdf');
assert.equal(a.page,2);
assert.equal(a.count,0);
assert.equal(a.image,null);
assert.equal(a.loading,true);
assert.equal(a.error,'');
a=reduce(a,{type:'count',uri:old.uri,generation:1,total:500});
assert.equal(a.count,0,'late prior-document count must not poison new document');
a=reduce(a,image(old.uri,5,720,1));
assert.equal(a.image,null,'late prior-document rendering must not display');
a=reduce(a,{type:'count',uri:a.uri,generation:2,total:4});
assert.equal(a.page,2,'new document restores its own saved page');
a=reduce(a,{type:'render-start',uri:a.uri,generation:2,page:2,request:2});
a=reduce(a,{...image(a.uri,2,720,2),generation:2});
assert.equal(visiblePdfImage(a,a.uri,2,720),'data:image/png;base64,AQID');
a=reduce(a,{type:'page',uri:a.uri,generation:2,page:3});
assert.equal(a.page,3);
assert.equal(a.image,null,'page changes must clear previous page before rendering');
a=reduce(a,{...image(a.uri,2,720,2),generation:2});
assert.equal(a.image,null,'late render for previous page must be dropped');
a=reduce(a,{type:'render-start',uri:a.uri,generation:2,page:3,request:3});
a=reduce(a,{...image(a.uri,3,720,2),generation:2});
assert.equal(a.image,null,'stale render request ID must be ignored');
a=reduce(a,{...image(a.uri,3,720,3),generation:2});
assert.equal(visiblePdfImage(a,a.uri,3,720),'data:image/png;base64,AQID');

// Forward/back controls must clamp; bad metadata should show an error.
a=reduce(a,{type:'page',uri:a.uri,generation:2,page:999});
assert.equal(a.page,3);
a=reduce(a,{type:'page',uri:a.uri,generation:2,page:-300});
assert.equal(a.page,0);
a=reduce(a,{type:'count',uri:a.uri,generation:2,total:2});
assert.equal(a.page,0);
a=reduce(a,{type:'count-error',uri:a.uri,generation:2,message:'Permission denied'});
assert.equal(a.error,'Permission denied');
assert.equal(a.image,null);
assert.equal(a.loading,false);
a=reduce(a,{type:'open',uri:'content://library/empty.pdf',initialPage:999,generation:3});
a=reduce(a,{type:'count',uri:a.uri,generation:3,total:0});
assert.match(a.error,/no readable pages/i);
assert.equal(a.loading,false);
assert.equal(a.image,null);
a=reduce(a,{type:'count',uri:a.uri,generation:3,total:3});
assert.equal(a.page,2,'out-of-range saved page must clamp to the new document');
a=reduce(a,{type:'render-start',uri:a.uri,generation:3,page:2,request:10});
a=reduce(a,{type:'render-success',uri:a.uri,generation:3,page:2,request:10,
  width:720,dataUri:'data:image/png;base64,'});
assert.equal(a.image,null,'native empty image must not produce a blank cover');
assert.match(a.error,/Unable to render/);
for(const [input,expect] of [[NaN,0],[Infinity,0],[-15,0],[2.9,2]]){
  assert.equal(safePdfPage(input),expect);
}

// Check the actual mobile reader consumes the document state machine while
// retaining the original reader controls/animation/view dimensions.
const reader=fs.readFileSync(path.join(__dirname,'LocalPdfReader.tsx'),'utf8');
for(const required of [
  'openPdfSession(uri,initialPage',
  'pdfSessionReducer(s,',
  'visiblePdfImage(active,uri,page,renderWidth)',
  'renderSeq.current!==request',
  'latest.current.uri!==uri',
  'appliedRequest.current=requestSignature',
  'Previous PDF page','Next PDF page','Rendering PDF page',
  "transform:[{perspective:1200}",
  "minHeight:58,borderTopWidth:1",
  'duration:120,useNativeDriver:true',
]){
 assert(reader.includes(required),'PDF reader source contract missing: '+required);
}
assert(!reader.includes('setImage('),'Do not retain unkeyed image state');
assert(!reader.includes('setPage(current=>Math.min(current,'),
  'Do not reuse the previous document page when a new PDF opens');
console.log('PASS: PDF switch/restart, stale native results, saved positions, clamping, errors and canonical reader presentation');
