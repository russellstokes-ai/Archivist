const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {groupLocalWorks,seriesGroups}=require('./libraryGrouping.ts');

const base={space:'Books',available:true,genre:'',identificationConfidence:'high'};
const books=[
  {id:1,uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%2F01%20-%20Dune.epub',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'EPUB',workKey:'frankherbert|dune|1|dune',editionKey:'frankherbert|dune|1|dune|format:epub',...base},
  {id:2,uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%2F01%20-%20Dune.pdf',title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,format:'PDF',workKey:'frankherbert|dune|1|dune',editionKey:'frankherbert|dune|1|dune|format:pdf',...base},
  {id:3,uri:'content://root/document/primary:Books%2FFrank%20Herbert%2FDune%2F02%20-%20Dune%20Messiah.epub',title:'Dune Messiah',author:'Frank Herbert',series:'Dune',seriesNumber:2,format:'EPUB',workKey:'frankherbert|dune|2|dunemessiah',editionKey:'frankherbert|dune|2|dunemessiah|format:epub',...base},
];
const works=groupLocalWorks(books);
assert.equal(works.length,2);
assert.equal(works.find(w=>w.title==='Dune').formats.join(','),'EPUB,PDF');
assert.equal(works.find(w=>w.title==='Dune').editions.length,2);
const series=seriesGroups(books);
assert.equal(series.length,1);
assert.deepEqual(series[0].works.map(w=>w.seriesNumber),[1,2]);

const audio=[
  {id:10,uri:'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F01%20-%20Opening.mp3',title:'01 - Opening',author:'Frank Herbert',series:'',format:'Audio',...base},
  {id:11,uri:'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2F02%20-%20Arrakis.mp3',title:'02 - Arrakis',author:'Frank Herbert',series:'',format:'Audio',...base},
];
const groupedAudio=groupLocalWorks(audio);
assert.equal(groupedAudio.length,1);
assert.equal(groupedAudio[0].title,'Dune');
assert.equal(groupedAudio[0].isMultipartAudio,true);
assert.equal(groupedAudio[0].items.length,2);

console.log('PASS: logical works group formats, series order and multipart audiobooks');
