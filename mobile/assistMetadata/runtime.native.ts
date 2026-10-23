import {NativeModules} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {File} from 'expo-file-system';
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
import {missingMetadata} from './core';
import {planChanges,writeEligibility} from './changePlan';
import {createPopulationQueue} from './jobQueue';
import {currentReview} from './review';
import {writeMetadataFile} from './writeBack.native';
import {validatedFields} from './fields';

const check=(s?:AbortSignal)=>{if(s?.aborted)throw Error('Metadata cancelled');};
type Receipt={state:string;revision?:number;portableId?:string};
const savedFileStates=['written','unchanged','written-partial','unchanged-partial'];
export async function createAndroidCatalogueRuntime(settings:Parameters<typeof createBaseRuntime>[0]){
 const base=await createBaseRuntime(settings),db=metadataDatabase(await openScannerDatabase());
 const store=await createAssistMetadataStore(db,base.metadata),cache=await createSearchCache(db);
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_durable_meta(work_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL);');
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_file_writes(work_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, state TEXT NOT NULL);');
 await db.execAsync('CREATE TABLE IF NOT EXISTS assist_cover_cache(work_id TEXT PRIMARY KEY,input_uri TEXT NOT NULL,local_uri TEXT NOT NULL);');
 await db.execAsync('CREATE TABLE IF NOT EXISTS assist_population_control(id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER NOT NULL);');
 const jobs=await createPopulationQueue(db);
 // Recover the target file lazily inside prepareSource. Walking every old
 // journal on startup could pin the writer behind an unavailable provider.
 let signature='',service:ReturnType<typeof createAssistSearchService>|undefined;
 async function configured(){
  const options=await settings(),token=await SecureStore.getItemAsync('archivist.metadata.metron.token.v1').catch(()=>null);
  const next=JSON.stringify([options.metadata,options.googleKey,token]);
  if(!service||signature!==next){signature=next;service=createAssistSearchService(createAssistProviders(options.metadata,options.googleKey,token||undefined),cache);}
  return service;
 }
 const assist=await createImprovedAssist(db,store,{search:async(...args)=>(await configured()).search(...args),more:async(...args)=>(await configured()).more(...args)},queueSavedWork);

 const pending=new Map<string,Promise<Receipt>>();
 let writeDrain:Promise<void>|undefined;
 let writeTimer:ReturnType<typeof setTimeout>|undefined,disposed=false;
 let coverDrain:Promise<void>|undefined,coverTimer:ReturnType<typeof setTimeout>|undefined;
 const coverOwner=new AbortController();
 let identifyDrain:Promise<void>|undefined,identifyTimer:ReturnType<typeof setTimeout>|undefined,identifyOwner:AbortController|undefined;
 let fileOperation='';
 const listeners=new Set<(id?:string)=>void>();
 const notify=(id?:string)=>{for(const listener of listeners){try{listener(id);}catch{/* A UI observer cannot interrupt file recovery. */}}};
 function scheduleWrites(delay:number){if(disposed)return;if(writeTimer)clearTimeout(writeTimer);writeTimer=setTimeout(()=>{writeTimer=undefined;resumeWrites();},Math.max(250,delay));}
 function resumeWrites(){
  if(disposed||writeDrain)return;
  if(writeTimer){clearTimeout(writeTimer);writeTimer=undefined;}
  let failed=false;
  // A slow document provider occupies this lane only. Discovery and lookup do
  // not wait for it. The durable queue resumes after an app restart.
  writeDrain=(async()=>{let next=await jobs.next('write');while(next&&!disposed){await persist(next.itemId);next=await jobs.next('write');}})()
   .catch(()=>{failed=true;fileOperation='File saving is waiting to retry. Library details are saved.';notify();})
   .finally(async()=>{writeDrain=undefined;if(disposed)return;if(failed){scheduleWrites(30000);return;}try{const wake=await jobs.nextWake('write');if(wake!==null)scheduleWrites(wake-Date.now());else{fileOperation='';notify();}}catch{scheduleWrites(30000);}});
 }
 async function queueFileWrite(id:string){
  const work=await store.get(id);if(!work)return;
  await jobs.enqueue(id,work.revision,'write');
  notify(id);resumeWrites();
 }
 async function queueArtwork(id:string,retry=false){
  const work=await store.get(id);if(!work)return;
  await jobs.enqueue(id,work.revision,'cover',retry);resumeCovers();
 }
 async function queueSavedWork(id:string){
  // Saving library details never waits for a download or a document provider.
  await queueArtwork(id);await queueFileWrite(id);
 }
 function scheduleCovers(delay:number){
  if(disposed)return;if(coverTimer)clearTimeout(coverTimer);
  coverTimer=setTimeout(()=>{coverTimer=undefined;resumeCovers();},Math.max(250,delay));
 }
 function resumeCovers(){
  if(disposed||coverDrain)return;
  if(coverTimer){clearTimeout(coverTimer);coverTimer=undefined;}
  let failed=false;
  coverDrain=(async()=>{
   let next=await jobs.next('cover');
   while(next&&!disposed){
    const job=await jobs.start(next.itemId,'cover');
    if(job){
     const work=await store.get(job.itemId);
     if(!work)await jobs.finish(job,'blocked','unavailable');
     else if(work.revision>job.revision)await jobs.enqueue(work.workId,work.revision,'cover');
     else if(work.revision<job.revision)await jobs.finish(job,'blocked','stale-catalogue');
     else try{const ready=await cacheArtwork(job.itemId,coverOwner.signal);await jobs.finish(job,ready?'done':'retry',ready?'ready':'cover-unavailable');}
     catch{if(disposed)return;await jobs.finish(job,'retry','cover-unavailable');}
    }
    next=await jobs.next('cover');
   }
  })().catch(()=>{failed=true;}).finally(async()=>{
   coverDrain=undefined;if(disposed)return;
   if(failed){scheduleCovers(30000);return;}
   try{const wake=await jobs.nextWake('cover');if(wake!==null)scheduleCovers(wake-Date.now());}catch{scheduleCovers(30000);}
  });
 }
 function scheduleIdentification(delay:number){
  if(disposed)return;if(identifyTimer)clearTimeout(identifyTimer);
  identifyTimer=setTimeout(()=>{identifyTimer=undefined;void resumeIdentification();},Math.max(250,delay));
 }
 async function populationEnabled(){return (await db.getFirstAsync<{enabled:number}>('SELECT enabled FROM assist_population_control WHERE id=1'))?.enabled===1;}
 async function pausePopulation(){
  identifyOwner?.abort();if(identifyTimer)clearTimeout(identifyTimer);
  await db.runAsync('INSERT INTO assist_population_control VALUES(1,0) ON CONFLICT(id) DO UPDATE SET enabled=0');notify();
 }
 function resumeIdentification():Promise<void>{
  if(disposed)return Promise.resolve();if(identifyDrain)return identifyDrain;
  if(identifyTimer){clearTimeout(identifyTimer);identifyTimer=undefined;}
  const owner=new AbortController();identifyOwner=owner;let failed=false;
  identifyDrain=(async()=>{
   if(!await populationEnabled())return;
   let next=await jobs.next('identify');
   while(next&&!disposed&&!owner.signal.aborted&&await populationEnabled()){
    const work=await store.get(next.itemId);
    if(work&&work.revision>next.revision){await jobs.enqueue(work.workId,work.revision,'identify');next=await jobs.next('identify');continue;}
    const job=await jobs.start(next.itemId,'identify');
    if(job){
     if(!work||work.revision<job.revision)await jobs.finish(job,'blocked','unavailable');
     else{
      const cancel=()=>assist.cancel(work.workId);owner.signal.addEventListener('abort',cancel,{once:true});
      try{
       check(owner.signal);const options=await settings();
       const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',work.workId);
       const audio=!!row&&JSON.parse(row.payload).entry.assets.some((asset:any)=>asset.disposition?.kind==='audio');
       if(missingMetadata(work,audio).length||!work.identityConfirmed){
        const result=await assist.search(work.workId,{online:options.metadata.onlineEnabled,automatic:true,retry:job.attempts>1});
        const state=await result.completion;check(owner.signal);
        await jobs.finish(job,state.state==='accepted'?'done':['error','cancelled','offline'].includes(state.state)?'retry':'needs-clues',state.state);
       }else await jobs.finish(job,'done','complete');
       await queueSavedWork(work.workId);notify(work.workId);
      }catch{await jobs.finish(job,'retry',owner.signal.aborted?'cancelled':'lookup-unavailable');}
      finally{owner.signal.removeEventListener('abort',cancel);}
     }
    }
    next=await jobs.next('identify');
   }
  })().catch(()=>{failed=true;}).finally(async()=>{
   identifyDrain=undefined;if(identifyOwner===owner)identifyOwner=undefined;
   if(disposed||owner.signal.aborted)return;
   try{if(!await populationEnabled())return;const wake=await jobs.nextWake('identify');if(wake!==null)scheduleIdentification(failed?30000:wake-Date.now());}catch{scheduleIdentification(30000);}
   notify();
  });return identifyDrain;
 }

 async function context(id:string){
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);
  if(!row)throw Error('Work is unavailable');
  const stored=JSON.parse(row.payload);
  // Source inspection belongs on the native worker. File.size on a content URI
  // is synchronous and can freeze the UI when a document provider stalls.
  // Discovery sizes can also be stale after an in-file metadata update. Native
  // persistence measures and hashes the current bytes rather than trusting them.
  const members=stored.entry.assets.map((asset:any)=>({path:asset.disposition?.container?asset.relativePath.replace(/\.[^./]+$/,'')+'.'+asset.disposition.container:asset.relativePath,uri:documentUri(stored.source.rootUri,asset.documentId),bytes:-1}));
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
  const options=await settings();if(options.metadata.writeMetadataToFiles===false)return 'disabled';
  const work=await store.get(id);if(!work)return 'unavailable';
  const previous=await db.getFirstAsync<{revision:number;state:string}>('SELECT revision,state FROM scanner_vnext_file_writes WHERE work_id=?',id);
  if(!force&&previous?.revision===work.revision&&savedFileStates.includes(previous.state))return previous.state;
  const saved=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);
  if(!saved)return 'unavailable';const entry=JSON.parse(saved.payload).entry;
  let state=writeEligibility(work,entry.issues||[],work.partIds.length>1)||'';
  if(!state){
   const source=await context(id);const writer=NativeModules.ArchivistFileMetadata;
   if(!writer?.prepareSource)state='writer-unavailable';
   else{
    const results:string[]=[];
    for(const [index,member] of source.members.entries()){
     if((await store.get(id))?.revision!==work.revision||(await settings()).metadata.writeMetadataToFiles===false)return 'superseded';
     let snapshot:{original:string;fingerprint:string;fieldsJson?:string}|undefined;
     try{
      const extension=member.path.toLowerCase().split('.').pop()||'';
      if(!['mp3','m4a','m4b','aac','flac','ogg','opus','wav','wma','epub','cbz','zip','cbr','cbt','pdf'].includes(extension)){results.push('unsupported-format');continue;}
      fileOperation=`Preparing file ${index+1} of ${source.members.length} for a safe metadata update.`;notify(id);
      snapshot=await writer.prepareSource(source.root,member.uri,extension);
      if(!snapshot)throw Error('Missing prepared source');
      const plan=planChanges(work,{...snapshot,root:source.root,uri:member.uri,path:member.path,fields:validatedFields(JSON.parse(snapshot.fieldsJson||'{}'))},source.members.length>1);
      if((await store.get(id))?.revision!==work.revision)return 'superseded';
      fileOperation=`Verifying and saving file ${index+1} of ${source.members.length}. Large files can take several minutes; you can keep using your library.`;notify();
      results.push(await writeMetadataFile(plan));
     }catch(error){results.push(String((error as {code?:string}).code||'file-write-failed'));}
     finally{if(snapshot){const file=new File(snapshot.original);if(file.exists)file.delete();}}
    }
    state=results.find(r=>!savedFileStates.includes(r))||(results.some(r=>r.endsWith('-partial'))?'written-partial':results.includes('written')?'written':'unchanged');
   }
  }
  await db.runAsync('INSERT INTO scanner_vnext_file_writes VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,state=excluded.state',id,work.revision,state);
  return state;
 }
 async function persist(id:string,force=false):Promise<Receipt>{
  const running=pending.get(id);if(running)return running;
  const job=(async()=>{
   const work=await store.get(id);if(!work){const orphan=await jobs.start(id,'write');if(orphan)await jobs.finish(orphan,'blocked','unavailable');return {state:'unavailable'};}
   await jobs.enqueue(id,work.revision,'write',force);const queued=await jobs.start(id,'write');
   if(!queued)return durableStatus(id);
   notify(id);
   let state:string;
   try{state=await writeConfirmedFiles(id,force);}catch{state='file-write-failed';}
   const value={state,revision:work.revision};
   await receipt(id,work.revision,value);
   await jobs.finish(queued,[...savedFileStates,'disabled'].includes(state)?'done':state==='identity-needs-evidence'?'needs-clues':['source-review-required','unsupported-format','unsupported-size','writer-unavailable','unavailable','FILE_RECOVERY_REQUIRED'].includes(state)?'blocked':'retry',state);
   notify(id);
   return value;
  })();pending.set(id,job);try{return await job;}finally{pending.delete(id);}
 }
 async function cacheArtwork(id:string,signal?:AbortSignal):Promise<boolean>{
  const work=await store.get(id);if(!work)return false;
  const input=work.fields.coverUri||'';
  const prior=await db.getFirstAsync<{local_uri:string}>('SELECT local_uri FROM assist_cover_cache WHERE work_id=? AND input_uri=?',id,input);
  if(prior&&new File(prior.local_uri).exists)return true;
  const artwork=await base.acquireArtwork(id,signal);check(signal);
  if(artwork.state!=='ready'||!artwork.uri)return false;
  // Native validation decodes the image and stores it by its content hash.
  // Cache ownership is separate from bibliographic revision: downloading a
  // cover must not cause a second rewrite of a multi-gigabyte audiobook.
  let applied=false;
  await db.withExclusiveTransactionAsync(async tx=>{
   check(signal);const current=await tx.getFirstAsync<{revision:number}>('SELECT revision FROM scanner_vnext_metadata WHERE work_id=?',id);
   if(current?.revision!==work.revision)return;
   await tx.runAsync('INSERT INTO assist_cover_cache VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET input_uri=excluded.input_uri,local_uri=excluded.local_uri',id,input,artwork.uri!);applied=true;
  });
  if(applied)notify(id);return applied;
 }
 async function refresh(id:string,signal?:AbortSignal){
  // UI projection does no network or file write. Population owns expensive jobs.
  return decorateRows(id,await base.refresh(id,signal,true));
 }
 async function decorateRows(id:string,rows:ScannerBook[]){
  const work=await store.get(id);if(!work)return rows;
  const saved=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);
  const staged=await db.getFirstAsync<{revision:number;payload:string}>('SELECT revision,payload FROM scanner_vnext_staged WHERE work_id=?',id);
  const issues=saved?JSON.parse(saved.payload).entry.issues||[]:[];
  const writeReceipt=await db.getFirstAsync<{state:string}>('SELECT state FROM scanner_vnext_file_writes WHERE work_id=? AND revision=?',id,work.revision);
  const writeJob=await jobs.load(id,'write');
  const artwork=await db.getFirstAsync<{local_uri:string}>('SELECT local_uri FROM assist_cover_cache WHERE work_id=? AND input_uri=?',id,work.fields.coverUri||'');
  const cachedCover=artwork&&new File(artwork.local_uri).exists?artwork.local_uri:undefined;
  const fileMessages:Record<string,string>={written:'Metadata written into the original file.','unsupported-format':'In-file metadata writing is unavailable for this format; the original is unchanged.','unsupported-size':'This file exceeds the current in-file writing limit; the original is unchanged.','source-review-required':'File writing is waiting for the source-file grouping to be checked.','identity-needs-evidence':'Details saved in the library; file writing is waiting for stronger identification evidence.','unchanged':'File metadata is already up to date.','FILE_RECOVERY_REQUIRED':'An interrupted file update needs recovery review. The original backup is retained in the app; keep the app installed.'};
  fileMessages['written-partial']=fileMessages['unchanged-partial']='Supported metadata is saved in the file. Fields this format cannot store remain saved in your library.';
  const pendingMessage=writeJob?.revision===work.revision?({pending:'Details saved in the library. File update queued.',running:'Details saved in the library. File update in progress.',retry:'Details saved in the library. File update will retry.'} as Record<string,string>)[writeJob.state]:undefined;
  const metadataFileStatus=(await settings()).metadata.writeMetadataToFiles===false?'File metadata saving is switched off.':pendingMessage|| (writeReceipt?(fileMessages[writeReceipt.state]||'Details saved in the library. The file update could not be verified; no successful write is claimed.'):'');
  const reasons=currentReview(work,issues,staged?.revision===work.revision?JSON.parse(staged.payload).reasons||[]:[]);
  return rows.map(row=>({...row,...work.fields,metadataFileStatus,seriesNumber:Number(work.fields.seriesNumber)||undefined,publishedYear:Number(work.fields.publishedYear)||undefined,coverUri:cachedCover||work.fields.coverUri||row.coverUri,needsReview:reasons.length>0,reviewReason:reasons.join(' · ')}));
 }
 async function enrich(books:LocalBook[],policy:AssistPolicy,onRows:(rows:ScannerBook[])=>Promise<void>,signal?:AbortSignal){
  const groups=new Map<string,LocalBook>();for(const book of books){const id=(book as ScannerBook).scannerWorkId;if(id&&!groups.has(id))groups.set(id,book);}
  // Persist the whole requested batch before processing. A process restart
  // resumes the remaining items rather than forgetting all but the current one.
  for(const [id]of groups){
   check(signal);const work=await store.get(id);if(!work)continue;
   await jobs.enqueue(id,work.revision,'identify',!!policy.retry);
   await queueArtwork(id,!!policy.retry);
  }
  if(!policy.online){await pausePopulation();for(const id of groups.keys()){check(signal);await onRows(await refresh(id,signal));}return;}
  check(signal);await db.runAsync('INSERT INTO assist_population_control VALUES(1,1) ON CONFLICT(id) DO UPDATE SET enabled=1');
  let updates=Promise.resolve(),updateError:unknown;
  const updated=(id?:string)=>{if(id&&groups.has(id))updates=updates.then(async()=>{check(signal);await onRows(await refresh(id,signal));}).catch(error=>{updateError=error;});};
  const cancel=()=>{identifyOwner?.abort();void pausePopulation().catch(()=>{});};
  listeners.add(updated);signal?.addEventListener('abort',cancel,{once:true});
  try{
   if(signal?.aborted)cancel();
   // Startup may already be finishing a disabled drain. Join it before starting
   // this explicitly enabled batch, otherwise the UI can report completion
   // before any of the newly queued items have been processed.
   if(identifyDrain)await identifyDrain;
   check(signal);await resumeIdentification();check(signal);await updates;if(updateError)throw updateError;
   for(const id of groups.keys()){check(signal);await onRows(await refresh(id,signal));}
  }finally{listeners.delete(updated);signal?.removeEventListener('abort',cancel);}
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
 resumeWrites();resumeCovers();void resumeIdentification();
 return {...base,metadata:store,assist,refresh,enrich,scan,durableStatus,queueFileWrite,queueArtwork,
  subscribe(listener:(id?:string)=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
  async writeProgress(){return {counts:await jobs.summary('write'),operation:fileOperation};},
  async populationProgress(){return {enabled:await populationEnabled(),counts:await jobs.summary('identify')};},
  pausePopulation,
  async recoveryOptions(id:string):Promise<{id:string;current:string;path:string}[]>{
   const writer=NativeModules.ArchivistFileMetadata;if(!writer?.pendingRecovery)throw Error('File recovery is unavailable in this version.');
   const source=await context(id),options:{id:string;current:string;path:string}[]=[];
   for(const member of source.members){const pending=await writer.pendingRecovery(member.uri);for(const item of pending)options.push({...item,path:member.path});}
   return options;
  },
  async restoreOriginal(id:string,option:{id:string;current:string}){
   // Revalidate membership so a stale editor cannot restore another work.
   const source=await context(id),writer=NativeModules.ArchivistFileMetadata;let found=false;
   for(const member of source.members){const entries=await writer.pendingRecovery(member.uri);if(entries.some((entry:{id:string;current:string})=>entry.id===option.id&&entry.current===option.current)){found=true;break;}}
   if(!found)throw Error('The file changed. Open recovery again to review it.');
   await writer.restorePending(option.id,option.current);
   const work=await store.get(id);if(work){await db.runAsync('DELETE FROM scanner_vnext_file_writes WHERE work_id=?',id);await jobs.enqueue(id,work.revision,'write',true);notify(id);resumeWrites();}
  },
  async retryFileWrite(id:string){const work=await store.get(id);if(!work)return;await jobs.enqueue(id,work.revision,'write',true);notify(id);resumeWrites();},
  async dispose(){disposed=true;if(writeTimer)clearTimeout(writeTimer);if(coverTimer)clearTimeout(coverTimer);if(identifyTimer)clearTimeout(identifyTimer);identifyOwner?.abort();coverOwner.abort();listeners.clear();await Promise.allSettled([writeDrain,coverDrain,identifyDrain]);},
  fileWriteStatus:async(id:string)=>(await db.getFirstAsync<{state:string}>('SELECT state FROM scanner_vnext_file_writes WHERE work_id=?',id))?.state||'not-written',
  async save(id:string,patch:Parameters<typeof store.saveManual>[1],policy:AssistPolicy){const work=await store.get(id);if(!work)throw Error('Unknown work');return assist.save(id,patch,work.revision,policy);},
  async confirm(id:string){const work=await store.get(id);if(!work)throw Error('Unknown work');const next=await store.confirmIdentity(id,work.revision);await queueSavedWork(id);return next;}
 };
}
