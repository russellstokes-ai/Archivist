function detectBubbleRegion(pixels,width,height,tapX,tapY){
  if(width<8||height<8||pixels.length<width*height*4)return null;
  const lum=(r,g,b)=>.2126*r+.7152*g+.0722*b,index=(x,y)=>(y*width+x)*4;
  const tx=Math.max(0,Math.min(width-1,Math.round(tapX))),ty=Math.max(0,Math.min(height-1,Math.round(tapY)));
  let seedX=tx,seedY=ty,seedScore=-1;
  const radius=Math.max(5,Math.min(22,Math.round(Math.min(width,height)*.035)));
  for(let dy=-radius;dy<=radius;dy++){
    const y=ty+dy;if(y<0||y>=height)continue;
    for(let dx=-radius;dx<=radius;dx++){
      const x=tx+dx;if(x<0||x>=width||dx*dx+dy*dy>radius*radius)continue;
      const p=index(x,y);if(pixels[p+3]<180)continue;
      const score=lum(pixels[p],pixels[p+1],pixels[p+2])-Math.sqrt(dx*dx+dy*dy)*1.4;
      if(score>seedScore){seedScore=score;seedX=x;seedY=y;}
    }
  }
  const sp=index(seedX,seedY),sr=pixels[sp],sg=pixels[sp+1],sb=pixels[sp+2],baseLum=lum(sr,sg,sb);
  if(baseLum<115)return null;
  const total=width*height,visited=new Uint8Array(total),queue=new Int32Array(total),leftByRow=new Int32Array(height),rightByRow=new Int32Array(height);
  leftByRow.fill(width);rightByRow.fill(-1);
  const tolerance=95*95,minLum=Math.max(75,baseLum-95),maxArea=Math.max(96,Math.floor(total*.30));
  let head=0,tail=0,area=0,left=width,top=height,right=-1,bottom=-1;queue[tail++]=seedY*width+seedX;
  while(head<tail){
    const pos=queue[head++];if(visited[pos])continue;
    const x=pos%width,y=(pos/width)|0,p=pos*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2],dr=r-sr,dg=g-sg,db=b-sb;
    if(pixels[p+3]<160||lum(r,g,b)<minLum||dr*dr+dg*dg+db*db>tolerance)continue;
    visited[pos]=1;area++;if(area>maxArea)return null;
    if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;
    if(x<leftByRow[y])leftByRow[y]=x;if(x>rightByRow[y])rightByRow[y]=x;
    if(x>0&&!visited[pos-1])queue[tail++]=pos-1;
    if(x+1<width&&!visited[pos+1])queue[tail++]=pos+1;
    if(y>0&&!visited[pos-width])queue[tail++]=pos-width;
    if(y+1<height&&!visited[pos+width])queue[tail++]=pos+width;
  }
  if(area<Math.max(28,total*.00035)||right<=left||bottom<=top)return null;
  const boxArea=(right-left+1)*(bottom-top+1);
  if(boxArea>total*.32||(right-left)>width*.88||(bottom-top)>height*.78)return null;
  const pad=Math.max(2,Math.round(Math.min(right-left+1,bottom-top+1)*.045));
  left=Math.max(0,left-pad);right=Math.min(width-1,right+pad);top=Math.max(0,top-pad);bottom=Math.min(height-1,bottom+pad);
  const step=Math.max(1,Math.floor((bottom-top+1)/90)),rows=[];let lastLeft=seedX,lastRight=seedX;
  for(let y=top;y<=bottom;y+=step){
    if(rightByRow[y]>=0){lastLeft=leftByRow[y];lastRight=rightByRow[y];}
    rows.push({y,left:Math.max(left,lastLeft-pad),right:Math.min(right,lastRight+pad)});
  }
  if(rows.at(-1)?.y!==bottom)rows.push({y:bottom,left:Math.max(left,lastLeft-pad),right:Math.min(right,lastRight+pad)});
  return {left,top,right,bottom,area,rows};
}

