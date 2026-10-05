const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/pageTurnLoop.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:mod.exports,setTimeout,clearTimeout});

{
  const pending=new Map();let id=0,turns=0,stops=0,done;
  const stop=mod.exports.startPageTurnLoop({firstDelay:900,restDelay:1600,reset(){},animate(fn){turns++;done=fn;},stop(){stops++;},schedule(fn,delay){pending.set(++id,{fn,delay});return id;},cancel(id){pending.delete(id);}});
  for(let i=0;i<4;i++){const [key,task]=pending.entries().next().value;pending.delete(key);assert.equal(task.delay,i?1600:900);task.fn();assert.equal(turns,i+1);done(true);}
  const [key,task]=pending.entries().next().value;pending.delete(key);task.fn();stop();done(true);assert.equal(pending.size,0);assert.equal(stops,1);stop();assert.equal(stops,1);
}

{
  const pending=new Map();let id=0,stops=0,done;
  const stop=mod.exports.startPageTurnLoop({
    firstDelay:0,restDelay:1600,reset(){},animate(fn){done=fn;},stop(){stops++;},
    preserveCurrentOnStop:true,
    schedule(fn,delay){pending.set(++id,{fn,delay});return id;},cancel(id){pending.delete(id);},
  });
  const [key,task]=pending.entries().next().value;pending.delete(key);task.fn();
  stop();
  assert.equal(stops,0,'play/pause reversal must not snap a visible in-flight leaf backwards');
  done(true);
  assert.equal(pending.size,0,'a preserved finishing leaf must not resurrect the stopped ambient loop');
}

console.log('PASS: repeated page turns cancel safely and play/pause can preserve a visible in-flight leaf');
