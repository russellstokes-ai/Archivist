const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'web/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
for(const file of ['app.js','index.html','style.css']){
  assert.equal(fs.readFileSync(path.join(root,'web',file),'utf8'),
    fs.readFileSync(path.join(root,'archivist/app/web',file),'utf8'),
    'root and packaged Atlas must be byte-identical: '+file);
}
assert(html.includes('id="atlas-rings"'),'missing Atlas rings mount');
assert(html.includes('id="atlas-more"'),'missing progressive Atlas paging');
assert(app.includes("renderAtlasRings(summaryData)"),'Atlas rings must consume published summary');
assert(app.includes("atlasDisplayLimit=120"),'Atlas initial render must be bounded');
assert(app.includes("Math.min(600,atlasDisplayLimit+120)"),'Atlas incremental limit must be explicit');
assert(app.includes("coverBudget=24"),'Atlas initial cover art probes must be bounded');
assert(app.includes("published works shown"),'Atlas must reflect published catalogue');
assert(!app.includes('for(let iteration=0;iteration<65;iteration++)'),'quadratic force loop unexpectedly restored');
assert(app.includes("params.set('year',String(libraryYear))"),'year ring must lead to actual filtered catalogue');
assert(app.includes("params.set('genre',libraryGenre)"),'genre ring must lead to actual filtered catalogue');
assert(css.includes('@media(max-width:759px)'),'Atlas must fit phone/HA ingress widths');

// Real ring function executes with a small deterministic SVG/DOM fixture.
class Node {
  constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.dataset={};this.textContent='';this.className='';this.type='';this.onclick=null}
  replaceChildren(...items){this.children=items}
  append(...items){this.children.push(...items)}
  setAttribute(name,value){this.attributes[name]=String(value)}
}
const rootElement=new Node('div');
const sandbox={
  document:{createElementNS:(ns,tag)=>new Node(tag),createElement:tag=>new Node(tag)},
  $:id=>id==='atlas-rings'?rootElement:null,
  element:(tag,text)=>{const e=new Node(tag);if(text!==undefined)e.textContent=String(text);return e},
  show:page=>sandbox.shown=page,
  loadBooks:async()=>sandbox.loaded=true,
  libraryFormat:'',libraryGenre:'',libraryYear:0,
  Math,Number,String,Array,Object,
};
sandbox.$=id=>id==='atlas-rings'?rootElement:{value:''};
const fragment=app.slice(app.indexOf('const atlasRingPalette='));
assert(fragment.startsWith('const atlasRingPalette='),'ring function must be independently testable');
vm.runInNewContext(fragment+"\nthis.testRingRender=renderAtlasRings;renderAtlasRings({genres:[{name:'Adventure',count:3},{name:'Fantasy',count:2}],formats:[{name:'Audio',count:2}],years:[{name:'1994',count:1}]});",sandbox);
assert.equal(rootElement.children.length,3,'render each of the three canonical Atlas ring families');
const genreCard=rootElement.children[0];
const ring=genreCard.children[1].children[0],legend=genreCard.children[1].children[1];
assert.equal(ring.tag,'svg','ring must render true browser SVG geometry');
assert.equal(legend.children.length,2,'genre legend must use actual published counts');
assert.equal(genreCard.children[0].textContent,'Genres');
assert.equal(ring.children[2].attributes['stroke-dashoffset']!==undefined,true);
legend.children[0].onclick();
assert.equal(sandbox.libraryGenre,'Adventure');
assert.equal(sandbox.shown,'library','genre must open existing filtered Library');
rootElement.replaceChildren();
sandbox.testRingRender({genres:[],formats:[],years:[]});
assert.equal(rootElement.children.length,3,'empty library ring state must stay functional');
console.log('PASS: published Atlas bounded graph, cover budgets, three SVG rings, genre filter and mirrored UI');
