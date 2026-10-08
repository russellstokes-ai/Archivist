const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {groupLocalWorks}=require('./localWorks.ts');
const {localWorksForReview}=require('./publicationPipeline.ts');
const {synchronizeLocalMetadata}=require('./metadataSync.ts');

const root='content://media/tree/primary%3AAudiobooks/document/primary%3AAudiobooks';
function chapter(id,folder,stem,album=''){
  return {
    id,uri:'content://media/document/primary:Audiobooks%2F'+encodeURIComponent(folder)+'%2F'+encodeURIComponent(stem)+'.mp3',
    rootUri:root,space:'Audiobooks',title:stem,author:'',series:'',format:'Audio',
    available:true,needsReview:true,coverShape:'square',
    metadataSource:'embedded',
    metadataProvenance:{title:'embedded'},metadataFieldConfidence:{title:'high'},
    embeddedMetadata:album?{workTitle:album}:{},
    workKey:'chapter-identity:'+id,
  };
}

// Device-like case: different disc labels and absent tags within a real
// 18-chapter book folder. These are not evidence of 18 separate books.
const multipart=Array.from({length:18},(_,i)=>chapter(
  1000+i,'The Long Road',String(i+1).padStart(2,'0')+' - Chapter '+String(i+1).padStart(2,'0'),
  i<6?'The Long Road':i<12?'The Long Road (Disc 2)':'',
));
assert.equal(multipart.length,18);
assert.equal(groupLocalWorks(multipart)[0].title,'The Long Road',
 'the logical work title must not inherit a disc-specific album label or a chapter title');
assert.equal(groupLocalWorks(multipart).length,1,
 'RED: one folder of 18 numbered chapters with incomplete or disc-suffixed album tags must be ONE book');
assert.equal(localWorksForReview(multipart).filter(work=>work.needsReview).length,1,
 'RED: Needs Attention must show one work-level review, never one review for each tagged/untagged chapter');
assert.equal(groupLocalWorks(synchronizeLocalMetadata(multipart).books).length,1,
 'RED: enrichment must not split an already identified physical book');

// An author or mixed folder genuinely containing two separate works must
// remain two books, even if its files are numbered.
const mixed=[
  chapter(2001,'Mixed Audiobooks','01 - Opening','Dune'),
  chapter(2002,'Mixed Audiobooks','02 - Desert','Dune'),
  chapter(2003,'Mixed Audiobooks','03 - Opening','Project Hail Mary'),
  chapter(2004,'Mixed Audiobooks','04 - Journey','Project Hail Mary'),
];
assert.deepEqual(groupLocalWorks(mixed).map(w=>w.files).sort((a,b)=>a-b),[2,2],
 'a mixed folder of two independently tagged works must NOT be over-merged');

// The device gold standard must apply to the logical WORK count, not
// the count of physical files. The data below adds 227 chapter assets from
// 12 distinct physical books with mixed, missing and disc-suffixed work tags.
const manyBooks=[];
for(let w=0;w<12;w++){
  const count=w<11?19:18; // 227 physical files
  for(let i=0;i<count;i++){
    manyBooks.push(chapter(30000+w*100+i,'Novel '+w,
      String(i+1).padStart(2,'0')+' - Chapter '+String(i+1).padStart(2,'0'),
      i<5?'Novel '+w:i<9?'Novel '+w+' (Disc 2)':''));
  }
}
assert.equal(manyBooks.length,227);
assert.equal(groupLocalWorks(manyBooks).length,12,
 '227 physical chapters in 12 physical book folders must produce 12 logical works');
assert.equal(groupLocalWorks(synchronizeLocalMetadata(manyBooks).books).length,12,
 'metadata synchronization must preserve the 12 groups');
assert.equal(localWorksForReview(manyBooks).filter(w=>w.needsReview).length,12,
 'only twelve work-level review cards may appear for these 227 chapter files');

console.log('PASS: conflicting disc tags are normalized without merging separate audiobooks');
