'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),ts=require('typescript');
const {test}=require('node:test');
function load(name,mocks={}){
 const filename=path.join(__dirname,name);assert.ok(fs.existsSync(filename),'Missing repair component '+name);
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,require:key=>{if(key in mocks)return mocks[key];throw Error('Unexpected dependency '+key);},console,Error,Promise,Number,Date},{filename});return exports;
}
const draft={uri:'content://picker/selected',fileName:'avatar.jpg',fileSize:100};
const previous={initials:'RS',color:'#47736F',photoUri:'file:///private/profile/previous.jpg'};
test('profile photo commit waits for durable storage before returning a replacement',async()=>{
 const {commitProfilePhoto}=load('profilePhotoCommit.ts');let release,saved,finished=false;const events=[];
 const pending=commitProfilePhoto(draft,previous,{copy:async()=>{events.push('copy');return 'file:///private/profile/new.jpg';},save:async next=>{events.push('saving');await new Promise(r=>{release=r;});saved=JSON.stringify(next);},remove:async()=>{throw Error('successful save must not remove the original');}}).then(next=>{finished=true;return next;});
 await new Promise(r=>setImmediate(r));assert.equal(finished,false);assert.equal(saved,undefined);assert.deepEqual(events,['copy','saving']);
 release();const next=await pending;assert.equal(next.photoUri,'file:///private/profile/new.jpg');assert.equal(JSON.parse(saved).photoUri,next.photoUri);assert.equal(previous.photoUri,'file:///private/profile/previous.jpg');
});
test('failed profile persistence removes only the new private copy and retains the previous photo',async()=>{
 const {commitProfilePhoto}=load('profilePhotoCommit.ts');const removed=[];
 await assert.rejects(commitProfilePhoto(draft,previous,{copy:async()=> 'file:///private/profile/new.jpg',save:async()=>{throw Error('Disk full');},remove:async uri=>{removed.push(uri);}}),/Disk full/);
 assert.deepEqual(removed,['file:///private/profile/new.jpg']);assert.equal(previous.photoUri,'file:///private/profile/previous.jpg');
});
test('cancel before or during copy never saves the draft or deletes a user original',async()=>{
 const {commitProfilePhoto}=load('profilePhotoCommit.ts');let copies=0,saves=0,current=false;const removed=[];
 const ports={copy:async()=>{copies++;current=false;return 'file:///private/profile/new.jpg';},save:async()=>{saves++;},remove:async uri=>{removed.push(uri);},shouldContinue:()=>current};
 await assert.rejects(commitProfilePhoto(draft,previous,ports),/cancel/i);assert.equal(copies,0);
 current=true;await assert.rejects(commitProfilePhoto(draft,previous,ports),/cancel/i);assert.equal(saves,0);assert.deepEqual(removed,['file:///private/profile/new.jpg']);
});
test('photo selection rejects remote, invalid and oversized input before copying',()=>{
 const {validateProfilePhoto}=load('profilePhotoCommit.ts');
 for(const input of [{uri:'https://example.invalid/photo.jpg'},{uri:''},{...draft,fileSize:NaN},{...draft,fileSize:16*1024*1024}])assert.throws(()=>validateProfilePhoto(input));
 validateProfilePhoto(draft);
});
function renderHarness(name){
 let slots=[],cursor=0;const effects=new Map();
 const react={createElement:(type,props,...children)=>({type,props:{...props,children:children.flat()}}),useState:initial=>{const n=cursor++;if(!(n in slots))slots[n]=initial;return [slots[n],value=>{slots[n]=typeof value==='function'?value(slots[n]):value;}];},useEffect:(fn,deps)=>{const key=cursor++,value=JSON.stringify(deps);if(effects.get(key)!==value){effects.set(key,value);fn();}}};
 const dimensions={width:360,height:780,fontScale:1};
 const rn=Object.fromEntries(['Image','Modal','Pressable','ScrollView','Text','View'].map(k=>[k,k]));rn.useWindowDimensions=()=>dimensions;
 const api=load(name,{'react':react,'react-native':rn,'react-native-safe-area-context':{SafeAreaView:'SafeAreaView'}});
 return {api,dimensions,render:(Component,props)=>{cursor=0;return Component(props);}};
}
function all(tree,predicate){if(!tree||typeof tree!=='object')return [];return [...(predicate(tree)?[tree]:[]),...(tree.props?.children||[]).flatMap(child=>all(child,predicate))];}
test('photo preview keeps explicit confirmation in a safe-area footer and refuses undecodable images',()=>{
 const h=renderHarness('ProfilePhotoPreview.tsx');let used=0,cancelled=0;
 const props={draft,saving:false,error:'',reduceMotion:true,onUse:()=>{used++;},onCancel:()=>{cancelled++;},palette:{background:'#07151C',ink:'#FFFFFF',muted:'#BBBBBB',accent:'#E3BC67',line:'#555555',danger:'#FF7777'}};
 const render=()=>h.render(h.api.ProfilePhotoPreview,props);
 let tree=render(),use=all(tree,n=>n.props.accessibilityLabel==='Use photo')[0];assert.ok(use);assert.equal(use.props.disabled,true);use.props.onPress();assert.equal(used,0);
 all(tree,n=>n.type==='Image')[0].props.onLoad();tree=render();use=all(tree,n=>n.props.accessibilityLabel==='Use photo')[0];assert.equal(use.props.disabled,false);use.props.onPress();assert.equal(used,1);
 const scroll=all(tree,n=>n.type==='ScrollView')[0];assert.equal(all(scroll,n=>n.type==='Pressable').length,0,'confirmation must not be buried below the scrollable image');
 tree.props.onRequestClose();assert.equal(cancelled,1);
 all(tree,n=>n.type==='Image')[0].props.onError();tree=render();assert.equal(all(tree,n=>n.props.accessibilityLabel==='Use photo')[0].props.disabled,true);
 props.saving=true;tree=render();tree.props.onRequestClose();assert.equal(cancelled,1,'cannot cancel a durable write mid-commit');
 for(const button of all(tree,n=>n.type==='Pressable'))assert.ok(button.props.style({pressed:false}).minHeight>=48);
 assert.equal(all(tree,n=>n.type==='SafeAreaView')[0].props.edges.length,4);
});
test('compact headers keep actions in the same section and stack for narrow or enlarged text',()=>{
 const h=renderHarness('CompactPageHeader.tsx'),{compactHeaderIsWide,CompactPageHeader}=h.api;
 for(const width of [320,360,540])assert.equal(compactHeaderIsWide(width,false,1),false);
 for(const width of [600,768,840,1024]){assert.equal(compactHeaderIsWide(width,false,1),true);assert.equal(compactHeaderIsWide(width,true,1),false);assert.equal(compactHeaderIsWide(width,false,2),false);}
 for(const width of [320,360,600,840,1024]){
  const tree=h.render(CompactPageHeader,{header:{type:'Heading',props:{}},children:{type:'Action',props:{}},width,largeText:false,testID:'header'});
  assert.equal(tree.props.children.length,2);assert.ok(tree.props.style.gap<=12);assert.equal(tree.props.children[1].props.style.minHeight,44);
 }
});
