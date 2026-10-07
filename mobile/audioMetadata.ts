import {EncodingType, readAsStringAsync} from 'expo-file-system/legacy';
import {isGenericMediaTitle, LocalMetadataFields, publicationYear} from './libraryIntelligence';

const maxID3v2Bytes=256*1024;
const maxMP4MetadataBytes=4*1024*1024;
const maxFastMP4MetadataBytes=512*1024;

export async function extractAudioMetadata(
  uri:string,
  extension:string,
  info?:{size?:number},
  options:{fast?:boolean}={},
):Promise<LocalMetadataFields>{
  const ext=extension.toLowerCase();
  try{
    if(options.fast){
      // Resolve lazily: parser-only tests/web do not require a native bridge.
      const {NativeModules,Platform}=require('react-native');
      if(Platform.OS==='android'){
        if(!NativeModules.ArchivistArchive?.readAudioMetadataWindows)return {};
        if(!['mp3','m4a','m4b'].includes(ext))return {};
        const windows=await NativeModules.ArchivistArchive.readAudioMetadataWindows(uri,ext);
        return ext==='mp3'
          ? {...parseID3v1Base64(windows.tail||''),...parseID3v2Base64(windows.head||'')}
          : mergeFields(parseMP4MetadataBase64(windows.head||''),parseMP4MetadataBase64(windows.tail||''));
      }
      // Keep the existing bounded-window implementation on iOS/web.
    }
    const size=typeof info?.size==='number'?info.size:undefined;
    if(ext==='mp3'){
      const firstLength=size===undefined?maxID3v2Bytes:Math.min(maxID3v2Bytes,size);
      const head=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:0,length:firstLength});
      let fields=parseID3v2Base64(head);
      if((!fields.title||!fields.author||!fields.publishedYear)&&size!==undefined&&size>=128){
        const tail=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:Math.max(0,size-128),length:128});
        fields={...parseID3v1Base64(tail),...fields};
      }
      return fields;
    }
    if(ext==='m4a'||ext==='m4b'){
      const limit=options.fast?maxFastMP4MetadataBytes:maxMP4MetadataBytes;
      const readLength=size===undefined?limit:Math.min(size,limit);
      const head=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:0,length:readLength});
      let fields=parseMP4MetadataBase64(head);
      if(size!==undefined&&size>readLength){
        // Normal preparation reads only a small head/tail window. Full 4 MB
        // windows remain available to explicit Deep Search.
        const tailLength=Math.min(size,limit);
        const tail=await readAsStringAsync(uri,{encoding:EncodingType.Base64,position:Math.max(0,size-tailLength),length:tailLength});
        fields=mergeFields(fields,parseMP4MetadataBase64(tail));
      }
      return fields;
    }
    return {};
  }catch(error){
    if(options.fast)throw error;
    return {};
  }
}

