import JSZip from 'jszip';
import {createEmbeddedCopy} from './embeddedCopy';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
export async function createTarMetadataCopy(input:Uint8Array,fields:WorkFields):Promise<Uint8Array>{
 if(input.length>64*1024*1024||input.length%512)throw Error('Unsupported TAR size');
 const decode=(bytes:Uint8Array)=>new TextDecoder().decode(bytes).replace(/\0.*$/s,'').trim();
 const parts:Uint8Array[]=[];let offset=0,found=false,ended=false,entries=0;const zip=new JSZip();
 while(offset+512<=input.length){
  const header=Uint8Array.from(input.subarray(offset,offset+512));if(header.every(b=>b===0)){if(input.slice(offset).some(b=>b!==0))throw Error('Trailing TAR data');ended=true;break;}
  if(++entries>5000)throw Error('TAR entry limit');
  const sizeText=decode(header.slice(124,136)),sumText=decode(header.slice(148,156));
  if(!/^[0-7]+$/.test(sizeText)||!/^[0-7]+$/.test(sumText))throw Error('Unsupported TAR numeric encoding');
  const size=parseInt(sizeText,8),sum=parseInt(sumText,8);header.fill(32,148,156);if(header.reduce((a,b)=>a+b,0)!==sum)throw Error('TAR checksum mismatch');
  const name=[decode(header.slice(345,500)),decode(header.slice(0,100))].filter(Boolean).join('/');
  if(!name||name.startsWith('/')||/[\\\0:]/.test(name)||name.split('/').includes('..')||![0,48,53].includes(header[156]))throw Error('Unsupported TAR entry');
  const end=offset+512+Math.ceil(size/512)*512;if(end>input.length)throw Error('Truncated TAR');
  if(/(^|\/)ComicInfo\.xml$/i.test(name)){if(found||size>2*1024*1024)throw Error('Ambiguous comic metadata');found=true;zip.file('ComicInfo.xml',input.slice(offset+512,offset+512+size));}
  else parts.push(input.slice(offset,end));offset=end;
 }
 if(!ended)throw Error('TAR end marker missing');
 const rewritten=await JSZip.loadAsync(await createEmbeddedCopy(await zip.generateAsync({type:'uint8array'}),'cbz',fields));
 const xml=await rewritten.file('ComicInfo.xml')!.async('uint8array');const header=new Uint8Array(512),encoder=new TextEncoder();
 const put=(offset:number,text:string)=>header.set(encoder.encode(text),offset);
 put(0,'ComicInfo.xml');put(100,'0000644\0');put(108,'0000000\0');put(116,'0000000\0');put(124,xml.length.toString(8).padStart(11,'0')+'\0');put(136,'00000000000\0');header.fill(32,148,156);header[156]=48;put(257,'ustar\0');put(263,'00');put(148,header.reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ');
 parts.push(header,xml,new Uint8Array((512-xml.length%512)%512+1024));
 const total=parts.reduce((n,p)=>n+p.length,0);if(total>64*1024*1024)throw Error('TAR output limit');const out=new Uint8Array(total);let position=0;for(const part of parts){out.set(part,position);position+=part.length;}return out;
}
