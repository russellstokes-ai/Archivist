import {parseHeaderClues,type HeaderClues} from './clues';
export interface RangeClueReader {readRange(offset:number,byteBudget:number,signal?:AbortSignal):Promise<{bytes:Uint8Array;budgetReached:boolean}>}
const u32=(b:Uint8Array,o:number)=>b[o]*16777216+b[o+1]*65536+b[o+2]*256+b[o+3];
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Metadata seek cancelled');};
/** Bounded initial-scan evidence only. Smart Search never invokes this reader. */
export async function readMp4IndexClues(size:number|null,reader:RangeClueReader,options:{maxBytes?:number;maxAtoms?:number;signal?:AbortSignal}={}){
  const maxBytes=options.maxBytes??131072,maxAtoms=options.maxAtoms??128;
  if(!Number.isInteger(maxBytes)||maxBytes<16||maxBytes>8388608||!Number.isInteger(maxAtoms)||maxAtoms<1||maxAtoms>1024)throw new RangeError('Invalid metadata seek budget');
  let bytesRead=0;
  const unresolved=(reason:string):{clues:HeaderClues;bytesRead:number}=>({clues:{readerVersion:'header-1',provenance:'embedded',status:'unresolved',reason,fields:{}},bytesRead});
  check(options.signal);
  if(size===null)return unresolved('unknown-file-size');
  if(!Number.isSafeInteger(size)||size<0||size>8796093022208)throw new RangeError('Invalid file size');
  async function read(offset:number,length:number){
    check(options.signal);const value=await reader.readRange(offset,length,options.signal);check(options.signal);
    if(!value||!(value.bytes instanceof Uint8Array)||value.bytes.length>length||typeof value.budgetReached!=='boolean')throw new Error('Invalid native range or exceeded byte budget');
    bytesRead+=value.bytes.length;return value.bytes;
  }
  let offset=0;
  for(let atoms=0;offset<size;atoms++){
    check(options.signal);
    if(atoms>=maxAtoms)return unresolved('mp4-atom-budget');
    if(maxBytes-bytesRead<Math.min(16,size-offset))return unresolved('source-read-budget');
    let header:Uint8Array;
    try{header=await read(offset,Math.min(16,size-offset));}catch(error){check(options.signal);if(error instanceof Error&&/Invalid native/.test(error.message))throw error;return unresolved('seek-read-failed');}
    if(header.length<8)return unresolved('truncated-mp4-atom');
    let length=u32(header,0);const type=String.fromCharCode(...header.subarray(4,8));let headerSize=8;
    if(length===1){if(header.length<16)return unresolved('truncated-mp4-atom');length=u32(header,8)*4294967296+u32(header,12);headerSize=16;}
    else if(length===0)length=size-offset;
    if(!Number.isSafeInteger(length)||length<headerSize||length>size-offset)return unresolved('invalid-mp4-atom');
    if(type==='moov'){
      if(headerSize!==8)return unresolved('extended-mp4-index-unsupported');
      const budget=Math.min(length,65536,maxBytes-bytesRead);
      if(budget<8)return unresolved('source-read-budget');
      let index:Uint8Array;
      try{index=await read(offset,budget);}catch(error){check(options.signal);if(error instanceof Error&&/Invalid native/.test(error.message))throw error;return unresolved('seek-read-failed');}
      check(options.signal);return {clues:parseHeaderClues(index,'m4b'),bytesRead};
    }
    // Jump by validated atom size; never read or copy the preceding media payload.
    offset+=length;
  }
  return unresolved('mp4-index-not-found');
}
