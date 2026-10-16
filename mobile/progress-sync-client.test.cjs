const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {OfflineProgressOutbox}=require('./progressReconciliation.ts');
const {createProgressStorage,progressIdentityFromPath,progressURL,replayDurableProgress}=require('./progressSyncClient.ts');
const edition=(id,asset,seconds,revision,complete=false)=>({kind:'edition',id,asset,seconds,revision,complete});
const listening=(id,seconds,revision,complete=false)=>({kind:'listening',id,asset:id,seconds,revision,complete});
const snapshot=items=>({items,hasMore:false,nextOffset:items.length,snapshot:'b'.repeat(48)});

(async()=>{
  const files=new Map();let writes=0,failWrite=false;
  const stateKey='archivist.progressOutboxes.v1';
  const backing=createProgressStorage(
    async()=>files.get(stateKey)||null,
    async value=>{if(failWrite)throw Error('ENOSPC in persisted outbox');files.set(stateKey,value);writes++},
  );
  const alice=new OfflineProgressOutbox(backing,'https://private.books.example',4);
  const bob=new OfflineProgressOutbox(backing,'https://private.books.example',7);
  const key=alice.key;
  assert.notEqual(alice.key,bob.key,'different family members need independent progress histories');
  assert.deepEqual(progressIdentityFromPath('/api/editions/13/progress'),{kind:'edition',id:13});
  assert.deepEqual(progressIdentityFromPath('/api/assets/31/listening-progress'),{kind:'listening',id:31});
  assert.throws(()=>progressIdentityFromPath('https://evil.example/api/editions/13/progress'),/Only authenticated/);
  assert.throws(()=>progressIdentityFromPath('/api/assets/31/reader'),/Only authenticated/);
  assert.equal(progressURL('edition',13),'/api/editions/13/progress');
  assert.equal(progressURL('listening',31),'/api/assets/31/listening-progress');
  assert.throws(()=>progressURL('reading',31),/verified native reader contract/);

  let requests=0;
  const empty=await replayDurableProgress(alice,async()=>{requests++;throw Error('should not call network')});
  assert.equal(empty.retained,0);assert.equal(requests,0);
  const work=await alice.record('edition',13,{asset:21,seconds:45,complete:false},2);
  let current=edition(13,21,20,2),puts=[];
  const transport=async(path,method,body)=>{
    if(path.startsWith('/api/sync/progress?'))return snapshot([current]);
    if(path==='/api/editions/13/progress'&&method==='PUT'){
      puts.push(body);
      if(body.revision!==current.revision)throw Error('409 conflict');
      current={...current,...body,revision:current.revision+1};
      return current;
    }
    throw Error('unexpected route '+method+' '+path);
  };
  failWrite=true;
  await assert.rejects(replayDurableProgress(alice,transport),/ENOSPC in persisted outbox/);
  failWrite=false;
  assert.equal((await alice.list()).length,1,'failed acknowledgement cannot delete latest playback');
  assert.equal(current.seconds,45,'server save may have succeeded even though receipt failed');
  // A repeat fetch sees the exact saved remote position and acknowledges the
  // old local event WITHOUT overwriting a later revision.
  const retry=await replayDurableProgress(alice,transport);
  assert.equal(retry.alreadySynced,1);
  assert.equal(retry.retained,0);
  assert.equal(puts.length,1,'exact remote state must not be uploaded twice');

  // Profile Bob's same origin/outbox storage cannot use Alice's bookmark.
  await bob.record('listening',31,{asset:31,seconds:23,complete:false},0);
  assert.equal((await alice.list()).length,0);
  assert.equal((await bob.list()).length,1);
  const saved=await replayDurableProgress(bob,async(path,method,body)=>{
    if(path.startsWith('/api/sync/progress?'))return snapshot([]);
    if(path==='/api/assets/31/listening-progress'&&method==='PUT'){
      assert.equal(body.revision,0);assert.equal(body.seconds,23);
      return {...body,revision:1};
    }
    throw Error('incorrect listening URL '+path);
  });
  assert.equal(saved.uploaded,1);
  assert.equal((await bob.list()).length,0);

  // When another device edited the same book, outbox must preserve local
  // rewind and never auto-select a winning position.
  await alice.record('edition',13,{asset:21,seconds:9,complete:false},3);
  const conflict=await replayDurableProgress(alice,async(path,method)=>{
    if(method==='PUT')throw Error('conflicted progress must not upload');
    return snapshot([edition(13,21,79,9)]);
  });
  assert.equal(conflict.conflicts,1);
  assert.equal(conflict.retained,1);
  assert.equal((await alice.list())[0].position.seconds,9);

  // No snapshot / wrong remote version must fail without any acknowledgment.
  await assert.rejects(replayDurableProgress(alice,async(path)=>{
    if(path.includes('offset=0'))return {items:[edition(13,21,20,3)],hasMore:true,nextOffset:1};
    throw Error('must fail on missing immutable cursor before second page');
  }),/missing consistent cursor/);
  assert.equal((await alice.list()).length,1);
  await assert.rejects(replayDurableProgress(alice,async(path,method)=>{
    if(!method)return snapshot([edition(13,21,20,3)]);
    return {asset:21,seconds:9,revision:999,complete:false};
  }),/acknowledgement differs/);
  assert.equal((await alice.list()).length,1);

  // A new recording during an async server PUT cannot be destroyed by the
  // stale success acknowledgement returned for a previous sequence.
  const present=(await alice.list())[0];
  let continuePut;const block=new Promise(resolve=>{continuePut=resolve});
  let invoked=false;
  const racing=replayDurableProgress(alice,async(path,method,body)=>{
    if(!method)return snapshot([edition(13,21,20,3)]);
    invoked=true;await block;return {...body,revision:4};
  });
  for(let i=0;i<12&&!invoked;i++)await new Promise(setImmediate);
  assert(invoked,'held network put must start');
  const newer=await alice.record('edition',13,{asset:21,seconds:123,complete:false},3);
  assert(newer.sequence>present.sequence);
  continuePut();
  const result=await racing;
  assert.equal(result.uploaded,0,'ack from older seq must not remove newer local progress');
  assert.equal(result.retained,1);
  assert.equal((await alice.list())[0].position.seconds,123);

  // Single fixed persisted key holds isolated envelopes, no raw bearer token.
  assert(files.get(stateKey)[key],'scoped progress must be written under stable small state key');
  assert(!JSON.stringify(files.get(stateKey)).includes('Bearer '),'tokens must never enter disk journal');
  assert(writes>0);
  console.log('PASS: journaled audio progress replay preserves failures, handles conflicts/retries and cannot drop newer or cross-profile bookmarks');
})().catch(e=>{console.error(e);process.exitCode=1});