export function parseID3v2Base64(base64:string):LocalMetadataFields{
  const bytes=base64Bytes(base64);
  if(bytes.length<10||ascii(bytes,0,3)!=='ID3')return {};
  const version=bytes[3];
  if(version!==3&&version!==4)return {};
  const tagSize=synchsafe(bytes,6);
  const end=Math.min(bytes.length,10+tagSize);
  const fields:LocalMetadataFields={};
  let album='';
  let offset=10;
  while(offset+10<=end){
    const id=ascii(bytes,offset,4);
    if(!/^[A-Z0-9]{4}$/.test(id))break;
    const frameSize=version===4?synchsafe(bytes,offset+4):bigEndian32(bytes,offset+4);
    if(frameSize<=0||offset+10+frameSize>end)break;
    const data=bytes.slice(offset+10,offset+10+frameSize);
    if(id[0]==='T'&&data.length){
      if(id==='TXXX'){
        const pair=decodeUserText(data);
        const key=pair.description.toLowerCase().replace(/[^a-z0-9]+/g,'');
        const value=pair.value.trim();
        if(value){
          if(/^(narrator|readby|reader)$/.test(key))fields.narrator=value;
          else if(/^(series|seriesname|collection)$/.test(key))fields.series=value;
          else if(/^(seriesnumber|seriesindex|booknumber|volume)$/.test(key)){
            const number=Number(value.match(/\d+(?:\.\d+)?/)?.[0]);
            if(Number.isFinite(number))fields.seriesNumber=number;
          }else if(key==='asin')fields.asin=value;
          else if(/^isbn(?:10|13)?$/.test(key))fields.isbn=value.replace(/[\s-]+/g,'');
          else if(key==='publisher')fields.publisher=value;
        }
      }else{
        const value=decodeTextFrame(data).trim();
        if(value){
          if(id==='TIT2')fields.title=value;
          else if(id==='TALB')album=value;
          else if(id==='TPE1')fields.author=value;
          else if(id==='TPE2'&&!fields.author)fields.author=value;
          else if(id==='TDRC'||id==='TYER')fields.publishedYear=publicationYear(value);
          else if(id==='TCON')fields.genre=value.replace(/^\((\d+)\)$/,'$1');
          else if(id==='TPUB')fields.publisher=value;
          else if(id==='TLAN')fields.language=value;
          else if(id==='TRCK'){
            const number=Number(value.match(/\d+/)?.[0]);
            if(Number.isFinite(number)&&number>0)fields.trackNumber=number;
          }else if(id==='TPOS'){
            const number=Number(value.match(/\d+/)?.[0]);
            if(Number.isFinite(number)&&number>0)fields.discNumber=number;
          }
        }
      }
    }
    offset+=10+frameSize;
  }
  if(album){
    fields.workTitle=album;
    if(!fields.title||isGenericMediaTitle(fields.title,'Audio',2))fields.title=album;
  }
  return compact(fields);
}

export function parseMP4MetadataBase64(base64:string):LocalMetadataFields{
  const bytes=base64Bytes(base64);
  if(bytes.length<16)return {};
  const title=mp4Text(bytes,'©nam');
  const album=mp4Text(bytes,'©alb');
  const artist=mp4Text(bytes,'©ART')||mp4Text(bytes,'aART');
  const albumArtist=mp4Text(bytes,'aART');
  const genre=mp4Text(bytes,'©gen');
  const date=mp4Text(bytes,'©day');
  const grouping=mp4Text(bytes,'©grp');
  const fields:LocalMetadataFields={};
  const chosenTitle=title&&isGenericMediaTitle(title,'Audio',2)&&album?album:title||album;
  if(chosenTitle)fields.title=chosenTitle;
  if(album)fields.workTitle=album;
  if(artist||albumArtist)fields.author=artist||albumArtist;
  if(genre)fields.genre=genre;
  if(grouping)fields.series=grouping;
  const trackNumber=mp4Index(bytes,'trkn');
  const discNumber=mp4Index(bytes,'disk');
  if(trackNumber)fields.trackNumber=trackNumber;
  if(discNumber)fields.discNumber=discNumber;
  const year=publicationYear(date);
  if(year)fields.publishedYear=year;
  return compact(fields);
}

function mp4Index(bytes:Uint8Array,name:string){
  const payload=mp4Data(bytes,name);
  if(!payload||payload.length<4)return undefined;
  // Apple trkn/disk atoms normally store the current index in bytes 2-3
  // of the data payload. Fall back to the first sensible 16-bit value.
  const preferred=(payload[2]<<8)|payload[3];
  if(preferred>0&&preferred<100000)return preferred;
  for(let i=0;i+1<payload.length;i+=2){
    const value=(payload[i]<<8)|payload[i+1];
    if(value>0&&value<100000)return value;
  }
  return undefined;
}

function mp4Text(bytes:Uint8Array,name:string){
  const payload=mp4Data(bytes,name);
  if(!payload?.length)return '';
  return utf8(payload).replace(/\0/g,' ').trim();
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
      const payloadStart=j+12;
      return bytes.slice(payloadStart,dataStart+dataSize);
    }
  }
  return undefined;
}

function mergeFields(primary:LocalMetadataFields,fallback:LocalMetadataFields){
  return compact({...fallback,...primary});
}

export function parseID3v1Base64(base64:string):LocalMetadataFields{
  const bytes=base64Bytes(base64);
  if(bytes.length<128)return {};
  const start=bytes.length-128;
  if(ascii(bytes,start,3)!=='TAG')return {};
  return compact({
    title:latin1(bytes,start+3,30),
    author:latin1(bytes,start+33,30),
    publishedYear:publicationYear(latin1(bytes,start+93,4)),
  });
}

