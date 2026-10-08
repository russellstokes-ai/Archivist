// Regression cases derived from real 2026-10-08 Windows/NAS inventory paths.
// The files are represented as read-only path/tag fixtures; their real payloads,
// on-disk embedded tags and online matches have NOT been inspected here.
// Intended as a behavior-level RED/GREEN identity gate, not an accuracy metric.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);
const {groupLocalWorks}=require('./localWorks.ts');
const {audioWorkGroupKeys}=require('./metadataSync.ts');

function uri(kind,relative){
  return 'content://nas/document/primary:'+kind+'%2F'+relative.split('/').map(encodeURIComponent).join('%2F');
}
function audio(id,relative,title,extra={}){
  return {id,uri:uri('Audiobooks',relative),rootUri:'content://nas/tree/primary%3AAudiobooks/document/primary%3AAudiobooks',
    space:'Audiobooks',format:'Audio',title,author:'',series:'',available:true,coverShape:'square',
    metadataSource:'path',...extra};
}
function comic(id,relative,title,format='CBZ'){
  return {id,uri:uri('Comics',relative),rootUri:'content://nas/tree/primary%3AComics/document/primary%3AComics',
    space:'Comics',format,title,author:'',series:'',available:true,coverShape:'portrait'};
}

// REAL NAS counterexample: these are five COMPLETE, distinct audiobook MP3s.
// Numbered prefixes mean *Discworld series position*, not chapters in one work.
// Never collapse the author's series folder into one enormous audiobook.
const discworld=[
  ['01. The Colour of Magic.mp3','The Colour of Magic'],
  ['02. The Light Fantastic.mp3','The Light Fantastic'],
  ['03. Equal Rites.mp3','Equal Rites'],
  ['04. Mort.mp3','Mort'],
  ['05. Sourcery.mp3','Sourcery'],
].map(([name,title],index)=>audio(100+index,'Terry Pratchett/Discworld/'+name,title,
  {author:'Terry Pratchett',series:'Discworld',seriesNumber:index+1,
   fileSize:[199590434,199119394,212822414,101716791,231649575][index]}));
const discworldWorks=groupLocalWorks(discworld);
assert.equal(discworldWorks.length,5,
  'NAS RED: numbered complete Discworld books in a series folder must be FIVE works, not one multipart audiobook');
assert.equal(new Set([...audioWorkGroupKeys(discworld).values()]).size,5,
  'series-volume numbers in filenames are not track indices');
assert.ok(discworldWorks.every(work=>work.files===1),
  'each Discworld single-file MP3 must retain a separate edition');

// Discovery may lack verified series numbers/tags; the real large MP3 sizes
// and distinct non-chapter titles still provide strong single-file-book evidence.
const discworldShallow=discworld.map(({seriesNumber,series,...rest})=>({...rest,series:''}));
assert.equal(groupLocalWorks(discworldShallow).length,5,
  'NAS RED: shallow file discovery must not require preexisting seriesNumber tags to avoid false-merge');
const discworldMixed=[
  ...discworldShallow,
  audio(107,'Terry Pratchett/Discworld/06. Wyrd Sisters.mp3','Wyrd Sisters',
    {author:'Terry Pratchett',fileSize:300849614}),
  audio(108,'Terry Pratchett/Discworld/The Science of Discworld  Revised Edition.mp3',
    'The Science of Discworld Revised Edition',
    {author:'Terry Pratchett',fileSize:197390393}),
];
assert.equal(groupLocalWorks(discworldMixed).length,7,
  'NAS RED: Discworld series includes unnumbered full audiobooks alongside numbered novels; all stay separate');
// Shallow discovery could have mislabeled the individual novel with the parent
// series name. Do not ship five separate catalogue entries titled "Discworld".
const discworldWrongTitles=discworldMixed.map(book=>({...book,title:'Discworld'}));
const recatalogued=groupLocalWorks(discworldWrongTitles);
assert.equal(recatalogued.length,7);
assert.ok(recatalogued.some(work=>work.title==='The Colour of Magic'),
  'NAS RED: standalone numbered audiobook title must be recovered from filename, not series folder');
