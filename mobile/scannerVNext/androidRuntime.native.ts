import {createAndroidSourceAccess,createAndroidClueReader,createAndroidArchiveReader,createAndroidArtworkReader} from './androidAccess.native';
import {openScannerDatabase} from './androidStore.native';
import {createCatalogueRuntime,documentUri} from './runtime';
import {createClueCache} from './clueCache';
import {collectWorkClues,type ClueAsset} from './collectClues';
import {createSearchCache,type WorkFields} from './fieldEvidence';
import {SearchService,sharedRequestQueue} from './search';
import {createBookProviders} from './providers';
import {requestProviderJson} from './androidProviders.native';
import type {MetadataSettings} from '../metadataSettings';
import type {Source} from './types';
import type {PipelineAsset} from './pipeline';
import {normalizeGenre} from './genre';
import {NativeModules} from 'react-native';
import {fetch as expoFetch} from 'expo/fetch';
import {File,Paths} from 'expo-file-system';
import {approvedArtworkUrl,readArtworkBytes} from './artworkDownload';
import {classifyAsset} from './classify';
import {parseHeaderClues} from './clues';
import {readMp4IndexClues} from './seekClues';
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
  async inspect(source,asset,signal){
   const input=asClue(source,asset),read=await header.readHeader(input,65536,signal);
   let disposition=classifyAsset({...asset,signature:read.bytes});let fields:WorkFields={};
   if(disposition.container==='zip'||disposition.container==='epub'){
    const value=await archive.read(input,signal);fields=value.fields;
    if(value.container==='epub'||value.container==='cbz')disposition={...disposition,kind:value.container==='epub'?'ebook':'comic',container:value.container,state:'candidate',reason:'archive-content-confirmed'};
   }
   if(disposition.kind==='audio'){
    let value=parseHeaderClues(read.bytes,disposition.container||asset.name.split('.').pop()||'');
    if(['m4a','m4b'].includes(disposition.container||'')&&(!value.fields.title||!value.fields.author)){
     const indexed=await readMp4IndexClues(input.size,{readRange:(offset,budget,owner)=>header.readRange(input,offset,budget,owner)},{signal,maxAtoms:32});
     if(Object.keys(indexed.clues.fields).length)value=indexed.clues;
    }
    fields={title:value.fields.album||value.fields.title,author:value.fields.author,genre:value.fields.genre,publishedYear:value.fields.publishedYear,publisher:value.fields.publisher,language:value.fields.language,description:value.fields.description};
    for(const key of Object.keys(fields) as (keyof WorkFields)[])if(fields[key]===undefined)delete fields[key];
    return {disposition,fields,grouping:value.fields.album&&value.fields.author&&value.fields.track?{title:value.fields.album,author:value.fields.author,track:value.fields.track,disc:value.fields.disc,edition:value.fields.album+'|'+value.fields.author,provenance:'embedded' as const}:undefined};
   }
   return {disposition,fields};
  },
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
   if(work.manual.coverUri&&work.fields.coverUri&&!approvedArtworkUrl(work.fields.coverUri))return {state:'invalid',issues:['manual-cover-needs-review']};
   if(!work.manual.coverUri)for(const candidate of assets.filter(a=>a.disposition.kind==='artwork').slice(0,8)){try{const result=await art.read(asClue(source,candidate),{signal});if(result.state==='ready')return result;}catch{if(signal?.aborted)throw Error('Artwork cancelled');}}
   if(!work.manual.coverUri){
    const container=first.disposition.container||first.name.split('.').pop()?.toLowerCase();
    if(container)try{const result=await art.read(asClue(source,first),{embeddedContainer:container,signal});if(result.state==='ready')return result;}catch{if(signal?.aborted)throw Error('Artwork cancelled');}
   }
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
