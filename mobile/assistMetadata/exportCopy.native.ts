import {File,Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
import {createEmbeddedCopy} from './embeddedCopy';
export async function exportMetadataCopy(uri:string,format:'epub'|'cbz',fields:WorkFields){
 if(!await Sharing.isAvailableAsync())throw Error('File sharing is unavailable');
 const source=new File(uri);if(!source.exists||source.size<=0||source.size>64*1024*1024)throw Error('Metadata copy requires an accessible file up to 64 MB');
 const bytes=await source.bytes();const result=await createEmbeddedCopy(bytes,format,fields);
 const copy=new File(Paths.cache,'Archivist-metadata-'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+format);
 let offered=false;
 try{
  copy.create();copy.write(result);
  const verified=await copy.bytes();if(verified.length!==result.length||verified.some((v,i)=>v!==result[i]))throw Error('Saved copy verification failed');
  // Android chooser completion is not a receiver read-completion receipt.
  // Keep offered files in the OS-managed cache so delayed imports can finish.
  offered=true;
  await Sharing.shareAsync(copy.uri,{mimeType:format==='epub'?'application/epub+zip':'application/vnd.comicbook+zip',dialogTitle:'Save a copy with embedded metadata'});
 }finally{if(!offered&&copy.exists)copy.delete();}
}
