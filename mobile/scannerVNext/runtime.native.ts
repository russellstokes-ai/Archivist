import {createAndroidSourceAccess,createAndroidClueReader,createAndroidArchiveReader,createAndroidArtworkReader} from './nativeAccess.native';
import {openScannerDatabase} from './store.native';
import {createCatalogueRuntime,documentUri} from './runtime';
import {createClueCache} from './clueCache';
import {collectWorkClues,type ClueAsset} from './collectClues';
import {createSearchCache,type WorkFields} from './fieldEvidence';
import {SearchService,sharedRequestQueue} from './search';
import {createBookProviders} from './providers';
import {requestProviderJson} from './providers.native';
import type {MetadataSettings} from '../metadataSettings';
import type {Source} from './types';
import type {PipelineAsset} from './pipeline';
import {normalizeGenre} from './genre';
import {NativeModules} from 'react-native';
import {fetch as expoFetch} from 'expo/fetch';
import {File,Paths} from 'expo-file-system';
import {approvedArtworkUrl,readArtworkBytes} from './artworkDownload';
type Settings={metadata:MetadataSettings;googleKey?:string};
export async function createAndroidCatalogueRuntime(settings:()=>Promise<Settings>){
 const db=await openScannerDatabase(),cache=await createClueCache(db),searchCache=await createSearchCache(db),header=createAndroidClueReader(),archive=createAndroidArchiveReader(),art=createAndroidArtworkReader(),proofs=new Set<string>();
 const asClue=(source:Source,a:PipelineAsset):ClueAsset=>({assetId:a.assetId,documentId:a.documentId,name:a.name,source,size:a.size??null,modified:a.modified??null});
 const fingerprint=(assets:PipelineAsset[])=>JSON.stringify(assets.map(a=>[a.assetId,a.size,a.modified]));
 let configured='',service:SearchService|undefined;
 async function searchService(){const options=await settings(),books=options.metadata.books,key=JSON.stringify([books.enabled,books.openLibrary,books.googleBooks,options.googleKey]);if(!service||configured!==key){configured=key;service=new SearchService(createBookProviders({openLibrary:books.enabled&&books.openLibrary,googleBooks:books.enabled&&books.googleBooks,googleKey:options.googleKey},requestProviderJson),searchCache);}return service;}
 const nonce=await NativeModules.ArchivistScanner?.allocateIdentityNamespace();if(typeof nonce!=='string'||!/^[a-f0-9-]{36}$/.test(nonce))throw new Error('Scanner identity bridge is unavailable');let sequence=0;
 return createCatalogueRuntime(db,()=>nonce+'-'+(++sequence),{
  access:createAndroidSourceAccess(),
  search:{async search(...args){return (await searchService()).search(...args);},async more(...args){return (await searchService()).more(...args);}},
  async clues(source,assets,signal){
   const first=assets[0];if(!first)return {};
   if(first.disposition.kind!=='audio'){
    if(!/\.(?:epub|cbz|zip)$/i.test(first.name))return {};
    const value=await archive.read(asClue(source,first),signal);if(value.status==='parsed'&&value.fields.title&&value.fields.author)proofs.add(fingerprint(assets));return value.fields;
   }
   const value=await collectWorkClues(assets.map(a=>asClue(source,a)),header,cache,{signal}),samples=value.samples.map(x=>x.clues);
   const fields:WorkFields={},consensus=(key:'author'|'genre'|'title'|'album')=>{const values=samples.map(x=>x.fields[key]?.trim()).filter((v):v is string=>!!v);return values.length===samples.length&&values.length&&values.every(x=>x===values[0])?values[0]:undefined;};
   fields.title=assets.length>1?consensus('album'):consensus('title')??consensus('album');fields.author=consensus('author');
   const genre=normalizeGenre(samples.flatMap(x=>x.fields.genre?[{value:x.fields.genre,source:'embedded' as const}]:[]));if(genre.state==='confirmed')fields.genre=genre.label;
   // Multipart identity requires corroborating album/author on two independent parts.
   if(fields.title&&fields.author&&samples.every(x=>x.status==='parsed')&&(assets.length===1||samples.length===2))proofs.add(fingerprint(assets));
   for(const key of Object.keys(fields)as(keyof WorkFields)[])if(!fields[key])delete fields[key];return fields;
  },
  identityProof:(assets)=>proofs.has(fingerprint(assets)),
  async artwork(source,assets,work,signal){
   const first=assets.find(a=>a.disposition.kind!=='artwork')??assets[0];if(!first)return {state:'missing'};
   if(work.fields.coverUri?.startsWith('file:///'))return art.read(asClue(source,first),{manualUri:work.fields.coverUri,signal});
   // Keep a protected but invalid manual reference visible; never replace it silently.
   if(work.manual.coverUri&&work.fields.coverUri)return {state:'invalid',issues:['manual-cover-needs-review']};
   for(const candidate of assets.filter(a=>a.disposition.kind==='artwork').slice(0,8)){try{return await art.read(asClue(source,candidate),{signal});}catch{if(signal?.aborted)throw Error('Artwork cancelled');}}
   if(work.fields.coverUri&&approvedArtworkUrl(work.fields.coverUri)&&(await settings()).metadata.onlineEnabled){
    return sharedRequestQueue.run('artwork',async inner=>{
     const response=await expoFetch(work.fields.coverUri!,{signal:inner,redirect:'error'}),bytes=await readArtworkBytes(response,inner);if(inner.aborted)throw Error('Artwork cancelled');
     const temporary=new File(Paths.cache,'scanner-art-'+nonce+'-'+(++sequence)+'.tmp');
     try{temporary.create();temporary.write(bytes);return await art.read(asClue(source,first),{privateUri:temporary.uri,signal:inner});}
     finally{if(temporary.exists)temporary.delete();}
    },signal);
   }
   return {state:'missing'};
  }
 });
}