assert.ok(recatalogued.some(work=>work.title==='The Science of Discworld Revised Edition'),
  'NAS RED: standalone unnumbered book title must not be replaced by the series folder');

// Positive case: chapters of *one* Expanse book share a book folder.
// Another Expanse novella with a different narrator must be a DIFFERENT work.
const expanse=[
  audio(200,'James S. A. Corey/The Expanse/narrated by Jefferson Mays/1.0 - Leviathan Wakes/Corey, James S. A. - The Expanse 1.0 - Leviathan Wakes - 00 Prologue Julie.mp3','Prologue Julie',
    {embeddedMetadata:{workTitle:'Leviathan Wakes',trackNumber:0},author:'James S. A. Corey'}),
  audio(201,'James S. A. Corey/The Expanse/narrated by Jefferson Mays/1.0 - Leviathan Wakes/Corey, James S. A. - The Expanse 1.0 - Leviathan Wakes - 01 Holden.mp3','Holden',
    {embeddedMetadata:{workTitle:'Leviathan Wakes',trackNumber:1},author:'James S. A. Corey'}),
  audio(202,'James S. A. Corey/The Expanse/narrated by Jefferson Mays/1.0 - Leviathan Wakes/Corey, James S. A. - The Expanse 1.0 - Leviathan Wakes - 02 Miller.mp3','Miller',
    {embeddedMetadata:{workTitle:'Leviathan Wakes',trackNumber:2},author:'James S. A. Corey'}),
  audio(203,'James S. A. Corey/The Expanse/narrated by Erik Davies/0.2 - The Churn (novella)(narrated by Erik Davies)/Corey, James S. A. - The Expanse 0.2 - The Churn (novella) - 01.mp3','Part 01',
    {embeddedMetadata:{workTitle:'The Churn',trackNumber:1},author:'James S. A. Corey'}),
  audio(204,'James S. A. Corey/The Expanse/narrated by Erik Davies/0.2 - The Churn (novella)(narrated by Erik Davies)/Corey, James S. A. - The Expanse 0.2 - The Churn (novella) - 02.mp3','Part 02',
    {embeddedMetadata:{workTitle:'The Churn',trackNumber:2},author:'James S. A. Corey'}),
];
const expanseWorks=groupLocalWorks(expanse);
assert.deepEqual(expanseWorks.map(work=>work.files).sort((a,b)=>a-b),[2,3],
  'Expanse: three chapters of one recording and two novella tracks must form two distinct works');
assert.equal(expanseWorks.length,2);
const malediction=groupLocalWorks([
  audio(300,'Warhammer Audiobooks/Dark Angels/Malediction/01 Track 1.mp3','Track 1'),
  audio(301,'Warhammer Audiobooks/Dark Angels/Malediction/02 Track 2.mp3','Track 2'),
  audio(302,'Warhammer Audiobooks/Dark Angels/Malediction/03 Track 3.mp3','Track 3'),
]);
assert.equal(malediction.length,1,'generic tracks in a named book folder must become ONE audiobook');
assert.equal(malediction[0].files,3);

// Large-NAS scale fixtures use anonymised/generated titles rather than
// publishing the user's full private library inventory. Counts, formats,
// rough size bands and folder arrangements reproduce observed NAS patterns.
// They are structural truth cases, not online metadata accuracy claims.
const discworldFull=[
  ...Array.from({length:39},(_,i)=>audio(10000+i,
    'Terry Pratchett/Discworld/'+String(i+1).padStart(2,'0')+'. Novel '+(i+1)+'.mp3',
    'Discworld',{author:'Terry Pratchett',fileSize:(100+(i%7)*55)*1024*1024})),
  audio(10039,'Terry Pratchett/Discworld/The Science of Discworld Revised Edition.mp3',
    'Discworld',{author:'Terry Pratchett',fileSize:188*1024*1024}),
];
const discworldFullWorks=groupLocalWorks(discworldFull);
assert.equal(discworldFullWorks.length,40,
  'NAS scale: 39 numbered standalone audiobooks plus one extra novel are 40 works');
