const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);

const {buildBookLookupHints,scoreOnlineBookCandidate,mergeOnlineBookCandidate,lookupOnlineBook}=require('./onlineBookMetadata.ts');

const sparse={title:'Dune',author:'',series:'',format:'EPUB',uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%2F01%20-%20Dune.epub'};
const hints=buildBookLookupHints(sparse);
assert(hints.titles.includes('Dune'));
assert(hints.authors.includes('Frank Herbert'));
assert(hints.series.includes('Dune'));

const exact=scoreOnlineBookCandidate({title:'Anything',isbn:'9780441172719',format:'EPUB'},{
  provider:'openlibrary',providerId:'/works/OL1W',fields:{title:'Dune',author:'Frank Herbert',isbn:'9780441172719'},coverUri:'https://x/cover.jpg',exactIdentifier:false,query:'isbn'
});
assert.equal(exact.confidence,'high');
assert.equal(exact.exactIdentifier,true);

const strong=scoreOnlineBookCandidate({title:'Project Hail Mary',author:'Andy Weir',format:'EPUB'},{
  provider:'openlibrary',providerId:'/works/OL2W',fields:{title:'Project Hail Mary',author:'Andy Weir'},exactIdentifier:false,query:'title'
});
assert.equal(strong.confidence,'high');

const protectedBook={title:'Manual Title',author:'Manual Author',format:'EPUB',metadataProvenance:{title:'manual',author:'embedded'},metadataFieldConfidence:{title:'high',author:'high'}};
const mergedProtected=mergeOnlineBookCandidate(protectedBook,{provider:'openlibrary',providerId:'/works/X',fields:{title:'Wrong',author:'Wrong',publisher:'Orbit'},score:95,confidence:'high',exactIdentifier:false,reasons:[],query:'q'},true);
assert.equal(mergedProtected.title,'Manual Title');
assert.equal(mergedProtected.author,'Manual Author');
assert.equal(mergedProtected.publisher,'Orbit');

const sparseMerge=mergeOnlineBookCandidate({title:'Dune',author:'',format:'EPUB',metadataProvenance:{title:'path'},metadataFieldConfidence:{title:'medium'}},{provider:'openlibrary',providerId:'/works/D',fields:{title:'Dune',author:'Frank Herbert',publisher:'Ace',publishedYear:1965,genre:'Science Fiction',description:'Novel'},coverUri:'https://covers/dune.jpg',score:92,confidence:'high',exactIdentifier:false,reasons:[],query:'q'},true);
assert.equal(sparseMerge.author,'Frank Herbert');
assert.equal(sparseMerge.publisher,'Ace');
assert.equal(sparseMerge.coverUri,'https://covers/dune.jpg');
assert.equal(sparseMerge.needsReview,false);

(async()=>{
  const fetcher=async(url)=>{
    if(url.includes('/search.json'))return {ok:true,status:200,json:async()=>({docs:[{key:'/works/OL262758W',title:'Dune',author_name:['Frank Herbert'],first_publish_year:1965,publisher:['Ace'],isbn:['9780441172719'],subject:['Science Fiction'],cover_i:8231856,series:['Dune'],first_sentence:['Set on Arrakis.']} ]})};
    return {ok:false,status:404,json:async()=>({})};
  };
  const result=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',series:'Dune',format:'EPUB'}, {fetcher,cache:{}});
  assert.equal(result.status,'matched');
  assert.equal(result.autoApply,true);
  assert.equal(result.best.fields.author,'Frank Herbert');
  assert.equal(result.best.fields.genre,'Science Fiction');
  assert.match(result.best.coverUri,/covers\.openlibrary\.org/);
  console.log('PASS: online book metadata handles sparse folders, strong matching, field protection, enrichment and covers');
})().catch(error=>{console.error(error);process.exit(1);});
