const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {filterPublishedWorks,libraryFormatFamilyMatches}=require('./libraryFilters.ts');

const works=[
  {canonicalKey:'book:dune',source:'local',title:'Dune',author:'Frank Herbert',series:'Dune',genre:'Science Fiction',format:'EPUB',space:'Books',readingState:'in-progress',rating:5,favourite:true,available:true},
  {canonicalKey:'comic:asm1',source:'local',title:'Amazing Spider-Man #1',author:'Nick Spencer',series:'Amazing Spider-Man',genre:'Superhero',format:'Comic',space:'Comics',readingState:'not-started',rating:4,favourite:false,available:true},
  {canonicalKey:'audio:phm',source:'server',title:'Project Hail Mary',author:'Andy Weir',series:'',genre:'Science Fiction',format:'Audio',space:'Audiobooks',readingState:'finished',rating:5,favourite:true,available:false},
  {canonicalKey:'pdf:manual',source:'downloaded',title:'Reader Manual',author:'',series:'',genre:'Reference',format:'PDF',space:'Documents',readingState:'not-started',rating:0,favourite:false,available:true},
];

assert.equal(libraryFormatFamilyMatches('EPUB','books'),true);
assert.equal(libraryFormatFamilyMatches('Comic','comics'),true);
assert.equal(libraryFormatFamilyMatches('CBR','comics'),true);
assert.equal(libraryFormatFamilyMatches('Audio','audio'),true);
assert.equal(libraryFormatFamilyMatches('PDF','pdf'),true);

const only=(filters)=>filterPublishedWorks(works,filters).map(work=>work.canonicalKey);
assert.deepEqual(only({formatFamily:'comics'}),['comic:asm1']);
assert.deepEqual(only({format:'Audio'}),['audio:phm']);
assert.deepEqual(only({author:'Frank Herbert'}),['book:dune']);
assert.deepEqual(only({series:'Amazing Spider-Man'}),['comic:asm1']);
assert.deepEqual(only({genre:'Science Fiction'}),['book:dune','audio:phm']);
assert.deepEqual(only({readingState:'finished'}),['audio:phm']);
assert.deepEqual(only({rating:5}),['book:dune','audio:phm']);
assert.deepEqual(only({favouriteOnly:true}),['book:dune','audio:phm']);
assert.deepEqual(only({unknownAuthorOnly:true}),['pdf:manual']);
assert.deepEqual(only({availability:'unavailable'}),['audio:phm']);
assert.deepEqual(only({space:'Comics'}),['comic:asm1']);
assert.deepEqual(only({query:'hail science'}),[],'search remains substring-based rather than token-OR');
assert.deepEqual(only({query:'hail'}),['audio:phm']);
assert.deepEqual(only({collectionKeys:new Set(['book:dune','comic:asm1'])}),['book:dune','comic:asm1']);
assert.deepEqual(only({formatFamily:'books',author:'Frank Herbert',readingState:'in-progress',favouriteOnly:true}),['book:dune']);
assert.deepEqual(only({}),works.map(work=>work.canonicalKey),'clearing filters must restore the full published catalogue');

console.log('PASS: one shared published-library predicate covers format, people, series, genre, state, rating, favourite, availability, collection and query filters');
