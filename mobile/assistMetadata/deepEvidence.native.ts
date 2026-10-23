import {NativeModules} from 'react-native';
import {File,Paths} from 'expo-file-system';
import {fetch as expoFetch} from 'expo/fetch';
import type {ScannerDatabase} from '../scannerVNext/store';
import type {MetadataWork} from '../scannerVNext/fieldEvidence';
import type {SearchResult} from '../scannerVNext/search';
import {sharedRequestQueue} from '../scannerVNext/search';
import {approvedArtworkUrl,readArtworkBytes} from '../scannerVNext/artworkDownload';
import type {AssistPolicy,createAssistSearchService} from './service';
import {textEvidence,coverDistance,selectDeepCandidate,type DeepProof} from './deepEvidence';
import {initDeepEvidence,loadDeepProof,saveDeepProof,deepSourceKey} from './deepEvidenceStore';
const check=(s:AbortSignal)=>{if(s.aborted)throw Error('Deep recognition cancelled');};
type Service=ReturnType<typeof createAssistSearchService>;
export async function createDeepRecognition(db:ScannerDatabase,configured:()=>Promise<Service>){
 await initDeepEvidence(db);let sequence=0;
 return async(work:MetadataWork,initial:SearchResult,policy:AssistPolicy,signal:AbortSignal)=>{
  check(signal);if(!policy.online||initial.state==='offline'||initial.state==='disabled')return null;
  const native=NativeModules.ArchivistScanner;if(!native?.readDeepEvidence||!native?.fingerprintPrivateCover||!native?.readDocumentStat)return null;
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',work.workId);if(!row)return null;
  const item=JSON.parse(row.payload),assets=item.entry?.assets;if(!Array.isArray(assets)||assets.length!==1)return null;
  const sourceKey=deepSourceKey(item);if(!sourceKey)return null;
  const asset=assets[0],container=asset.disposition?.container;if(!['pdf','cbz','zip','epub','cb7'].includes(container)||!item.source?.rootUri||!asset.documentId)return null;
  const scope=await native.beginScope(item.source.rootUri);let closing:Promise<unknown>|undefined;
  const close=()=>closing??(closing=Promise.resolve(native.cancelScope(scope.scope))),abort=()=>{void close().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  const sourceCurrent=async()=>{const stat=await native.readDocumentStat(scope.scope,asset.documentId);check(signal);return stat.state==='ok'&&stat.documentId===asset.documentId&&stat.size===asset.size&&stat.modified===asset.modified;};
  try{
   if(!await sourceCurrent())return null;
   check(signal);let proof=await loadDeepProof(db,work.workId,work.revision);let hash=proof?.coverHash||'';
   if(!proof){
    const value=await native.readDeepEvidence(scope.scope,asset.documentId,container);check(signal);
    if(value.state!=='ok')return null;
    if(typeof value.text!=='string'||value.text.length>16384||typeof value.coverHash!=='string'||value.coverHash&&!/^[a-f0-9]{16}$/.test(value.coverHash))throw Error('Invalid deep evidence');
    proof={text:value.text,sourceKey,coverHash:value.coverHash,fields:textEvidence(value.text),covers:{}};hash=value.coverHash;
   }
   let result=initial;
   if(Object.keys(proof.fields).some(k=>proof!.fields[k as keyof typeof proof.fields]!==work.fields[k as keyof typeof work.fields])){
    // Raw page text is never sent to providers. Only explicit bibliographic fields.
    const extra=await (await configured()).search({...work,fields:{...proof.fields,...work.fields,...(proof.fields.isbn&&!work.fields.isbn?{isbn:proof.fields.isbn}:{})}},{...policy,signal});check(signal);
    const rows=new Map(initial.candidates.map(r=>[r.candidate.provider+'|'+r.candidate.id,r]));for(const r of extra.candidates)rows.set(r.candidate.provider+'|'+r.candidate.id,r);
    result={...initial,state:rows.size?'review':initial.state,candidates:[...rows.values()].slice(0,200),issues:[...new Set([...initial.issues,...extra.issues])]};
   }
   if(hash)for(const row of result.candidates.slice(0,3)){
    const candidate=row.candidate,url=candidate.fields.coverUrl;if(!url||!approvedArtworkUrl(url)||/placeholder|no[-_]?cover|default[-_]?cover/i.test(url))continue;
    try{
     const distance=await sharedRequestQueue.run('deep-cover',async inner=>{
      const response=await expoFetch(url,{signal:inner,redirect:'error'}),bytes=await readArtworkBytes(response,inner);check(inner);
      const file=new File(Paths.cache,'assist-deep-'+Date.now()+'-'+(++sequence)+'.img');
      try{file.create();file.write(bytes);const value=await native.fingerprintPrivateCover(scope.scope,file.uri);check(inner);return value.state==='ok'?coverDistance(hash,value.coverHash):null;}finally{if(file.exists)file.delete();}
     },signal);
     if(distance!==null)proof.covers[candidate.provider+'|'+candidate.id]=distance;
    }catch{check(signal);}
   }
   if(!await sourceCurrent())return null;
   await saveDeepProof(db,work.workId,work.revision,proof,signal);check(signal);
   return {result,candidate:selectDeepCandidate(work.fields,result.candidates.map(r=>r.candidate),proof)};
  }finally{signal.removeEventListener('abort',abort);await close();}
 };
}
