const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {audioWorkGroupKeys,canonicalMetadataForBooks,synchronizeLocalMetadata,synchronizeLocalMetadataCooperative}=require('./metadataSync.ts');
const {groupLocalWorks}=require('./localWorks.ts');
const {localWorksForReview}=require('./publicationPipeline.ts');

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

const cachedMusicAuthor=synchronizeLocalMetadata([
  track(35,'01 - Opening',{title:'Opening',author:'Music',metadataProvenance:{title:'embedded',author:'embedded'},metadataFieldConfidence:{title:'high',author:'high'}}),
  track(36,'02 - Trouble',{title:'Trouble',author:'Music',metadataProvenance:{title:'embedded',author:'embedded'},metadataFieldConfidence:{title:'high',author:'high'}}),
]).books;
assert.equal(groupLocalWorks(cachedMusicAuthor)[0].author,'Craig Alanson','cached Android Music root metadata must be repaired from stronger path identity');
assert.equal(cachedMusicAuthor.every(item=>item.author==='Craig Alanson'),true,'repaired author must synchronize across audiobook tracks');


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

const providerMatched=synchronizeLocalMetadata([
  track(50,'01 - Opening',{title:'Opening',onlineMetadataMatch:{fields:{title:'Black Ops: Expeditionary Force #4',author:'Craig Alanson',series:'Expeditionary Force',seriesNumber:4},confidence:'high'}}),
  track(51,'02 - Trouble',{title:'Trouble',onlineMetadataMatch:{fields:{title:'Black Ops: Expeditionary Force #4',author:'Craig Alanson',series:'Expeditionary Force',seriesNumber:4},confidence:'high'}}),
]).books;
assert.equal(groupLocalWorks(providerMatched)[0].title,'Black Ops: Expeditionary Force #4','high-confidence provider work title may improve the work identity');
assert.equal(providerMatched[0].title,'Opening','provider work title must not overwrite chapter title');
assert.equal(providerMatched[1].title,'Trouble','provider work title must not overwrite sibling chapter title');


const manual=synchronizeLocalMetadata([
  track(4,'01 - Opening',{title:'Black Ops Director Cut',author:'Craig Alanson',metadataSource:'manual',metadataProvenance:{title:'manual',author:'manual'},metadataFieldConfidence:{title:'high',author:'high'},onlineMetadataMatch:{fields:{title:'Black Ops Online'},confidence:'high'}}),
  track(5,'02 - More',{title:'More',onlineMetadataMatch:{fields:{title:'Black Ops Online'},confidence:'high'}}),
]).books;
assert.equal(groupLocalWorks(manual)[0].title,'Black Ops Director Cut','manual work title must outrank inferred/provider metadata');

const rootMixed=[
  track(70,'Dune - Part 01',{uri:'content://root/document/primary:Audiobooks%2FDune%20-%20Part%2001.mp3',title:'Opening',author:'Frank Herbert',embeddedMetadata:{workTitle:'Dune'}}),
  track(71,'Dune - Part 02',{uri:'content://root/document/primary:Audiobooks%2FDune%20-%20Part%2002.mp3',title:'Arrakis',author:'Frank Herbert',embeddedMetadata:{workTitle:'Dune'}}),
  track(72,'Project Hail Mary - Part 01',{uri:'content://root/document/primary:Audiobooks%2FProject%20Hail%20Mary%20-%20Part%2001.mp3',title:'Chapter 1',author:'Andy Weir',embeddedMetadata:{workTitle:'Project Hail Mary'}}),
  track(73,'Project Hail Mary - Part 02',{uri:'content://root/document/primary:Audiobooks%2FProject%20Hail%20Mary%20-%20Part%2002.mp3',title:'Chapter 2',author:'Andy Weir',embeddedMetadata:{workTitle:'Project Hail Mary'}}),
];
const rootKeys=audioWorkGroupKeys(rootMixed);
assert.equal(rootKeys.get(rootMixed[0].uri),rootKeys.get(rootMixed[1].uri),'root-level chapter files sharing one embedded work title must group together');
assert.equal(rootKeys.get(rootMixed[2].uri),rootKeys.get(rootMixed[3].uri),'a second root-level audiobook must form its own work');
assert.notEqual(rootKeys.get(rootMixed[0].uri),rootKeys.get(rootMixed[2].uri),'two different audiobooks in one root must never be merged');
const rootSynced=synchronizeLocalMetadata(rootMixed).books;
const rootWorks=groupLocalWorks(rootSynced);
assert.equal(rootWorks.find(item=>item.author==='Frank Herbert')?.title,'Dune','embedded album/work title must become the canonical root audiobook identity');
assert.equal(rootWorks.find(item=>item.author==='Andy Weir')?.title,'Project Hail Mary','each root audiobook must retain its own canonical work title');

