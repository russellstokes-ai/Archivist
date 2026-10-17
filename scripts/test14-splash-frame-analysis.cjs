#!/usr/bin/env node
'use strict';
// No Playwright/GPU/OCR. Inspect actual Android screencap PNG pixels with
// Node built-ins; a successfully launched *static* icon must FAIL Test 14.
const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const SIGN=Buffer.from([137,80,78,71,13,10,26,10]);
function decodePNG(bytes){
 assert(bytes.subarray(0,8).equals(SIGN),'Invalid Android screenshot PNG');
 let w=0,h=0,depth=0,type=0,pos=8,chunks=[];
 while(pos+12<=bytes.length){
   const len=bytes.readUInt32BE(pos),tag=bytes.toString('ascii',pos+4,pos+8);
   if(len>100_000_000||pos+len+12>bytes.length)throw Error('Corrupt PNG chunk');
   const data=bytes.subarray(pos+8,pos+8+len);pos+=len+12;
   if(tag==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];type=data[9];}
   if(tag==='IDAT')chunks.push(data);
   if(tag==='IEND')break;
 }
 const bpp=type===6?4:type===2?3:0;
 if(!bpp||depth!==8||w<200||h<350||w*h>15_000_000)throw Error('Unsupported Android screenshot PNG format');
 const raw=zlib.inflateSync(Buffer.concat(chunks));
 const stride=w*bpp,expect=(stride+1)*h;
 if(raw.length!==expect)throw Error('PNG row size mismatch');
 const out=Buffer.alloc(stride*h);
 let offset=0;
 for(let y=0;y<h;y++){
   const filter=raw[offset++],row=y*stride;
   for(let x=0;x<stride;x++){
     const val=raw[offset++];
     const a=x>=bpp?out[row+x-bpp]:0;
     const b=y?out[row+x-stride]:0;
     const c=y&&x>=bpp?out[row+x-stride-bpp]:0;
     let p=0;
     if(filter===0)p=0;
     else if(filter===1)p=a;
     else if(filter===2)p=b;
     else if(filter===3)p=Math.floor((a+b)/2);
     else if(filter===4){
       const guess=a+b-c,da=Math.abs(guess-a),db=Math.abs(guess-b),dc=Math.abs(guess-c);
       p=da<=db&&da<=dc?a:db<=dc?b:c;
     }else throw Error('Invalid PNG filter');
     out[row+x]=(val+p)&255;
   }
 }
 return {width:w,height:h,bpp,pixels:out};
}
function pixel(frame,x,y){
 const i=(y*frame.width+x)*frame.bpp;
 return frame.pixels.subarray(i,i+3);
}
function brandTeal(frame){
 // Samples outside the logo's centre, not status bar/navigation chrome.
 const locs=[[.15,.34],[.85,.34],[.15,.62],[.85,.62]];
 let matched=0;
 for(const [px,py] of locs){
   const [r,g,b]=pixel(frame,Math.floor(frame.width*px),Math.floor(frame.height*py));
   if(Math.abs(r-47)<=25&&Math.abs(g-139)<=25&&Math.abs(b-134)<=25)matched++;
 }
 return matched>=3;
}
function centreDifference(a,b){
 if(a.width!==b.width||a.height!==b.height||a.bpp!==b.bpp)throw Error('Fold/rotation changed during screenshot sampling');
 let count=0,changed=0;
 for(let y=Math.floor(a.height*.25);y<Math.floor(a.height*.79);y+=5){
   for(let x=Math.floor(a.width*.25);x<Math.floor(a.width*.75);x+=5){
     const av=pixel(a,x,y),bv=pixel(b,x,y);
     if(Math.abs(av[0]-bv[0])+Math.abs(av[1]-bv[1])+Math.abs(av[2]-bv[2])>52)changed++;
     count++;
   }
 }
 return count?changed/count:0;
}
function analyze(paths){
 if(paths.length<7)throw Error('Need at least seven native startup frames');
 const frames=paths.map(p=>decodePNG(fs.readFileSync(p)));
 const tealFlags=frames.map(brandTeal);
 const teal=tealFlags.filter(Boolean).length;
 const deltas=frames.slice(1).map((frame,i)=>centreDifference(frames[i],frame));
 const moving=deltas.filter(v=>v>=.015).length;
 // Native OS splash => Shelf transitions are NOT proof of an animated logo.
 // Require two distinct progressing frames with the same approved teal backdrop.
 const movingTealTransitions=deltas.filter((value,i)=>tealFlags[i]&&tealFlags[i+1]&&value>=.015).length;
 return {frames:frames.length,brandTealFrames:teal,movingTransitions:moving,movingTealTransitions,deltas};
}
if(require.main===module){
 try{
   const result=analyze(process.argv.slice(2));
   console.log('Test14 native splash pixel evidence:',JSON.stringify(result));
   assert(result.brandTealFrames>=3,'Approved teal background not visible across native launch');
   assert(result.movingTealTransitions>=2,
     'Approved teal is visible but the book did NOT visibly animate through at least two teal-backed native transitions');
   console.log('PASS: real Android screen capture shows approved teal plus moving centre-stage animation');
 }catch(e){console.error('FAILED Test14 Android animation:',String(e));process.exitCode=1;}
}
module.exports={decodePNG,brandTeal,centreDifference,analyze};
