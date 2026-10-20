import JSZip from 'jszip';
import {createEmbeddedCopy} from './embeddedCopy';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
// Independent RAR 1.5–4 container writer, based on the published RAR technical note.
// It never implements compression/decompression or copies UnRAR implementation code.
import {createRar5MetadataCopy} from './rar5Copy';
const LIMIT=64*1024*1024;
function crc(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes){c^=b;for(let bit=0;bit<8;bit++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function join(parts:Uint8Array[]){const size=parts.reduce((n,p)=>n+p.length,0);if(size>LIMIT)throw Error('RAR output size limit');const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
function header(type:number,flags:number,rest:Uint8Array){const h=new Uint8Array(7+rest.length),v=new DataView(h.buffer);h[2]=type;v.setUint16(3,flags,true);v.setUint16(5,h.length,true);h.set(rest,7);v.setUint16(0,crc(h.subarray(2))&65535,true);return h;}
function stored(xml:Uint8Array){const name=new TextEncoder().encode('ComicInfo.xml'),rest=new Uint8Array(25+name.length),v=new DataView(rest.buffer);v.setUint32(0,xml.length,true);v.setUint32(4,xml.length,true);rest[8]=2;v.setUint32(9,crc(xml),true);rest[17]=20;rest[18]=0x30;v.setUint16(19,name.length,true);v.setUint32(21,32,true);rest.set(name,25);return join([header(0x74,0x8000,rest),xml]);}
/** Caller must independently extract/compare all page payloads before source replacement. */
export async function createRarMetadataCopy(input:Uint8Array,fields:WorkFields,readExisting?:(name:string)=>Promise<Uint8Array>):Promise<Uint8Array>{
 if(input.length>LIMIT||input.length<20)throw Error('Unsupported RAR size');
 if(input[6]===1)return createRar5MetadataCopy(input,fields,readExisting);
 const signature=[82,97,114,33,26,7,0];if(!signature.every((b,i)=>input[i]===b))throw Error('Unsupported RAR version');
 const v=new DataView(input.buffer,input.byteOffset,input.byteLength),parts=[input.subarray(0,7)];let at=7,count=0,main=false,ended=false,old:Uint8Array|undefined,removed=false;
 const names=new Set<string>();
 while(at<input.length){
  if(at+7>input.length)throw Error('Truncated RAR header');const type=input[at+2],flags=v.getUint16(at+3,true),size=v.getUint16(at+5,true);
  if(size<7||at+size>input.length)throw Error('Truncated RAR header');
  if((crc(input.subarray(at+2,at+size))&65535)!==v.getUint16(at,true))throw Error('RAR header CRC mismatch');
  if(++count>5000)throw Error('RAR entry limit');
  let packed=0;if(flags&0x8000){if(size<11)throw Error('Truncated RAR data size');packed=v.getUint32(at+7,true);}
  const finish=at+size+packed;if(finish>input.length)throw Error('Truncated RAR data');let keep=true;
  if(!main){if(type!==0x73||size!==13||(flags&~8)!==0)throw Error('Unsupported RAR archive flags');main=true;}
  else if(type===0x74){
   if(size<32||(flags&0x8000)===0||(flags&0x8d0f)!==0x8000)throw Error('Unsupported RAR file flags');
   if(removed&&(flags&16))throw Error('Unsupported solid metadata dependency');
   const unpacked=v.getUint32(at+11,true),nameSize=v.getUint16(at+26,true);if(!nameSize||32+nameSize>size)throw Error('Truncated RAR name');
   const nameBytes=input.subarray(at+32,at+32+nameSize);if(nameBytes.includes(0))throw Error('Unsupported encoded RAR name');
   const name=new TextDecoder('utf-8',{fatal:true}).decode(nameBytes).replace(/\\/g,'/');
   if(name.startsWith('/')||name.includes(':')||name.split('/').includes('..')||names.has(name.toLowerCase()))throw Error('Ambiguous or unsafe RAR name');names.add(name.toLowerCase());
   if(unpacked>64*1024*1024)throw Error('RAR entry expansion limit');
   if(input[at+25]===0x30&&(packed!==unpacked||crc(input.subarray(at+size,finish))!==v.getUint32(at+16,true)))throw Error('RAR data CRC mismatch');
   if(/(^|\/)ComicInfo\.xml$/i.test(name)){
    if(old||unpacked>2*1024*1024)throw Error('Ambiguous comic metadata');
    old=input[at+25]===0x30?Uint8Array.from(input.subarray(at+size,finish)):readExisting?await readExisting(name):undefined;
    if(!old||old.length!==unpacked||crc(old)!==v.getUint32(at+16,true))throw Error('Cannot verify existing RAR metadata');keep=false;removed=true;
   }
  }else if(type===0x7b){if((flags&~0x4000)!==0||size!==7||finish!==input.length)throw Error('Unsupported RAR end record');ended=true;break;}
  else if(type===0x7a){
   // Only independent archive comments are safe to carry through; recovery/authentication
   // records depend on the original archive layout and are deliberately not discarded.
   if(size<32||(flags&0x4000)===0||(flags&0x100)!==0)throw Error('Unsupported RAR service');
   const n=v.getUint16(at+26,true);if(32+n>size||new TextDecoder().decode(input.subarray(at+32,at+32+n))!=='CMT')throw Error('Unsupported RAR service');
  }else throw Error('Unsupported RAR block');
  if(keep)parts.push(input.subarray(at,finish));at=finish;
 }
 if(!ended)throw Error('RAR end marker missing');
 const zip=new JSZip();if(old)zip.file('ComicInfo.xml',old);
 const edited=await JSZip.loadAsync(await createEmbeddedCopy(await zip.generateAsync({type:'uint8array'}),'cbz',fields));const xml=await edited.file('ComicInfo.xml')!.async('uint8array');
 return join([...parts,stored(xml),header(0x7b,0,new Uint8Array())]);
}