const mixedRootUri='content://root/tree/primary%3AMy%20Mixed%20Library/document/primary%3AMy%20Mixed%20Library';
const mixedRootRealWorld=[
  track(80,'The Martian - Chapter 01',{
    uri:'content://root/document/primary:My%20Mixed%20Library%2FThe%20Martian%20-%20Chapter%2001.mp3',
    rootUri:mixedRootUri,
    title:'Chapter 01',
    author:'',
    embeddedMetadata:{},
  }),
  track(81,'The Martian - Chapter 02',{
    uri:'content://root/document/primary:My%20Mixed%20Library%2FThe%20Martian%20-%20Chapter%2002.mp3',
    rootUri:mixedRootUri,
    title:'Chapter 02',
    author:'',
    embeddedMetadata:{},
  }),
  track(82,'000001',{
    uri:'content://root/document/primary:My%20Mixed%20Library%2F000001.mp3',
    rootUri:mixedRootUri,
    title:'000001',
    author:'Douglas Adams',
    embeddedMetadata:{workTitle:"The Hitchhiker's Guide to the Galaxy"},
  }),
  track(83,'000002',{
    uri:'content://root/document/primary:My%20Mixed%20Library%2F000002.mp3',
    rootUri:mixedRootUri,
    title:'000002',
    author:'Douglas Adams',
    embeddedMetadata:{workTitle:"The Hitchhiker's Guide to the Galaxy"},
  }),
];
const mixedRootKeys=audioWorkGroupKeys(mixedRootRealWorld);
assert.equal(mixedRootKeys.get(mixedRootRealWorld[0].uri),mixedRootKeys.get(mixedRootRealWorld[1].uri),'book-name plus chapter-number filenames must form one root audiobook');
assert.equal(mixedRootKeys.get(mixedRootRealWorld[2].uri),mixedRootKeys.get(mixedRootRealWorld[3].uri),'unclear filenames with the same embedded album/work title must form one root audiobook');
assert.notEqual(mixedRootKeys.get(mixedRootRealWorld[0].uri),mixedRootKeys.get(mixedRootRealWorld[2].uri),'filename-derived and metadata-derived root audiobooks must remain separate');
const mixedRootWorks=groupLocalWorks(synchronizeLocalMetadata(mixedRootRealWorld).books);
assert.equal(mixedRootWorks.length,2,'two real-world root audiobooks must become two logical books');
assert.ok(mixedRootWorks.some(work=>work.title==='The Martian'&&work.files===2),'multipart filenames alone must recover the book title without inventing an author');
assert.ok(mixedRootWorks.some(work=>work.title==="The Hitchhiker's Guide to the Galaxy"&&work.files===2));

const rootByName=[
  track(74,'Leviathan Wakes - Part 01',{uri:'content://root/document/primary:Audiobooks%2FLeviathan%20Wakes%20-%20Part%2001.mp3',title:'Part 01',author:''}),
  track(75,'Leviathan Wakes - Part 02',{uri:'content://root/document/primary:Audiobooks%2FLeviathan%20Wakes%20-%20Part%2002.mp3',title:'Part 02',author:''}),
];
const rootNameKeys=audioWorkGroupKeys(rootByName);
assert.equal(rootNameKeys.get(rootByName[0].uri),rootNameKeys.get(rootByName[1].uri),'strong filename part patterns must group a root-level audiobook even before online enrichment');

const crossFormat=synchronizeLocalMetadata([
  {id:10,uri:'file:///Dune.epub',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,genre:'Science Fiction',description:'Arrakis.',format:'EPUB',space:'Books',available:true,metadataSource:'embedded',metadataProvenance:{title:'embedded',author:'embedded',series:'embedded',genre:'embedded',description:'embedded'},metadataFieldConfidence:{title:'high',author:'high',series:'high',genre:'high',description:'high'}},
  {id:11,uri:'file:///Dune.pdf',title:'Dune',author:'Frank Herbert',series:'',genre:'',format:'PDF',space:'Books',available:true,metadataSource:'path',metadataProvenance:{title:'path',author:'path'},metadataFieldConfidence:{title:'high',author:'high'}},
]).books;
assert.equal(crossFormat[1].series,'Dune');
assert.equal(crossFormat[1].genre,'Science Fiction');
assert.equal(crossFormat[1].description,'Arrakis.');
assert.equal(crossFormat[1].coverUri,undefined,'covers must not leak between different formats/editions');



