const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);

const {buildBookLookupHints,scoreOnlineBookCandidate,mergeOnlineBookCandidate,lookupOnlineBook,shouldLookupBookOnline,onlineBookCacheKey}=require('./onlineBookMetadata.ts');

assert.match(onlineBookCacheKey({title:'Dune',author:'Frank Herbert',format:'EPUB'}),/^v3\|/,'optimized matcher must ignore stale cache entries from earlier scanner builds');

const sparse={title:'Dune',author:'',series:'',format:'EPUB',uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%2F01%20-%20Dune.epub'};
const hints=buildBookLookupHints(sparse);
assert(hints.titles.includes('Dune'));
assert(hints.authors.includes('Frank Herbert'));
assert(hints.series.includes('Dune'));

const simpleAuthorFolder=buildBookLookupHints({title:'Dune',author:'',format:'EPUB',uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune.epub'});
assert(simpleAuthorFolder.authors.includes('Frank Herbert'));
assert.equal(simpleAuthorFolder.series.includes('Frank Herbert'),false);

const exact=scoreOnlineBookCandidate({title:'Anything',isbn:'9780441172719',format:'EPUB'},{
  provider:'openlibrary',providerId:'/works/OL1W',fields:{title:'Dune',author:'Frank Herbert',isbn:'9780441172719'},coverUri:'https://x/cover.jpg',exactIdentifier:false,query:'isbn'
});
assert.equal(exact.confidence,'high');
assert.equal(exact.exactIdentifier,true);


const isbn10Against13Preferred=scoreOnlineBookCandidate({title:'Dune',isbn:'0441172717',format:'EPUB'},{
  provider:'openlibrary',providerId:'/works/OL1W',fields:{title:'Dune',author:'Frank Herbert',isbn:'9780441172719'},identifiers:['0441172717','9780441172719'],coverUri:'https://x/cover.jpg',exactIdentifier:false,query:'isbn'
});
assert.equal(isbn10Against13Preferred.exactIdentifier,true);
assert.equal(isbn10Against13Preferred.confidence,'high');

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

assert.equal(
  shouldLookupBookOnline({title:'Dune',author:'Frank Herbert',format:'EPUB',coverUri:'file:///covers/dune.jpg'}),
  true,
  'missing genre must trigger work-level Atlas enrichment'
);
assert.equal(
  shouldLookupBookOnline({title:'Dune',author:'Frank Herbert',format:'EPUB'}),
  true,
  'a missing publication cover should trigger one normal lookup'
);
assert.equal(
  shouldLookupBookOnline({title:'Dune',author:'',format:'EPUB',coverUri:'file:///covers/dune.jpg',needsReview:true}),
  true,
  'unresolved identity must still be searched'
);

(async()=>{
  const openLibraryCalls=[];
  const fetcher=async(url,init)=>{
    openLibraryCalls.push({url,headers:init?.headers||{}});
    if(url.includes('/search.json'))return {ok:true,status:200,json:async()=>({docs:[{key:'/works/OL262758W',title:'Dune',author_name:['Frank Herbert'],first_publish_year:1965,publisher:['Ace'],isbn:['9780441172719'],subject:['Science Fiction'],cover_i:8231856,series:['Dune'],first_sentence:['Set on Arrakis.']} ]})};
    return {ok:false,status:404,json:async()=>({})};
  };
  const result=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',series:'Dune',format:'EPUB'}, {fetcher,cache:{}});
  assert.equal(result.status,'matched');
  assert.equal(result.autoApply,true);
  assert.equal(result.best.fields.author,'Frank Herbert');
  assert.equal(result.best.fields.genre,'Science Fiction');
  assert.equal(result.best.fields.series,'Dune');
  assert.match(result.best.coverUri,/covers\.openlibrary\.org/);
  assert(openLibraryCalls.filter(call=>call.url.includes('openlibrary.org')).every(call=>/^Archivist\//.test(call.headers['User-Agent'])),'Open Library calls must identify Archivist');
  let isbnFallbackCalls=0;
  const isbnCoverFetcher=async(url,init)=>{
    isbnFallbackCalls++;
    return {ok:true,status:200,json:async()=>({docs:[{key:'/works/OLXW',title:'Example Book',author_name:['Example Author'],isbn:['9781234567897']} ]})};
  };
  const isbnCover=await lookupOnlineBook({title:'Example Book',author:'Example Author',format:'EPUB'},{fetcher:isbnCoverFetcher,cache:{},openLibraryEnabled:true});
  assert.match(isbnCover.best.coverUri,/\/b\/isbn\/9781234567897-L\.jpg\?default=false$/,'ISBN must provide a cover fallback when Open Library has no cover_i');

  const cachedMiss={
    'stale||||epub':{expiresAt:Date.now()+60000,result:{key:'stale||||epub',status:'none',candidates:[],autoApply:false,queried:['cached']}},
  };
  let bypassCalls=0;
  const bypassFetcher=async()=>{bypassCalls++;return {ok:true,status:200,json:async()=>({docs:[{key:'/works/OLSW',title:'Stale',author_name:['Author'],cover_i:42}]})}};
  const staleInput={title:'Stale',author:'',series:'',format:'EPUB'};
  const staleKey=require('./onlineBookMetadata.ts').onlineBookCacheKey(staleInput);
  cachedMiss[staleKey]={expiresAt:Date.now()+60000,result:{key:staleKey,status:'none',candidates:[],autoApply:false,queried:['cached']}};
  const cachedResult=await lookupOnlineBook(staleInput,{fetcher:bypassFetcher,cache:cachedMiss});
  assert.equal(bypassCalls,0,'normal enrichment should respect a live metadata cache');
  assert.equal(cachedResult.status,'none');
  const refreshed=await lookupOnlineBook(staleInput,{fetcher:bypassFetcher,cache:cachedMiss,ignoreCache:true});
  assert.ok(bypassCalls>0,'explicit refresh must bypass stale positive/negative metadata cache');
  assert.ok(refreshed.queried.length>0,'cache bypass must execute a fresh provider query even when the new result remains low-confidence');

  let deepCalls=0;
  const deepFetcher=async()=>{deepCalls++;return {ok:true,status:200,json:async()=>({docs:[]})}};
  const deepResult=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',series:'Dune Chronicles',format:'EPUB'},{fetcher:deepFetcher,openLibraryEnabled:true,deep:true,ignoreCache:true});
  assert.ok(deepCalls>=3,'Deep Search must execute broader per-work query plans instead of stopping after the first weak result');
  assert.ok(deepResult.queried.length>=3);

  const googleOnlyCalls=[];
  const googleOnlyFetcher=async(url)=>{
    googleOnlyCalls.push(url);
    if(url.includes('googleapis.com/books/v1/volumes'))return {ok:true,status:200,json:async()=>({items:[{id:'g1',volumeInfo:{title:'Dune',authors:['Frank Herbert'],publisher:'Ace',publishedDate:'1965',industryIdentifiers:[{type:'ISBN_13',identifier:'9780441172719'}],categories:['Science Fiction'],imageLinks:{thumbnail:'http://books.google.test/dune.jpg'}}}]})};
    throw new Error('Open Library should not be called');
  };
  const googleOnly=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',format:'EPUB'},{fetcher:googleOnlyFetcher,openLibraryEnabled:false,googleBooksApiKey:'test-key',cache:{}});
  assert.equal(googleOnly.status,'matched');
  assert.equal(googleOnly.best.provider,'googlebooks');
  assert(googleOnlyCalls.every(url=>!url.includes('openlibrary.org')));

  console.log('PASS: online book metadata handles sparse folders, provider controls, strong matching, field protection, enrichment and covers');
})().catch(error=>{console.error(error);process.exit(1);});
