import {NativeModules} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {fetch as expoFetch} from 'expo/fetch';
import {File,Paths} from 'expo-file-system';
import {createAndroidCatalogueRuntime as createBaseRuntime} from '../scannerVNext/androidRuntime.native';
import {openScannerDatabase} from '../scannerVNext/androidStore.native';
import {metadataDatabase} from '../scannerVNext/metadataWrites';
import {createSearchCache} from '../scannerVNext/fieldEvidence';
import {documentUri,type ScannerBook} from '../scannerVNext/runtime';
import type {LocalBook} from '../localLibrary';
import {createAssistMetadataStore} from './store';
import {createImprovedAssist} from './controller';
import {createAssistProviders} from './providers.native';
import {createAssistSearchService,type AssistPolicy} from './service';
import {missingMetadata,ProviderQueue} from './core';
import {makePortableFields,validatePortableRecord} from './portable';
import {currentReview} from './review';
import {writeMetadataFile} from './writeBack.native';
import {RecoveryReader} from './recoveryReader';
const artworkQueue=new ProviderQueue();
const check=(s?:AbortSignal)=>{if(s?.aborted)throw Error('Metadata cancelled');};
type Receipt={state:string;revision?:number;portableId?:string};
export async function createAndroidCatalogueRuntime(settings:Parameters<typeof createBaseRuntime>[0]){
 const base=await createBaseRuntime(settings),db=metadataDatabase(await openScannerDatabase());
 const store=await createAssistMetadataStore(db,base.metadata),cache=await createSearchCache(db);
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_durable_meta(work_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL);');
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_file_writes(work_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, state TEXT NOT NULL);');
 await NativeModules.ArchivistFileMetadata?.recoverPending?.().catch(()=>{});
 let signature='',service:ReturnType<typeof createAssistSearchService>|undefined;
 async function configured(){
  const options=await settings(),token=await SecureStore.getItemAsync('archivist.metadata.metron.token.v1').catch(()=>null);
  const next=JSON.stringify([options.metadata,options.googleKey,token]);
  if(!service||signature!==next){signature=next;service=createAssistSearchService(createAssistProviders(options.metadata,options.googleKey,token||undefined),cache);}
  return service;
 }
 const assist=await createImprovedAssist(db,store,{search:async(...args)=>(await configured()).search(...args),more:async(...args)=>(await configured()).more(...args)});
 const native=NativeModules.ArchivistMetadata as {createPortableId?:()=>Promise<string>;exportRecord?:(root:string,input:string)=>Promise<string>;restoreRecord?:(root:string,members:string)=>Promise<string|null>;inspectArtwork?:(uri:string)=>Promise<string|null>}|undefined;
 const pending=new Map<string,Promise<Receipt>>();
 const recoveryReader=new RecoveryReader();
 async function context(id:string){
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);
  if(!row)throw Error('Work is unavailable');
  const stored=JSON.parse(row.payload);
  // Source inspection belongs on the native worker. File.size on a content URI
  // is synchronous and can freeze the UI when a document provider stalls.
  // Discovery sizes can also be stale after an in-file metadata update. Native
  // persistence measures and hashes the current bytes rather than trusting them.
  const members=stored.entry.assets.map((asset:any)=>({path:asset.relativePath,uri:documentUri(stored.source.rootUri,asset.documentId),bytes:-1}));
  return {root:stored.source.rootUri as string,members};
 }
 async function durableStatus(id:string):Promise<Receipt>{
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_durable_meta WHERE work_id=?',id);
  if(!row)return {state:'not-saved'};try{return JSON.parse(row.payload);}catch{return {state:'error'};}
 }
 async function receipt(id:string,revision:number,value:Receipt){
  await db.runAsync('INSERT INTO scanner_vnext_durable_meta VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',id,revision,JSON.stringify(value));
 }
 async function writeConfirmedFiles(id:string,force=false){
  const options=await settings();if(options.metadata.writeMetadataToFiles===false)return;
  const work=await store.get(id);if(!work?.identityConfirmed)return;
  const previous=await db.getFirstAsync<{revision:number;state:string}>('SELECT revision,state FROM scanner_vnext_file_writes WHERE work_id=?',id);
  if(!force&&previous?.revision===work.revision)return previous.state;
  const source=await context(id);let state='unsupported-format';
  try{
   // A catalogue identity never resolves ambiguous source-file membership by itself.
   const saved=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);
   const issues=saved?JSON.parse(saved.payload).entry.issues||[]:[];
   if(issues.some((x:string)=>['duplicate-part-number','overlapping-group-needs-review','source-parts-missing','source-discovery-incomplete','manual-edition-unresolved'].includes(x)))state='source-review-required';
   else for(const member of source.members){
    if((await store.get(id))?.revision!==work.revision||(await settings()).metadata.writeMetadataToFiles===false)return;
    const result=await writeMetadataFile(source.root,member.uri,member.path,work.fields,source.members.length>1);
    if(result!=='unsupported-format'){state=result;if(result!=='written')break;}
   }
  }catch(error){state=String((error as {code?:string}).code||'file-write-failed');}
  await db.runAsync('INSERT INTO scanner_vnext_file_writes VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,state=excluded.state',id,work.revision,state);
  return state;
 }
 async function persist(id:string,force=false):Promise<Receipt>{
  const running=pending.get(id);if(running){await running;return persist(id,force);}
  if(pending.size>=32)return {state:'queued'};
  const job=(async()=>{
   if((await settings()).metadata.writeMetadataToFiles===false)return {state:'disabled'};
   const work=await store.get(id);if(!work||!work.identityConfirmed)return {state:'identity-needs-review'};
   const fileState=await writeConfirmedFiles(id,force);
   if(fileState==='FILE_RECOVERY_REQUIRED')return {state:'file-recovery-required',revision:work.revision};
   const previous=await durableStatus(id);
   if(!force&&previous.revision===work.revision&&['saved','restored','metadata-saved-cover-missing'].includes(previous.state))return previous;
   let priorId=previous.portableId;
   try{
    if(!native?.exportRecord)throw Error('Native persistence unavailable');
    if(!priorId){
     priorId=await native.createPortableId?.();
     if(!priorId||!(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/).test(priorId))throw Error('Portable identity unavailable');
    }
    await receipt(id,work.revision,{state:'saving',revision:work.revision,portableId:priorId});
    const source=await context(id);
    const payload={...makePortableFields(work),revision:work.revision,members:source.members,portableId:priorId,coverUri:work.fields.coverUri||''};
    const result=JSON.parse(await native.exportRecord(source.root,JSON.stringify(payload))) as Receipt;
    if(!['saved','metadata-saved-cover-missing'].includes(result.state)||result.revision!==work.revision||result.portableId!==priorId)throw Error('Invalid persistence receipt');
    await receipt(id,work.revision,result);return result;
   }catch{
    const result={state:'needs-writable-folder',revision:work.revision,portableId:priorId};await receipt(id,work.revision,result);return result;
   }
  })();pending.set(id,job);try{return await job;}finally{if(pending.get(id)===job)pending.delete(id);}
 }
 async function cacheArtwork(id:string,signal?:AbortSignal){
  const work=await store.get(id);const url=work?.fields.coverUri;
  if(!work||!url||!url.startsWith('https://')||!(await settings()).metadata.onlineEnabled)return;
  const approved=new URL(url);if(approved.username||approved.password||!['covers.openlibrary.org','books.google.com','books.googleusercontent.com','metron.cloud','static.metron.cloud','m.media-amazon.com','images-na.ssl-images-amazon.com','inventaire.io','www.comics.org','files1.comics.org','files2.comics.org'].includes(approved.hostname))return;
  await artworkQueue.run('artwork',async inner=>{
   check(signal);const response=await expoFetch(url,{signal:inner,redirect:'error'});
   if(!response.ok||!response.body)throw Error('Artwork unavailable');
   const size=Number(response.headers.get('Content-Length'));if(Number.isFinite(size)&&size>4194304)throw Error('Artwork too large');
   const reader=response.body.getReader();const chunks:Uint8Array[]=[];let total=0;
   try{while(true){check(signal);const part=await reader.read();if(part.done)break;if(!part.value?.length||chunks.length>=8192)throw Error('Invalid artwork');total+=part.value.length;if(total>4194304)throw Error('Artwork too large');chunks.push(part.value);}}
   finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
   const bytes=new Uint8Array(total);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
   check(signal);const file=new File(Paths.document,'assist-cover-'+id.replace(/[^a-zA-Z0-9-]/g,'')+'-'+work.revision+'.image');
   if(!file.exists)file.create();file.write(bytes);
   try{
    if(!native?.inspectArtwork||await native.inspectArtwork(file.uri)!=='valid')throw Error('Artwork validation failed');
    check(signal);await store.setResolvedArtwork(id,url,file.uri,work.revision,signal);
   }catch(error){if(file.exists)file.delete();throw error;}
  },signal,0);
 }
 async function refresh(id:string,signal?:AbortSignal){
  await cacheArtwork(id,signal).catch(()=>{check(signal);});const rows=await base.refresh(id,signal);
  await persist(id).catch(()=>{});return decorateRows(id,rows);
 }
 async function decorateRows(id:string,rows:ScannerBook[]){
  const work=await store.get(id);if(!work)return rows;
  const saved=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);
  const staged=await db.getFirstAsync<{revision:number;payload:string}>('SELECT revision,payload FROM scanner_vnext_staged WHERE work_id=?',id);
  const issues=saved?JSON.parse(saved.payload).entry.issues||[]:[];
  const writeReceipt=await db.getFirstAsync<{state:string}>('SELECT state FROM scanner_vnext_file_writes WHERE work_id=?',id);
  const fileMessages:Record<string,string>={written:'Metadata written into the original file.','unsupported-format':'In-file metadata writing is unavailable for this format; the original is unchanged.','unsupported-size':'This file exceeds the current in-file writing limit; the original is unchanged.','source-review-required':'File writing is waiting for the source-file grouping to be checked.'};
  const metadataFileStatus=(await settings()).metadata.writeMetadataToFiles===false?'File metadata saving is switched off.':writeReceipt?(fileMessages[writeReceipt.state]||'File metadata update could not be verified. Check the source folder; no successful write is claimed.'):'';
  const reasons=currentReview(work,issues,staged?.revision===work.revision?JSON.parse(staged.payload).reasons||[]:[]);
  return rows.map(row=>({...row,...work.fields,metadataFileStatus,seriesNumber:Number(work.fields.seriesNumber)||undefined,publishedYear:Number(work.fields.publishedYear)||undefined,coverUri:work.fields.coverUri||row.coverUri,needsReview:reasons.length>0,reviewReason:reasons.join(' · ')}));
 }
 async function restore(id:string,signal?:AbortSignal){
  if(!native?.restoreRecord)return false;const status=await durableStatus(id);
  if(!['not-saved','restoring'].includes(status.state))return false;
  const current=await store.get(id);if(!current||Object.values(current.manual).some(Boolean))return false;
  try{
   check(signal);const source=await context(id),raw=await recoveryReader.read(()=>native.restoreRecord!(source.root,JSON.stringify(source.members)),signal);check(signal);
   if(!raw)return false;const response=JSON.parse(raw),record=validatePortableRecord(response.record);
   if(status.portableId&&status.portableId!==record.portableId)throw Error('Conflicting restore identity');
   const fields={...record.fields,...(typeof response.coverUri==='string'&&response.coverUri.startsWith('file:///')?{coverUri:response.coverUri}:{})};
   // Reserve the recovered identity before committing fields/manual locks.
   // A crash or failed final receipt must not cause the next export to fork it.
   await receipt(id,current.revision,{state:'restoring',revision:current.revision,portableId:record.portableId});
   const next=await store.restorePortable(id,fields,record.manual,current.revision,signal);
   await receipt(id,next.revision,{state:'restored',revision:next.revision,portableId:record.portableId});return true;
  }catch(error){
   check(signal);
   // Temporary provider failure is not evidence that no saved identity exists.
   // Leave this work untouched so the next refresh can retry recovery.
   if(error instanceof Error&&/^Recovery (timeout|circuit-open|queue-full|error)/.test(error.message))return 'deferred' as const;
   return false;
  }
 }
 async function enrich(books:LocalBook[],policy:AssistPolicy,onRows:(rows:ScannerBook[])=>Promise<void>,signal?:AbortSignal){
  const groups=new Map<string,LocalBook>();for(const book of books){const id=(book as ScannerBook).scannerWorkId;if(id&&!groups.has(id))groups.set(id,book);}
  for(const [id,book]of groups){
   check(signal);const restored=await restore(id,signal);
   if(restored==='deferred'){
    console.warn('Archivist metadata recovery deferred; source provider unavailable');
    continue;
   }
   if(restored)await onRows(await refresh(id,signal));
   const work=await store.get(id);if(!work)continue;
   const missing=missingMetadata(work,book.format==='Audio');
   const previous=await assist.get(id);
   const freshResult=previous?.revision===work.revision&&previous.updated>Date.now()-3600000;
   if(policy.online&&policy.automatic&&missing.length&&!freshResult){
    const abort=()=>assist.cancel(id);signal?.addEventListener('abort',abort,{once:true});
    try{const result=await assist.search(id,policy),state=await result.completion;check(signal);if(state.state==='accepted')check(signal);}
    finally{signal?.removeEventListener('abort',abort);}
   }
   await onRows(await refresh(id,signal));
   await persist(id);await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
 }
 const scan=async(...args:Parameters<typeof base.scan>)=>{
  const result=await base.scan(...args);const groups=[...new Set(result.books.map(b=>(b as ScannerBook).scannerWorkId).filter(Boolean))];
  const replacements=new Map<string,ScannerBook[]>();
  // Commit discovery first. Recovery may hash large comics/audio or wait on a
  // document provider; enrich already restores each work after this baseline.
  const byWork=new Map<string,ScannerBook[]>();
  for(const book of result.books){const row=book as ScannerBook;const rows=byWork.get(row.scannerWorkId)??[];rows.push(row);byWork.set(row.scannerWorkId,rows);}
  for(const id of groups){check(args[4]?.signal);replacements.set(id,await decorateRows(id,byWork.get(id)??[]));}
  if(replacements.size){const rows=new Map(result.books.map(b=>[b.uri,b]));for(const group of replacements.values())for(const b of group)rows.set(b.uri,b);result.books=[...rows.values()];}
  return result;
 };
 return {...base,metadata:store,assist,refresh,enrich,scan,durableStatus,savePortable:(id:string)=>persist(id,true),
  fileWriteStatus:async(id:string)=>(await db.getFirstAsync<{state:string}>('SELECT state FROM scanner_vnext_file_writes WHERE work_id=?',id))?.state||'not-written',
  async save(id:string,patch:Parameters<typeof store.saveManual>[1],policy:AssistPolicy){const work=await store.get(id);if(!work)throw Error('Unknown work');return assist.save(id,patch,work.revision,policy);},
  async confirm(id:string){const work=await store.get(id);if(!work)throw Error('Unknown work');const next=await store.confirmIdentity(id,work.revision);void persist(id);return next;}
 };
}
