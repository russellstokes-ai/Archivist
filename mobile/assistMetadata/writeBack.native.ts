import {NativeModules} from 'react-native';
import {File,Paths} from 'expo-file-system';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
import {createEmbeddedCopy} from './embeddedCopy';
import {createPdfMetadataCopy} from './pdfCopy';
import {createTarMetadataCopy} from './tarCopy';
import {createRarMetadataCopy} from './rarCopy';
export async function writeMetadataFile(root:string,uri:string,path:string,fields:WorkFields,multipart=false){
 const extension=path.toLowerCase().split('.').pop()||'';
 if(['mp3','m4a','m4b','aac','flac','ogg','opus','wav','wma'].includes(extension)){
  const writer=NativeModules.ArchivistFileMetadata;if(!writer?.prepareAudio||!writer?.replaceVerified)return 'writer-unavailable';
  const copies=await writer.prepareAudio(root,uri,extension,JSON.stringify(fields),multipart);
  try{return await writer.replaceVerified(root,uri,copies.original,copies.updated) as string;}
  finally{for(const value of [copies.original,copies.updated]){const file=new File(value);if(file.exists)file.delete();}}
 }
 const format=extension==='cbr'?'cbr':extension==='cbt'?'cbt':extension==='pdf'?'pdf':path.toLowerCase().endsWith('.epub')?'epub':(path.toLowerCase().endsWith('.cbz')||path.toLowerCase().endsWith('.zip'))?'cbz':null;
 if(!format)return 'unsupported-format';
 const native=NativeModules.ArchivistFileMetadata;if(!native?.replaceVerified)return 'writer-unavailable';
 const source=new File(uri);if(!source.exists||source.size<=0||source.size>64*1024*1024)return 'unsupported-size';
 if(format==='cbr'&&(!native.readRarMetadata||!native.verifyRarCopies))return 'writer-unavailable';
 const original=await source.bytes(),output=format==='cbr'?await createRarMetadataCopy(original,fields,async name=>Uint8Array.from(atob(await native.readRarMetadata(uri,name)),c=>c.charCodeAt(0))):format==='cbt'?await createTarMetadataCopy(original,fields):format==='pdf'?await createPdfMetadataCopy(original,fields):await createEmbeddedCopy(original,format,fields);
 const id=Date.now()+'-'+Math.random().toString(36).slice(2);
 const expected=new File(Paths.cache,'metadata-original-'+id),updated=new File(Paths.cache,'metadata-updated-'+id);
 try{
  expected.create();expected.write(original);updated.create();updated.write(output);
  if(format==='cbr'&&await native.verifyRarCopies(expected.uri,updated.uri)!==true)throw Error('RAR extraction verification failed');
  return await native.replaceVerified(root,uri,expected.uri,updated.uri) as string;
 }finally{if(expected.exists)expected.delete();if(updated.exists)updated.delete();}
}