export function createSpeechFocusController(){
  let overlay=null,generation=0;const cache=new Map();
  function close(){generation++;if(overlay){overlay.remove();overlay=null;}}
  function regionFor(img,clientX,clientY,key){
    const rect=img.getBoundingClientRect();if(!rect.width||!rect.height||!img.naturalWidth||!img.naturalHeight)return null;
    const scale=Math.min(1,520/Math.max(img.naturalWidth,img.naturalHeight)),width=Math.max(8,Math.round(img.naturalWidth*scale)),height=Math.max(8,Math.round(img.naturalHeight*scale));
    const x=(clientX-rect.left)/rect.width*width,y=(clientY-rect.top)/rect.height*height,bucket=key+':'+Math.round(x/24)+':'+Math.round(y/24);
    if(cache.has(bucket))return {region:cache.get(bucket),rect,width,height};
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;
    ctx.drawImage(img,0,0,width,height);let data;try{data=ctx.getImageData(0,0,width,height).data;}catch{return null;}
    const region=detectBubbleRegion(data,width,height,x,y);if(!region)return null;cache.set(bucket,region);if(cache.size>24){const oldest=cache.keys().next().value;if(oldest)cache.delete(oldest);}
    return {region,rect,width,height};
  }
  function focus(img,clientX,clientY,key='page'){
    if(overlay){close();return true;}
    const token=++generation,found=regionFor(img,clientX,clientY,key);if(!found||token!==generation)return false;
    const {region,rect,width,height}=found,sx=img.naturalWidth/width,sy=img.naturalHeight/height;
    const sourceX=region.left*sx,sourceY=region.top*sy,sourceW=(region.right-region.left+1)*sx,sourceH=(region.bottom-region.top+1)*sy;if(sourceW<12||sourceH<12)return false;
    const outputScale=Math.min(1,1600/Math.max(sourceW,sourceH)),outW=Math.max(1,Math.round(sourceW*outputScale)),outH=Math.max(1,Math.round(sourceH*outputScale));
    const canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;const ctx=canvas.getContext('2d');if(!ctx)return false;
    const path=new Path2D(),xScale=outW/(region.right-region.left+1),yScale=outH/(region.bottom-region.top+1),rows=region.rows;if(rows.length<2)return false;
    path.moveTo((rows[0].left-region.left)*xScale,(rows[0].y-region.top)*yScale);
    for(const row of rows)path.lineTo((row.left-region.left)*xScale,(row.y-region.top)*yScale);
    for(let i=rows.length-1;i>=0;i--){const row=rows[i];path.lineTo((row.right-region.left)*xScale,(row.y-region.top)*yScale);}path.closePath();
    ctx.save();ctx.clip(path);ctx.drawImage(img,sourceX,sourceY,sourceW,sourceH,0,0,outW,outH);ctx.restore();
    const displayLeft=rect.left+region.left/width*rect.width,displayTop=rect.top+region.top/height*rect.height,displayW=(region.right-region.left+1)/width*rect.width,displayH=(region.bottom-region.top+1)/height*rect.height,ratio=displayW/Math.max(1,displayH);
    let targetW=Math.min(innerWidth*.82,Math.max(displayW*2.15,220)),targetH=targetW/Math.max(.2,ratio);if(targetH>innerHeight*.68){targetH=innerHeight*.68;targetW=targetH*ratio;}
    const targetLeft=Math.max(12,Math.min(innerWidth-targetW-12,(innerWidth-targetW)/2)),targetTop=Math.max(12,Math.min(innerHeight-targetH-12,(innerHeight-targetH)/2));
    const button=document.createElement('button');button.type='button';button.className='speech-focus-overlay';button.setAttribute('aria-label','Close enlarged speech bubble');button.style.left=displayLeft+'px';button.style.top=displayTop+'px';button.style.width=displayW+'px';button.style.height=displayH+'px';canvas.style.width='100%';canvas.style.height='100%';button.append(canvas);button.onclick=close;button.onkeydown=e=>{if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();close();}};
    document.body.append(button);overlay=button;button.focus({preventScroll:true});requestAnimationFrame(()=>{if(button!==overlay)return;button.classList.add('open');button.style.left=targetLeft+'px';button.style.top=targetTop+'px';button.style.width=targetW+'px';button.style.height=targetH+'px';});return true;
  }
  document.addEventListener('pointerdown',e=>{if(overlay&&!overlay.contains(e.target))close();},true);
  return {focus,close,cancel:close,isActive:()=>!!overlay};
}
