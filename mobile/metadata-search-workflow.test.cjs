const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {applyManualCluesToWork,acceptBookCandidateForWork}=require('./metadataSearchWorkflow.ts');

function track(id,title,trackNumber){
  return {
    id,uri:'file:///audio/'+id+'.mp3',rootUri:'file:///audio',title,author:'',series:'',genre:'',
    format:'Audio',space:'Audio',available:true,coverShape:'square',needsReview:true,
    embeddedMetadata:{title,workTitle:'Dune',trackNumber,discNumber:1},
  };
}
const source=[track(1,'Chapter One',1),track(2,'Chapter Two',2)];
const clues=applyManualCluesToWork(source,source.map(item=>item.uri),{
  title:'Dune',author:'Frank Herbert',series:'Dune',genre:'',description:'',
});
assert.equal(clues[0].author,'Frank Herbert');
assert.equal(clues[0].needsReview,true,'Save clues must not silently accept the book');
assert.equal(clues[0].embeddedMetadata.trackNumber,1);

const candidate={
  provider:'openlibrary',providerId:'/works/OL1W',
  fields:{title:'Dune',author:'Frank Herbert',genre:'Science Fiction',publisher:'Ace',publishedYear:1965,description:'Novel'},
  coverUri:'https://covers.example/dune.jpg',score:96,confidence:'high',exactIdentifier:false,reasons:['strong title match'],query:'Dune',
};
const accepted=acceptBookCandidateForWork(clues,clues.map(item=>item.uri),candidate);
assert.equal(accepted[0].genre,'Science Fiction');
assert.equal(accepted[0].publisher,'Ace');
assert.equal(accepted[0].needsReview,false);
assert.equal(accepted[0].embeddedMetadata.trackNumber,1,'Accept metadata must not replace chapter/part properties');
assert.equal(accepted[1].embeddedMetadata.trackNumber,2,'Each physical part keeps its own ordering data');
assert.equal(accepted[0].uri,source[0].uri);
console.log('PASS: metadata search workflow preserves chapter/part structure while saving clues and accepting work metadata');

const corrected=acceptBookCandidateForWork(applyManualCluesToWork(source,source.map(b=>b.uri),{title:'Dun',author:'Frank',series:'',genre:''}),source.map(b=>b.uri),candidate);
assert.equal(corrected[0].title,'Dune','explicit candidate acceptance must replace incomplete manual search clues');
assert.equal(corrected[0].author,'Frank Herbert');
assert.equal(corrected[0].metadataProvenance.title,'manual');
