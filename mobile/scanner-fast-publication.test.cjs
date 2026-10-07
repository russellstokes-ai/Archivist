const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {lookupOnlineBook,shouldLookupBookOnline}=require('./onlineBookMetadata.ts');

function base(extra={}){
  return {
    uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune.epub',
    title:'Dune',author:'Frank Herbert',series:'',genre:'',format:'EPUB',
    needsReview:false,
    metadataProvenance:{title:'path',author:'path'},
    metadataFieldConfidence:{title:'high',author:'high'},
    ...extra,
  };
}

assert.equal(
  shouldLookupBookOnline(base({coverUri:'file:///covers/dune.jpg'})),
  false,
  'publish-ready identity+cover must skip optional online enrichment'
);
assert.equal(
  shouldLookupBookOnline(base({coverUri:undefined})),
  true,
  'missing publication cover should trigger a normal lookup'
);

(async()=>{
  let calls=0;
  const fetcher=async url=>{
    calls++;
    return {ok:true,status:200,json:async()=>({docs:[
      {key:'/works/a',title:'Dune',author_name:['Frank Herbert'],cover_i:1,isbn:['9780441172719']},
      {key:'/works/b',title:'Dune',author_name:['Frank Herbert'],cover_i:2,isbn:['9780000000002']},
    ]})};
  };
  const result=await lookupOnlineBook(base({coverUri:undefined}),{
    fetcher,cache:{},openLibraryEnabled:true,
  });
  assert.equal(result.autoApply,true,'obvious title+author must auto-accept despite similar editions');
  assert.equal(result.status,'matched');
  assert.ok(result.best?.coverUri,'obvious match should provide artwork');
  assert.ok(calls<=1,'normal lookup should stop after one precise query for an obvious work');

  const localLibrary=fs.readFileSync('localLibrary.ts','utf8');
  assert.match(localLibrary,/const alreadyNeedsReview=!!book\.needsReview/,'ambiguous online suggestions must inspect prior review state');
  assert.match(localLibrary,/needsReview:alreadyNeedsReview/,'ambiguous online suggestions must never downgrade an already-resolved work');

  console.log('PASS: fast scanner skips optional enrichment, preserves resolved identity and uses one precise lookup for obvious books');
})().catch(error=>{console.error(error);process.exit(1)});
