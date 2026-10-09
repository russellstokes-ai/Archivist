import type {ScannerDatabase} from './store';
import type {SearchService,SearchResult} from './search';
import type {createMetadataStore,MetadataWork,WorkFields} from './fieldEvidence';
type MetadataStore=Awaited<ReturnType<typeof createMetadataStore>>;
type Policy={online:boolean;automatic:boolean;explicit?:boolean;retry?:boolean};
export type AssistState={revision:number;state:SearchResult['state']|'pending'|'stale'|'cancelled'|'accepted';result?:SearchResult;updated:number};
export async function createAssistController(db:ScannerDatabase,store:MetadataStore,service:Pick<SearchService,'search'>&Partial<Pick<SearchService,'more'>>){
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_assist(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL);');
 const active=new Map<string,AbortController>();
 async function persist(work:MetadataWork,value:AssistState,controller?:AbortController){
  let written=false;if(JSON.stringify(value).length>524288)throw new Error('Assist result budget');
  const owns=()=>!controller||active.get(work.workId)===controller;
  const superseded=new Error('Assist request superseded');
  try{await db.withExclusiveTransactionAsync(async tx=>{
   if(!owns())return;
   const current=await tx.getFirstAsync<{revision:number}>('SELECT revision FROM scanner_vnext_metadata WHERE work_id=?',work.workId);
   if(current?.revision!==work.revision||!owns())return;
   await tx.runAsync('INSERT INTO scanner_vnext_assist VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',work.workId,work.revision,JSON.stringify(value));
   if(!owns())throw superseded;written=true;
  });}catch(error){if(error!==superseded)throw error;return false;}return written;
 }
 const get=async(id:string):Promise<AssistState|null>=>{const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_assist WHERE work_id=? AND length(payload)<=524288',id);return row?JSON.parse(row.payload):null;};
 async function start(work:MetadataWork,policy:Policy){
  active.get(work.workId)?.abort();const controller=new AbortController();active.set(work.workId,controller);
  await persist(work,{revision:work.revision,state:'pending',updated:Date.now()},controller);
  const completion=(async():Promise<AssistState>=>{
   try{
    const result=await service.search(work,{...policy,signal:controller.signal});
    const value:AssistState={revision:work.revision,state:result.state,result,updated:Date.now()};
    if(controller.signal.aborted||!await persist(work,value,controller))return {revision:work.revision,state:'stale',updated:Date.now()};return value;
   }catch(error){
    const value:AssistState={revision:work.revision,state:controller.signal.aborted?'cancelled':'pending',updated:Date.now()};
    if(!await persist(work,value,controller))return {...value,state:'stale'};return value;
   }finally{if(active.get(work.workId)===controller)active.delete(work.workId);}
  })();
  return {work,completion};
 }
 return {
  get,
  async save(id:string,patch:WorkFields,expected:number,policy:Policy){const work=await store.saveManual(id,patch,expected);return start(work,policy);},
  async search(id:string,policy:Policy){const work=await store.get(id);if(!work)throw new Error('Unknown work');return start(work,policy);},
  cancel(id:string){active.get(id)?.abort();},
  async accept(id:string,candidateId:string,expected:number,confirmIdentityConflicts=false){
   const state=await get(id);if(state?.revision!==expected)throw new Error('Stale Assist choices');
   const candidate=state.result?.candidates.find(row=>row.candidate.provider+'|'+row.candidate.id===candidateId)?.candidate;if(!candidate)throw new Error('Candidate is not in this work lookup');
   active.get(id)?.abort();const work=await store.accept(id,candidate,expected,{confirmIdentityConflicts});await persist(work,{revision:work.revision,state:'accepted',updated:Date.now()});return work;
  },
  async more(id:string,provider:string,page:number,expected:number,policy:Policy){
   const work=await store.get(id),state=await get(id);if(!work||work.revision!==expected||state?.revision!==expected)throw new Error('Stale Assist choices');if(!service.more)throw new Error('Provider paging unavailable');
   active.get(id)?.abort();const controller=new AbortController();active.set(id,controller);
   try{
    const result=await service.more(work,provider,page,{online:policy.online,automatic:policy.automatic,signal:controller.signal},state.result?.nextPlans?.[provider]??0);
    if(controller.signal.aborted||active.get(id)!==controller)throw new Error('Stale Assist choices');
    result.nextPages={...state.result?.nextPages,...result.nextPages};result.nextPlans={...state.result?.nextPlans,...result.nextPlans};const candidates=new Map((state.result?.candidates??[]).map(row=>[row.candidate.provider+'|'+row.candidate.id,row]));for(const row of result.candidates)candidates.set(row.candidate.provider+'|'+row.candidate.id,row);if(candidates.size>200)throw new Error('Result budget reached; refine the title or author');
    result.candidates=[...candidates.values()].sort((a,b)=>b.score-a.score);const value:AssistState={revision:expected,state:result.candidates.length?'review':result.state,result,updated:Date.now()};if(!await persist(work,value,controller))throw new Error('Stale Assist choices');return value;
   }finally{if(active.get(id)===controller)active.delete(id);}
  },
 };
}
