const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const tick=source.match(/^function tick\(now\).*$/m)[0];
// rAF timestamps refer to the start of a frame; a Play/Pause handler can run
// later in that same frame and set transitionStart ahead of the rAF timestamp.
for(const [phase,from,to] of [['opening',.999,1],['closing',.001,0],['opening',.5,1],['closing',.5,0]]){
 const c=vm.createContext({phase,activeTurn:false,opening:from,transitionFrom:from,transitionTo:to,transitionStart:100,reduced:false,ease:t=>t*t*(3-2*t),paint:()=>{},requestAnimationFrame:()=>{}});
 vm.runInContext(tick,c);
 for(const time of [80,99,100,101,150,1100]){
  vm.runInContext('tick('+time+')',c);
  assert(c.opening>=Math.min(from,to)&&c.opening<=Math.max(from,to),`Book hinge escaped valid range after ${phase}: ${c.opening}, frame=${time}`);
 }
}
const c=vm.createContext({phase:'turning',activeTurn:true,turnStart:100,skipping:true,reduced:false,ease:t=>t*t*(3-2*t),paint:()=>{},requestAnimationFrame:()=>{}});
vm.runInContext(tick,c);vm.runInContext('tick(80)',c);assert.equal(c.turn,0,'A frame older than a turn request must not advance or reverse the page');
console.log('PASS: stale animation-frame timestamps cannot fling the book outside its hinge bounds');
