'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
let started,calls=0;
const ready=new Promise(resolve=>started=resolve);
const fetcher=async(url,{signal})=>{
 if(++calls===1){started();return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));}
 assert.equal(new URL(url).searchParams.get('title'),'New title');
 return new Response(JSON.stringify({docs:[{key:'/works/OL1W',title:'New title',author_name:['Writer']}],numFound:1}),{status:200});
};
const original=Module._load;
Module._load=function(id,...args){return id==='expo/fetch'?{fetch:fetcher}:original.call(this,id,...args);};
const {createAssistProviders}=require('./assistMetadata/providers.native.ts');Module._load=original;
(async()=>{
 const provider=createAssistProviders({books:{enabled:true,openLibrary:true,googleBooks:false},comics:{enabled:false,metron:false}})[0];
 const abort=new AbortController();
 const first=provider.search({title:'Old title'},0,abort.signal);const rejected=assert.rejects(first,/cancel|abort/i);
 await ready;abort.abort();await rejected;
 const next=await provider.search({title:'New title'},0);
 assert.equal(next.candidates[0].fields.title,'New title');assert.equal(calls,2);
 console.log('PASS: cancelling an actual Assist provider request does not disable subsequent clue searches');
})().catch(e=>{console.error(e);process.exitCode=1});
