const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
async function load(file){return require('./'+file);}
(async()=>{
  const x=await load('atlasInteraction.ts');
  const {buildAtlasUniverse}=await load('atlasUniverse.ts');
  const works=Array.from({length:2000},(_,i)=>({key:'w'+i,canonicalKey:'w'+i,title:'Book '+i,author:'Author '+i%75,series:'Series '+i%50,genre:i%37===0?'':'Genre '+i%37,format:i%2?'Audio':'Ebook',space:'Books',source:'local'}));
  const start=performance.now(),graph=buildAtlasUniverse(works);
  const elapsed=performance.now()-start;
  const reversed=buildAtlasUniverse([...works].reverse());
  assert.deepEqual(graph,reversed,'Input order must not change positions or sampling');
  assert.equal(graph.nodes.filter(n=>n.kind==='work').length,120);
  assert.equal(graph.hiddenWorks,1880);
  const byId=new Map(graph.nodes.map(n=>[n.id,n]));
  for(const edge of graph.edges){assert(byId.has(edge.from)&&byId.has(edge.to));if(edge.kind==='genre'){
    const hub=byId.get(edge.from),work=byId.get(edge.to);
    assert(hub.label===work.genre||hub.label==='Other genres','No invented cross-genre relationships');
  }}
  assert(graph.nodes.some(n=>n.label==='Other genres'));
  const hidden=works.find(w=>!byId.has('work:'+w.key));
  const focused=buildAtlasUniverse(works,[],[],120,[hidden.key]);
  assert(focused.nodes.some(n=>n.id==='work:'+hidden.key),'Search must promote a hidden work');
  for(const width of [320,360,390,599,600,720,900,1200]){
    const ring=Math.min(width-(width>=940?56:width>=600?48:width<360?28:32),width>=940?720:width>=600?620:520),diameter=ring-64;
    const fit=x.atlasFit(graph.nodes,diameter);
    for(const n of graph.nodes)assert(Math.hypot(fit.x+n.x*fit.scale-diameter/2,fit.y+n.y*fit.scale-diameter/2)<=diameter/2-31,'Fit must keep every node inside its circular viewport');
    const a={x:diameter*.3,y:diameter*.4},b={x:diameter*.6,y:diameter*.55};
    const zoom=x.atlasZoomAt(fit,a,b,fit.scale*2);
    assert(Math.abs((a.x-fit.x)/fit.scale-(b.x-zoom.x)/zoom.scale)<1e-8,'Pinch x anchor');
    assert(Math.abs((a.y-fit.y)/fit.scale-(b.y-zoom.y)/zoom.scale)<1e-8,'Pinch y anchor');
    const node=graph.nodes[0],centre={x:diameter/2,y:diameter/2},transform={x:centre.x-node.x,y:centre.y-node.y,scale:1};
    assert.equal(x.atlasNearest([node],transform,centre,diameter),node.id);
    assert.equal(x.atlasNearest([node],transform,{x:-1,y:-1},diameter),null);
    const constrained=x.atlasConstrain({x:1e8,y:-1e8,scale:2},graph.nodes,diameter);
    assert(constrained.x<1e8&&constrained.y> -1e8,'Pan must not lose the graph');
    assert(graph.nodes.some(n=>Math.hypot(constrained.x+n.x*constrained.scale-diameter/2,constrained.y+n.y*constrained.scale-diameter/2)<diameter/2),'At least one node stays inside circular pan bounds');
  }
  assert.equal(x.atlasZoomAt({x:0,y:0,scale:1},{x:0,y:0},{x:0,y:0},100).scale,3.5);
  const slices=x.atlasBreakdown(works,w=>w.genre||'Unclassified',()=> '#47736F');
  const colours=x.atlasGenrePalette(works.map(w=>w.genre),()=> '#47736F');
  assert.equal(new Set(colours.values()).size,colours.size,'Distinct genre colours within the active library');
  assert.deepEqual(colours,x.atlasGenrePalette([...works].reverse().map(w=>w.genre),()=> '#47736F'));
  assert.equal(buildAtlasUniverse([]).nodes.length,0);
  assert.equal(slices.reduce((sum,s)=>sum+s.count,0),2000);
  assert.equal(x.atlasSummary(slices).reduce((sum,s)=>sum+s.count,0),2000);
  assert.equal(x.atlasSummary(slices).at(-1).label,'Other categories');
  const segments=x.atlasRingSegments([[{label:'Audio',count:1,color:'blue'},{label:'Book',count:3,color:'green'}],slices,slices]);
  assert.equal(segments.length,144);
  assert.equal(segments.filter(s=>s.sector===0&&s.color==='blue').length,12);
  assert.equal(segments.filter(s=>s.sector===0&&s.color==='green').length,36);
  assert(x.atlasRingSegments([[],[],[]]).every(s=>!s.color));
  const overlap=[{id:'a',kind:'genre',label:'Fantasy',x:100,y:100},{id:'b',kind:'genre',label:'Mystery',x:101,y:101}];
  const labels=x.atlasLabels(overlap,{x:0,y:0,scale:1},300,'b',new Set());
  assert(labels.has('b')&&!labels.has('a'),'Selected label wins collision');
  console.log(`Atlas interaction tests passed: 8 viewport widths, pinch anchors, pan bounds, hit testing, label collisions, real chart proportions, 2,000-work sampling/search. Graph build ${elapsed.toFixed(1)}ms (logic only, not frame performance).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
