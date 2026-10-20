const assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createAssistSearchService}=require('./assistMetadata/service.ts');
const {selectAutomatic}=require('./assistMetadata/core.ts');
(async()=>{
 const candidate={id:'B089M9XZW5',provider:'audible-uk',relatedMatch:true,identifiers:['B089M9XZW5'],fields:{title:'From the Oasthouse: The Alan Partridge Podcast (Series 1)',author:'Alan Partridge',description:'Catalogue description',publishedYear:'2020'}};
 const fields={title:'From the Oasthouse',author:'Steve Coogan'};
 const service=createAssistSearchService([{id:'audible-uk',search:async()=>({candidates:[candidate],nextPage:null})}],{load:async()=>null,save:async()=>{}});
 const result=await service.search({fields},{online:true,automatic:false,explicit:true});
 assert.equal(result.state,'review');assert.equal(result.candidates.length,1,'Author conflict must not erase a relevant title from manual review');
 assert(result.candidates[0].conflicts.includes('author'));assert.equal(result.candidates[0].automaticEligible,false);
 assert.equal(selectAutomatic({fields},[candidate]),null,'Never automatically replace the user identity with a conflicting catalogue record');
 console.log('PASS: relevant author-conflicting editions remain reviewable, never automatic');
})().catch(e=>{console.error(e);process.exit(1)});
