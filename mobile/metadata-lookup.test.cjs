const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};const req=(id)=>require(id);vm.runInNewContext('(function(require,module,exports){'+out+'\n})(req,module,module.exports)',{req,require:req,module:mod,exports:mod.exports,AbortController,URLSearchParams,setTimeout,clearTimeout,fetch:async()=>{throw Error('network disabled in unit test')}});return mod.exports;}
const x=load(__dirname+'/metadataLookup.ts');

const input={title:'A Wizard of Earthsea',author:'Ursula K. Le Guin',series:'Earthsea',publishedYear:1968};
const exact={provider:'open-library',providerId:'OL1W',title:'A Wizard of Earthsea',authors:['Ursula K. Le Guin'],series:['Earthsea'],publishedYear:1968,coverUri:'https://cover'};
assert(x.scoreMetadataMatch(input,exact)>.95);

const subtitle={provider:'google-books',providerId:'g1',title:'A Wizard of Earthsea: The Earthsea Cycle, Book 1',authors:['Ursula Le Guin'],publishedYear:1968,coverUri:'https://cover'};
assert(x.scoreMetadataMatch(input,subtitle)>.86,'subtitle variants with a strong author should still match');

const wrongAuthor={provider:'google-books',providerId:'g2',title:'A Wizard of Earthsea',authors:['Someone Else'],publishedYear:1968,coverUri:'https://wrong'};
assert(x.scoreMetadataMatch(input,wrongAuthor)<.86,'right title but wrong author must not auto-match');

const missingAuthorInput={title:'Dune'};
const exactTitleOnly={provider:'open-library',providerId:'dune-wrong',title:'Dune',authors:['Frank Herbert'],publishedYear:1965,coverUri:'https://cover'};
assert(x.scoreMetadataMatch(missingAuthorInput,exactTitleOnly)<.86,'exact title alone must never auto-publish');

const candidateMissingAuthor={provider:'open-library',providerId:'no-author',title:'Dune',authors:[],publishedYear:1965,coverUri:'https://cover'};
assert(x.scoreMetadataMatch({title:'Dune',author:'Frank Herbert'},candidateMissingAuthor)<.86,'candidate without author evidence must not auto-match');

const wrongSeries={provider:'open-library',providerId:'wrong-series',title:'Dune',authors:['Frank Herbert'],series:['Dune: House Trilogy'],publishedYear:1965,coverUri:'https://cover'};
assert(x.scoreMetadataMatch({title:'Dune',author:'Frank Herbert',series:'Dune Chronicles'},wrongSeries)<.86,'strongly conflicting series evidence must block automatic matching');

const noSeriesCandidate={provider:'google-books',providerId:'no-series',title:'Dune',authors:['Frank Herbert'],publishedYear:1965,coverUri:'https://cover'};
assert(x.scoreMetadataMatch({title:'Dune',author:'Frank Herbert',series:'Dune Chronicles'},noSeriesCandidate)>.86,'missing provider series data should be neutral, not a false conflict');

const isbnInput={title:'Anything',author:'Unknown',isbn:'9780547773742'};
const isbnCandidate={provider:'open-library',providerId:'OL2W',title:'The Hobbit',authors:['J. R. R. Tolkien'],isbns:['978-0-547-77374-2'],coverUri:'https://cover'};
assert.equal(x.scoreMetadataMatch(isbnInput,isbnCandidate),1,'exact ISBN must override fuzzy text');

const differentIsbn={provider:'google-books',providerId:'g3',title:'Anything',authors:['Unknown'],isbns:['9780000000001'],coverUri:'https://cover'};
assert.equal(x.scoreMetadataMatch(isbnInput,differentIsbn),.25,'known ISBN must reject a different identifier even when title/author match');

const noIdentifierCandidate={provider:'google-books',providerId:'g4',title:'Anything',authors:['Unknown'],coverUri:'https://cover'};
assert.equal(x.scoreMetadataMatch(isbnInput,noIdentifierCandidate),.25,'known ISBN must not fall back to fuzzy matching when a candidate omits identifiers');

assert.equal(x.bestMetadataMatch(input,[wrongAuthor],.86),null);
assert.equal(x.bestMetadataMatch(input,[exact,subtitle],.86).providerId,'OL1W');
assert.equal(x.bestMetadataMatch(missingAuthorInput,[exactTitleOnly],.86),null);
assert.equal(x.bestMetadataMatch(isbnInput,[differentIsbn,isbnCandidate],.86).providerId,'OL2W');

console.log('PASS: metadata matching is identifier-first and requires strong title+author evidence for fuzzy publication');
