const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');

function load(file,extra={}){
  const src=fs.readFileSync(__dirname+'/'+file,'utf8');
  const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  const req=id=>id==='./playback'?{}:require(id);
  vm.runInNewContext(`(function(require,module,exports){${out}\n})(req,module,module.exports)`,{req,require:req,module:mod,exports:mod.exports,setTimeout,clearTimeout,...extra});
  return mod.exports;
}

const player=load('playerExperience.ts');
const loop=load('pageTurnLoop.ts');

const sequence=[
  {playing:true, visible:false,reduceMotion:false,expect:'closed',label:'playing in background'},
  {playing:true, visible:true, reduceMotion:false,expect:'turning',label:'return to Now while still playing'},
  {playing:false,visible:true, reduceMotion:false,expect:'closed',label:'pause on visible player'},
  {playing:true, visible:true, reduceMotion:false,expect:'turning',label:'rapid play after pause'},
  {playing:true, visible:false,reduceMotion:false,expect:'closed',label:'leave player again'},
  {playing:true, visible:true, reduceMotion:false,expect:'turning',label:'second return must behave like first return'},
];
for(const step of sequence){
  assert.equal(player.playerMotionState(step),step.expect,step.label);
}

assert.equal(player.livingBookHingeDuration(0,1,player.PLAYER_MOTION_TIMING.openMs,false),player.PLAYER_MOTION_TIMING.openMs,'fresh re-entry must perform a full clean opening');
assert.equal(player.livingBookHingeDuration(.5,0,player.PLAYER_MOTION_TIMING.closeMs,false),Math.round(player.PLAYER_MOTION_TIMING.closeMs*.5),'pause reversal must close only the remaining hinge distance');
assert.equal(player.PLAYER_MOTION_TIMING.pageTurnMs,3000,'ambient page turns must run at half the previous visual speed');
assert.equal(player.PLAYER_MOTION_TIMING.closeMs,1000,'Pause must have a deliberate smooth close duration');
assert.equal(player.livingBookHingeDuration(.35,1,player.PLAYER_MOTION_TIMING.openMs,false),Math.round(player.PLAYER_MOTION_TIMING.openMs*.65),'rapid play reversal must reopen only the remaining hinge distance');

const pending=new Map();let id=0,oldDone,newDone,stops=0,oldTurns=0,newTurns=0;
const schedule=(fn,delay)=>{const key=++id;pending.set(key,{fn,delay});return key;};
const cancel=key=>pending.delete(key);

const stopOld=loop.startPageTurnLoop({
  firstDelay:520,restDelay:300,reset(){},
  animate(done){oldTurns++;oldDone=done;},
  stop(){stops++;},
  preserveCurrentOnStop:false,schedule,cancel,
});
{
  const [key,task]=pending.entries().next().value;pending.delete(key);task.fn();
}
assert.equal(oldTurns,1);
stopOld();
assert.equal(stops,1,'leaving the player must stop the in-flight native page animation');
oldDone(true);
assert.equal(pending.size,0,'an old page-turn callback must not schedule another turn after player exit');

const stopNew=loop.startPageTurnLoop({
  firstDelay:520,restDelay:300,reset(){},
  animate(done){newTurns++;newDone=done;},
  stop(){stops++;},
  preserveCurrentOnStop:false,schedule,cancel,
});
{
  const [key,task]=pending.entries().next().value;
  assert.equal(task.delay,520,'a returned player must start a fresh first-turn delay, never resume an old page mid-turn');
  pending.delete(key);task.fn();
}
assert.equal(newTurns,1);
newDone(true);
assert.equal([...pending.values()][0].delay,300,'only the new visible session may schedule the next ambient turn');
stopNew();

console.log('PASS: Test 10.1 Living Book transition sequence survives leave/return, pause/play reversal and stale page callbacks');
