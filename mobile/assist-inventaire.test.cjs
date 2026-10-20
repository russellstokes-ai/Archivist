const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createInventaireProvider}=require('./assistMetadata/inventaire.ts');
(async()=>{
 const calls=[];
 const p=createInventaireProvider(async url=>{calls.push(url);const ids=new URL(url).searchParams.get('uris');
  if(ids.startsWith('isbn:'))return {entities:{a:{uri:'inv:'+'a'.repeat(32),type:'edition',labels:{fromclaims:'I, Robot'},claims:{'wdt:P212':['9780007532278'],'wdt:P629':['wd:Q1']},image:{url:'/img/entities/abcdef'}}}};
  if(ids==='wd:Q1')return {entities:{'wd:Q1':{type:'work',claims:{'wdt:P50':['wd:Q2'],'wdt:P136':['wd:Q3']}}}};
  return {entities:{'wd:Q2':{labels:{en:'Isaac Asimov'}},'wd:Q3':{labels:{en:'science fiction'}}}};
 });
 const result=await p.search({isbn:'9780007532278'},0);
 assert.equal(result.candidates[0].fields.author,'Isaac Asimov');assert.equal(result.candidates[0].fields.genre,'Science Fiction');
 assert.equal(result.candidates[0].fields.coverUrl,'https://inventaire.io/img/entities/abcdef');assert.equal(result.candidates[0].relatedMatch,true);
 assert.equal(calls.length,3);assert.deepEqual(await p.search({asin:'B012345678'},0),{candidates:[],nextPage:null});
 console.log('PASS: ISBN edition resolves linked Wikidata author and genre without guessing');
})().catch(e=>{console.error(e);process.exitCode=1});
