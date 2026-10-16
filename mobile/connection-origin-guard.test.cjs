const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

// This is not a UI change. The server session can be rehydrated from persisted
// state; request() must validate it again, before attaching a bearer token.
const source=fs.readFileSync(path.join(__dirname,'connection.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleExports={};
const captured=[];
const fakeFetch=async (url,options)=>{
  captured.push({url,headers:options.headers});
  return {ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({ok:true})};
};
vm.runInNewContext(js,{
  exports:moduleExports,module:{exports:moduleExports},
  fetch:fakeFetch,URL,AbortController,setTimeout,clearTimeout,Error
},{filename:'connection.ts'});
const {request}=moduleExports;
(async()=>{
  const token='sensitive-bearer-from-rehydrated-session';
  // Malicious/stale origins can bypass the UI's add-server validation unless
  // every request checks the persisted origin before attaching credentials.
  for(const unsafe of [
    {server:'https://legit.example.com@evil.example.com',path:'/api/books'},
    {server:'http://evil.example.com',path:'/api/books'},
    {server:'https://books.example.com/redirect',path:'/api/books'},
    {server:'https://books.example.com',path:'/api/../logout'},
    {server:'https://books.example.com',path:'/api/%2e%2e/logout'},
  ]){
    const n=captured.length;
    await assert.rejects(()=>request({server:unsafe.server,token},unsafe.path));
    assert.equal(captured.length,n,'Bearer token sent to an unvalidated or normalized endpoint: '+JSON.stringify(unsafe));
  }
  await request({server:'https://books.example.com',token},'/api/books?space=Audio');
  await request({server:'http://100.100.10.5:5056',token},'/api/books');
  assert.deepEqual(captured.map(x=>x.url),[
    'https://books.example.com/api/books?space=Audio',
    'http://100.100.10.5:5056/api/books'
  ]);
  assert(captured.every(x=>x.headers.Authorization==='Bearer '+token));
  console.log('PASS: rehydrated session origins and API paths validate before bearer authentication, while HTTPS and private LAN remain supported');
})().catch(err=>{console.error(err);process.exitCode=1});
