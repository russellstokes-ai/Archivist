const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const phase=source.match(/^function setPhase\(next,data\).*$/m)[0];
const tick=source.match(/^function tick\(now\).*$/m)[0];
for(const next of ['closing','opening']){
 const context=vm.createContext({phase:'turning',activeTurn:true,opening:.6,turn:.4,direction:1,skipping:false,reduced:false,performance:{now:()=>100},transitionFrom:0,transitionTo:0,transitionStart:0,turnStart:0,ease:t=>t,paint:()=>{},requestAnimationFrame:()=>{}});
 vm.runInContext('function commitTurn(){activeTurn=false;turn=0;} function prepareTurn(){activeTurn=true;turn=0;}'+phase,context);
 vm.runInContext(`setPhase('${next}',{});`,context);
 assert.equal(context.activeTurn,false,'A hinge transition must not retain a frozen, half-turned page');
}
for(const [phaseName,duration,from,to] of [['opening',900,0,1],['closing',1000,1,0]]){
 const context=vm.createContext({phase:phaseName,activeTurn:false,opening:from,transitionFrom:from,transitionTo:to,transitionStart:0,reduced:false,ease:t=>t,paint:()=>{},requestAnimationFrame:()=>{}});
 vm.runInContext(tick,context);vm.runInContext(`tick(${duration})`,context);
 assert.equal(context.opening,to,'Canvas hinge must finish at the same time as the player phase controller');
}
console.log('PASS: interrupted page turns settle before hinge movement and opening/closing timings match the player');
