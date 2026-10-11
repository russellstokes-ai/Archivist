const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

// Execute the REAL page-burst functions extracted from Archivist's App.tsx,
// with a deterministic scheduler and the REAL Living Book phase reducer.
// This verifies visible events rather than merely checking source strings.
function extract(source,names){
  const tree=ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const found=new Map();
  function visit(n){
    if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))
      found.set(n.name.text,n.getText(tree).replace(/^export\s+/,''));
    ts.forEachChild(n,visit);
  }
  visit(tree);
  for(const name of names)assert(found.has(name),'Missing runtime function '+name);
  return ts.transpileModule(names.map(name=>found.get(name)).join('\n'),{
    compilerOptions:{module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}
  }).outputText;
}
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const phaseSource=fs.readFileSync(__dirname+'/playerExperience.ts','utf8');
const code=extract(app,['cancelSkipBurst','runSkipBurstStep','turnPages']);
const phase=extract(phaseSource,['reduceLivingBookMotion']);
const reducer=vm.runInNewContext(phase+'\nreduceLivingBookMotion');

function scenario(input,queued,paused=false,cancelImmediately=false){
  let now=0,nextId=1;
  let timers=[];
  const phases=[],directions=[],busy=[],counts=[];
  const livingBookMotionRef={current:{phase:'open',closeAfterSettle:false}};
  const queue={current:[]};
  const epoch={current:0};
  const timer={current:null};
  const running={current:false};
  const visibility={current:true};
  let coverClose=0;
  const ctx={
    skipGeneration:epoch,skipBurstQueue:queue,skipBurstTimer:timer,
    skipBurstRunning:running,skipPlaybackVisible:visibility,
    livingBookMotionRef,
    stopLivingBookPageLoop:()=>{},
    setSkipDirection:d=>directions.push(d),
    setSkipPageCount:n=>counts.push(n),
    setSkipTurning:v=>busy.push(v),
    animateLivingBookCoverClose:()=>{coverClose++},
    reduceMotion:false,playbackVisible:true,
    setTimeout:(fn,delay)=>{const id=nextId++;timers.push({id,at:now+delay,fn});return id},
    clearTimeout:id=>{timers=timers.filter(t=>t.id!==id)},
    transitionLivingBook:event=>{
      const old=livingBookMotionRef.current;
      const next=reducer(old,event);
      livingBookMotionRef.current=next;
      phases.push({event:event.type,phase:next.phase});
      return next;
    },
  };
  const api=vm.runInNewContext(code+'\n({cancelSkipBurst,runSkipBurstStep,turnPages})',ctx);
  api.turnPages(input.count,input.direction);
  if(queued)api.turnPages(queued.count,queued.direction);
  if(paused)ctx.transitionLivingBook({type:'pause-request'});
  if(cancelImmediately)api.cancelSkipBurst();
  let steps=0;
  while(timers.length>0){
    assert(++steps<100,'Timeout loop must terminate');
    timers.sort((a,b)=>a.at-b.at);
    const task=timers.shift();
    now=task.at;task.fn();
  }
  return {phases,directions,busy,counts,now,coverClose,queue:queue.current,phase:livingBookMotionRef.current.phase};
}

for(const [count,direction] of [[3,1],[6,-1]]){
  const result=scenario({count,direction});
  for(const phase of ['turn-request','turn-complete','settle-complete']){
    assert.equal(result.phases.filter(p=>p.event===phase).length,count,
      'Required '+count+' distinct '+phase+' events');
  }
  assert.equal(result.directions.length,count);
  assert(result.directions.every(d=>d===direction),'Skip book directions are wrong');
  assert.equal(result.phase,'open');
  assert.deepEqual(Array.from(result.queue),[]);
  assert.equal(result.busy.at(-1),false);
  assert(result.now>=count*870,'Full existing short-turn physics must finish before committing each page');
}

const consecutive=scenario({count:3,direction:1},{count:6,direction:-1});
assert.equal(consecutive.phases.filter(p=>p.event==='turn-request').length,9);
assert.deepEqual(consecutive.directions.slice(0,3),[1,1,1]);
assert.deepEqual(consecutive.directions.slice(3),[-1,-1,-1,-1,-1,-1]);

const interrupted=scenario({count:6,direction:-1},null,false,true);
assert.equal(interrupted.phases.filter(p=>p.event==='turn-request').length,1);
assert.equal(interrupted.phases.filter(p=>p.event==='turn-complete').length,1,
  'Cancelling should settle the active renderer turn, not leave it spinning forever');
assert.equal(interrupted.phases.filter(p=>p.event==='settle-complete').length,1);
assert.equal(interrupted.phase,'open');
assert.deepEqual(Array.from(interrupted.queue),[]);
assert.equal(interrupted.busy.at(-1),false);
assert.equal(interrupted.now,0,'Cancelled scheduled page-flip timers must never fire');

assert(app.includes('skipBookKeyRef.current!==currentAudioKey'));
assert(app.includes('if(!playbackVisible||reduceMotion)cancelSkipBurst()'));

const paused=scenario({count:6,direction:1},null,true);
assert.equal(paused.phases.filter(p=>p.event==='turn-request').length,1);
assert.equal(paused.coverClose,1,'Pause finishes current turn then closes without phantom pages');
assert.equal(paused.phase,'closing');

console.log('PASS: REAL Archivist controller + phase reducer produces exactly 3 forward, 6 backward, queued 9 mixed-direction, and pause-safe turn sequences');