// Device regression: 226 physical audiobook files belong to 12 works.
// Distinct descriptive chapter names and incomplete tags must never turn a
// book-folder library into 226 individual metadata-review tasks.
const largeBookFolders=[];
for(let workIndex=0;workIndex<12;workIndex++){
  const chapterCount=workIndex<10?19:18;
  for(let chapter=0;chapter<chapterCount;chapter++){
    const filename='Scene '+String(chapter+1).padStart(2,'0')+' '+(chapter%2?'Return to the valley':'An unexpected visitor');
    largeBookFolders.push(track(30000+workIndex*100+chapter,filename,{
      uri:'content://media/document/primary:Audiobooks%2FWriter%20'+workIndex+'%2FNovel%20'+workIndex+'%2F'+encodeURIComponent(filename)+'.mp3',
      rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks',
      title:filename,
      author:'',
      series:'',
      needsReview:true,
      workKey:'chapter:'+workIndex+':'+chapter,
      embeddedMetadata:chapter===0?{workTitle:'Novel '+workIndex}:{},
    }));
  }
}
assert.equal(largeBookFolders.length,226);
const grouped226=groupLocalWorks(largeBookFolders);
assert.equal(grouped226.length,12,
  '226 physical chapters across 12 book folders must display as 12 works, even with descriptive filenames or partial album tags');
assert.deepEqual(grouped226.map(work=>work.files).sort((a,b)=>a-b),[18,18,...Array(10).fill(19)]);
const attention226=localWorksForReview(largeBookFolders).filter(book=>book.needsReview);
assert.equal(attention226.length,12,
  'Needs Attention must show one editable card per audiobook, not one card per physical chapter file');
const synchronized226=synchronizeLocalMetadata(largeBookFolders).books;
assert.equal(groupLocalWorks(synchronized226).length,12,
  'the canonical metadata pass must not split already grouped audiobook works');
const {applyManualCluesToWork}=require('./metadataSearchWorkflow.ts');
const firstWorkUris=grouped226[0].tracks.map(track=>track.uri);
const edited226=applyManualCluesToWork(largeBookFolders,firstWorkUris,{title:'The Correct Novel',author:'Correct Writer'});
assert.equal(edited226.filter(book=>book.author==='Correct Writer').length,19,
  'editing one review card must update every chapter of that book, never just the first file');
assert.equal(edited226.filter(book=>book.author==='Correct Writer'&& !firstWorkUris.includes(book.uri)).length,0,
  'a book edit must not spill across unrelated books');

