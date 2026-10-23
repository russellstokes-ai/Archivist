const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(
  fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}
).outputText,file);
const {atlasEligible,atlasSelectPublished,atlasSourceAudit}=require('./atlasSourceSelection.ts');
const {buildAtlasUniverse}=require('./atlasUniverse.ts');
const {atlasBreakdown}=require('./atlasInteraction.ts');

const staged=(id,format='EPUB',published=true,genre='Fantasy',year=2007)=>({
  source:'local',key:'local:scanner-'+id,canonicalKey:'local:scanner-'+id,logicalWorkKey:'scanner-'+id,
  title:'Work '+id,author:'Writer',genre,format,publishedYear:year,available:true,
  coverUri:'file:///test/cover-'+id+'.jpg',
  localWork:{title:'Work '+id,author:'Writer',coverUri:'file:///test/cover-'+id+'.jpg',
    format,needsReview:!published,tracks:[
      {scannerWorkId:'scanner-'+id,scannerPublished:published,format},
    ]},
});
const legacy=(id,review=false,cover=true)=>({
  source:'local',key:'local:legacy-'+id,canonicalKey:'local:legacy-'+id,
  title:'Legacy '+id,author:'Writer',genre:'',format:'Comic',publishedYear:0,available:true,
  coverUri:cover?'file:///test/legacy-cover.jpg':'',
  localWork:{title:'Legacy '+id,author:'Writer',format:'Comic',needsReview:review,
    coverUri:cover?'file:///test/legacy-cover.jpg':'',
    tracks:[{format:'Comic'}]},
});
const published=staged('published');
const reviewed=staged('review', 'Audio',false);
const migrated=legacy('migrated');
const needsReview=legacy('needs-review',true);
const missingCover=legacy('missing-art',false,false);
const brokenFlag=staged('unknown','EPUB',false);
brokenFlag.localWork.needsReview=false;
const all=[published,reviewed,migrated,needsReview,missingCover,brokenFlag];
// Malformed/stale published flags must not leak unreviewed or incomplete works.
const publishedButReview={...staged('stale'),localWork:{...staged('stale').localWork,needsReview:true}};
const publishedNoCover={...staged('no-cover'),localWork:{...staged('no-cover').localWork,coverUri:''},coverUri:''};
const partiallyPublished={...staged('partial'),localWork:{...staged('partial').localWork,tracks:[
 {scannerWorkId:'scanner-partial',scannerPublished:true,format:'Audio'},
 {scannerWorkId:'scanner-partial',scannerPublished:false,format:'Audio'},
]}};
assert.equal(atlasEligible(publishedButReview),true,'Review remains available without hiding discovered books from Atlas');
assert.equal(atlasEligible(publishedNoCover),true,'Cover acquisition must not hide the work from Atlas');
assert.equal(atlasEligible(partiallyPublished),true,'Atlas counts the logical work independently of chapter publication');
assert.equal(atlasSelectPublished([publishedButReview,publishedNoCover,partiallyPublished]).length,3);
assert.deepEqual(atlasSelectPublished(all).map(x=>x.title),['Work published','Work review','Legacy migrated','Work unknown']);
assert.equal(atlasEligible(reviewed),true,'Discovered scanner works enter Atlas before enrichment');
assert.equal(atlasEligible(brokenFlag),true,'Scanner identity keeps a discovered work visible');
assert.equal(atlasEligible(migrated),true,'fully reviewed legacy works remain visible');
assert.equal(atlasEligible(missingCover),false,'incomplete legacy metadata must remain unexposed');
assert.deepEqual(atlasSourceAudit(all,'all'),{
  sourceWorks:6,local:6,localPublished:4,localUnpublished:2,downloaded:0,remote:0,publishedVisible:4,
});

const multipart={...staged('multipart','Audio'),localWork:{
  ...staged('multipart','Audio').localWork,
  tracks:Array.from({length:57},(_,i)=>({scannerWorkId:'scanner-multipart',scannerPublished:true,
    format:'Audio',uri:'content://test/chapter-'+i})),
}};
assert.equal(atlasSelectPublished([multipart]).length,1,'57 audio chapters represent one logical work');
const issues=Array.from({length:40},(_,i)=>staged('comic-'+i,'Comic'));
assert.equal(atlasSelectPublished(issues).length,40,'40 published comic issues are separate works');
assert.equal(atlasSelectPublished(issues,'server').length,0);
const sourceWork={
  source:'server',key:'server:1',canonicalKey:'server-work:example:1',title:'Remote',
  author:'Remote Writer',genre:'',format:'Audio',available:false,coverUri:'',
};
const download={...sourceWork,source:'downloaded',key:'downloaded:1',available:true,
  localWork:{title:'Remote',author:'Remote Writer',needsReview:false,format:'Audio',
    coverUri:'file:///downloaded-cover',tracks:[{format:'Audio'}]},
};
const mixed=atlasSelectPublished([sourceWork,download]);
assert.equal(mixed.length,1,'remote + offline are one logical title');
assert.equal(mixed[0].source,'downloaded','usable offline work wins when server inaccessible');
const atlasWorks=atlasSelectPublished([...all,sourceWork,download]);
const graphs=buildAtlasUniverse(atlasWorks,[],[],120);
assert.equal(graphs.nodes.filter(n=>n.kind==='work').length,5);
assert.ok(graphs.nodes.some(n=>n.kind==='genre'&&n.label==='Unclassified'),
  'missing genre is categorized, never excluded');
const group=[
  atlasBreakdown(atlasWorks,w=>w.genre.trim()||'Unclassified',()=> '#B99A68'),
  atlasBreakdown(atlasWorks,w=>w.format||'Not recorded',()=> '#B99A68'),
  atlasBreakdown(atlasWorks,w=>w.publishedYear?String(w.publishedYear):'Not recorded',()=> '#B99A68'),
];
assert.deepEqual(group.map(g=>g.reduce((sum,entry)=>sum+entry.count,0)),[5,5,5],
  'genre, format and publication-year rings share the same published logical-book universe');
assert.ok(group[2].some(e=>e.label==='Not recorded'),'missing year must be counted');
console.log('PASS: Atlas matches published logical Library works, keeps complete legacy catalogues, includes discovered works awaiting enrichment, supports all three rings and offline dedupe');
