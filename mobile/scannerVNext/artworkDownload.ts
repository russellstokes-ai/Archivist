type ResponsePort={ok:boolean;status:number;headers:{get(name:string):string|null};body:{getReader():{read():Promise<{done:boolean;value?:Uint8Array}>;cancel():Promise<unknown>;releaseLock():void}}|null;url?:string};
export function approvedArtworkUrl(url:string){try{const parsed=new URL(url);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&['covers.openlibrary.org','books.google.com','books.googleusercontent.com'].includes(parsed.hostname);}catch{return false;}}
export async function readArtworkBytes(response:ResponsePort,signal?:AbortSignal){
 const check=()=>{if(signal?.aborted)throw Error('Artwork download cancelled');};check();if(!response.body)throw Error('Artwork transport unavailable');const reader=response.body.getReader();let complete=false;
 try{
  if(!response.ok)throw Error('Artwork download unavailable');if(response.url&&!approvedArtworkUrl(response.url))throw Error('Artwork redirect is not approved');
  const length=Number(response.headers.get('Content-Length'));if(Number.isFinite(length)&&length>4194304)throw Error('Artwork byte budget');
  let total=0;const chunks:Uint8Array[]=[];while(true){check();const item=await reader.read();check();if(item.done){complete=true;break;}if(!(item.value instanceof Uint8Array)||!item.value.length||chunks.length>=8192)throw Error('Invalid artwork stream budget');total+=item.value.length;if(total>4194304)throw Error('Artwork byte budget');chunks.push(item.value);}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}check();return bytes;
 }finally{if(!complete)try{await reader.cancel();}catch{}reader.releaseLock();}
}
