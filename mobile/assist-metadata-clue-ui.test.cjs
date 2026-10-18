'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.tsx']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText,p);
// Minimal hook host: execute the actual component's input/effect lifecycle without a native renderer.
const slots=[],effects=[];let cursor=0;
const react={createElement:(type,props,...children)=>({type,props,children}),
 useState(initial){const n=cursor++;if(!(n in slots))slots[n]=initial;return [slots[n],value=>slots[n]=value];},
 useRef(initial){const n=cursor++;return slots[n]||(slots[n]={current:initial});},
 useEffect(callback,deps){const n=cursor++,old=slots[n];if(!old||deps.some((v,i)=>v!==old.deps[i]))effects.push(()=>{old?.cleanup?.();slots[n]={deps,cleanup:callback()};});}
};
const original=Module._load;Module._load=function(id,...args){if(id==='react')return {...react,default:react};if(id==='react-native')return {Text:'Text',TextInput:'TextInput',View:'View'};return original.call(this,id,...args);};
const {AssistClueSearch}=require('./assistMetadata/ClueSearch.tsx');Module._load=original;
(async()=>{
 let calls=0,release;const results=[];
 const props={workId:'one',online:true,colors:{},search:async()=>{calls++;if(calls===1)return new Promise(r=>release=r);return 'new result';},onCancel:()=>{},onResult:r=>results.push(r)};
 const render=()=>{cursor=0;const tree=AssistClueSearch(props);while(effects.length)effects.shift()();return tree.children.find(x=>x?.type==='TextInput').props;};
 render().onChangeText('Same clue');let input=render();input.onSubmitEditing();
 assert.equal(calls,1);props.online=false;render();release('old result');
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(results,[],'Offline cancellation must suppress stale results');
 props.online=true;input=render();input.onSubmitEditing();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,2,'Turning online metadata back on must allow resubmitting the same clue');assert.deepEqual(results,['new result']);
 console.log('PASS: offline cancellation suppresses stale results and permits retrying the unchanged clue');
})().catch(e=>{console.error(e);process.exitCode=1});
