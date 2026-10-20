const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const tick=source.match(/^function tick\(now\).*$/m)[0];
let scheduled=0;
const c=vm.createContext({phase:'idle',activeTurn:false,paint:()=>{throw Error('lost canvas')},requestAnimationFrame:()=>scheduled++});
vm.runInContext(tick,c);
try{vm.runInContext('tick(1)',c)}catch{}
assert.equal(scheduled,1,'A failed draw must not permanently stop future frames');
console.log('PASS: rendering survives a failed frame');
