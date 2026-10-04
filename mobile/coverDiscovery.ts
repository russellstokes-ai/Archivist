import {openNativeZip} from './nativeZip';
import JSZip from 'jszip';
import {NativeModules} from 'react-native';
import {openCbrPages,readCbtImages} from './archiveReader';
import {
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

export type DiscoveredCover = {
  base64: string;
  mimeType: string;
  extension: string;
};

const maxArchiveBytes=64*1024*1024;
const maxCoverBytes=12*1024*1024;
const maxAudioTagBytes=4*1024*1024;

export async function discoverEmbeddedCover(
  uri:string,
  extension:string,
  info?:{size?:number;modificationTime?:number},
):Promise<string|undefined>{
  const ext=extension.toLowerCase();
  let cover:DiscoveredCover|undefined;
  try{
    if(ext==='pdf'){
      const module=NativeModules?.ArchivistArchive;
      if(!module?.renderPdfPage)return undefined;
      const result=await module.renderPdfPage(uri,0,480);
      const base64=String(result?.base64||'');
      if(!base64||Math.floor(base64.length*3/4)>maxCoverBytes)return undefined;
      cover={base64,mimeType:'image/png',extension:'png'};
    }else if(ext==='cbr'||ext==='cbt'){
      const first=ext==='cbr'?await (await openCbrPages(uri)).loadPage(0):(await readCbtImages(uri))[0];
      const base64=String(first?.base64||'');
      const mimeType=String(first?.mime||'image/jpeg');
      if(!base64||Math.floor(base64.length*3/4)>maxCoverBytes)return undefined;
      const extension=mimeType.includes('png')?'png':mimeType.includes('webp')?'webp':mimeType.includes('gif')?'gif':'jpg';
      cover={base64,mimeType,extension};
    }else if(ext==='epub'||ext==='cbz'||ext==='zip'){
      const nativeZip=await openNativeZip(uri);
      if(nativeZip){try{cover=await extractArchiveCoverFromZip(nativeZip,ext);}finally{await nativeZip.dispose?.();}}
      else{
        if(typeof info?.size==='number'&&info.size>maxArchiveBytes)return undefined;
        const base64=await readAsStringAsync(uri,{encoding:EncodingType.Base64});
        cover=await extractArchiveCoverFromBase64(base64,ext);
      }
    }else if(ext==='mp3'){
      const length=typeof info?.size==='number'?Math.min(info.size,maxAudioTagBytes):maxAudioTagBytes;
      const head=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:0,length});
      cover=extractID3PictureFromBase64(head);
    }else if(ext==='m4a'||ext==='m4b'){
      const size=typeof info?.size==='number'?info.size:undefined;
      const length=size===undefined?maxAudioTagBytes:Math.min(size,maxAudioTagBytes);
      const head=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:0,length});
      cover=extractMP4PictureFromBase64(head);
      if(!cover&&size!==undefined&&size>length){
        const tailLength=Math.min(size,maxAudioTagBytes);
        const tail=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:Math.max(0,size-tailLength),length:tailLength});
        cover=extractMP4PictureFromBase64(tail);
      }
    }else{
      return undefined;
    }
    if(!cover)return undefined;
    return await persistDiscoveredCover(cover,uri,info);
  }catch{
    return undefined;
  }
}

export async function extractArchiveCoverFromBase64(base64:string, extension:string):Promise<DiscoveredCover|undefined>{
  if(!base64)return undefined;
  try{
    return await extractArchiveCoverFromZip(await JSZip.loadAsync(base64,{base64:true}),extension);
  }catch{return undefined;}
}

