import React,{useEffect,useMemo,useRef,useState} from 'react';
import {StyleSheet,View} from 'react-native';

export function AmbientGlow({color='#47736F',size=520,strength=1}:{color?:string;size?:number;strength?:number}){
  return <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',width:size,height:size,left:'50%',top:0,marginLeft:-size/2}}>{Array.from({length:24},(_,i)=>{const inset=i*size/64;return <View key={i} style={{position:'absolute',left:inset,top:inset,right:inset,bottom:inset,borderRadius:size,backgroundColor:color,opacity:.009*strength}}/>})}</View>;
}
import {WebView} from 'react-native-webview';
import {EncodingType,StorageAccessFramework,cacheDirectory,createDownloadResumable,deleteAsync,getInfoAsync,moveAsync,readAsStringAsync} from 'expo-file-system/legacy';
import type {LivingBookPhase} from './playerExperience';

export type LivingBookCanvasProps={
  title:string;author:string;chapter?:string;number?:number;phase:LivingBookPhase;
  direction:1|-1;skipping:boolean;reduceMotion:boolean;coverUri?:string;
  coverMode?:'portrait'|'jacket'|'fallback';coverHeaders?:Record<string,string>;
};

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
function mimeFrom(uri:string,data:string){if(data.startsWith('/9j/'))return'image/jpeg';if(data.startsWith('iVBORw0KGgo'))return'image/png';if(data.startsWith('UklGR'))return'image/webp';const v=uri.toLowerCase();if(v.includes('.png'))return'image/png';if(v.includes('.webp'))return'image/webp';return'image/jpeg';}
async function localDataUri(uri:string){const data=uri.startsWith('content://')?await StorageAccessFramework.readAsStringAsync(uri,{encoding:EncodingType.Base64}):await readAsStringAsync(uri,{encoding:EncodingType.Base64});return data?'data:'+mimeFrom(uri,data)+';base64,'+data:'';}
async function coverSource(uri?:string,headers?:Record<string,string>){
  if(!uri)return'';if(uri.startsWith('data:'))return uri;
  if(/^https:\/\//i.test(uri)){
    if(!headers||!Object.keys(headers).length)return uri;
    if(!cacheDirectory)return'';
    const target=cacheDirectory+'archivist-living-'+hash(uri)+'.img';
    const info=await getInfoAsync(target).catch(()=>({exists:false} as const));
    if(!info.exists){
      const temp=target+'.download';
      await deleteAsync(temp,{idempotent:true}).catch(()=>undefined);
      let oversized=false;
      const task=createDownloadResumable(uri,temp,{headers},progress=>{
        const total=Number(progress.totalBytesExpectedToWrite)||0;
        const written=Number(progress.totalBytesWritten)||0;
        if((total>12*1024*1024||written>12*1024*1024)&&!oversized){
          oversized=true;
          void task.cancelAsync().catch(()=>undefined);
        }
      });
      let timer:ReturnType<typeof setTimeout>|undefined;
      try{
        const result=await Promise.race([
          task.downloadAsync(),
          new Promise<never>((_,reject)=>{
            timer=setTimeout(()=>{
              void task.cancelAsync().catch(()=>undefined);
              reject(Error('Living Book cover download timed out.'));
            },10_000);
          }),
        ]);
        if(oversized)throw Error('Living Book cover exceeds the 12 MB safety limit.');
        if(!result||result.status<200||result.status>=300)throw Error('Living Book cover download failed.');
        await deleteAsync(target,{idempotent:true}).catch(()=>undefined);
        await moveAsync({from:temp,to:target});
      }catch{
        await deleteAsync(temp,{idempotent:true}).catch(()=>undefined);
        return'';
      }finally{
        if(timer)clearTimeout(timer);
      }
    }
    return localDataUri(target);
  }
  try{return await localDataUri(uri);}catch{return'';}
}
function js(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}
function rendererHtml(initial:{title:string;author:string;chapter:string;number:number;phase:LivingBookPhase;direction:1|-1;skipping:boolean;reduceMotion:boolean;coverMode:string;}){
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{width:100%;height:100%;display:block;background:transparent}</style></head><body><canvas id="book" width="1000" height="840"></canvas><script>
(()=>{'use strict';
const cfg=${js(initial)};
const canvas=document.getElementById('book'),ctx=canvas.getContext('2d',{alpha:true});
const W=174,H=256,N=64,PI=Math.PI,ease=t=>t*t*(3-2*t);
let title=cfg.title||'',author=cfg.author||'',chapter=cfg.chapter||'',page=Math.max(2,(cfg.number||1)*2);
let phase=cfg.phase||'closed',direction=cfg.direction===-1?-1:1,skipping=!!cfg.skipping,reduced=!!cfg.reduceMotion;
let opening=(phase==='closed'||phase==='closing')?0:1,turn=(phase==='turning'||phase==='settling')?1:0;
let transitionStart=performance.now(),transitionFrom=opening,transitionTo=opening,turnStart=performance.now(),activeTurn=(phase==='turning'||phase==='settling');
let coverImage=null,coverReady=false,coverMode=cfg.coverMode||'fallback';

function wrap(t,text,x,y,maxWidth,lineHeight,maxLines){const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(line&&t.measureText(test).width>maxWidth){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((v,i)=>t.fillText(v,x,y+i*lineHeight,maxWidth));}
function texture(isCover,num){const c=document.createElement('canvas');c.width=348;c.height=512;const t=c.getContext('2d');t.fillStyle=isCover?'#102b35':'#f3ecd9';t.fillRect(0,0,348,512);
 if(isCover){
  if(coverReady&&coverImage&&coverMode==='portrait'){const scale=Math.max(348/coverImage.naturalWidth,512/coverImage.naturalHeight),w=coverImage.naturalWidth*scale,h=coverImage.naturalHeight*scale;t.drawImage(coverImage,(348-w)/2,(512-h)/2,w,h);const g=t.createLinearGradient(0,0,0,512);g.addColorStop(0,'rgba(0,0,0,.01)');g.addColorStop(1,'rgba(0,0,0,.16)');t.fillStyle=g;t.fillRect(0,0,348,512);}
  else if(coverReady&&coverImage&&coverMode==='jacket'){t.fillStyle='#16343b';t.fillRect(0,0,348,512);t.strokeStyle='#c6a374';t.lineWidth=2;t.strokeRect(22,22,304,468);const box=250,x=(348-box)/2,y=92;t.fillStyle='#0b2027';t.fillRect(x-4,y-4,box+8,box+8);const scale=Math.min(box/coverImage.naturalWidth,box/coverImage.naturalHeight),w=coverImage.naturalWidth*scale,h=coverImage.naturalHeight*scale;t.drawImage(coverImage,x+(box-w)/2,y+(box-h)/2,w,h);t.textAlign='center';t.fillStyle='#c6a374';t.font='10px Georgia';t.fillText('ARCHIVIST · AUDIOBOOK',174,62);t.fillStyle='#f1ead5';t.font='24px Georgia';wrap(t,title,174,385,278,28,2);t.fillStyle='#bdb99e';t.font='13px Georgia';t.fillText(author,174,463,280);}
  else{t.strokeStyle='#c6a374';t.lineWidth=2;t.strokeRect(22,22,304,468);t.textAlign='center';t.fillStyle='#c6a374';t.font='18px Georgia';t.fillText(author.toUpperCase(),174,67,292);t.fillStyle='#f1ead5';t.font='30px Georgia';wrap(t,title.toUpperCase(),174,145,286,34,4);t.fillStyle='#c6a374';t.font='11px Georgia';t.fillText('ARCHIVIST',174,464);}
 }else{t.fillStyle='#716957';t.textAlign='center';t.font='11px Georgia';t.fillText(title.toUpperCase(),174,36,290);t.font='bold 13px Georgia';t.fillText(chapter||title,174,68,280);t.textAlign='left';t.font='12px Georgia';const lines=['The evening light reached across the room.','Beyond the windows, the city lay quiet.','He paused at the door, listening carefully.','There was still time to change his mind.','A narrow shadow moved across the stone.','For a moment, nothing else seemed to matter.'];for(let i=0;i<24;i++){if(i===6||i===16)continue;t.fillText(lines[(i+num)%lines.length],29,91+i*14,290);}t.textAlign='center';t.font='11px Georgia';t.fillText(String(num),174,484);}
 return c;
}
let cover=texture(true,0),liner=texture(false,0),left=texture(false,page),right=texture(false,page+1),front=right,back=texture(false,page+2);
function project(x,y,z){const tilt=.39,yy=y*Math.cos(tilt)-z*Math.sin(tilt),zz=y*Math.sin(tilt)+z*Math.cos(tilt),p=1050/(1050-zz);return[250+(x-W/2*(1-opening))*p,216+yy*p,zz];}
function tri(img,a,b,c,ua,ub,uc){ctx.save();ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.clip();const den=ua[0]*(ub[1]-uc[1])+ub[0]*(uc[1]-ua[1])+uc[0]*(ua[1]-ub[1]);if(Math.abs(den)<.00001){ctx.restore();return;}const solve=v=>[(v[0]*(ub[1]-uc[1])+v[1]*(uc[1]-ua[1])+v[2]*(ua[1]-ub[1]))/den,(v[0]*(uc[0]-ub[0])+v[1]*(ua[0]-uc[0])+v[2]*(ub[0]-ua[0]))/den,(v[0]*(ub[0]*uc[1]-uc[0]*ub[1])+v[1]*(uc[0]*ua[1]-ua[0]*uc[1])+v[2]*(ua[0]*ub[1]-ub[0]*ua[1]))/den];const xx=solve([a[0],b[0],c[0]]),yy=solve([a[1],b[1],c[1]]);ctx.transform(xx[0],yy[0],xx[1],yy[1],xx[2],yy[2]);ctx.drawImage(img,0,0);ctx.restore();}
function surface(img,points,reverse=false,shade=true){const strips=[];for(let i=0;i<N;i++){const p=points[i],q=points[i+1];strips.push({i,p,q,z:(p[0][2]+q[0][2])/2});}strips.sort((a,b)=>a.z-b.z);for(const strip of strips){const i=strip.i,p=strip.p,q=strip.q,u=348*(reverse?1-i/N:i/N),v=348*(reverse?1-(i+1)/N:(i+1)/N);tri(img,p[0],q[0],q[1],[u,0],[v,0],[v,512]);tri(img,p[0],q[1],p[1],[u,0],[v,512],[u,512]);if(shade){const edge=Math.sin(PI*i/N),curl=activeTurn?Math.sin(PI*turn):0;ctx.fillStyle='rgba(62,43,24,'+(.025+.07*edge+.055*edge*curl)+')';ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);ctx.lineTo(q[0][0],q[0][1]);ctx.lineTo(q[1][0],q[1][1]);ctx.lineTo(p[1][0],p[1][1]);ctx.fill();}}}
function rigid(angle,z=0,w=W,h=H){return Array.from({length:N+1},(_,i)=>{const d=w*i/N;return[project(d*Math.cos(angle),-h/2,z+d*Math.sin(angle)),project(d*Math.cos(angle),h/2,z+d*Math.sin(angle))];});}
function flex(progress){const base=direction===1?4+progress:5-progress,coords=[[0,base]],step=W/N;let x=0,z=base;for(let i=1;i<=N;i++){const u=(i-.5)/N,a=PI*progress+.64*Math.sin(PI*progress)*Math.sin(PI*(u-.25));x+=step*Math.cos(a);z+=step*Math.sin(a);coords.push([x,z]);}const lift=Math.sin(PI*progress);return coords.map((v,i)=>[project(direction*v[0],-H/2,v[1]+5*lift*i/N),project(direction*v[0],H/2,v[1]-5*lift*i/N)]);}
function prepareTurn(){front=texture(false,direction===1?page+1:page);back=texture(false,direction===1?page+2:page-1);activeTurn=true;turn=0;turnStart=performance.now();}
function commitTurn(){if(!activeTurn)return;if(direction===1){page+=2;left=back;right=texture(false,page+1);}else{page=Math.max(2,page-2);right=back;left=texture(false,page);}activeTurn=false;turn=0;}
function rebuildStable(){liner=texture(false,0);left=texture(false,page);right=texture(false,page+1);cover=texture(true,0);}
function setPhase(next,data){if(data){direction=data.direction===-1?-1:1;skipping=!!data.skipping;reduced=!!data.reduceMotion;}if(next===phase)return;const previous=phase;phase=next;const now=performance.now();if(next==='opening'){transitionFrom=opening;transitionTo=1;transitionStart=now;if(reduced)opening=1;}else if(next==='closing'){transitionFrom=opening;transitionTo=0;transitionStart=now;if(reduced)opening=0;}else if(next==='turning'){if(!activeTurn)prepareTurn();turnStart=now;if(reduced)turn=1;}else if(next==='settling'){if(!activeTurn)prepareTurn();turn=1;}else if(next==='open'){opening=1;if(previous==='settling'||previous==='turning')commitTurn();}else if(next==='closed'){opening=0;activeTurn=false;turn=0;}}
function paint(){ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,500,420);ctx.save();ctx.fillStyle='rgba(0,0,0,.19)';ctx.filter='blur(15px)';ctx.beginPath();ctx.ellipse(250,342,110+80*opening,18+4*opening,0,0,2*PI);ctx.fill();ctx.restore();surface(cover,rigid(0,-9,W+5,H+8),false,false);for(let j=0;j<6;j++)surface(liner,rigid(0,-7+j*1.7),false,false);surface(right,rigid(0,4));if(opening>0){surface(cover,rigid(PI*opening,-5,W+5,H+8),opening>.5,false);surface(left,rigid(PI*opening,5),opening>.5);}if(activeTurn)surface(turn>.5?back:front,flex(turn),direction===1?turn>.5:turn<.5,true);if(opening<1)surface(opening<.5?cover:liner,rigid(PI*opening,11,W+5,H+8),opening>.5,false);}
function tick(now){if(phase==='opening'||phase==='closing'){const progress=reduced?1:Math.min(1,(now-transitionStart)/1500);opening=transitionFrom+(transitionTo-transitionFrom)*ease(progress);}else if(phase==='turning'&&activeTurn){const duration=skipping?780:1900,progress=reduced?1:Math.min(1,(now-turnStart)/duration);turn=ease(progress);}else if(phase==='settling'&&activeTurn)turn=1;paint();requestAnimationFrame(tick);}
window.ArchivistLivingBook={setState:data=>{if(!data)return;if(typeof data.title==='string'&&data.title!==title)title=data.title;if(typeof data.author==='string')author=data.author;if(typeof data.chapter==='string')chapter=data.chapter;if(Number.isFinite(data.number)){const nextPage=Math.max(2,Number(data.number)*2);if(!activeTurn&&nextPage!==page){page=nextPage;rebuildStable();}}setPhase(data.phase||phase,data);},setCover:(source,mode)=>{coverMode=mode||'fallback';if(!source){coverImage=null;coverReady=false;cover=texture(true,0);return;}const img=new Image();img.onload=()=>{coverImage=img;coverReady=true;cover=texture(true,0);};img.onerror=()=>{coverImage=null;coverReady=false;cover=texture(true,0);};img.src=source;}};
paint();requestAnimationFrame(tick);
})();</script></body></html>`;
}

export function LivingBookCanvas(props:LivingBookCanvasProps){
  const ref=useRef<WebView>(null);
  const [ready,setReady]=useState(false);
  const initialHtml=useMemo(()=>rendererHtml({
    title:props.title,author:props.author,chapter:props.chapter||'',number:props.number||1,
    phase:props.phase,direction:props.direction,skipping:props.skipping,reduceMotion:props.reduceMotion,
    coverMode:props.coverMode||'fallback',
  }),[]);
  const inject=(code:string)=>{if(ready)ref.current?.injectJavaScript('try{'+code+'}catch(e){};true;');};

  useEffect(()=>{
    inject('window.ArchivistLivingBook&&window.ArchivistLivingBook.setState('+js({
      title:props.title,author:props.author,chapter:props.chapter||'',number:props.number||1,
      phase:props.phase,direction:props.direction,skipping:props.skipping,reduceMotion:props.reduceMotion,
    })+')');
  },[ready,props.title,props.author,props.chapter,props.number,props.phase,props.direction,props.skipping,props.reduceMotion]);

  useEffect(()=>{
    let live=true;
    void coverSource(props.coverUri,props.coverHeaders).then(source=>{
      if(live)inject('window.ArchivistLivingBook&&window.ArchivistLivingBook.setCover('+js(source)+','+js(props.coverMode||'fallback')+')');
    });
    return()=>{live=false;};
  },[ready,props.coverUri,props.coverMode,JSON.stringify(props.coverHeaders||{})]);

  return <View accessibilityLabel="Living book artwork" style={styles.stage} pointerEvents="none">
    <WebView ref={ref} source={{html:initialHtml}} originWhitelist={['*']} javaScriptEnabled scrollEnabled={false}
      bounces={false} overScrollMode="never" androidLayerType="hardware" style={styles.web} containerStyle={styles.container}
      onLoadEnd={()=>setReady(true)} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}
      setSupportMultipleWindows={false} accessible={false} importantForAccessibility="no-hide-descendants"/>
  </View>;
}

const styles=StyleSheet.create({
  stage:{width:340,maxWidth:'100%',height:290,alignSelf:'center',overflow:'hidden',backgroundColor:'transparent'},
  web:{backgroundColor:'transparent'},container:{flex:1,backgroundColor:'transparent'},
});
