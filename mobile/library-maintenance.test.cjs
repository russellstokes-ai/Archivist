const fs=require('fs');
const vm=require('vm');
const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};vm.runInNewContext(`(function(require,module,exports){${out}\n})(require,module,module.exports)`,{require,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/libraryMaintenance.ts');
const assert=(v,m)=>{if(!v)throw Error(m)};
const works=[
  {source:'local',author:'',series:'Series',genre:'Fantasy',coverUri:''},
  {source:'downloaded',author:'Author',series:'',genre:'',coverUri:'file://cover.jpg'},
  {source:'server',author:'Author',series:'Series',genre:'Fantasy',coverUri:''},
];
const counts=x.metadataGapCounts(works);
assert(counts.author===1,'missing author count');
assert(counts.series===1,'missing series count');
assert(counts.genre===1,'missing genre count');
assert(counts.cover===1,'server cover routes must not be falsely classified as missing');
assert(x.matchesMetadataGap(works[0],'cover')===true,'device work without cover must match');
assert(x.matchesMetadataGap(works[2],'cover')===false,'remote server work must not infer missing cover from coverUri');
const quality=x.metadataCompleteness(works[1]);
assert(quality.complete===false&&quality.missing.join(',')==='series,genre','metadata completeness');
console.log('library-maintenance.test.cjs passed');


const advanced=x.advancedMetadataCompleteness({
  title:'Dune',author:'Frank Herbert',series:'Dune',seriesNumber:1,genre:'Science Fiction',
  coverUri:'cover.jpg',publishedYear:1965,narrator:'Simon Vance',publisher:'Chilton',
  isbn:'9780441172719',language:'en',description:'A desert world.',format:'Audio',source:'local',
});
assert(advanced.complete===true,'advanced metadata complete');
assert(advanced.missing.length===0,'advanced metadata missing should be empty');

const incomplete=x.advancedMetadataCompleteness({title:'Book',author:'Author',series:'Saga',format:'Audio',source:'local'});
assert(incomplete.complete===false,'advanced incomplete metadata');
assert(incomplete.missing.includes('seriesNumber'),'missing series number');
assert(incomplete.missing.includes('narrator'),'missing narrator');
assert(incomplete.missing.includes('identifier'),'missing identifier');

const advancedCounts=x.advancedMetadataGapCounts([
  {title:'One',author:'A',series:'S',seriesNumber:1,format:'EPUB',source:'local'},
  {title:'Two',author:'B',series:'',format:'Audio',source:'local'},
]);
assert(advancedCounts.series===1,'advanced series gap count');
assert(advancedCounts.narrator===1,'advanced narrator gap count');
console.log('advanced library metadata maintenance passed');
