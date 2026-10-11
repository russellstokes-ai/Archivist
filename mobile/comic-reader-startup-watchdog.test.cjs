const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const desired=['clearComicReaderWatch','retryComicReaderOriginOnce','armComicReaderReadyWatch'];
const parsed=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const funcs=new Map();
(function visit(n){
  if(ts.isFunctionDeclaration(n)&&desired.includes(n.name?.text))funcs.set(n.name.text,n.getText(parsed));
  ts.forEachChild(n,visit);
})(parsed);
for(const name of desired)assert(funcs.has(name),'Missing comic startup safeguard: '+name);
const javascript=ts.transpileModule(desired.map(n=>funcs.get(n)).join('\n'),{
  compilerOptions:{module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}
}).outputText;

function scenario(){
  const queue=[];
  const events=[];
  const ready={current:false};
  const attempt={current:false};
  const timer={current:null};
  const identity={current:'comic-A'};
  let counter=0;
  const ctx={
    Platform:{OS:'android'},comicReaderReady:ready,comicWebViewFallbackAttempt:attempt,
    comicReaderReadyTimer:timer,readingIdentity:identity,
    setComicReaderUseDataFallback:val=>events.push({type:'fallback',val}),
    setReaderLoadError:msg=>events.push({type:'error',msg}),
    setError:msg=>events.push({type:'generic-error',msg}),
    setTimeout:(fn,delay)=>{assert.equal(delay,7000);const id=++counter;queue.push({id,fn,delay});return id},
    clearTimeout:id=>{const i=queue.findIndex(q=>q.id===id);if(i>=0)queue.splice(i,1)},
  };
  const fn=vm.runInNewContext(javascript+'\n({clearComicReaderWatch,retryComicReaderOriginOnce,armComicReaderReadyWatch})',ctx);
  return {fn,queue,events,ready,attempt,timer,identity};
}
let s=scenario();
s.fn.armComicReaderReadyWatch('comic-A');
assert.equal(s.queue.length,1);
s.queue.shift().fn(); // WebView did not send onError or ready
assert.equal(s.events.filter(e=>e.type==='fallback').length,1,
  'Blocked primary origin MUST retry as encoded HTML even when Android omits onError');
assert.equal(s.attempt.current,true);
s.fn.armComicReaderReadyWatch('comic-A');
assert.equal(s.queue.length,1);
s.queue.shift().fn(); // fallback also failed to signal ready
assert.equal(s.events.filter(e=>e.type==='fallback').length,1,'Never loop failed comic origins');
assert.equal(s.events.filter(e=>e.type==='error').length,1,'Report a retryable failure after two origins');

s=scenario();
s.fn.armComicReaderReadyWatch('comic-A');
s.ready.current=true; // real comic script sent reader-ready
s.queue.shift().fn();
assert.equal(s.events.length,0,'A ready comic must not restart or display an error');

s=scenario();
s.fn.armComicReaderReadyWatch('comic-A');
s.identity.current='comic-B'; // user switched books during load
s.queue.shift().fn();
assert.equal(s.events.length,0,'Old comic timers must not overwrite the new reader');

s=scenario();
assert.equal(s.fn.retryComicReaderOriginOnce(),true);
assert.equal(s.fn.retryComicReaderOriginOnce(),false);
assert.equal(s.events.filter(e=>e.type==='fallback').length,1);

assert(app.includes("if(message?.type==='reader-ready'&&reading.format==='Comic'){comicReaderReady.current=true;clearComicReaderWatch();}"));
assert(app.includes("if(reading.format==='Comic')armComicReaderReadyWatch(reading.uri||reading.id)"));
assert(app.includes('const closeReader=()=>{++readerOpenGeneration.current;comicWebViewFallbackAttempt.current=false;comicReaderReady.current=false;'));
console.log('PASS: real 7-second comic WebView watchdog, ready signal, stale-book guard, exactly one fallback and no infinite retries');
