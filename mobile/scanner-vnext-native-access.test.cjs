const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
assert.ok(fs.existsSync(__dirname+'/scannerVNext/nativeAccess.ts'),'Resumable native traversal must exist');
const {NativeSourceAccess}=require('./scannerVNext/nativeAccess.ts');
const source={id:'test-source',rootUri:'content://test/tree/root',name:'Test'};
const file=(id,name)=>({documentId:id,name,mimeType:'audio/mpeg',directory:false});
const dir=(id,name)=>({documentId:id,name,mimeType:'vnd.android.document/directory',directory:true});
// Only the OS/provider boundary is replaced. Traversal, serialization and cancellation are production code.
function provider(tree){
  let count=0;const calls=[],closed=[],active=new Set();
  return {calls,closed,active,
    async beginScope(){const scope='scope-'+(++count);active.add(scope);return {scope,rootDocumentId:'root'};},
    async queryChildren(scope,parent,offset,limit){
      assert.ok(active.has(scope));calls.push({parent,offset,limit});
      const rows=tree[parent];if(rows instanceof Error)throw rows;
      if(!rows)throw new Error('Unexpected parent '+parent);
      return {state:'ok',entries:rows.slice(offset,offset+limit),nextOffset:offset+limit<rows.length?offset+limit:null};
    },
    async cancelScope(scope){closed.push(scope);active.delete(scope);}
  };
}
(async()=>{
  const port=provider({root:[dir('book','Novel'),file('loose','loose.mp3')],book:[dir('disc','Disc 1'),file('cover','cover.jpg')],disc:[file('part1','01.mp3'),file('part2','02.mp3')]});
  let access=new NativeSourceAccess(port),cursor=null,entries=[];
  do{
    const batch=await access.nextBatch(source,cursor,1);assert.ok(batch.entries.length<=1);
    entries.push(...batch.entries);cursor=batch.nextCursor;
    // Simulate process/controller restart: only the persisted cursor survives.
    access=new NativeSourceAccess(port);
  }while(cursor);
  assert.deepEqual(entries.map(e=>e.relativePath).sort(),['Novel','Novel/Disc 1','Novel/Disc 1/01.mp3','Novel/Disc 1/02.mp3','Novel/cover.jpg','loose.mp3'].sort());
  assert.equal(new Set(entries.map(e=>e.documentId)).size,6);
  assert.equal(port.active.size,0);assert.equal(port.closed.length,port.calls.length);
  assert.ok(port.calls.every(c=>c.limit===1));

  const loopPort=provider({root:[dir('a','A')],a:[dir('root','Cycle'),file('good','good.mp3')]});
  const loopAccess=new NativeSourceAccess(loopPort);let loopCursor=null,loopIssues=[],loopEntries=[];
  do{const b=await loopAccess.nextBatch(source,loopCursor,128);loopCursor=b.nextCursor;loopIssues.push(...b.issues??[]);loopEntries.push(...b.entries);}while(loopCursor);
  assert.equal(loopIssues[0].reason,'directory-cycle');assert.ok(loopEntries.some(e=>e.documentId==='good'));
  assert.equal(loopPort.calls.filter(c=>c.parent==='root').length,1);

  const broken=provider({root:[dir('broken','Unreadable'),dir('ok','Readable')],broken:new Error('Permission lost'),ok:[file('good','good.mp3')]});
  const brokenAccess=new NativeSourceAccess(broken);let brokenCursor=null,issues=[],found=[];
  do{const b=await brokenAccess.nextBatch(source,brokenCursor,128);brokenCursor=b.nextCursor;issues.push(...b.issues??[]);found.push(...b.entries);}while(brokenCursor);
  assert.ok(found.some(e=>e.relativePath==='Readable/good.mp3'));assert.equal(issues[0].reason,'directory-unreadable');assert.ok(issues[0].detail.includes('Unreadable'));
  await assert.rejects(()=>new NativeSourceAccess(provider({root:new Error('Denied')})).nextBatch(source,null,1),/Denied/);
  await assert.rejects(()=>access.nextBatch({...source,id:'other'},entries.length?'wrong-cursor':null,1),/cursor/i);
  const first=await new NativeSourceAccess(provider({root:[file('one','one.mp3'),file('two','two.mp3')]})).nextBatch(source,null,1);
  await assert.rejects(()=>access.nextBatch({...source,rootUri:'content://different/tree/root'},first.nextCursor,1),/source/i);
  const invalid=provider({root:[file('bad','../escape.mp3')]});
  await assert.rejects(()=>new NativeSourceAccess(invalid).nextBatch(source,null,1),/name/i);assert.equal(invalid.active.size,0);
  const looping=provider({root:[]});looping.queryChildren=async()=>({state:'ok',entries:[],nextOffset:0});
  await assert.rejects(()=>new NativeSourceAccess(looping).nextBatch(source,null,1),/progress/i);

  const abort=new AbortController();const cancelled=provider({root:[]});
  cancelled.queryChildren=async()=>{abort.abort();return {state:'ok',entries:[file('late','late.mp3')],nextOffset:null};};
  await assert.rejects(()=>new NativeSourceAccess(cancelled).nextBatch(source,null,128,abort.signal),/cancel/i);
  assert.equal(cancelled.active.size,0);assert.equal(cancelled.closed.length,1);
  const preAbort=new AbortController();preAbort.abort();const untouched=provider({root:[]});
  await assert.rejects(()=>new NativeSourceAccess(untouched).nextBatch(source,null,128,preAbort.signal),/cancel/i);assert.equal(untouched.closed.length,0);

  const {discoverSource}=require('./scannerVNext/discovery.ts');
  const recorded=[];const persisted={async saveSource(){},async saveBatch(){},async saveIssue(id,issue){recorded.push(issue);}};
  const replay=await discoverSource(source,new NativeSourceAccess(provider({root:[dir('bad','Bad'),file('ok','ok.mp3')],bad:new Error('Denied')})),persisted);
  assert.equal(replay.complete,true);assert.equal(replay.accounted,2);assert.equal(recorded[0].reason,'directory-unreadable');
  console.log('PASS: native traversal resumes across restarts, bounds pages, reports failed folders, prevents ancestor cycles, closes scopes and rejects cancelled/stale results');
})().catch(error=>{console.error(error);process.exitCode=1;});
