const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {enrichLocalBookMetadataOnline}=require('./localLibrary.ts');

function base(extra={}){
  return {
    id:1,uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune.epub',
    title:'Dune',author:'Frank Herbert',series:'',genre:'',format:'EPUB',space:'Books',
    available:true,coverShape:'portrait',needsReview:false,
    metadataProvenance:{title:'path',author:'path'},
    metadataFieldConfidence:{title:'high',author:'high'},
    ...extra,
  };
}

(async()=>{
  const resolved=base({coverUri:'file:///covers/dune.jpg'});
  let calls=0;
  const noLookup=await enrichLocalBookMetadataOnline([resolved],{
    cache:{},
    openLibraryEnabled:true,
    concurrency:4,
    onBatch:()=>{},
    // no fetcher should ever be needed for a publish-ready identity+cover
  });
  assert.equal(noLookup.attempted,0,'publish-ready book must skip optional online enrichment');

  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>{
    calls++;
    return {ok:true,status:200,json:async()=>({docs:[
      {key:'/works/a',title:'Dune',author_name:['Frank Herbert'],cover_i:1,isbn:['9780441172719']},
      {key:'/works/b',title:'Dune',author_name:['Frank Herbert'],cover_i:2,isbn:['9780000000002']},
    ]})};
  };
  try{
    const missingCover=base({coverUri:undefined});
    const result=await enrichLocalBookMetadataOnline([missingCover],{
      cache:{},openLibraryEnabled:true,applyHighConfidence:true,concurrency:4,
    });
    assert.equal(result.attempted,1);
    assert.equal(result.matched,1,'obvious title+author must auto-accept despite similar editions');
    assert.equal(result.books[0].needsReview,false);
    assert.ok(result.books[0].onlineMetadataMatch?.coverUri,'obvious match should provide artwork');
    assert.ok(calls<=1,'normal lookup should stop after one precise query for an obvious work');
  } finally {
    globalThis.fetch=originalFetch;
  }

  console.log('PASS: fast scanner skips optional enrichment, preserves resolved identity and uses one precise lookup for obvious books');
})().catch(error=>{console.error(error);process.exit(1)});
