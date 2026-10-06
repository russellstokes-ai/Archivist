const fs=require('fs');const vm=require('vm');const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};const req=(id)=>require(id);vm.runInNewContext('(function(require,module,exports){'+out+'\n})(req,module,module.exports)',{req,require:req,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/livingBookCover.ts');const assert=(v,m)=>{if(!v)throw Error(m)};
assert(x.isPortraitLivingBookCover({width:600,height:900}),'portrait accepted');
assert(!x.isPortraitLivingBookCover({width:1000,height:1000}),'square audiobook art rejected');
let d=x.chooseLivingBookCover({editionCoverUri:'square.jpg',candidates:[{uri:'weak.jpg',source:'google-books',width:600,height:900,confidence:.60}]});assert(d.kind==='jacket'&&d.uri==='square.jpg','weak work match falls back to jacket');
d=x.chooseLivingBookCover({editionCoverUri:'square.jpg',candidates:[{uri:'book.jpg',source:'open-library',width:640,height:1000,confidence:.78,exactIdentifier:true}]});assert(d.kind==='portrait'&&d.uri==='book.jpg','exact identifier can promote portrait candidate');
const locked=x.lockLivingBookCover(d,{kind:'portrait',uri:'new.jpg',source:'google-books',confidence:1});assert(locked.uri==='book.jpg','session cover remains locked');

let resolved=x.resolveLivingBookCover({
  format:'Audio',
  editionCoverUri:'square-edition.jpg',
  editionCoverShape:'square',
  livingBookCoverUri:'portrait.jpg',
  livingBookCoverSource:'open-library',
  livingBookCoverConfidence:.97,
});
assert(resolved.kind==='portrait'&&resolved.uri==='portrait.jpg','validated portrait artwork must drive the physical book');
resolved=x.resolveLivingBookCover({
  format:'Audio',
  editionCoverUri:'square-edition.jpg',
  editionCoverShape:'square',
  livingBookCoverUri:'weak-portrait.jpg',
  livingBookCoverSource:'google-books',
  livingBookCoverConfidence:.60,
});
assert(resolved.kind==='jacket'&&resolved.uri==='square-edition.jpg','weak portrait evidence must fall back to an edition-art jacket');
resolved=x.resolveLivingBookCover({
  format:'Audio',
  editionCoverUri:'square-edition.jpg',
  editionCoverShape:'square',
  livingBookCoverUri:'square-edition.jpg',
  livingBookCoverSource:'jacket',
  livingBookCoverConfidence:1,
});
assert(resolved.kind==='jacket','explicit jacket decisions remain jackets');

let session=x.lockLivingBookCoverSession(undefined,'local|device|dune',resolved);
const sameSession=x.lockLivingBookCoverSession(session,'local|device|dune',{kind:'portrait',uri:'late-new-cover.jpg',source:'open-library',confidence:1});
assert(sameSession===session&&sameSession.decision.uri==='square-edition.jpg','late metadata cannot swap the physical cover inside one work session');
const nextSession=x.lockLivingBookCoverSession(session,'local|device|messiah',{kind:'portrait',uri:'messiah.jpg',source:'open-library',confidence:1});
assert(nextSession!==session&&nextSession.decision.uri==='messiah.jpg','switching works must unlock a new physical cover');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
assert(app.includes("lockLivingBookCoverSession(livingBookCoverSessionRef.current,key,next)"),'Player must use the keyed Living Book cover session lock');
assert(app.includes('resolveLivingBookCover({'),'Player must use the production Living Book cover resolver');
assert(!app.includes("current.livingBookCoverSource==='jacket'||(current.format==='Audio'&&!current.livingBookCoverUri)"),'Player must not maintain a parallel cover decision path');

console.log('living-book-cover.test.cjs passed');
