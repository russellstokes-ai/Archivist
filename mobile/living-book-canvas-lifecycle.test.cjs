const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const moduleUnderTest={exports:{}};
const source=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8')+'\nexport {rendererHtml};';
const compiled=ts.transpileModule(source,{compilerOptions:{module:1,target:9,jsx:2}}).outputText;
const req=id=>id==='react-native'?{StyleSheet:{create:x=>x}}:id==='./playerExperience'?requirePlayer():{};
function requirePlayer(){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/playerExperience.ts','utf8'),{compilerOptions:{module:1,target:9}}).outputText,{exports:mod.exports,require:()=>({})});return mod.exports;}
vm.runInNewContext(compiled,{exports:moduleUnderTest.exports,require:req});
const html=moduleUnderTest.exports.rendererHtml({title:'Dune',author:'Frank Herbert',chapter:'One',number:1,phase:'closed',direction:1,skipping:false,reduceMotion:false,coverMode:'portrait'});
let now=0,nextFrame;
const context=new Proxy({measureText:t=>({width:t.length*8}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
const canvas={width:1000,height:840,getContext:()=>context};
const window={};
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
// Observe actual renderer state; do not replace its animation or phase implementation.
script=script.replace('})();','window.observe=()=>({opening,turn,page,phase,activeTurn});})();');
vm.runInNewContext(script,{window,document:{getElementById:()=>canvas,createElement:()=>({...canvas})},performance:{now:()=>now},requestAnimationFrame:fn=>{nextFrame=fn},Image:class{}});
const state=phase=>window.ArchivistLivingBook.setState({phase,number:1,direction:1,skipping:false,reduceMotion:false});
const frame=delta=>{now+=delta;nextFrame(now);return window.observe();};
state('opening');assert.equal(frame(450).opening,.5,'opening uses canonical 900 ms duration');assert.equal(frame(450).opening,1);
state('open');state('turning');assert.equal(frame(1500).turn,.5,'ambient page takes 3000 ms');
// Pause while turning leaves the leaf active until scheduler completes it.
assert.equal(window.observe().activeTurn,true);assert.equal(frame(1500).turn,1);
state('settling');state('closing');assert.equal(window.observe().activeTurn,false,'settled leaf commits before closing');assert.equal(window.observe().page,4);
assert.equal(frame(500).opening,.5);assert.equal(frame(500).opening,0);state('closed');
state('opening');assert.equal(frame(900).opening,1);state('open');assert.equal(window.observe().page,4,'unchanged chapter must not reset physical leaf on return');
console.log('PASS: production Canvas canonical timing, pause/settle/close and replay lifecycle');