function decodeTextFrame(data:Uint8Array){
  const encoding=data[0];
  return decodeEncoded(data.slice(1),encoding).replace(/\0/g,' ').trim();
}

function decodeUserText(data:Uint8Array){
  const encoding=data[0];
  const body=data.slice(1);
  const separator=encoding===1||encoding===2?findUtf16Null(body):body.indexOf(0);
  if(separator<0)return {description:'',value:decodeEncoded(body,encoding)};
  const step=encoding===1||encoding===2?2:1;
  return {
    description:decodeEncoded(body.slice(0,separator),encoding).trim(),
    value:decodeEncoded(body.slice(separator+step),encoding).replace(/\0/g,' ').trim(),
  };
}

function findUtf16Null(bytes:Uint8Array){
  for(let i=0;i+1<bytes.length;i+=2)if(bytes[i]===0&&bytes[i+1]===0)return i;
  return -1;
}

function decodeEncoded(bytes:Uint8Array,encoding:number){
  if(encoding===1){
    if(bytes.length>=2&&bytes[0]===0xff&&bytes[1]===0xfe)return utf16(bytes.slice(2),true);
    if(bytes.length>=2&&bytes[0]===0xfe&&bytes[1]===0xff)return utf16(bytes.slice(2),false);
    return utf16(bytes,true);
  }
  if(encoding===2)return utf16(bytes,false);
  if(encoding===3)return utf8(bytes);
  return latin1Bytes(bytes);
}

function utf16(bytes:Uint8Array,little:boolean){
  let out='';
  for(let i=0;i+1<bytes.length;i+=2){
    const code=little?bytes[i]|(bytes[i+1]<<8):(bytes[i]<<8)|bytes[i+1];
    if(code)out+=String.fromCharCode(code);
  }
  return out;
}
function utf8(bytes:Uint8Array){
  let out='',i=0;
  while(i<bytes.length){
    const a=bytes[i++];
    if(a<0x80){if(a)out+=String.fromCharCode(a);continue;}
    if((a&0xe0)===0xc0&&i<bytes.length){const b=bytes[i++];out+=String.fromCharCode(((a&31)<<6)|(b&63));continue;}
    if((a&0xf0)===0xe0&&i+1<bytes.length){const b=bytes[i++],c=bytes[i++];out+=String.fromCharCode(((a&15)<<12)|((b&63)<<6)|(c&63));continue;}
    if((a&0xf8)===0xf0&&i+2<bytes.length){
      const b=bytes[i++],c=bytes[i++],d=bytes[i++];
      let cp=((a&7)<<18)|((b&63)<<12)|((c&63)<<6)|(d&63);cp-=0x10000;
      out+=String.fromCharCode(0xd800+(cp>>10),0xdc00+(cp&1023));
    }
  }
  return out;
}
function latin1(bytes:Uint8Array,start:number,length:number){return latin1Bytes(bytes.slice(start,start+length)).replace(/\0+$/,'').trim();}
function latin1Bytes(bytes:Uint8Array){let out='';for(const b of bytes)if(b)out+=String.fromCharCode(b);return out;}
function ascii(bytes:Uint8Array,start:number,length:number){let out='';for(let i=start;i<Math.min(bytes.length,start+length);i++)out+=String.fromCharCode(bytes[i]);return out;}
function synchsafe(bytes:Uint8Array,start:number){return ((bytes[start]&0x7f)<<21)|((bytes[start+1]&0x7f)<<14)|((bytes[start+2]&0x7f)<<7)|(bytes[start+3]&0x7f);}
function bigEndian32(bytes:Uint8Array,start:number){return (((bytes[start]<<24)>>>0)|(bytes[start+1]<<16)|(bytes[start+2]<<8)|bytes[start+3])>>>0;}
function compact(fields:LocalMetadataFields){const out:LocalMetadataFields={};for(const [k,v] of Object.entries(fields))if(v!==undefined&&v!==null&&String(v).trim()!=='')(out as any)[k]=v;return out;}

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
