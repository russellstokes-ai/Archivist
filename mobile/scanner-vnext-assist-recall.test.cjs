const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {rankCandidates}=require('./scannerVNext/search.ts'),{createBookProviders}=require('./scannerVNext/providers.ts');
(async()=>{
 const c=(id,title,extra={})=>({id,provider:'open-library',identifiers:[],fields:{title,author:'Fixture Writer',...extra}});
 const rows=rankCandidates({title:'The Master of Mankind',author:'Fixture Writer'},[c('a','The Master of Mankind',{publishedYear:'2017'}),c('b','The Master of Mankind (41) (The Horus Heresy)',{genre:'Science Fiction',publishedYear:'2018'})]);
 assert.equal(rows.find(r=>r.candidate.id==='a').candidate.fields.genre,'Science Fiction');assert.equal(rows.find(r=>r.candidate.id==='a').candidate.fields.publishedYear,'2017');
 const partial=rankCandidates({title:'Outgunned'},[c('p','Outgunned: A Novel')])[0];assert(partial.score>0);assert(!partial.automaticEligible);
 assert.equal(rankCandidates({title:'The Hobbit'},[c('z','The Hobbit'),c('a','The Hobbit')])[0].candidate.id,'z','Equal scores preserve provider relevance instead of sorting arbitrary IDs');
 const provider=createBookProviders({openLibrary:true,googleBooks:false},async()=>({docs:[{key:'/works/OL12W',title:'Fixture',subject:['Fiction, science fiction, general']}],numFound:1}))[0];
 assert.equal((await provider.search({title:'Fixture'},0)).candidates[0].fields.genre,'Science Fiction');
 console.log('PASS: subtitle recall, compatible-edition genre completion, selected year retained, comma subject mapping');
})().catch(e=>{console.error(e);process.exitCode=1;});
