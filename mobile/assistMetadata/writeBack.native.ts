import {NativeModules} from 'react-native';
import {File,Paths} from 'expo-file-system';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
import {createEmbeddedCopy} from './embeddedCopy';
export async function writeMetadataFile(root:string,uri:string,path:string,fields:WorkFields){
 const format=path.toLowerCase().endsWith('.epub')?'epub':path.toLowerCase().endsWith('.cbz')?'cbz':null;
 if(!format)return 'unsupported-format';
 const native=NativeModules.ArchivistFileMetadata;if(!native?.replaceVerified)return 'writer-unavailable';
 const source=new File(uri);if(!source.exists||source.size<=0||source.size>64*1024*1024)return 'unsupported-size';
 const original=await source.bytes(),output=await createEmbeddedCopy(original,format,fields);
 const id=Date.now()+'-'+Math.random().toString(36).slice(2);
 const expected=new File(Paths.cache,'metadata-original-'+id),updated=new File(Paths.cache,'metadata-updated-'+id);
 try{
  expected.create();expected.write(original);updated.create();updated.write(output);
  return await native.replaceVerified(root,uri,expected.uri,updated.uri) as string;
 }finally{if(expected.exists)expected.delete();if(updated.exists)updated.delete();}
}
