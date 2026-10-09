export type EmbeddedFields={title?:string;album?:string;author?:string;genre?:string;track?:number;disc?:number};
export type HeaderClues={readerVersion:'header-1';provenance:'embedded';status:'parsed'|'partial'|'unresolved';reason:string;fields:EmbeddedFields};
const ids:Record<string,keyof EmbeddedFields>={TIT2:'title',TALB:'album',TPE1:'author',TCON:'genre',TRCK:'track',TPOS:'disc','\xa9nam':'title','\xa9alb':'album','\xa9ART':'author',aART:'author','\xa9gen':'genre'};
function ascii(bytes:Uint8Array,start:number,length:number){let value='';for(let i=start;i<start+length;i++)value+=String.fromCharCode(bytes[i]);return value;}
function u32(bytes:Uint8Array,start:number){return bytes[start]*16777216+bytes[start+1]*65536+bytes[start+2]*256+bytes[start+3];}
function sync(bytes:Uint8Array,start:number){for(let i=0;i<4;i++)if(bytes[start+i]&128)return -1;return bytes[start]*2097152+bytes[start+1]*16384+bytes[start+2]*128+bytes[start+3];}
// Self-contained decoding avoids assuming TextDecoder exists in the Android JS runtime.
function utf8(bytes:Uint8Array):string{
  let out='';
  for(let i=0;i<bytes.length&&out.length<4096;){
    const first=bytes[i++];if(first<128){out+=String.fromCharCode(first);continue;}
    const count=first>=194&&first<=223?1:first>=224&&first<=239?2:first>=240&&first<=244?3:0;
    if(!count||i+count>bytes.length){out+='\ufffd';continue;}
    let value=first&((1<<(6-count))-1),valid=true;
    for(let n=0;n<count;n++){const next=bytes[i+n];if((next&192)!==128){valid=false;break;}value=value*64+(next&63);}
    if(!valid){out+='\ufffd';continue;}
    i+=count;
    if(value<(count===1?128:count===2?2048:65536)||value>0x10ffff||value>=0xd800&&value<=0xdfff)out+='\ufffd';else out+=String.fromCodePoint(value);
  }
  return out;
}
function text(bytes:Uint8Array,encoding:number):string|null{
  if(encoding===3)return utf8(bytes).split('\0')[0].trim();
  if(encoding===0)return ascii(bytes,0,Math.min(bytes.length,4096)).split('\0')[0].trim();
  if(encoding!==1&&encoding!==2)return null;
  let offset=0,little=false;
  if(encoding===1){if(bytes[0]===255&&bytes[1]===254)little=true;else if(!(bytes[0]===254&&bytes[1]===255))return null;offset=2;}
  let value='';for(let i=offset;i+1<bytes.length&&value.length<4096;i+=2){const point=little?bytes[i]+bytes[i+1]*256:bytes[i]*256+bytes[i+1];if(!point)break;value+=String.fromCharCode(point);}return value.trim();
}

/** Parses only complete frames/atoms inside a bounded header. Absence is never
 * proof of absent metadata: late MP4 indexes and other formats remain unresolved.
 * Embedded strings are evidence, never accepted identity or manual field updates.
 */
export function parseHeaderClues(bytes:Uint8Array,extension:string):HeaderClues {
  if(bytes.length>65536)throw new RangeError('Header byte budget exceeded');
  const result:HeaderClues={readerVersion:'header-1',provenance:'embedded',status:'unresolved',reason:'unsupported-header-format',fields:{}};
  const conflicts=new Set<keyof EmbeddedFields>();let partial=false,reason='';
  function assign(key:keyof EmbeddedFields,value:string|null){
    if(!value||conflicts.has(key))return;
    if(value.includes('\ufffd')){partial=true;reason='invalid-text-encoding';return;}
    const numeric=key==='track'||key==='disc';const n=numeric&&/^\d+(?:\/\d+)?$/.test(value)?Number(value.split('/')[0]):null;
    const next=numeric?n&&Number.isSafeInteger(n)&&n<=100000?n:null:value;
    if(next===null)return;
    const prior=result.fields[key];
    if(prior!==undefined&&prior!==next){delete result.fields[key];conflicts.add(key);partial=true;reason='conflicting-embedded-fields';return;}
    if(numeric)result.fields[key as 'track'|'disc']=next as number;else result.fields[key as 'title'|'album'|'author'|'genre']=next as string;
  }
  if(bytes.length>=10&&ascii(bytes,0,3)==='ID3'){
    const version=bytes[3],length=sync(bytes,6);
    if(version!==3&&version!==4){result.reason='unsupported-id3-version';return result;}
    if(bytes[5]!==0){result.reason='id3-flags-require-special-reader';return result;}
    if(length<0){result.status='partial';result.reason='invalid-id3-size';return result;}
    const end=Math.min(bytes.length,10+length);partial=10+length>bytes.length;
    let offset=10,frames=0;
    while(offset<end&&bytes[offset]!==0){
      if(++frames>1024||offset+10>end){partial=true;break;}
      const id=ascii(bytes,offset,4),size=version===4?sync(bytes,offset+4):u32(bytes,offset+4);
      if(!/^[A-Z0-9]{4}$/.test(id)||size<1||offset+10+size>end){partial=true;break;}
      if(bytes[offset+8]||bytes[offset+9]){partial=true;reason='id3-frame-flags-require-special-reader';}
      else if(ids[id])assign(ids[id],text(bytes.subarray(offset+11,offset+10+size),bytes[offset+10]));
      offset+=10+size;
    }
    result.reason=reason|| (partial?'id3-truncated-or-frame-budget':'id3-header');
  }else if(['m4a','m4b','mp4'].includes(extension.toLowerCase().replace(/^\./,''))){
    let atoms=0,index=false;
    function walk(start:number,end:number,depth:number,inIndex=false){
      if(depth>8){partial=true;reason='mp4-depth-budget';return;}
      let offset=start;
      while(offset<end){
        if(++atoms>1024||offset+8>end){partial=true;return;}
        const size=u32(bytes,offset),type=ascii(bytes,offset+4,4);
        if(size===1){partial=true;reason='mp4-large-atom-requires-seek';return;}
        const atomEnd=size===0?end:offset+size;
        if(size!==0&&size<8||atomEnd>end){partial=true;return;}
        if(type==='ilst'){index=true;walk(offset+8,atomEnd,depth+1,true);}
        else if(type==='meta'){if(offset+12>atomEnd)partial=true;else walk(offset+12,atomEnd,depth+1);}
        else if(['moov','udta'].includes(type))walk(offset+8,atomEnd,depth+1);
        else if(inIndex&&ids[type]){
          const dataStart=offset+8;
          if(dataStart+16>atomEnd||ascii(bytes,dataStart+4,4)!=='data'||u32(bytes,dataStart)<16||dataStart+u32(bytes,dataStart)>atomEnd){partial=true;}
          else if(u32(bytes,dataStart+8)===1)assign(ids[type],utf8(bytes.subarray(dataStart+16,dataStart+u32(bytes,dataStart))).split('\0')[0].trim());
          else{partial=true;reason='unsupported-mp4-text-encoding';}
        }
        offset=atomEnd;
      }
    }
    walk(0,bytes.length,0);
    result.reason=reason||(partial?'mp4-truncated-or-atom-budget':index?'mp4-header':'mp4-index-not-in-header');
  }else return result;
  result.status=partial?'partial':Object.keys(result.fields).length?'parsed':'unresolved';return result;
}
