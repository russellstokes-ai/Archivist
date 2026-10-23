import {metadataDatabase} from '../scannerVNext/metadataWrites';
import type {ScannerDatabase} from '../scannerVNext/store';
import type {MetadataWork,WorkFields} from '../scannerVNext/fieldEvidence';
import type {AssistState} from '../scannerVNext/assist';
import type {SearchResult,Candidate} from '../scannerVNext/search';
import type {AssistMetadataStore} from './store';
import type {AssistPolicy,createAssistSearchService} from './service';
import {supplementCandidate} from './supplement';
import {loadNeighbourContext,selectNeighbourCandidate} from './neighbours';
import {fillMissing,selectAutomatic} from './core';
type State=AssistState&{clues?:string};
type Service=ReturnType<typeof createAssistSearchService>;
type DeepSearch=(work:MetadataWork,result:SearchResult,policy:AssistPolicy,signal:AbortSignal)=>Promise<{result:SearchResult;candidate:Candidate|null}|null>;
export async function createImprovedAssist(db:ScannerDatabase,store:AssistMetadataStore,service:Service,onSaved?:(id:string)=>Promise<void>,deepSearch?:DeepSearch){
 db=metadataDatabase(db);const active=new Map<string,AbortController>();
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_assist(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL);');
 async function persist(work:MetadataWork,state:State,owner?:AbortController){
  if(JSON.stringify(state).length>524288)throw Error('Assist result budget');let saved=false;
  await db.withExclusiveTransactionAsync(async tx=>{
   if(owner&&(owner.signal.aborted||active.get(work.workId)!==owner))return;
   const row=await tx.getFirstAsync<{revision:number}>('SELECT revision FROM scanner_vnext_metadata WHERE work_id=?',work.workId);
   if(row?.revision!==work.revision)return;
   await tx.runAsync('INSERT INTO scanner_vnext_assist VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',work.workId,work.revision,JSON.stringify(state));
   if(owner&&(owner.signal.aborted||active.get(work.workId)!==owner))throw Error('Search superseded');saved=true;
  });return saved;
 }
 async function get(id:string):Promise<State|null>{
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_assist WHERE work_id=? AND length(payload)<=524288',id);
  if(!row)return null;try{const state=JSON.parse(row.payload) as State;return state.state==='pending'&&!active.has(id)?{...state,state:'error'}:state;}catch{return null;}
 }
 async function mediaKind(id:string):Promise<AssistPolicy['mediaKind']>{
  const exists=await db.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='scanner_vnext_catalogue'");if(!exists)return undefined;
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);if(!row)return undefined;
  try{const assets=JSON.parse(row.payload).entry?.assets;if(!Array.isArray(assets)||!assets.length)return undefined;
   const kinds=new Set(assets.map(a=>a.disposition?.kind));return kinds.size!==1?undefined:kinds.has('audio')?'audio':kinds.has('comic')?'comic':kinds.has('ebook')||kinds.has('document')?'book':undefined;
  }catch{return undefined;}
 }
 async function start(work:MetadataWork,policy:AssistPolicy){
  active.get(work.workId)?.abort();const owner=new AbortController();active.set(work.workId,owner);
  await persist(work,{revision:work.revision,state:'pending',updated:Date.now()},owner);
  const completion=(async():Promise<State>=>{
   try{
    policy={...policy,mediaKind:await mediaKind(work.workId)};
    const neighbours=policy.automatic&&policy.clues===undefined?await loadNeighbourContext(db,work):null;
    const searchWork=neighbours?{...work,fields:{...neighbours.fields,...work.fields}}:work;
    let result=await service.search(searchWork,{...policy,signal:owner.signal});
    if(owner.signal.aborted||active.get(work.workId)!==owner)return {revision:work.revision,state:'cancelled',updated:Date.now()};
    let selected=policy.automatic&&policy.clues===undefined?selectAutomatic(work,result.candidates.map(r=>r.candidate))||selectNeighbourCandidate(work,result.candidates.map(r=>r.candidate),neighbours):null;
    if(!selected&&policy.automatic&&policy.clues===undefined&&deepSearch){
     try{const deep=await deepSearch(work,result,policy,owner.signal);if(deep){result=deep.result;selected=deep.candidate;}}catch{if(owner.signal.aborted)throw Error('Search cancelled');}
    }
    const winner=selected?supplementCandidate(selected,result.candidates.map(r=>r.candidate)):null;
    if(winner){
     const patch=work.identityConfirmed?fillMissing(work,winner):null;
     if(!work.identityConfirmed||patch&&Object.keys(patch).length){
      const candidate=work.identityConfirmed?{...winner,fields:{...work.fields,...patch},identifiers:[work.fields.isbn,work.fields.asin].filter((v):v is string=>!!v)}:winner;
      const saved=await store.accept(work.workId,candidate,work.revision,{signal:owner.signal});
      const state:State={revision:saved.revision,state:'accepted',result,updated:Date.now()};
      if(!await persist(saved,state,owner))return {...state,state:'stale'};
      await onSaved?.(saved.workId);return state;
     }
    }
    const state:State={revision:work.revision,state:result.state==='pending'?(result.issues.length?'error':'needs-clues'):result.state,result,updated:Date.now(),...(policy.clues!==undefined?{clues:policy.clues}:{})};
    return await persist(work,state,owner)?state:{...state,state:'stale'};
   }catch{
    const state:State={revision:work.revision,state:owner.signal.aborted?'cancelled':'error',updated:Date.now()};
    await persist(work,state,owner).catch(()=>false);return state;
   }finally{if(active.get(work.workId)===owner)active.delete(work.workId);}
  })();return {work,completion};
 }
 return {
  get,
  cancel(id:string){active.get(id)?.abort();},
  async search(id:string,policy:AssistPolicy){const work=await store.get(id);if(!work)throw Error('Unknown work');return start(work,policy);},
  async save(id:string,patch:WorkFields,expected:number,policy:AssistPolicy){const saved=await store.saveManual(id,patch,expected);await onSaved?.(id);return start(saved,policy);},
  async accept(id:string,candidateId:string,expected:number,confirm=false,lookupUpdated?:number){
   const state=await get(id);if(state?.revision!==expected||lookupUpdated!==undefined&&state.updated!==lookupUpdated)throw Error('These search results have changed. Search again to choose the current match.');
   const candidate=state.result?.candidates.find(r=>r.candidate.provider+'|'+r.candidate.id===candidateId)?.candidate;
   if(!candidate)throw Error('This match is no longer available. Search again to refresh the choices.');active.get(id)?.abort();
   const work=await store.accept(id,supplementCandidate(candidate,state?.result?.candidates.map(r=>r.candidate)||[]),expected,{confirmIdentityConflicts:confirm});await persist(work,{revision:work.revision,state:'accepted',result:state.result,updated:Date.now()});await onSaved?.(id);return work;
  },
  async more(id:string,provider:string,page:number,expected:number,policy:AssistPolicy){
   const work=await store.get(id),state=await get(id);if(!work||work.revision!==expected||state?.revision!==expected)throw Error('Stale Assist choices');
   active.get(id)?.abort();const owner=new AbortController();active.set(id,owner);
   try{
    const result=await service.more(work,provider,page,{...policy,clues:state.clues,mediaKind:await mediaKind(id),signal:owner.signal},state.result?.nextPlans?.[provider]||0);
    if(owner.signal.aborted||active.get(id)!==owner)throw Error('Search cancelled');
    const rows=new Map((state.result?.candidates||[]).map(r=>[r.candidate.provider+'|'+r.candidate.id,r]));for(const row of result.candidates)rows.set(row.candidate.provider+'|'+row.candidate.id,row);
    if(rows.size>200)throw Error('Refine search clues');
    const merged:SearchResult={...result,candidates:[...rows.values()].sort((a,b)=>b.score-a.score),nextPages:{...state.result?.nextPages,...result.nextPages},nextPlans:{...state.result?.nextPlans,...result.nextPlans}};
    const next:State={revision:expected,state:merged.candidates.length?'review':merged.state,result:merged,clues:state.clues,updated:Date.now()};
    if(!await persist(work,next,owner))throw Error('Stale Assist choices');return next;
   }finally{if(active.get(id)===owner)active.delete(id);}
  }
 };
}
