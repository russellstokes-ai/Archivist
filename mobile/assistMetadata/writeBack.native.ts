import {NativeModules} from 'react-native';
import {File,Paths} from 'expo-file-system';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
import {createEmbeddedCopy} from './embeddedCopy';
import {createPdfMetadataCopy} from './pdfCopy';
import {createTarMetadataCopy} from './tarCopy';
import {createRarMetadataCopy} from './rarCopy';
import {plannedFields,type ChangePlan} from './changePlan';
export async function writeMetadataFile(plan:ChangePlan){
 const {root,uri,path}=plan.file,fields=plannedFields(plan),multipart=plan.multipart;
 const state=(value:string)=>plan.omittedFields?.length&&['written','unchanged'].includes(value)?value+'-partial':value;
 if(!plan.operations.length)return state('unchanged');
 const receipt=JSON.stringify({...plan.file.fields,...fields});
 const extension=path.toLowerCase().split('.').pop()||'';
 if(['mp3','m4a','m4b','aac','flac','ogg','opus','wav','wma'].includes(extension)){
  const writer=NativeModules.ArchivistFileMetadata;if(!writer?.prepareAudio||!writer?.replaceVerified)return 'writer-unavailable';
  const copies=await writer.prepareAudio(plan.file.original,plan.file.fingerprint,extension,JSON.stringify(fields),multipart);
  try{return state(await writer.replaceVerified(root,uri,plan.file.original,copies.updated,receipt) as string);}
  finally{const file=new File(copies.updated);if(file.exists)file.delete();}
 }
 const format=extension==='cbr'?'cbr':extension==='cbt'?'cbt':extension==='pdf'?'pdf':path.toLowerCase().endsWith('.epub')?'epub':path.toLowerCase().endsWith('.cbz')?'cbz':null;
 if(!format)return 'unsupported-format';
 const native=NativeModules.ArchivistFileMetadata;if(!native?.replaceVerified)return 'writer-unavailable';
 const source=new File(plan.file.original);if(!source.exists||source.size<=0||source.size>64*1024*1024)return 'unsupported-size';
 if(format==='cbr'&&(!native.readRarMetadata||!native.verifyRarCopies))return 'writer-unavailable';
 const original=await source.bytes(),output=format==='cbr'?await createRarMetadataCopy(original,fields,async name=>Uint8Array.from(atob(await native.readRarMetadata(source.uri,name)),c=>c.charCodeAt(0))):format==='cbt'?await createTarMetadataCopy(original,fields):format==='pdf'?await createPdfMetadataCopy(original,fields):await createEmbeddedCopy(original,format,fields);
 const id=Date.now()+'-'+Math.random().toString(36).slice(2);
 const updated=new File(Paths.cache,'metadata-updated-'+id);
 try{
  updated.create();updated.write(output);
  if(format==='cbr'&&await native.verifyRarCopies(source.uri,updated.uri)!==true)throw Error('RAR extraction verification failed');
  return state(await native.replaceVerified(root,uri,source.uri,updated.uri,receipt) as string);
 }finally{if(updated.exists)updated.delete();}
}
