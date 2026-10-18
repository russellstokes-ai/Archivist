const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createAudibleProvider}=require('./assistMetadata/audible.ts');
const {rankAssistCandidates}=require('./assistMetadata/core.ts');
(async()=>{
 let requested;const provider=createAudibleProvider(async url=>{requested=new URL(url);return {products:[{asin:'B089M9XZW5',title:'From the Oasthouse: The Alan Partridge Podcast (Series 1)',authors:[{name:'Alan Partridge'}],narrators:[{name:'Alan Partridge'}],publisher_name:'Audible Originals',release_date:'2020-09-03',language:'english',publisher_summary:'<p>Catalogue summary</p>',product_images:{'500':'https://m.media-amazon.com/images/I/example.jpg'}},{asin:'bad',title:'Invalid'}],total_results:1}});
 const result=await provider.search({title:'From the Oasthouse'},0);
 assert.equal(requested.hostname,'api.audible.co.uk');assert.equal(requested.searchParams.get('keywords'),'From the Oasthouse');assert.equal(result.candidates.length,1);
 const c=result.candidates[0];assert.equal(c.fields.narrator,'Alan Partridge');assert.equal(c.fields.publishedYear,'2020');assert.equal(c.fields.description,'Catalogue summary');
 assert.equal(rankAssistCandidates({title:c.fields.title,author:c.fields.author},[c])[0].automaticEligible,false,'Audio editions must not automatically replace print metadata');
 await provider.search({asin:'B089M9XZW5'},0);assert.equal(requested.searchParams.get('asins'),'B089M9XZW5');
 assert.deepEqual(await provider.search({isbn:'9780306406157'},0),{candidates:[],nextPage:null});
 console.log('PASS: Audible catalogue parsing, ASIN search, edition review and no ISBN guessing');
})().catch(e=>{console.error(e);process.exitCode=1});
