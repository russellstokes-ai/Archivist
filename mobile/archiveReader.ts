import {EncodingType,getInfoAsync,readAsStringAsync} from 'expo-file-system/legacy';

declare const require:any;
export type ArchiveImage={name:string;mime:string;base64:string};
const maxArchiveBytes=256*1024*1024;
const maxEntryBytes=64*1024*1024;
const maxPages=500;
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(input:string){
  const clean=input.replace(/[^A-Za-z0-9+/=]/g,'');const out:number[]=[];let buffer=0,bits=0;
  for(const ch of clean){if(ch==='=')break;const value=alphabet.indexOf(ch);if(value<0)continue;buffer=(buffer<<6)|value;bits+=6;if(bits>=8){bits-=8;out.push((buffer>>bits)&255);}}
  return new Uint8Array(out);
}
function encodeBase64(bytes:Uint8Array){
  let out='';for(let i=0;i<bytes.length;i+=3){const a=bytes[i]||0,b=bytes[i+1]||0,c=bytes[i+2]||0,n=(a<<16)|(b<<8)|c;out+=alphabet[(n>>18)&63]+alphabet[(n>>12)&63]+(i+1<bytes.length?alphabet[(n>>6)&63]:'=')+(i+2<bytes.length?alphabet[n&63]:'=');}return out;
}
function text(bytes:Uint8Array,start:number,length:number){let s='';for(let i=start;i<Math.min(bytes.length,start+length);i++){if(bytes[i]===0)break;s+=String.fromCharCode(bytes[i]);}return s.trim();}
function octal(bytes:Uint8Array,start:number,length:number){const raw=text(bytes,start,length).replace(/\0/g,'').trim();return raw?parseInt(raw,8)||0:0;}
function mime(name:string){const lower=name.toLowerCase();return lower.endsWith('.png')?'image/png':lower.endsWith('.webp')?'image/webp':lower.endsWith('.gif')?'image/gif':'image/jpeg';}
function imageName(name:string){return /\.(jpe?g|png|gif|webp)$/i.test(name);}
export function parseTarImages(bytes:Uint8Array):ArchiveImage[]{
  const images:ArchiveImage[]=[];let offset=0,total=0;
  while(offset+512<=bytes.length&&images.length<maxPages){
    let empty=true;for(let i=offset;i<offset+512;i++)if(bytes[i]!==0){empty=false;break;}if(empty)break;
    const name=text(bytes,offset,100);const size=octal(bytes,offset+124,12);const type=String.fromCharCode(bytes[offset+156]||48);
    if(size<0||size>maxEntryBytes)throw Error('Comic archive entry exceeds the 64 MB safety limit.');
    const dataStart=offset+512,dataEnd=dataStart+size;if(dataEnd>bytes.length)throw Error('Comic archive is truncated.');
    if(type!=='5'&&imageName(name)){total+=size;if(total>maxArchiveBytes)throw Error('Comic archive expands beyond the 256 MB reader safety limit.');images.push({name,mime:mime(name),base64:encodeBase64(bytes.slice(dataStart,dataEnd))});}
    offset=dataStart+Math.ceil(size/512)*512;
  }
  return images.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
}
export async function readCbtImages(uri:string){
  const info=await getInfoAsync(uri);if(!info.exists)throw Error('Comic archive is unavailable.');if('size' in info&&typeof info.size==='number'&&info.size>maxArchiveBytes)throw Error('Comic archive exceeds the 256 MB reader safety limit.');
  const raw=await readAsStringAsync(uri,{encoding:EncodingType.Base64});return parseTarImages(decodeBase64(raw));
}
export async function readCbrImages(uri:string):Promise<ArchiveImage[]>{
  const info=await getInfoAsync(uri);if(!info.exists)throw Error('Comic archive is unavailable.');if('size' in info&&typeof info.size==='number'&&info.size>maxArchiveBytes)throw Error('Comic archive exceeds the 256 MB reader safety limit.');
  const rn=require('react-native');const module=rn.NativeModules?.ArchivistArchive;if(!module?.readRarImages)throw Error('CBR reading requires the Archivist Android native reader module.');
  const result=await module.readRarImages(uri,maxPages,maxEntryBytes,maxArchiveBytes);return Array.isArray(result)?result:[];
}
