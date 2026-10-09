const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createBookProviders,readBoundedJson}=require('./scannerVNext/providers.ts');const {RequestQueue,ProviderRequestError}=require('./scannerVNext/search.ts');
(async()=>{
 const urls=[];let now=0;const queue=new RequestQueue({now:()=>now,sleep:async ms=>{now+=ms;}});
 const request=async(url,signal)=>{urls.push(url);return url.includes('openlibrary')?{docs:[{key:'/works/OL123W',title:'Generated Novel',author_name:['Fixture Writer'],cover_i:2,isbn:['9780000000002'],subject:['Science Fiction']}],numFound:21}:{items:[{id:'fixture',volumeInfo:{title:'Generated Novel',authors:['Fixture Writer'],categories:['Fiction / Science Fiction'],imageLinks:{thumbnail:'http://books.google.com/generated.jpg'},industryIdentifiers:[{identifier:'9780000000002'}]}}],totalItems:21};};
 const providers=createBookProviders({openLibrary:true,googleBooks:true,googleKey:'test-key'},request,queue);
 const ol=await providers[0].search({title:'Generated Novel',author:'Fixture Writer',series:'Fixture Saga'},0);assert.equal(ol.candidates[0].provider,'open-library');assert.match(ol.candidates[0].fields.coverUrl,/^https:/);assert.equal(ol.nextPage,1);assert.ok(urls[0].includes('limit=20'));
 const google=await providers[1].search({title:'Generated Novel'},1);assert.equal(google.nextPage,null);assert.ok(urls[1].includes('startIndex=20'));assert.match(google.candidates[0].fields.coverUrl,/^https:/);assert.equal(google.candidates[0].identifiers[0],'9780000000002');
 assert.equal(createBookProviders({openLibrary:true,googleBooks:true},request,queue)[1].available,false);
 let cancelled=0;const body={getReader(){let emitted=false;return {async read(){if(emitted)return {done:true};emitted=true;return {done:false,value:new Uint8Array(1048577)};},async cancel(){cancelled++;},releaseLock(){}};}};
 await assert.rejects(()=>readBoundedJson({ok:true,status:200,headers:{get(){return null;}},body}),/budget/);assert.equal(cancelled,1);
 await assert.rejects(()=>readBoundedJson({ok:false,status:429,headers:{get(name){return name==='Retry-After'?'2':null;}},body:null}),e=>e instanceof ProviderRequestError&&e.retryAfterMs>=2000);
 const rate=new RequestQueue();await assert.rejects(()=>rate.run('open-library',async()=>{throw new ProviderRequestError(429,5000);}),/429/);let called=false;await assert.rejects(()=>rate.run('open-library',async()=>{called=true;}),/paused/);assert.equal(called,false);
 console.log('PASS: complementary provider mapping, secure cover URLs, result paging, optional credentials, bounded streaming and Retry-After');
})().catch(e=>{console.error(e);process.exitCode=1;});
