const fs=require('fs');const vm=require('vm');const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};vm.runInNewContext(`(function(require,module,exports){${out}\n})(require,module,module.exports)`,{require,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/libraryOrganisation.ts');const assert=(v,m)=>{if(!v)throw Error(m)};
const works=[
 {source:'local',canonicalKey:'local:a',title:'Alpha',author:'A',series:'S',genre:'Fantasy',format:'EPUB',space:'Main',available:true,readingState:'in-progress',rating:8,favourite:true},
 {source:'server',canonicalKey:'server-work:x:1',title:'Beta',author:'B',series:'',genre:'History',format:'Audio',space:'Server',available:true,readingState:'not-started',rating:0,favourite:false},
];
const shelf={id:'s',name:'Fav fantasy',source:'all',format:'',author:'',series:'',genre:'Fantasy',space:'',readingState:'',minimumRating:6,favouriteOnly:true,availableOnly:false,sort:'rating',createdAt:''};
assert(x.applySmartShelf(works,shelf).map(w=>w.title).join(',')==='Alpha','smart shelf filtering');
let c={id:'c',name:'C',canonicalKeys:[],createdAt:''};c=x.toggleCollectionWork(c,'server-work:x:1');assert(c.canonicalKeys[0]==='server-work:x:1','collection add');c=x.toggleCollectionWork(c,'server-work:x:1');assert(c.canonicalKeys.length===0,'collection remove');
assert(x.collectionWorks(works,{...c,canonicalKeys:['local:a']})[0].title==='Alpha','collection membership');
console.log('library-organisation.test.cjs passed');
