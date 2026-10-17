const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),zlib=require('zlib');
const {decodePNG,analyse,analyze}=require('../scripts/test14-splash-frame-analysis.cjs');
const pngSig=Buffer.from([137,80,78,71,13,10,26,10]);
let crcTable=null;
function crc32(data){
 if(!crcTable)crcTable=Array.from({length:256},(_,i)=>{
  let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
 });
 let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;
}
function chunk(name,data){
 const tag=Buffer.from(name),len=Buffer.alloc(4),crc=Buffer.alloc(4);
 len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));
 return Buffer.concat([len,tag,data,crc]);
}
function frame(phase){
 const w=320,h=480,info=Buffer.alloc(13);info.writeUInt32BE(w,0);info.writeUInt32BE(h,4);info[8]=8;info[9]=6;
 const rows=Buffer.alloc((w*4+1)*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const idx=y*(w*4+1)+1+x*4;
  const dynamic=y>135&&y<350&&x>85+phase*8&&x<185+phase*8;
  rows[idx]=dynamic?185:47;rows[idx+1]=dynamic?154:139;rows[idx+2]=dynamic?104:134;rows[idx+3]=255;
 }
 return Buffer.concat([pngSig,chunk('IHDR',info),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'archivist-native-splash-'));
try{
 const files=Array.from({length:8},(_,i)=>{
  const p=path.join(folder,'sample-'+i+'.png');fs.writeFileSync(p,frame(i));return p;
 });
 const data=decodePNG(fs.readFileSync(files[0]));
 assert.equal(data.width,320);assert.equal(data.height,480);
 const good=analyze(files);
 assert.equal(good.brandTealFrames,8);
 assert(good.movingTransitions>=2,'Moving native captures must show changing centre pixels');
 assert(good.movingTealTransitions>=2,'Animation must move on teal, not merely switch from splash to Shelf');
 const frozen=analyze(Array.from({length:8},()=>files[0]));
 assert.equal(frozen.movingTransitions,0,'Static icon must be rejected even though brand teal exists');
 assert.equal(frozen.movingTealTransitions,0,'Static teal must never pass the new native animation gate');
 console.log('PASS: native screenshot decoder distinguishes real moving splash from static branded icon');
}finally{fs.rmSync(folder,{recursive:true,force:true})}
