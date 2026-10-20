import JSZip from 'jszip';
import {createEmbeddedCopy} from './embeddedCopy';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
// Independent container-only implementation of https://www.rarlab.com/technote.htm.
const LIMIT=64*1024*1024;
function crc(b:Uint8Array){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function cat(p:Uint8Array[]){const length=p.reduce((a,b)=>a+b.length,0);if(length>LIMIT)throw Error('RAR output limit');const out=new Uint8Array(length);let at=0;for(const b of p){out.set(b,at);at+=b.length;}return out;}
function vint(n:number){const b=[];do{const v=n%128;n=Math.floor(n/128);b.push(v|(n?128:0));}while(n);return Uint8Array.from(b);}
function u32(n:number){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b;}
function block(body:Uint8Array){const data=cat([vint(body.length),body]);return cat([u32(crc(data)),data]);}
export async function createRar5MetadataCopy(input:Uint8Array,fields:WorkFields,readExisting?:(name:string)=>Promise<Uint8Array>):Promise<Uint8Array>{
 if(input.length>LIMIT||![82,97,114,33,26,7,1,0].every((b,i)=>input[i]===b))throw Error('Unsupported RAR5');
 const view=new DataView(input.buffer,input.byteOffset,input.byteLength),parts=[input.subarray(0,8)];let pos=8,bound=input.length,main=false,ended=false,removed=false,old:Uint8Array|undefined,count=0;const names=new Set<string>();
 const read=()=>{let n=0,power=1;for(let i=0;i<8;i++){if(pos>=bound)throw Error('Truncated RAR5 integer');const b=input[pos++];n+=(b&127)*power;if(!Number.isSafeInteger(n))throw Error('RAR5 integer overflow');if(!(b&128))return n;power*=128;}throw Error('RAR5 integer too long');};
 while(pos<input.length){
  if(++count>5000)throw Error('RAR entry limit');const start=pos;bound=input.length;if(pos+4>bound)throw Error('Truncated RAR5');const checksum=view.getUint32(pos,true);pos+=4;const size=read(),end=pos+size;if(size>2*1024*1024||end>input.length)throw Error('Truncated RAR5 header');bound=end;
  if(crc(input.subarray(start+4,end))!==checksum)throw Error('RAR5 header CRC mismatch');
  const type=read(),flags=read();if(flags&~0x67)throw Error('Unsupported RAR5 block flags');const extra=flags&1?read():0,packed=flags&2?read():0,extraStart=end-extra,finish=end+packed;if(extraStart<pos||finish>input.length)throw Error('Truncated RAR5 data');let keep=true;
  const extras:Uint8Array[]=[];
  const parseExtras=(archive:boolean)=>{pos=extraStart;while(pos<end){const begin=pos,length=read(),stop=pos+length;if(stop>end||!length)throw Error('Invalid RAR5 extra record');const kind=read();if(!archive&&(kind===1||kind===5))throw Error('Unsupported encrypted or redirected RAR5 entry');if(!(archive&&kind===1))extras.push(input.subarray(begin,stop));pos=stop;}if(pos!==end)throw Error('RAR5 extra bounds');};
  if(!main){if(type!==1||packed)throw Error('RAR5 main header missing');const archiveFlags=read();if(archiveFlags&~4)throw Error('Unsupported RAR5 archive flags');if(pos!==extraStart)throw Error('Unsupported RAR5 main fields');parseExtras(true);const bytes=cat(extras);parts.push(block(cat([vint(1),vint(bytes.length?1:0),...(bytes.length?[vint(bytes.length)]:[]),vint(archiveFlags),bytes])));keep=false;main=true;}
  else if(type===2||type===3){
   if(removed&&(flags&32))throw Error('Unsupported RAR5 metadata child');const fileFlags=read(),unpacked=read();read();if(fileFlags&~7||unpacked>64*1024*1024)throw Error('Unsupported RAR5 entry');
   if(fileFlags&2)pos+=4;let dataCRC:number|undefined;if(fileFlags&4){if(pos+4>extraStart)throw Error('Truncated RAR5 CRC');dataCRC=view.getUint32(pos,true);pos+=4;}
   const compression=read();read();const nameLength=read();if(!nameLength||pos+nameLength>extraStart)throw Error('Truncated RAR5 name');const name=new TextDecoder('utf-8',{fatal:true}).decode(input.subarray(pos,pos+nameLength));pos+=nameLength;
   if(pos!==extraStart||name.includes('\0')||name.startsWith('/')||/[\\:]/.test(name)||name.split('/').includes('..'))throw Error('Unsafe RAR5 name');parseExtras(false);
   if(type===3){if(name==='RR')throw Error('Unsupported RAR5 recovery record');if(name==='QO')keep=false;}
   else{
    if(names.has(name.toLowerCase()))throw Error('Ambiguous RAR5 name');names.add(name.toLowerCase());if(removed&&(compression&64))throw Error('Unsupported solid metadata dependency');
    const stored=(compression&0x380)===0;if(stored&&(packed!==unpacked||(dataCRC!==undefined&&crc(input.subarray(end,finish))!==dataCRC)))throw Error('RAR5 data CRC mismatch');
    if(/(^|\/)ComicInfo\.xml$/i.test(name)){if(old||unpacked>2*1024*1024)throw Error('Ambiguous comic metadata');old=stored?Uint8Array.from(input.subarray(end,finish)):readExisting?await readExisting(name):undefined;if(!old||old.length!==unpacked||(dataCRC!==undefined&&crc(old)!==dataCRC))throw Error('Cannot verify RAR5 metadata');keep=false;removed=true;}
   }
  }else if(type===5){if(read()!==0||pos!==end||packed||finish!==input.length)throw Error('Unsupported RAR5 end');ended=true;break;}
  else throw Error('Unsupported RAR5 block');
  if(keep)parts.push(input.subarray(start,finish));pos=finish;
 }
 if(!ended)throw Error('RAR5 end marker missing');const zip=new JSZip();if(old)zip.file('ComicInfo.xml',old);const edited=await JSZip.loadAsync(await createEmbeddedCopy(await zip.generateAsync({type:'uint8array'}),'cbz',fields));const xml=await edited.file('ComicInfo.xml')!.async('uint8array'),name=new TextEncoder().encode('ComicInfo.xml');
 const file=block(cat([vint(2),vint(2),vint(xml.length),vint(4),vint(xml.length),vint(32),u32(crc(xml)),vint(0),vint(0),vint(name.length),name]));return cat([...parts,file,xml,block(Uint8Array.from([5,4,0]))]);
}
