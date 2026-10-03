const fs=require('fs');
const vm=require('vm');
const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};vm.runInNewContext(`(function(require,module,exports){${out}\n})(require,module,module.exports)`,{require,module:mod,exports:mod.exports});return mod.exports;}
const {shelfRecommendations,recommendationFamily}=load(__dirname+'/shelfRecommendations.ts');
const assert=(v,m)=>{if(!v)throw Error(m)};
const work=(key,format,extra={})=>({key,title:key,author:'Author '+key,series:'',genre:'',format,available:true,readingState:'not-started',rating:0,favourite:false,...extra});
const items=[
  work('read-sf','EPUB',{author:'A One',genre:'Sci-Fi',readingState:'finished',rating:9,favourite:true}),
  work('read-sf-2','EPUB',{author:'A Two',genre:'Sci-Fi',readingState:'finished',rating:8}),
  work('candidate-sf','Ebook',{author:'A Three',genre:'Sci-Fi'}),
  work('candidate-romance','EPUB',{author:'A Four',genre:'Romance',rating:7}),
  work('finished-no','EPUB',{genre:'Sci-Fi',readingState:'finished'}),
  work('unavailable-no','EPUB',{genre:'Sci-Fi',available:false}),
  work('comic-seed','Comic',{genre:'Crime',readingState:'finished',rating:9}),
  work('comic-seed-2','CBZ',{genre:'Crime',readingState:'finished',favourite:true}),
  work('comic-candidate','Comic',{genre:'Crime'}),
  work('audio-seed','Audio',{author:'Narrative A',genre:'History',readingState:'finished',rating:10}),
  work('audio-seed-2','Audiobook',{author:'Narrative B',genre:'History',readingState:'in-progress'}),
  work('audio-candidate','Audio',{genre:'History'}),
];
const rec=shelfRecommendations(items,5);
assert(rec.books.personalised===true,'books should personalise after two meaningful signals');
assert(rec.books.works[0].key==='candidate-sf','owned unread matching taste should rank first');
assert(!rec.books.works.some(x=>x.key==='finished-no'),'finished works must not be recommended');
assert(!rec.books.works.some(x=>x.key==='unavailable-no'),'unavailable works must not be recommended');
assert(rec.comics.works[0].key==='comic-candidate','comic recommendation should stay within comics');
assert(rec.audio.works[0].key==='audio-candidate','audio recommendation should stay within audio');
assert(recommendationFamily('EPUB')==='books'&&recommendationFamily('CBR')==='comics'&&recommendationFamily('Audio')==='audio','format family mapping');
const cold=shelfRecommendations([work('z','EPUB'),work('a','EPUB',{rating:8})],3);
assert(cold.books.personalised===false,'cold start must identify itself as non-personalised');
assert(cold.books.works[0].key==='a','cold start should deterministically prefer stronger owned-library signals');
assert(shelfRecommendations(items,99).books.works.length<=5,'recommendation rows must never exceed five');
console.log('shelf-recommendations.test.cjs passed');
