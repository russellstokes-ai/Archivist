// Regression: 342 real Android MP3s physically stored beneath a SAF-picked tree.
// Mirrors the generator in .github/scripts/android-fixture-media.py (diagnostic342).
// The unchanged Test23 APK returned 73 review items for these 12 true works.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText,file);
const {audioWorkGroupKeys,synchronizeLocalMetadata}=require('./metadataSync.ts');
const {decodedPathParts}=require('./libraryIntelligence.ts');
const {groupLocalWorks}=require('./localWorks.ts');
const {localWorksForReview}=require('./publicationPipeline.ts');

const selected='primary:Documents/ArchivistQADiagnostic342';
const root='content://com.android.externalstorage.documents/tree/'+encodeURIComponent(selected);
function fileUri(relative){
  return 'content://com.android.externalstorage.documents/tree/'+encodeURIComponent(selected)
    +'/document/'+encodeURIComponent(selected+'/'+relative);
}
function generate(withEmbedded){
  const books=[];
  for(let work=0;work<12;work++){
    const book='QA Book '+String(work+1).padStart(2,'0');
    const author='QA Author '+String(Math.floor(work/4)+1).padStart(2,'0');
    const total=work===11?34:28;
    for(let part=1;part<=total;part++){
      let directory,stem;
      if(work<3){
        directory=author+'/'+book;
        stem=String(part).padStart(3,'0')+' - Chapter '+String(part).padStart(2,'0');
      }else if(work<7){
        directory=author+'/'+book+'/CD '+(part<=14?'01':'02');
        stem=String((part-1)%14+1).padStart(2,'0')+' - Chapter '+String((part-1)%14+1).padStart(2,'0');
      }else if(work<9){
        directory='';
        stem=book+' - Part '+String(part).padStart(2,'0');
      }else{
        directory=author+'/QA Series/'+book+'/Part '+(part<=14?'1':'2');
        stem=String(part).padStart(3,'0')+' - Track '+String(part).padStart(2,'0');
      }
      const name=(directory?directory+'/':'')+stem+'.mp3';
      let album;
      if(part%13===0)album='';
      else if(part%11===0)album='Disc '+(Math.floor(part/14)+1);
      else if(part%7===0)album='Chapter '+String(part).padStart(2,'0');
      else if(part%5===0)album=book+' (Disc 2)';
      else album=book;
      books.push({
        id:'synthetic-'+books.length,
        rootUri:root,uri:fileUri(name),space:'ArchivistQADiagnostic342',
        format:'Audio',title:stem,author:'',series:'',genre:'',
        available:true,needsReview:true,coverShape:'square',
        fileSize:1800,workKey:'inferred-file:'+stem+':'+books.length,
        embeddedMetadata:withEmbedded?{
          workTitle:album,
          trackNumber:part,
          discNumber:part<=14?1:2,
        }:undefined,
      });
    }
  }
  assert.equal(books.length,342);
  return books;
}
const results=[];
function verify(name,books){
  const works=groupLocalWorks(books);
  const keys=audioWorkGroupKeys(books);
  const fileCounts=works.map(work=>work.files).sort((a,b)=>a-b);
  results.push({stage:name,works:works.length,uniqueKeys:new Set(keys.values()).size,
    reviewWorks:localWorksForReview(books).length,files:fileCounts.reduce((a,b)=>a+b,0),
    workSizes:fileCounts});
  assert.equal(works.length,12,name+' must keep 342 chapters in 12 logical works, not 73');
  assert.equal(new Set(keys.values()).size,12,name+' group keys must agree with works');
  assert.deepEqual(fileCounts,[...Array(11).fill(28),34],name+' cannot lose/misassign chapters');
  assert.equal(localWorksForReview(books).length,12,name+' Needs Attention must be work-level');
}
const discovery=generate(false);
assert.deepEqual(decodedPathParts(root),['Documents','ArchivistQADiagnostic342'],
  'SAF tree URI root must resolve to same decoded path components as document URIs');
verify('find-books/no-embedded-tags',discovery);
const postId3=generate(true);
verify('identify/id3-conflicting-tags',postId3);
verify('identify/metadata-synchronised',synchronizeLocalMetadata(postId3).books);

// Negative case: a mixed author folder containing two distinct album identities
// remains two works; do not restore a "merge everything in same folder" bug.
const a=postId3[0],b=postId3[100];
const mixed=[
  {...a,uri:fileUri('QA Author 04/Mixed/'+ '01 - Chapter 01.mp3'),embeddedMetadata:{workTitle:'Dune'}},
  {...a,uri:fileUri('QA Author 04/Mixed/'+ '02 - Chapter 02.mp3'),embeddedMetadata:{workTitle:'Dune'}},
  {...b,uri:fileUri('QA Author 04/Mixed/'+ '03 - Chapter 03.mp3'),embeddedMetadata:{workTitle:'Project Hail Mary'}},
  {...b,uri:fileUri('QA Author 04/Mixed/'+ '04 - Chapter 04.mp3'),embeddedMetadata:{workTitle:'Project Hail Mary'}},
];
assert.deepEqual(groupLocalWorks(mixed).map(work=>work.files).sort(),[2,2],
  'separate named albums sharing a real folder must stay distinct');

// Negative case: complete standalone volumes in a series are not chapters.
const series=['The Colour of Magic','The Light Fantastic','Equal Rites'].map((title,index)=>({
  ...a,uri:fileUri('Writer/Discworld/'+String(index+1).padStart(2,'0')+'. '+title+'.m4b'),
  title,series:'Discworld',seriesNumber:index+1,fileSize:130*1024*1024,
  embeddedMetadata:undefined,workKey:'series:'+title
}));
assert.equal(groupLocalWorks(series).length,3,'independent full books cannot be merged');

console.log('SCANNER_WORK_REGRESSION_RESULTS '+JSON.stringify(results));
console.log('PASS: 342 native SAF fixture groups as 12 works at every phase; real separate books stay separate');
