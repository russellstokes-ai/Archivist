const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {SavedQueue,reorder}=require('./queue.ts');
(async()=>{
 let saved={items:[],revision:0},conflict=false,errors=[];
 const api=async(path,method,data)=>{if(method==='PUT'){if(conflict){conflict=false;saved={items:[{id:9}],revision:9};throw Error('changed elsewhere');}assert.equal(data.revision,saved.revision);saved={items:data.ids.map(id=>({id})),revision:saved.revision+1};}return {...saved};};
 const q=new SavedQueue(api,()=>{},message=>errors.push(message));await q.reload();
 await Promise.all([q.edit(items=>[...items,{id:1}]),q.edit(items=>[...items,{id:2}])]);assert.deepEqual(q.items,[{id:1},{id:2}]);
 await q.edit(items=>reorder(items,1,-1));assert.deepEqual(saved.items,[{id:2},{id:1}]);
 const reopened=new SavedQueue(api,()=>{},()=>{});await reopened.reload();assert.deepEqual(reopened.items,q.items);
 conflict=true;await q.edit(items=>items.slice(1));assert.deepEqual(q.items,[{id:9}]);assert.equal(errors.length,1);
 q.dispose();await q.edit(()=>[]);assert.deepEqual(saved.items,[{id:9}]);console.log('PASS: saved queue, serialized updates, reorder, reopen and conflict reload');
})().catch(e=>{console.error(e);process.exitCode=1;});
