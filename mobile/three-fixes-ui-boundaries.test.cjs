'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const {test}=require('node:test');
const {effectiveSource}=require('./threeFixes/source.cjs');
const appPath=path.join(__dirname,'App.tsx'),app=effectiveSource(appPath,fs.readFileSync(appPath,'utf8'));
test('rapid operation changes reach the scan UI even inside its count-throttle interval',()=>{
 const start=app.indexOf('  const reportLocalScan='),end=app.indexOf('  const endLocalScan=',start);assert.ok(start>=0&&end>start);
 const source=app.slice(start,end)+'\nexports.reportLocalScan=reportLocalScan;';
 const exports={},seen=[];let now=1000,current=true;
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,Date:{now:()=>now},scanCommitGate:{isCurrent:()=>current},setScanProgress:p=>seen.push(p)});
 const report=exports.reportLocalScan(1);
 report({phase:'preparing',currentFolder:'Checking comic identity',processed:0,total:10});
 now+=1;report({phase:'preparing',currentFolder:'Checking cover artwork',processed:0,total:10});
 assert.equal(seen.at(-1).currentFolder,'Checking cover artwork','do not conceal the operation that can stall');
 now+=1;report({phase:'preparing',currentFolder:'Checking cover artwork',processed:1,total:10});assert.equal(seen.length,2,'unchanged-operation counts remain throttled');
 now+=151;report({phase:'preparing',currentFolder:'Checking cover artwork',processed:2,total:10});assert.equal(seen.length,3);
 current=false;report({phase:'complete',currentFolder:'Catalogue saved',processed:10,total:10});assert.equal(seen.length,3,'stale generations cannot update progress');
});
function luminance(hex){const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function walk(tree,predicate){return !tree||typeof tree!=='object'?[]:[...(predicate(tree)?[tree]:[]),...(tree.props?.children||[]).flatMap(child=>walk(child,predicate))];}
test('Use photo remains legible on the gold fill in both light and dark preview palettes',()=>{
 const exports={},react={createElement:(type,props,...children)=>({type,props:{...props,children:children.flat()}}),useState:initial=>[initial,()=>{}],useEffect:()=>{}};
 const rn=Object.fromEntries(['Image','Modal','Pressable','ScrollView','Text','View'].map(key=>[key,key]));rn.useWindowDimensions=()=>({width:360,height:780,fontScale:1});
 const file=path.join(__dirname,'ProfilePhotoPreview.tsx');
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,require:key=>key==='react'?react:key==='react-native'?rn:key==='react-native-safe-area-context'?{SafeAreaView:'SafeAreaView'}:{}});
 for(const background of ['#FFFFFF','#07151C']){
  const tree=exports.ProfilePhotoPreview({draft:{uri:'file:///photo.jpg'},saving:false,error:'',reduceMotion:true,onUse:()=>{},onCancel:()=>{},palette:{background,ink:background==='#FFFFFF'?'#182C29':'#FFFFFF',muted:'#777777',accent:'#E3BC67',line:'#888888',danger:'#FF0000'}});
  const button=walk(tree,n=>n.props.accessibilityLabel==='Use photo')[0],label=walk(button,n=>n.type==='Text')[0];
  assert.ok(contrast(label.props.style.color,button.props.style({pressed:false}).backgroundColor)>=4.5,'Use photo label must have clear contrast against its gold fill');
 }
});
