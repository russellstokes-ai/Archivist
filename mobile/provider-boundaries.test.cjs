const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {lookupOnlineBook}=require('./onlineBookMetadata.ts');
const {lookupOnlineComic}=require('./onlineComicMetadata.ts');

(async()=>{
  const calls=[];
  const bookFetcher=async(url)=>{
    calls.push(url);
    const q=new URL(url).searchParams.get('q')||'';
    if(q.includes('isbn:9780441172719'))return {ok:true,status:200,json:async()=>({docs:[{key:'/works/DUNE',title:'Dune',author_name:['Frank Herbert'],isbn:['9780441172719'],cover_i:1}]})};
    if(q.includes('author:"Frank Herbert"'))return {ok:true,status:200,json:async()=>({docs:[{key:'/works/DUNE',title:'Dune',author_name:['Frank Herbert'],cover_i:1}]})};
    if(q.includes('title:"Dune"'))return {ok:true,status:200,json:async()=>({docs:[{key:'/works/DUNE',title:'Dune',author_name:['Frank Herbert'],cover_i:1}]})};
    return {ok:true,status:200,json:async()=>({docs:[]})};
  };

  const titleOnly=await lookupOnlineBook({title:'Dune',author:'',format:'EPUB'},{fetcher:bookFetcher,openLibraryEnabled:true,ignoreCache:true,interactive:true});
  assert.ok(titleOnly.candidates.some(candidate=>candidate.fields.title==='Dune'),'title-only Smart Search must return candidates');
  assert.ok(calls.some(url=>(new URL(url).searchParams.get('q')||'').includes('title:"Dune"')));

  calls.length=0;
  const authorOnly=await lookupOnlineBook({title:'',author:'Frank Herbert',format:'EPUB'},{fetcher:bookFetcher,openLibraryEnabled:true,ignoreCache:true,interactive:true});
  assert.ok(authorOnly.candidates.some(candidate=>candidate.fields.author==='Frank Herbert'),'author-only Smart Search must return candidates');
  assert.ok(calls.some(url=>(new URL(url).searchParams.get('q')||'').includes('author:"Frank Herbert"')));

  calls.length=0;
  const isbn=await lookupOnlineBook({title:'',author:'',isbn:'9780441172719',format:'EPUB'},{fetcher:bookFetcher,openLibraryEnabled:true,ignoreCache:true,interactive:true});
  assert.equal(isbn.best?.exactIdentifier,true);
  assert.equal(isbn.status,'matched');
  assert.ok(calls.some(url=>(new URL(url).searchParams.get('q')||'').includes('isbn:9780441172719')));

  const disabled=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',format:'EPUB'},{fetcher:bookFetcher,openLibraryEnabled:false,ignoreCache:true});
  assert.equal(disabled.status,'unconfigured','disabled book providers must not masquerade as an offline network failure');

  const googleCalls=[];
  const google=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',format:'EPUB'},{
    openLibraryEnabled:false,
    googleBooksApiKey:'configured',
    ignoreCache:true,
    fetcher:async url=>{
      googleCalls.push(url);
      return {ok:true,status:200,json:async()=>({items:[{id:'g',volumeInfo:{title:'Dune',authors:['Frank Herbert'],imageLinks:{thumbnail:'https://books.test/dune.jpg'}}}]})};
    },
  });
  assert.ok(googleCalls.length>0&&googleCalls.every(url=>url.includes('googleapis.com/books')),'configured Google Books must operate independently of Open Library');
  assert.ok(google.candidates.length>0);

  const offline=await lookupOnlineBook({title:'Dune',author:'Frank Herbert',format:'EPUB'},{
    openLibraryEnabled:true,ignoreCache:true,fetcher:async()=>{throw new Error('network down')},
  });
  assert.equal(offline.status,'offline');

  const comicInput={format:'Comic',series:'Amazing Spider-Man',comicIssueNumber:'1'};
  const unconfigured=await lookupOnlineComic(comicInput,{fetcher:async()=>{throw new Error('must not call')}});
  assert.equal(unconfigured.status,'unconfigured');

  const rateLimited=await lookupOnlineComic(comicInput,{
    token:'token',
    fetcher:async()=>({ok:false,status:429,headers:{get:()=> '60'},json:async()=>({})}),
  });
  assert.equal(rateLimited.status,'rate-limited');

  const comicOffline=await lookupOnlineComic(comicInput,{token:'token',fetcher:async()=>{throw new Error('network down')}});
  assert.equal(comicOffline.status,'offline');

  console.log('PASS: provider boundaries distinguish clues, configuration, offline and rate-limit states');
})().catch(error=>{console.error(error);process.exitCode=1});
