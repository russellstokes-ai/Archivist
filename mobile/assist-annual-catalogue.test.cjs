const assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),Module=require('module');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const calls=[];const original=Module._load;
Module._load=function(id,...args){if(id==='expo/fetch')return {fetch:()=>{throw Error('unexpected network')}};if(id==='../onlineComicMetadata')return {lookupOnlineComic:async input=>{calls.push(input);return {status:'none',candidates:calls.length===1?[]:[{providerId:'1',fields:{title:'2000 AD Annual 1978',comicIssueNumber:'1',publishedYear:1977}}]};}};return original.call(this,id,...args)};
const {createAssistProviders}=require('./assistMetadata/providers.native.ts');Module._load=original;
const core=require('./assistMetadata/core.ts');
(async()=>{
 const provider=createAssistProviders({books:{enabled:false},comics:{enabled:true,metron:true}},undefined,'test-token').find(p=>p.id==='metron');
 const result=await provider.search({title:'2000 AD Annual 1978'},0);
 assert.equal(calls.length,2,'An empty issue-year lookup must retry by series');
 assert.equal(calls[0].comicIssueNumber,'1978');assert.equal(calls[1].comicIssueNumber,undefined);assert.equal(calls[1].publishedYear,undefined);
 assert.equal(result.candidates[0].fields.seriesNumber,'1');assert.equal(result.candidates[0].fields.publishedYear,'1977');
 const ranked=core.rankAssistCandidates({title:'2000 AD Annual 1978'},[{id:'wrong',provider:'test',identifiers:[],fields:{title:'2000 AD Annual 1979'}},{id:'right',provider:'test',identifiers:[],fields:{title:'2000 AD Annual 1978',publishedYear:'1977'}}]);
 assert.equal(ranked[0].candidate.id,'right');assert(ranked[1].conflicts.includes('annual-label'));assert(!ranked[0].conflicts.includes('annual-label'));
 console.log('PASS: annual cover labels do not assume issue numbering or publication year, and other annuals conflict');
})().catch(e=>{console.error(e);process.exitCode=1});
