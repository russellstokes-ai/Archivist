import {classifyAsset} from './classify';
import type {Source,SourceAccess,DiscoveryStore,DiscoveryOptions,DiscoverySummary,DiscoveredEntry} from './types';

export async function discoverSource(source:Source,access:SourceAccess,store:DiscoveryStore,options:DiscoveryOptions={}):Promise<DiscoverySummary>{
  const maxEntries=options.maxEntries??100000;
  const batchSize=options.batchSize??128;
  if(!Number.isInteger(maxEntries)||maxEntries<1||maxEntries>100000)throw new RangeError('maxEntries must be 1..100000');
  if(!Number.isInteger(batchSize)||batchSize<1||batchSize>128)throw new RangeError('batchSize must be 1..128');
  if(!source.id||!source.rootUri)throw new Error('Selected source grant is required');
  if(!options.signal?.aborted)await store.saveSource(source);
  let cursor=options.cursor??null;
  const seenDocuments=new Set<string>();
  const seenCursors=new Set<string|null>();
  const result:DiscoverySummary={visited:0,accounted:0,candidates:0,ambiguous:0,unsupported:0,unreadable:0,rejected:0,directories:0,duplicateEntries:0,complete:false,reason:'',nextCursor:cursor};
  const stop=async(reason:string,detail='')=>{
    result.reason=reason;result.nextCursor=cursor;
    if(reason!=='cancelled'&&reason!=='entry-limit')await store.saveIssue(source.id,{reason,detail,cursor});
    return result;
  };
  while(result.visited<maxEntries){
    if(options.signal?.aborted)return stop('cancelled');
    if(seenCursors.has(cursor))return stop('cursor-loop');
    seenCursors.add(cursor);
    const limit=Math.min(batchSize,maxEntries-result.visited);
    let batch;
    try{batch=await access.nextBatch(source,cursor,limit,options.signal);}
    catch(error){return stop(options.signal?.aborted?'cancelled':'provider-error',error instanceof Error?error.message:'Provider request failed');}
    if(options.signal?.aborted)return stop('cancelled');
    if(!batch||!Array.isArray(batch.entries)||batch.entries.length>limit||!(batch.nextCursor===null||typeof batch.nextCursor==='string'))return stop('invalid-batch');
    if(batch.entries.some(e=>!e||typeof e.documentId!=='string'||!e.documentId||typeof e.relativePath!=='string'||typeof e.name!=='string'))return stop('invalid-entry');
    if(batch.issues!==undefined&&(!Array.isArray(batch.issues)||batch.issues.length>128||batch.issues.some(issue=>!issue||typeof issue.reason!=='string'||typeof issue.detail!=='string'||issue.reason.length>128||issue.detail.length>4096)))return stop('invalid-issues');
    // Persist failures before advancing the checkpoint: interrupted writes can repeat an issue,
    // but cannot silently advance past an inaccessible folder.
    for(const issue of batch.issues??[]){
      if(options.signal?.aborted)return stop('cancelled');
      await store.saveIssue(source.id,{...issue,cursor});
    }
    const accepted:DiscoveredEntry[]=[];
    for(const entry of batch.entries){
      result.visited++;
      if(seenDocuments.has(entry.documentId)){result.duplicateEntries++;continue;}
      seenDocuments.add(entry.documentId);
      const relativePath=entry.relativePath.replace(/\\/g,'/');
      const outside=!relativePath||relativePath.startsWith('/')||relativePath.split('/').some(p=>p==='..'||p==='.'||p===''||p.includes(':'));
      const disposition=outside?{state:'rejected' as const,kind:'unknown' as const,reason:'outside-selected-root',audiobookConfirmed:false as const}
        :entry.readable===false?{state:'unreadable' as const,kind:'unknown' as const,reason:'provider-entry-unreadable',audiobookConfirmed:false as const}
        :entry.directory?{state:'directory' as const,kind:'directory' as const,reason:'directory-entry',audiobookConfirmed:false as const}
        :classifyAsset(entry);
      accepted.push({...entry,relativePath,disposition});
    }
    // saveBatch owns the transaction: entries and continuation become durable together.
    try{await store.saveBatch(source.id,accepted,{cursor:batch.nextCursor,visited:result.visited,accounted:result.accounted+accepted.length,complete:batch.nextCursor===null},options.signal);}
    catch(error){if(options.signal?.aborted)return stop('cancelled');throw error;}
    for(const entry of accepted){
      result.accounted++;
      switch(entry.disposition.state){
        case 'candidate':result.candidates++;break;
        case 'ambiguous':result.ambiguous++;break;
        case 'unsupported':result.unsupported++;break;
        case 'unreadable':result.unreadable++;break;
        case 'rejected':result.rejected++;break;
        case 'directory':result.directories++;break;
      }
    }
    cursor=batch.nextCursor;result.nextCursor=cursor;
    if(cursor===null){result.complete=true;result.reason='complete';return result;}
    // Give navigation, cancellation and progress consumers a turn between bounded batches.
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  return stop('entry-limit');
}
