const fs=require('fs');const vm=require('vm');const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};const req=(id)=>require(id);vm.runInNewContext('(function(require,module,exports){'+out+'\n})(req,module,module.exports)',{req,require:req,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/livingBookCover.ts');const assert=(v,m)=>{if(!v)throw Error(m)};
assert(x.isPortraitLivingBookCover({width:600,height:900}),'portrait accepted');
assert(!x.isPortraitLivingBookCover({width:1000,height:1000}),'square audiobook art rejected');
let d=x.chooseLivingBookCover({editionCoverUri:'square.jpg',candidates:[{uri:'weak.jpg',source:'google-books',width:600,height:900,confidence:.60}]});assert(d.kind==='jacket'&&d.uri==='square.jpg','weak work match falls back to jacket');
d=x.chooseLivingBookCover({editionCoverUri:'square.jpg',candidates:[{uri:'book.jpg',source:'open-library',width:640,height:1000,confidence:.78,exactIdentifier:true}]});assert(d.kind==='portrait'&&d.uri==='book.jpg','exact identifier can promote portrait candidate');
const locked=x.lockLivingBookCover(d,{kind:'portrait',uri:'new.jpg',source:'google-books',confidence:1});assert(locked.uri==='book.jpg','session cover remains locked');
console.log('living-book-cover.test.cjs passed');
