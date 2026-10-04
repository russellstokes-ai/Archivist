import type JSZip from 'jszip';
declare const require:any;

export type BookZip=JSZip & {dispose?:()=>Promise<void>};

/** Index and decompress on Android's worker threads; keep only one entry in JS. */
export async function openNativeZip(uri:string):Promise<BookZip|null>{
  const native=require('react-native').NativeModules?.ArchivistArchive;
  if(!native?.openZip||!native?.readZipEntry||!native?.closeZip)return null;
  const result:{token:string;entries:Array<{name:string;size:number}>}=await native.openZip(uri);
  const files:Record<string,unknown>=Object.create(null);
  for(const entry of result.entries){
    files[entry.name]={name:entry.name,dir:false,_data:{uncompressedSize:entry.size},async:(type:string)=>{
      if(type!=='text'&&type!=='base64')throw Error('Unsupported archive encoding.');
      return native.readZipEntry(result.token,entry.name,type==='text');
    }};
  }
  let closed=false;
  return {files,file:(name:string)=>files[name]||null,dispose:async()=>{if(closed)return;closed=true;await native.closeZip(result.token);}} as unknown as BookZip;
}
