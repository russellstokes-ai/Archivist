const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const script=source.slice(source.indexOf("(()=>{'use strict';"),source.indexOf('})();</script>')+5);
for(const initialPhase of ['closed','opening','open','turning','settling','closing']){
 let time=100,draws=0,frames=[],images=[],messages=[],failDraw=false;
 const ctx=new Proxy({measureText:t=>({width:String(t).length*6}),createLinearGradient:()=>({addColorStop(){}}),drawImage(){if(failDraw){failDraw=false;throw Error('temporary canvas failure');}draws++;},transform(...v){assert(v.every(Number.isFinite),'non-finite transform');},setTransform(...v){assert(v.every(Number.isFinite));}},{get:(o,k)=>o[k]??(()=>{})});
 const canvas=()=>({width:1000,height:840,getContext:()=>ctx});
 const window={ReactNativeWebView:{postMessage:s=>messages.push(s)}};
 const c=vm.createContext({window,document:{getElementById:canvas,createElement:canvas},performance:{now:()=>time},requestAnimationFrame:f=>frames.push(f),Image:class{constructor(){images.push(this);this.naturalWidth=500;this.naturalHeight=500;}}});
 const cfg={title:'Book A',author:'Writer A',phase:initialPhase,number:1,direction:1,coverMode:'jacket'};
 vm.runInContext(script.replace('const cfg=${js(initial)};','const cfg='+JSON.stringify(cfg)+';'),c);
 const frame=()=>{time+=100;const f=frames.shift();assert(f,'animation loop disappeared');f(time);};
 frame();assert(draws>0,'re-entry must draw from '+initialPhase);
 for(const phase of ['closing','closed','opening','open','turning','settling','open']){window.ArchivistLivingBook.setState({phase,title:'Book B',author:'Writer B',number:2,direction:1});frame();}
 window.ArchivistLivingBook.setCover('old','jacket');window.ArchivistLivingBook.setCover('new','jacket');images[1].onload();images[0].onload();frame();
 failDraw=true;frame();assert(messages.includes('archivist-living-render-error'));const before=draws;frame();assert(draws>before,'a failed frame must not kill subsequent rendering');
}
console.log('PASS: actual Canvas mounts in every phase, survives Play/Pause, metadata changes and a failed draw');