assert.ok(discworldFullWorks.every(work=>work.files===1),
  'each independent audiobook-sized series file is one physical edition');
assert.equal(new Set(discworldFullWorks.map(work=>work.title)).size,40,
  'distinct titles recovered from filename, not the shared Discworld series folder');

// Contrasting NAS patterns: many smaller tracks and a teaching-course folder
// represent complete *single* works, never 66 books or 36 books.
const consoleWars=Array.from({length:66},(_,i)=>audio(11000+i,
  'Console Wars Sega Nintendo Battle/'+String(i+1).padStart(2,'0')
    +' - Console Wars Sega Nintendo Battle.mp3',
  String(i+1)+' - Console Wars',{fileSize:(4+(i%4)*3)*1024*1024}));
const courseLessons=Array.from({length:36},(_,i)=>audio(12000+i,
  'TGC - The Decisive Battles Of World History/'+String(i+1).padStart(2,'0')
    +'_Lecture '+(i+1)+' World History.mp3',
  'Lecture '+(i+1),{fileSize:(22+(i%4)*3)*1024*1024}));
assert.equal(groupLocalWorks(consoleWars).length,1,
  'NAS scale: 66 multipart audiobook tracks must remain one work');
assert.equal(groupLocalWorks(courseLessons).length,1,
  'NAS scale: 36 numbered lectures within one course must remain one work');

// The same series folder may contain several book folders, each with dozens
// of chapters. Books cannot become one giant series or 113 loose tracks.
const largeExpanse=[
  ...Array.from({length:57},(_,i)=>audio(13000+i,
    'James S. A. Corey/The Expanse/narrated by Jefferson Mays/1.0 - Leviathan Wakes/'
      +'Corey - The Expanse 1.0 - Leviathan Wakes - '+String(i).padStart(2,'0')
      +' Chapter.mp3',
    'Chapter '+i,{fileSize:10*1024*1024})),
  ...Array.from({length:56},(_,i)=>audio(14000+i,
    'James S. A. Corey/The Expanse/narrated by Jefferson Mays/2.0 - Calibans War/'
      +'Corey - The Expanse 2.0 - Calibans War - '+String(i).padStart(2,'0')
      +' Chapter.mp3',
    'Chapter '+i,{fileSize:12*1024*1024})),
];
assert.deepEqual(groupLocalWorks(largeExpanse).map(w=>w.files).sort((a,b)=>a-b),[56,57],
  'NAS scale: 113 chapters from two distinct Expanse books must become exactly two works');

// Comic semantics differ: each CBZ/CBR is a distinct issue/volume,
// even when many are nested under the same parent series/collection.
const comics=groupLocalWorks([
  comic(400,'ConanTheBarbarian-001to260-Many/Conan the Barbarian 001.cbz','Conan the Barbarian 001'),
  comic(401,'ConanTheBarbarian-001to260-Many/Conan the Barbarian 002.cbz','Conan the Barbarian 002'),
  comic(402,'Judge Dredd - The Complete Case Files (v01-v27+)(digital+Scans)/Judge Dredd - The Complete Case Files 001 (2009) (2000adonline.com).cbr','Judge Dredd Complete Case Files 001','CBR'),
  comic(403,'Judge Dredd - The Complete Case Files (v01-v27+)(digital+Scans)/Judge Dredd - The Complete Case Files 002 (2006) (Digital) (Z6-Empire).cbr','Judge Dredd Complete Case Files 002','CBR'),
]);
assert.equal(comics.length,4,'comic issues/volumes must NOT be merged into one book by parent folder');
assert.ok(comics.every(work=>work.files===1));
console.log('PASS: NAS evidence grouping: Discworld separate; Expanse multipart; Malediction tracks; Conan/Judge Dredd individual assets');
