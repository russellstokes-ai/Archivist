const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};const req=(id)=>require(id);vm.runInNewContext('(function(require,module,exports){'+out+'\n})(req,module,module.exports)',{req,require:req,module:mod,exports:mod.exports,AbortController,URLSearchParams,setTimeout,clearTimeout,fetch:async()=>{throw Error('network disabled in unit test')}});return mod.exports;}
const x=load(__dirname+'/metadataLookup.ts');
const input={title:'A Wizard of Earthsea',author:'Ursula K. Le Guin',publishedYear:1968};
const exact={provider:'open-library',providerId:'OL1W',title:'A Wizard of Earthsea',authors:['Ursula K. Le Guin'],publishedYear:1968,coverUri:'https://cover'};
assert(x.scoreMetadataMatch(input,exact)>.95);
const subtitle={provider:'google-books',providerId:'g1',title:'A Wizard of Earthsea: The Earthsea Cycle, Book 1',authors:['Ursula Le Guin'],publishedYear:1968,coverUri:'https://cover'};
assert(x.scoreMetadataMatch(input,subtitle)>.86);
const wrongAuthor={provider:'google-books',providerId:'g2',title:'A Wizard of Earthsea',authors:['Someone Else'],publishedYear:1968,coverUri:'https://wrong'};
assert(x.scoreMetadataMatch(input,wrongAuthor)<.86);
const isbnInput={title:'Anything',author:'Unknown',isbn:'9780547773742'};
const isbnCandidate={provider:'open-library',providerId:'OL2W',title:'The Hobbit',authors:['J. R. R. Tolkien'],isbns:['978-0-547-77374-2'],coverUri:'https://cover'};
assert.equal(x.scoreMetadataMatch(isbnInput,isbnCandidate),1);
assert.equal(x.bestMetadataMatch(input,[wrongAuthor],.86),null);
assert.equal(x.bestMetadataMatch(input,[exact,subtitle],.86).providerId,'OL1W');
console.log('PASS: metadata matching rejects plausible wrong books and accepts strong work matches');
