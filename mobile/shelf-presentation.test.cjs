const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {groupShelfFormats, obviousShelfFormatChoice, sortSeriesWorks} = require('./shelfPresentation.ts');

function work(key, format, extra={}) {
  return {
    key,
    source:'local',
    logicalWorkKey:'frank herbert|dune|1|dune',
    title:'Dune',
    author:'Frank Herbert',
    series:'Dune',
    seriesNumber:1,
    format,
    available:true,
    readingState:'not-started',
    favourite:false,
    rating:0,
    ...extra,
  };
}

const grouped=groupShelfFormats([
  work('epub','EPUB',{coverUri:'cover.jpg'}),
  work('pdf','PDF'),
  work('audio','Audio',{readingState:'in-progress',favourite:true,rating:8}),
]);
assert.equal(grouped.length,1,'different formats of one logical local work should collapse on Shelf');
assert.deepEqual(grouped[0].formatChoices.map(item=>item.format),['EPUB','PDF','Audio']);
assert.equal(grouped[0].format,'Audio','active format should represent the grouped work');
assert.equal(grouped[0].readingState,'in-progress');
assert.equal(grouped[0].favourite,true);
assert.equal(grouped[0].rating,8);
assert.equal(obviousShelfFormatChoice(grouped[0].formatChoices)?.key,'audio','single active format resumes directly');
assert.equal(obviousShelfFormatChoice(grouped[0].formatChoices,'pdf')?.key,'pdf','remembered explicit format wins');

const ambiguous=groupShelfFormats([work('epub2','EPUB'),work('pdf2','PDF')])[0];
assert.equal(obviousShelfFormatChoice(ambiguous.formatChoices),null,'first open with no active or remembered format must ask');

const sameFormat=groupShelfFormats([
  work('edition-a','EPUB'),
  work('edition-b','EPUB'),
]);
assert.equal(sameFormat.length,2,'same-format editions must not be silently collapsed by format grouping');

assert.deepEqual(sortSeriesWorks([
  {title:'Book Three',seriesNumber:3},
  {title:'Novella',seriesNumber:2.5},
  {title:'Prequel',seriesNumber:0.5},
  {title:'Book One',seriesNumber:1},
]).map(item=>item.seriesNumber),[0.5,1,2.5,3]);

console.log('PASS: Shelf format grouping, resume choice and decimal series order');
