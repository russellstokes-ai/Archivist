const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createGcdProvider}=require('./assistMetadata/gcd.ts');
(async()=>{
 const calls=[];const p=createGcdProvider(async url=>{calls.push(url);if(url.includes('/series/name/'))return {results:[{api_url:'https://www.comics.org/api/issue/123/',descriptor:'2000 AD Annual 1978'}],next:null};return {api_url:url,series_name:'2000 AD Annual',number:'1978',key_date:'1977-09-01',cover:'https://files1.comics.org/img/gcd/covers_by_id/1/w400/123.jpg',story_set:[{type:'comic story',script:'Pat Mills',genre:'science fiction'}]};});
 const r=await p.search({title:'2000 AD Annual 1978'},0);
 assert(calls[0].includes('/2000%20AD%20Annual/issue/1978/'));assert.equal(r.candidates[0].fields.genre,'Science Fiction');assert.equal(r.candidates[0].fields.author,'Pat Mills');assert.equal(r.candidates[0].fields.publishedYear,'1977');assert.equal(r.candidates[0].fields.seriesNumber,'1978');assert(r.candidates[0].relatedMatch);
 await p.search({title:'2000 AD Annual 1978'},0);assert.equal(calls.length,2,'Repeated query must use cached catalogue data');
 assert.equal((await p.search({title:'From the Oasthouse'},0)).candidates.length,0);
 let count=0;const limited=createGcdProvider(async()=>{count++;throw Object.assign(Error('limited'),{status:429,retryAfterMs:60000});});
 await assert.rejects(limited.search({title:'Batman #12'},0));await assert.rejects(limited.search({title:'Batman #13'},0));assert.equal(count,1,'Back off rather than repeatedly calling a rate-limited API');
 const hostile=createGcdProvider(async()=>({results:[{api_url:'https://evil.example/issue/1'}]}));assert.equal((await hostile.search({title:'Batman #12'},0)).candidates.length,0);
 const publisherOnly=createGcdProvider(async url=>url.includes('/series/name/')?{results:[{api_url:'https://www.comics.org/api/issue/99/'}]}:url.includes('/issue/')?{api_url:url,series_name:'Example',number:'1',series:'https://www.comics.org/api/series/5/',story_set:[]}:url.includes('/series/')?{publisher:'https://www.comics.org/api/publisher/7/'}:{name:'IPC'});
 const publisherResult=await publisherOnly.search({title:'Example #1'},0);assert.equal(publisherResult.candidates[0].fields.publisher,'IPC');assert.equal(publisherResult.candidates[0].fields.author,undefined);
 console.log('PASS: no-key GCD annual lookup, metadata, cache, rate-limit backoff and endpoint validation');
})().catch(e=>{console.error(e);process.exitCode=1});
