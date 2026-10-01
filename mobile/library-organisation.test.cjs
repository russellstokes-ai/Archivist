const fs=require('fs');const vm=require('vm');const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};vm.runInNewContext(`(function(require,module,exports){${out}\n})(require,module,module.exports)`,{require,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/libraryOrganisation.ts');const assert=(v,m)=>{if(!v)throw Error(m)};
const works=[
 {source:'local',canonicalKey:'local:a',title:'Alpha',author:'A',series:'S',genre:'Fantasy',format:'EPUB',space:'Main',available:true,readingState:'in-progress',rating:8,favourite:true},
 {source:'server',canonicalKey:'server:b',title:'Beta',author:'B',series:'',genre:'History',format:'Audio',space:'Server',available:true,readingState:'not-started',rating:0,favourite:false},
 {source:'server',canonicalKey:'server:c',title:'Gamma',author:'C',series:'S2',genre:'Fantasy',format:'Audio',space:'Server',available:false,readingState:'finished',rating:10,favourite:false},
];
const shelf={id:'s',name:'Fav fantasy',source:'all',format:'',author:'',series:'',genre:'Fantasy',space:'',readingState:'',minimumRating:6,favouriteOnly:true,availableOnly:false,sort:'rating',createdAt:''};
assert(x.applySmartShelf(works,shelf).map(w=>w.title).join(',')==='Alpha','legacy smart shelf filtering');
const nested={kind:'group',mode:'all',children:[
 {kind:'group',mode:'any',children:[
   {kind:'rule',field:'genre',operator:'equals',value:'Fantasy'},
   {kind:'rule',field:'format',operator:'equals',value:'Audio'},
 ]},
 {kind:'rule',field:'rating',operator:'at-least',value:'8'},
]};
const advanced={...shelf,genre:'',minimumRating:0,favouriteOnly:false,rules:nested};
assert(x.applySmartShelf(works,advanced).map(w=>w.title).join(',')==='Alpha,Gamma','nested ALL/ANY');
let edited=x.addGroupAtPath(x.emptySmartShelfRules(),[]);
edited=x.addRuleAtPath(edited,[0],{kind:'rule',field:'available',operator:'is-false',value:''});
assert(edited.children[0].kind==='group'&&edited.children[0].children.length===1,'nested group edit');
edited=x.replaceRuleNode(edited,[0,0],{kind:'rule',field:'favourite',operator:'is-true',value:''});
assert(edited.children[0].children[0].field==='favourite','nested rule replace');
edited=x.removeRuleNode(edited,[0,0]);
assert(edited.children[0].children.length===0,'nested rule remove');
const sanitized=x.sanitizeRuleGroup({kind:'group',mode:'any',children:[{kind:'rule',field:'genre',operator:'contains',value:'fan'}]});
assert(sanitized.mode==='any'&&sanitized.children.length===1,'rule sanitization');
let c={id:'c',name:'C',canonicalKeys:[],createdAt:''};c=x.toggleCollectionWork(c,'server:b');assert(c.canonicalKeys[0]==='server:b','collection add');c=x.toggleCollectionWork(c,'server:b');assert(c.canonicalKeys.length===0,'collection remove');
assert(x.collectionWorks(works,{...c,canonicalKeys:['local:a']})[0].title==='Alpha','collection membership');
console.log('PASS: nested Smart Shelf rules and collection organisation');
