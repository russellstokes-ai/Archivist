export type ArtworkCandidate={uri:string;manual:boolean};
export type ArtworkResult={state:'ready'|'missing'|'invalid';uri?:string;manual?:boolean;bytes?:number;width?:number;height?:number;issues?:string[]};
export interface ArtworkPort {read(uri:string,maxBytes:number,signal?:AbortSignal):Promise<{bytes:Uint8Array;width:number;height:number}>;save(workId:string,bytes:Uint8Array,signal?:AbortSignal):Promise<string>}
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Artwork cancelled');};
export async function resolveArtwork(workId:string,candidates:ArtworkCandidate[],port:ArtworkPort,signal?:AbortSignal):Promise<ArtworkResult>{
 if(!workId||workId.length>128||candidates.length>8)throw new Error('Artwork budget');check(signal);
 // A failed manual image stays unresolved; it is never silently replaced by online art.
 const manual=candidates.filter(x=>x.manual),selected=manual.length?manual:candidates,issues:string[]=[];
 for(const candidate of selected){check(signal);if(!/^(file|content|https):\/\//.test(candidate.uri)||candidate.uri.length>2048){issues.push('invalid-artwork-uri');continue;}
  try{const image=await port.read(candidate.uri,4194304,signal);check(signal);const bytes=image.bytes;
   const png=bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v),jpeg=bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217;
   if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>4194304||!png&&!jpeg||!Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)||image.width<64||image.height<64||image.width*image.height>16777216)throw new Error('Invalid artwork');
   const uri=candidate.manual?candidate.uri:await port.save(workId,bytes,signal);check(signal);return {state:'ready',uri,manual:candidate.manual,bytes:bytes.length,width:image.width,height:image.height};
  }catch{check(signal);issues.push('artwork-unavailable-or-invalid');}
 }
 return {state:candidates.length?'invalid':'missing',issues};
}