const numberedBookFolder=[
  track(62001,'The unexpected visit',{uri:'content://media/document/primary:Audiobooks%2FAuthor%2FBook%2001%20-%20The%20Winter%20Night%2FThe%20unexpected%20visit.mp3',rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks'}),
  track(62002,'A long journey',{uri:'content://media/document/primary:Audiobooks%2FAuthor%2FBook%2001%20-%20The%20Winter%20Night%2FA%20long%20journey.mp3',rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks'}),
  track(62003,'A final promise',{uri:'content://media/document/primary:Audiobooks%2FAuthor%2FBook%2001%20-%20The%20Winter%20Night%2FA%20final%20promise.mp3',rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks'}),
  track(62004,'The discovery',{uri:'content://media/document/primary:Audiobooks%2FAuthor%2FBook%2001%20-%20The%20Winter%20Night%2FThe%20discovery.mp3',rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks'}),
];
assert.equal(groupLocalWorks(numberedBookFolder).length,1,
 'book folders prefixed Book 01 must group descriptive chapters instead of being mistaken for the Books collection');

// Common SAF layout: the user selects Audiobooks, containing one folder per
// book. There is no intermediate author folder. Scan must still return 12
// logical works for 226 physical chapter files.
const directBookFolders=largeBookFolders.map((book,index)=>{
  const sourceParts=book.uri.split('%2F');
  const bookFolder=sourceParts[sourceParts.length-2];
  const filename=sourceParts[sourceParts.length-1];
  return {...book,uri:'content://media/document/primary:Audiobooks%2F'+bookFolder+'%2F'+filename,
    rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks'};
});
assert.equal(directBookFolders.length,226);
assert.equal(groupLocalWorks(directBookFolders).length,12,
 'selecting Audiobooks root with 12 immediate book subfolders must not produce 226 review rows');
assert.equal(localWorksForReview(directBookFolders).filter(book=>book.needsReview).length,12,
 'immediate book folders must generate exactly one Needs Attention task per book');
assert.equal(groupLocalWorks(synchronizeLocalMetadata(directBookFolders).books).length,12,
 'a rescan/metadata synchronization must preserve direct-child book grouping');
const descriptiveChapters=['The Arrival','Beyond the Hills','A Strange Invitation','The Return'].map((title,i)=>track(64000+i,title,{
  uri:'content://media/document/primary:Audiobooks%2FThe%20Magic%20Mountain%2F'+encodeURIComponent(title)+'.mp3',
  rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks',
  title,author:'',embeddedMetadata:{},needsReview:true,
}));
const descriptiveWork=groupLocalWorks(descriptiveChapters);
assert.equal(descriptiveWork.length,1,'one book folder with descriptive chapter filenames must be one book');
assert.equal(descriptiveWork[0].title,'The Magic Mountain','work title must use book-folder identity rather than the first chapter');
const descriptiveSynced=synchronizeLocalMetadata(descriptiveChapters).books;
assert.equal(groupLocalWorks(descriptiveSynced)[0].title,'The Magic Mountain',
  'rescan must keep book title while preserving original chapter track names');
assert.deepEqual(descriptiveSynced.map(track=>track.title),['The Arrival','Beyond the Hills','A Strange Invitation','The Return'],
  'individual playable chapter labels must remain unchanged');



const multipartM4a=['Part 01 - Arrival','Part 02 - Journey','Part 03 - Finale'].map((chapter,i)=>track(63000+i,chapter,{
  uri:'content://media/document/primary:Audiobooks%2FWriter%2FBook%20Four%2F'+encodeURIComponent(chapter)+'.m4a',
  rootUri:'content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks',
  title:chapter,embeddedMetadata:{},
}));
assert.equal(groupLocalWorks(multipartM4a).length,1,
 'a multi-part M4A audiobook with numbered chapters must group as one book');

const mixedAlbumDirectory=[
  track(60001,'01 - Opening',{uri:'content://media/document/primary:Audiobooks%2FMixed%20Albums%2F01.mp3',embeddedMetadata:{workTitle:'Album One'}}),
  track(60002,'02 - More',{uri:'content://media/document/primary:Audiobooks%2FMixed%20Albums%2F02.mp3',embeddedMetadata:{workTitle:'Album One'}}),
  track(60003,'03 - Beginning',{uri:'content://media/document/primary:Audiobooks%2FMixed%20Albums%2F03.mp3',embeddedMetadata:{workTitle:'Album Two'}}),
  track(60004,'04 - Ending',{uri:'content://media/document/primary:Audiobooks%2FMixed%20Albums%2F04.mp3',embeddedMetadata:{workTitle:'Album Two'}}),
];
assert.deepEqual(groupLocalWorks(mixedAlbumDirectory).map(work=>work.files).sort(),[2,2],
  'two explicit album identities in one physical folder must not be merged into a single book');

const unrelatedSingles=[
 track(50001,'An original lecture',{uri:'content://media/document/primary:Audiobooks%2FMixed%20Collection%2FAn%20original%20lecture.mp3',title:'An original lecture',embeddedMetadata:{}}),
 track(50002,'A different lecture',{uri:'content://media/document/primary:Audiobooks%2FMixed%20Collection%2FA%20different%20lecture.mp3',title:'A different lecture',embeddedMetadata:{}}),
];
assert.equal(groupLocalWorks(unrelatedSingles).length,2,
  'separate standalone files in a collection folder must not be falsely merged');

(async()=>{
  const many=[];
  for(let work=0;work<180;work++){
    for(let chapter=0;chapter<3;chapter++){
      many.push(track(
        10000+work*3+chapter,
        String(chapter+1).padStart(2,'0')+' - Chapter',
        {
          uri:'content://root/document/primary:Audiobooks%2FAuthor%20'+work+'%2FBook%20'+work+'%2F'+String(chapter+1).padStart(2,'0')+'%20-%20Chapter.mp3',
          title:'Chapter '+(chapter+1),
        },
      ));
    }
  }
  let ticks=0;
  const ticker=setInterval(()=>{ticks++;},0);
  const cooperative=await synchronizeLocalMetadataCooperative(many,{batchSize:24});
  clearInterval(ticker);
  assert.equal(cooperative.books.length,many.length);
  assert.ok(ticks>0,'large canonical metadata synchronization must yield to the event loop');

  console.log('PASS: canonical metadata sync preserves chapters, unifies audiobook identity/covers, fills safe cross-format gaps and yields on large catalogues');
})().catch(error=>{console.error(error);process.exitCode=1;});

