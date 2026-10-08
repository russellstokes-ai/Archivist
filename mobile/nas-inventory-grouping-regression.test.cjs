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
  {author:'Terry Pratchett',series:'Discworld',seriesNumber:index+1}));
const discworldWorks=groupLocalWorks(discworld);
assert.equal(discworldWorks.length,5,
  'NAS RED: numbered complete Discworld books in a series folder must be FIVE works, not one multipart audiobook');
assert.equal(new Set([...audioWorkGroupKeys(discworld).values()]).size,5,
  'series-volume numbers in filenames are not track indices');
assert.ok(discworldWorks.every(work=>work.files===1),
  'each Discworld single-file MP3 must retain a separate edition');

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