async function extractArchiveCoverFromZip(zip:JSZip,extension:string):Promise<DiscoveredCover|undefined>{
  try{
    const entries=Object.values(zip.files).filter(file=>!file.dir&&isImage(file.name)&&(((file as any)._data?.uncompressedSize??0)<=maxCoverBytes));
    if(!entries.length)return undefined;
    const ext=extension.toLowerCase();

    if(ext==='epub'){
      const target=await epubCoverEntry(zip);
      if(target)return zipCover(target);
      const named=entries
        .slice()
        .sort((a,b)=>coverNameRank(a.name)-coverNameRank(b.name)||naturalCompare(a.name,b.name))
        .find(file=>coverNameRank(file.name)<90);
      return named?zipCover(named):undefined;
    }

    const comic=entries
      .filter(file=>!/(^|\/)__macosx\//i.test(file.name)&&!/\/(?:thumbs?|thumbnails?)\//i.test(file.name))
      .sort((a,b)=>{
        const ar=coverNameRank(a.name),br=coverNameRank(b.name);
        if(ar!==br&&Math.min(ar,br)<90)return ar-br;
        return naturalCompare(a.name,b.name);
      })[0];
    return comic?zipCover(comic):undefined;
  }catch{
    return undefined;
  }
}

export function extractID3PictureFromBase64(base64:string):DiscoveredCover|undefined{
  const bytes=base64Bytes(base64);
  if(bytes.length<10||ascii(bytes,0,3)!=='ID3')return undefined;
  const version=bytes[3];
  if(version!==3&&version!==4)return undefined;
  const tagSize=synchsafe(bytes,6);
  const end=Math.min(bytes.length,10+tagSize);
  let fallback:DiscoveredCover|undefined;
  for(let offset=10;offset+10<=end;){
    const id=ascii(bytes,offset,4);
    if(!/^[A-Z0-9]{4}$/.test(id))break;
    const frameSize=version===4?synchsafe(bytes,offset+4):bigEndian32(bytes,offset+4);
    if(frameSize<=0||offset+10+frameSize>end)break;
    if(id==='APIC'){
      const parsed=parseAPIC(bytes.slice(offset+10,offset+10+frameSize));
      if(parsed){
        if(parsed.pictureType===3)return parsed.cover;
        fallback=fallback||parsed.cover;
      }
    }
    offset+=10+frameSize;
  }
  return fallback;
}

export function extractMP4PictureFromBase64(base64:string):DiscoveredCover|undefined{
  const bytes=base64Bytes(base64);
  const payload=mp4Data(bytes,'covr');
  if(!payload?.length||payload.length>maxCoverBytes)return undefined;
  const extension=signatureExtension(payload);
  if(!extension)return undefined;
  return {base64:bytesBase64(payload),mimeType:mimeForExtension(extension),extension};
}

function mp4Data(bytes:Uint8Array,name:string){
  for(let i=4;i+4<=bytes.length;i++){
    if(ascii(bytes,i,4)!==name)continue;
    const parentStart=i-4;
    const parentSize=bigEndian32(bytes,parentStart);
    if(parentSize<16)continue;
    const parentEnd=Math.min(bytes.length,parentStart+parentSize);
    for(let j=i+4;j+16<=parentEnd;j++){
      if(ascii(bytes,j,4)!=='data')continue;
      const dataStart=j-4;
      const dataSize=bigEndian32(bytes,dataStart);
      if(dataSize<16||dataStart+dataSize>parentEnd)continue;
      return bytes.slice(j+12,dataStart+dataSize);
    }
  }
  return undefined;
}

async function epubCoverEntry(zip:JSZip){
  let opfPath='';
  const container=zip.file('META-INF/container.xml');
  if(container){
    const xml=await container.async('text');
    opfPath=xml.match(/full-path\s*=\s*["']([^"']+\.opf)["']/i)?.[1]||'';
  }
  const opf=(opfPath&&zip.file(opfPath))||Object.values(zip.files).find(file=>!file.dir&&/\.opf$/i.test(file.name));
  if(!opf)return undefined;
  const xml=await opf.async('text');
  if(!opfPath)opfPath=opf.name;
  const base=opfPath.includes('/')?opfPath.slice(0,opfPath.lastIndexOf('/')+1):'';

  const coverId=xml.match(/<meta\b[^>]*name\s*=\s*["']cover["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1]
    ||xml.match(/<meta\b[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']cover["'][^>]*>/i)?.[1];

  const items=[...xml.matchAll(/<item\b([^>]+)>/gi)].map(match=>{
    const attrs=match[1];
    return {
      id:attr(attrs,'id'),
      href:attr(attrs,'href'),
      properties:attr(attrs,'properties'),
      mediaType:attr(attrs,'media-type'),
    };
  }).filter(item=>item.href);

  let item=items.find(candidate=>/\bcover-image\b/i.test(candidate.properties));
  if(!item&&coverId)item=items.find(candidate=>candidate.id===coverId);
  if(!item)item=items.find(candidate=>/cover|front|titlepage/i.test(candidate.id+' '+candidate.href)&&/^image\//i.test(candidate.mediaType));
  if(!item)return undefined;

  const coverPath=normalZipPath(base+decodeXml(item.href).split('#')[0]);
  const file=zip.file(coverPath)||Object.values(zip.files).find(candidate=>normalZipPath(candidate.name).toLowerCase()===coverPath.toLowerCase());
  if(!file||file.dir||!isImage(file.name)||(((file as any)._data?.uncompressedSize??0)>maxCoverBytes))return undefined;
  return file;
}

async function zipCover(file:JSZip.JSZipObject):Promise<DiscoveredCover|undefined>{
  const ext=imageExtension(file.name);
  if(!ext)return undefined;
  const base64=await file.async('base64');
  if(!base64||Math.floor(base64.length*3/4)>maxCoverBytes)return undefined;
  return {base64,mimeType:mimeForExtension(ext),extension:ext};
}

function parseAPIC(data:Uint8Array){
  if(data.length<6)return undefined;
  const encoding=data[0];
  let cursor=1;
  const mimeEnd=indexOfByte(data,0,cursor);
  if(mimeEnd<0)return undefined;
  let mime=ascii(data,cursor,mimeEnd-cursor).toLowerCase();
  cursor=mimeEnd+1;
  if(cursor>=data.length)return undefined;
  const pictureType=data[cursor++];
  const descriptionEnd=encoding===1||encoding===2?indexOfUtf16Null(data,cursor):indexOfByte(data,0,cursor);
  if(descriptionEnd<0)return undefined;
  cursor=descriptionEnd+(encoding===1||encoding===2?2:1);
  if(cursor>=data.length)return undefined;
  const image=data.slice(cursor);
  if(!image.length||image.length>maxCoverBytes)return undefined;
  let extension=mime.includes('png')?'png':mime.includes('webp')?'webp':mime.includes('gif')?'gif':mime.includes('jpeg')||mime.includes('jpg')?'jpg':'';
  if(!extension){
    extension=signatureExtension(image);
    mime=mimeForExtension(extension);
  }
  if(!extension)return undefined;
  return {pictureType,cover:{base64:bytesBase64(image),mimeType:mime,extension}};
}

async function persistDiscoveredCover(cover:DiscoveredCover,sourceUri:string,info?:{size?:number;modificationTime?:number}){
  if(!documentDirectory)return 'data:'+cover.mimeType+';base64,'+cover.base64;
  const dir=documentDirectory.replace(/\/$/,'')+'/covers/';
  await makeDirectoryAsync(dir,{intermediates:true});
  const fingerprint=hash(sourceUri+'|'+String(info?.size??'')+'|'+String(info?.modificationTime??''));
  const target=dir+'embedded-'+fingerprint+'.'+cover.extension;
  const existing=await getInfoAsync(target).catch(()=>({exists:false} as any));
  if(existing.exists)return target;
  await writeAsStringAsync(target,cover.base64,{encoding:EncodingType.Base64});
  return target;
}

function attr(text:string,name:string){
  return decodeXml(text.match(new RegExp('\\b'+name+'\\s*=\\s*["\\\']([^"\\\']*)["\\\']','i'))?.[1]||'');
}
function decodeXml(value:string){return value.replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'");}
function normalZipPath(value:string){
  const parts:string[]=[];
  for(const part of value.replace(/\\/g,'/').split('/')){
    if(!part||part==='.')continue;
    if(part==='..')parts.pop();else parts.push(part);
  }
  return parts.join('/');
}
function isImage(name:string){return !!imageExtension(name);}
function imageExtension(name:string){
  const ext=name.toLowerCase().split('?')[0].match(/\.([a-z0-9]+)$/)?.[1]||'';
  return ext==='jpeg'?'jpg':['jpg','png','webp','gif'].includes(ext)?ext:'';
}
function mimeForExtension(ext:string){return ext==='png'?'image/png':ext==='webp'?'image/webp':ext==='gif'?'image/gif':'image/jpeg';}
function coverNameRank(name:string){
  const base=name.toLowerCase().split('/').pop()||'';
  if(/^cover(?:[-_. ]?\d*)?\.(?:jpe?g|png|webp|gif)$/.test(base))return 0;
  if(/^front(?:[-_. ]?cover)?\.(?:jpe?g|png|webp|gif)$/.test(base))return 1;
  if(/cover|front|titlepage/.test(base))return 5;
  return 99;
}
function naturalCompare(a:string,b:string){return a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});}
function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}
function indexOfByte(bytes:Uint8Array,value:number,start=0){for(let i=start;i<bytes.length;i++)if(bytes[i]===value)return i;return -1;}
function indexOfUtf16Null(bytes:Uint8Array,start=0){for(let i=start;i+1<bytes.length;i+=2)if(bytes[i]===0&&bytes[i+1]===0)return i;return -1;}
function signatureExtension(bytes:Uint8Array){
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'jpg';
  if(bytes.length>=8&&bytes[0]===0x89&&ascii(bytes,1,3)==='PNG')return 'png';
  if(bytes.length>=6&&(ascii(bytes,0,6)==='GIF87a'||ascii(bytes,0,6)==='GIF89a'))return 'gif';
  if(bytes.length>=12&&ascii(bytes,0,4)==='RIFF'&&ascii(bytes,8,4)==='WEBP')return 'webp';
  return '';
}
function ascii(bytes:Uint8Array,start:number,length:number){let out='';for(let i=start;i<Math.min(bytes.length,start+length);i++)out+=String.fromCharCode(bytes[i]);return out;}
function synchsafe(bytes:Uint8Array,start:number){return ((bytes[start]&0x7f)<<21)|((bytes[start+1]&0x7f)<<14)|((bytes[start+2]&0x7f)<<7)|(bytes[start+3]&0x7f);}
function bigEndian32(bytes:Uint8Array,start:number){return (((bytes[start]<<24)>>>0)|(bytes[start+1]<<16)|(bytes[start+2]<<8)|bytes[start+3])>>>0;}
function base64Bytes(input:string){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean=input.replace(/[^A-Za-z0-9+/]/g,'');
  const out=new Uint8Array(Math.floor(clean.length*3/4));
  let buffer=0,bits=0,index=0;
  for(const char of clean){
    const value=chars.indexOf(char);if(value<0)continue;
    buffer=(buffer<<6)|value;bits+=6;
    if(bits>=8){bits-=8;out[index++]=(buffer>>bits)&255;}
  }
  return out.slice(0,index);
}
function bytesBase64(bytes:Uint8Array){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out='';
  for(let i=0;i<bytes.length;i+=3){
    const a=bytes[i],b=i+1<bytes.length?bytes[i+1]:0,c=i+2<bytes.length?bytes[i+2]:0;
    out+=chars[a>>2]+chars[((a&3)<<4)|(b>>4)]+(i+1<bytes.length?chars[((b&15)<<2)|(c>>6)]:'=')+(i+2<bytes.length?chars[c&63]:'=');
  }
  return out;
}
