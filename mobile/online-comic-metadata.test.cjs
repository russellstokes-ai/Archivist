const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {
  buildComicLookupHints,
  lookupOnlineComic,
  mergeOnlineComicCandidate,
  normalizeComicIssueNumber,
  scoreOnlineComicCandidate,
}=require('./onlineComicMetadata.ts');

assert.equal(normalizeComicIssueNumber('#001'),'1');
assert.equal(normalizeComicIssueNumber('001A'),'1A');

const sparse=buildComicLookupHints({
  format:'Comic',
  uri:'content://root/document/primary:Comics%2FMarvel%2FAmazing%20Spider-Man%20(2018)%2FAmazing%20Spider-Man%20-%20001%20-%20Back%20to%20Basics.cbz',
});
assert(sparse.series.includes('Amazing Spider-Man'));
assert(sparse.issueNumbers.includes('1'));
assert(sparse.years.includes(2018));

const pureIssue=buildComicLookupHints({
  format:'Comic',
  uri:'content://root/document/primary:Comics%2FMarvel%2FAmazing%20Spider-Man%20(2018)%2F001.cbz',
});
assert(pureIssue.series.includes('Amazing Spider-Man'));
assert(pureIssue.issueNumbers.includes('1'));
assert(pureIssue.years.includes(2018));

const issueLeadingTitle=buildComicLookupHints({
  format:'Comic',
  uri:'content://root/document/primary:Comics%2FDC%2FSandman%2F001%20-%20Sleep%20of%20the%20Just.cbz',
});
assert(issueLeadingTitle.series.includes('Sandman'));
assert(issueLeadingTitle.issueNumbers.includes('1'));

const strong=scoreOnlineComicCandidate(
  {format:'Comic',series:'Amazing Spider-Man',comicIssueNumber:'1',comicVolume:5,publishedYear:2018},
  {provider:'metron',providerId:'50',fields:{series:'Amazing Spider-Man',comicIssueNumber:'1',comicVolume:5,publishedYear:2018},coverUri:'https://static.metron.cloud/1.jpg',query:'q'},
);
assert.equal(strong.confidence,'high');
assert.equal(strong.exactIssue,true);
assert(strong.score>=90);

const wrongIssue=scoreOnlineComicCandidate(
  {format:'Comic',series:'Amazing Spider-Man',comicIssueNumber:'1'},
  {provider:'metron',providerId:'51',fields:{series:'Amazing Spider-Man',comicIssueNumber:'12'},query:'q'},
);
assert.equal(wrongIssue.confidence,'low');

const protectedBook={
  format:'Comic',
  title:'Local title',
  series:'Sandman',
  publisher:'DC',
  comicIssueNumber:'1',
  comicVolume:1,
  metadataProvenance:{series:'embedded',publisher:'embedded'},
  comicMetadataProvenance:{comicIssueNumber:'embedded',comicVolume:'embedded'},
  coverCandidates:[],
};
const protectedMerged=mergeOnlineComicCandidate(protectedBook,{
  provider:'metron',providerId:'99',
  fields:{title:'Sandman #1',series:'The Sandman',publisher:'DC Comics',comicIssueNumber:'1',comicVolume:2,description:'Dream returns.',comicCharacters:['Dream']},
  coverUri:'https://static.metron.cloud/sandman.jpg',score:95,confidence:'high',exactIdentifier:false,exactIssue:true,seriesScore:1,reasons:[],query:'q',
},true);
assert.equal(protectedMerged.series,'Sandman');
assert.equal(protectedMerged.publisher,'DC');
assert.equal(protectedMerged.comicVolume,1);
assert.equal(protectedMerged.description,'Dream returns.');
assert.deepEqual(protectedMerged.comicCharacters,['Dream']);
assert.equal(protectedMerged.coverUri,'https://static.metron.cloud/sandman.jpg');

(async()=>{
  const calls=[];
  const fetcher=async(url,init)=>{
    calls.push({url,auth:init?.headers?.Authorization,userAgent:init?.headers?.['User-Agent']});
    if(url.includes('/api/issue/?'))return {ok:true,status:200,json:async()=>({results:[{
      id:50,
      series:{id:15,name:'Amazing Spider-Man',volume:5,year_began:2018},
      number:'1',
      issue:'Amazing Spider-Man (2018) #1',
      cover_date:'2018-07-01',
      store_date:'2018-06-06',
      image:'https://static.metron.cloud/asm1.jpg',
    }]})};
    if(url.includes('/api/issue/50/'))return {ok:true,status:200,json:async()=>({
      id:50,
      series:{id:15,name:'Amazing Spider-Man',volume:5,year_began:2018,publisher:{id:1,name:'Marvel'},genres:[{name:'Superhero'}],language:'en'},
      number:'1',
      cover_date:'2018-07-01',
      store_date:'2018-06-06',
      image:'https://static.metron.cloud/asm1.jpg',
      desc:'Peter Parker returns to basics.',
      isbn:'9781302912314',
      upc:'75960608936900111',
      page_count:32,
      arcs:[{name:'Back to Basics'}],
      characters:[{name:'Spider-Man'}],
      teams:[{name:'Avengers'}],
      universes:[{name:'Earth-616'}],
      credits:[
        {creator:{name:'Nick Spencer'},role:[{name:'Writer'}]},
        {creator:{name:'Ryan Ottley'},role:[{name:'Penciller'}]},
      ],
      cv_id:676020,
      gcd_id:2310000,
    })};
    return {ok:false,status:404,json:async()=>({})};
  };

  const input={
    format:'Comic',
    uri:'content://root/document/primary:Comics%2FAmazing%20Spider-Man%20(2018)%2FAmazing%20Spider-Man%20-%20001.cbz',
    series:'Amazing Spider-Man',
    comicIssueNumber:'1',
    comicVolume:5,
    publishedYear:2018,
  };
  const result=await lookupOnlineComic(input,{token:'metron-test-token',fetcher,cache:{}});
  assert.equal(result.status,'matched');
  assert.equal(result.autoApply,true);
  assert.equal(result.best.fields.series,'Amazing Spider-Man');
  assert.equal(result.best.fields.comicIssueNumber,'1');
  assert.equal(result.best.fields.publisher,'Marvel');
  assert.equal(result.best.fields.author,'Nick Spencer');
  assert.equal(result.best.fields.comicVolume,5);
  assert.deepEqual(result.best.fields.comicStoryArcs,['Back to Basics']);
  assert.deepEqual(result.best.fields.comicCharacters,['Spider-Man']);
  assert.deepEqual(result.best.fields.comicTeams,['Avengers']);
  assert.deepEqual(result.best.fields.comicUniverses,['Earth-616']);
  assert.equal(result.best.fields.comicPageCount,32);
  assert.equal(result.best.fields.comicExternalIds.comicVine,676020);
  assert(calls.every(call=>call.auth==='Bearer metron-test-token'));
  assert(calls.every(call=>/^Archivist\//.test(call.userAgent)));

  const unconfigured=await lookupOnlineComic(input,{fetcher,cache:{}});
  assert.equal(unconfigured.status,'unconfigured');
  assert.equal(unconfigured.candidates.length,0);

  console.log('PASS: comic metadata recognises sparse names, issue identity, rich Metron detail, protected local fields and secure token auth');
})().catch(error=>{console.error(error);process.exit(1);});
