const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {canonicalMetadataForBooks,synchronizeLocalMetadata}=require('./metadataSync.ts');
const {groupLocalWorks}=require('./localWorks.ts');

function track(id,name,extra={}){
  return {
    id,
    uri:'content://root/document/primary:Audiobooks%2FCraig%20Alanson%2FExpeditionary%20Force%2F04%20-%20Black%20Ops%2F'+encodeURIComponent(name)+'.mp3',
    title:name.replace(/\.mp3$/,''),
    author:'',
    series:'',
    genre:'',
    format:'Audio',
    space:'Audiobooks',
    available:true,
    metadataSource:'embedded',
    metadataProvenance:{title:'embedded'},
    metadataFieldConfidence:{title:'high'},
    coverShape:'square',
    ...extra,
  };
}

const raw=[
  track(1,'01 - Opening',{title:'Opening',coverUri:'file:///app/covers/embedded-blackops.jpg',coverCandidates:['file:///app/covers/embedded-blackops.jpg']}),
  track(2,'02 - Columbus Day',{title:'Columbus Day'}),
  track(3,'03 - Trouble',{title:'Trouble'}),
];
const canonical=canonicalMetadataForBooks(raw);
assert.equal(canonical.title,'Black Ops','chapter titles must not replace the audiobook work title');
assert.equal(canonical.author,'Craig Alanson');
assert.equal(canonical.series,'Expeditionary Force');
assert.equal(canonical.seriesNumber,4);
assert.equal(canonical.coverUri,'file:///app/covers/embedded-blackops.jpg');

const synced=synchronizeLocalMetadata(raw).books;
assert.equal(synced.every(item=>item.author==='Craig Alanson'),true);
assert.equal(synced.every(item=>item.series==='Expeditionary Force'),true);
assert.equal(synced.every(item=>item.seriesNumber===4),true);
assert.equal(synced.every(item=>item.coverUri==='file:///app/covers/embedded-blackops.jpg'),true,'one verified audiobook cover must fill sibling tracks');
assert.equal(new Set(synced.map(item=>item.workKey)).size,1,'all audiobook tracks must share one canonical work identity');
assert.equal(synced[0].title,'Opening','real embedded chapter titles must remain track titles');

const work=groupLocalWorks(synced)[0];
assert.equal(work.title,'Black Ops');
assert.equal(work.author,'Craig Alanson');
assert.equal(work.series,'Expeditionary Force');
assert.equal(work.seriesNumber,4);
assert.equal(work.coverUri,'file:///app/covers/embedded-blackops.jpg');
assert.equal(work.needsReview,false);

const outlier=synchronizeLocalMetadata([
  track(40,'01 - Opening',{
    title:'Opening',
    author:'Wrong Person',
    series:'Wrong Series',
    metadataProvenance:{title:'embedded',author:'embedded',series:'embedded'},
    metadataFieldConfidence:{title:'high',author:'high',series:'high'},
  }),
  track(41,'02 - Trouble',{title:'Trouble'}),
]).books;
const outlierWork=groupLocalWorks(outlier)[0];
assert.equal(outlierWork.title,'Black Ops','folder/work identity must beat a 50/50 chapter-title split');
assert.equal(outlierWork.author,'Craig Alanson','one bad embedded author must not override repeated work evidence');
assert.equal(outlierWork.series,'Expeditionary Force','one bad embedded series must not override repeated work evidence');
assert.equal(outlier[0].title,'Opening','track chapter title must remain intact after work-level consensus');

const manual=synchronizeLocalMetadata([
  track(4,'01 - Opening',{title:'Black Ops Director Cut',author:'Craig Alanson',metadataSource:'manual',metadataProvenance:{title:'manual',author:'manual'},metadataFieldConfidence:{title:'high',author:'high'}}),
  track(5,'02 - More',{title:'More'}),
]).books;
assert.equal(groupLocalWorks(manual)[0].title,'Black Ops Director Cut','manual work title must outrank inferred/provider metadata');

const crossFormat=synchronizeLocalMetadata([
  {id:10,uri:'file:///Dune.epub',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,genre:'Science Fiction',description:'Arrakis.',format:'EPUB',space:'Books',available:true,metadataSource:'embedded',metadataProvenance:{title:'embedded',author:'embedded',series:'embedded',genre:'embedded',description:'embedded'},metadataFieldConfidence:{title:'high',author:'high',series:'high',genre:'high',description:'high'}},
  {id:11,uri:'file:///Dune.pdf',title:'Dune',author:'Frank Herbert',series:'',genre:'',format:'PDF',space:'Books',available:true,metadataSource:'path',metadataProvenance:{title:'path',author:'path'},metadataFieldConfidence:{title:'high',author:'high'}},
]).books;
assert.equal(crossFormat[1].series,'Dune');
assert.equal(crossFormat[1].genre,'Science Fiction');
assert.equal(crossFormat[1].description,'Arrakis.');
assert.equal(crossFormat[1].coverUri,undefined,'covers must not leak between different formats/editions');

console.log('PASS: canonical metadata sync preserves chapters, unifies audiobook identity/covers and fills safe cross-format gaps');
