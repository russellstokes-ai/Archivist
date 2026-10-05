const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');

function loadWithFetch(fetchImpl){
  const source=fs.readFileSync(__dirname+'/metadataLookup.ts','utf8');
  const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  let timerId=0;
  const fastSetTimeout=(fn,ms)=>{
    const id=++timerId;
    if(ms<2000)Promise.resolve().then(fn);
    return id;
  };
  vm.runInNewContext('(function(require,module,exports){'+out+'\n})(require,module,module.exports)',{
    require,module:mod,exports:mod.exports,
    fetch:fetchImpl,
    AbortController,
    URLSearchParams,
    setTimeout:fastSetTimeout,
    clearTimeout:()=>{},
    Promise,Error,TypeError,
  });
  return mod.exports;
}

(async()=>{
  let calls=0;
  const retrying=loadWithFetch(async()=>{
    calls++;
    if(calls===1)return {
      ok:false,status:503,
      headers:{get:()=>null},
      async json(){return {};},
    };
    return {
      ok:true,status:200,
      headers:{get:()=>null},
      async json(){return {docs:[{key:'/works/OL1W',title:'Dune',author_name:['Frank Herbert'],cover_i:123,first_publish_year:1965}]};},
    };
  });
  const results=await retrying.lookupOpenLibrary({title:'Dune',author:'Frank Herbert'});
  assert.equal(calls,2,'transient 5xx metadata failures should receive one controlled retry');
  assert.equal(results.length,1);
  assert.equal(results[0].title,'Dune');

  let hardCalls=0;
  const hardFailure=loadWithFetch(async()=>{
    hardCalls++;
    return {ok:false,status:400,headers:{get:()=>null},async json(){return {};}};
  });
  await assert.rejects(
    hardFailure.lookupOpenLibrary({title:'Dune',author:'Frank Herbert'}),
    /returned 400/,
  );
  assert.equal(hardCalls,1,'non-transient provider failures must not be retried');

  const source=fs.readFileSync(__dirname+'/metadataLookup.ts','utf8');
  assert(source.includes('new AbortController()'),'metadata provider requests must retain abort timeouts');
  assert(source.includes('response.status===429||response.status>=500'),'only rate-limit/server failures should use status-based retry');
  assert(source.includes('attempt<2'),'provider retry count must remain bounded');

  console.log('PASS: metadata provider requests use bounded timeout/retry behavior');
})().catch(error=>{console.error(error);process.exitCode=1});
