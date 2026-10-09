export type SearchFields=Partial<Record<'title'|'author'|'series'|'seriesNumber'|'isbn'|'asin'|'language',string>>;
export type Candidate={id:string;provider:string;fields:SearchFields&{genre?:string;coverUrl?:string;description?:string};identifiers:string[];anthology?:boolean};
export type SearchWork={workId:string;revision:number;fields:SearchFields;manual:Record<string,boolean|undefined>;partIds:string[]};
export type Query=SearchFields;
export interface SearchProvider {id:string;available?:boolean;search(query:Query,page:number,signal?:AbortSignal):Promise<{candidates:Candidate[];nextPage:number|null}>}
export type RankedCandidate={candidate:Candidate;score:number;conflicts:string[];automaticEligible:boolean};
export type SearchResult={state:'review'|'no-match'|'offline'|'disabled'|'pending';candidates:RankedCandidate[];requests:number;cacheHit:boolean;issues:string[];nextPages:Record<string,number|null>;nextPlans?:Record<string,number>};
export type SearchCache={load(key:string):Promise<{expires:number;value:SearchResult}|null>;save(key:string,value:{expires:number;value:SearchResult},signal?:AbortSignal):Promise<unknown>};
export type SearchPolicy={online:boolean;automatic:boolean;explicit?:boolean;signal?:AbortSignal;retry?:boolean;sessionId?:string};
const normalize=(value:string|undefined)=>(value??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Search cancelled');};
export function queryPlans(fields:SearchFields):Query[]{
 const clean:Query={};for(const key of ['title','author','series','seriesNumber','isbn','asin','language'] as const){const value=fields[key]?.trim();if(!value)continue;if(value.length>512||/[\r\n]|(?:content|file):\/\/|[a-z]:[\\/]/i.test(value))throw new Error('Search accepts bibliographic clues, not file paths');clean[key]=value;}
 if(!clean.title&&!clean.author&&!clean.isbn&&!clean.asin)return [];
 const plans=[clean];if(clean.title&&(clean.author||clean.series||normalize(clean.title)!==clean.title)){plans.push({...clean,title:normalize(clean.title),author:undefined,series:undefined,seriesNumber:undefined});}return plans;
}
export function rankCandidates(fields:SearchFields,candidates:Candidate[]):RankedCandidate[]{
 const identifiers=[fields.isbn,fields.asin].filter(Boolean).map(x=>normalize(x).replace(/ /g,''));
 return candidates.map(candidate=>{
  const conflicts:string[]=[];const title=!!fields.title&&normalize(fields.title)===normalize(candidate.fields.title),author=!!fields.author&&normalize(fields.author)===normalize(candidate.fields.author);
  const ids=candidate.identifiers.map(x=>normalize(x).replace(/ /g,'')),identifier=identifiers.some(x=>ids.includes(x));
  if(fields.author&&candidate.fields.author&&!author)conflicts.push('author');
  if(identifiers.length&&ids.length&&!identifier)conflicts.push('identifier');
  if(fields.seriesNumber&&candidate.fields.seriesNumber&&normalize(fields.seriesNumber)!==normalize(candidate.fields.seriesNumber))conflicts.push('series-number');
  if(candidate.anthology)conflicts.push('anthology');
  const series=!!fields.series&&normalize(fields.series)===normalize(candidate.fields.series);
  return {candidate,score:(identifier?1000:0)+(title?100:0)+(author?40:0)+(series?10:0)-(conflicts.length*50),conflicts,automaticEligible:conflicts.length===0&&(identifier||title&&author)};
 }).sort((a,b)=>b.score-a.score||a.candidate.id.localeCompare(b.candidate.id));
}
export class ProviderRequestError extends Error {constructor(public status:number,public retryAfterMs=0){super('Provider request failed ('+status+')');}}
type Job={provider:string;operation:(signal:AbortSignal)=>Promise<unknown>;resolve:(value:unknown)=>void;reject:(error:Error)=>void;controller:AbortController;settled:boolean;timer?:ReturnType<typeof setTimeout>;signal?:AbortSignal;abort?:()=>void};
export class RequestQueue {
 private waiting:Job[]=[];private current:Job|null=null;private quarantined=false;private health=new Map<string,{next:number;blocked:number;failures:number}>();
 private now:()=>number;private sleep:(ms:number)=>Promise<void>;private deadline:number;
 constructor(options:{now?:()=>number;sleep?:(ms:number)=>Promise<void>;deadlineMs?:number}={}){this.now=options.now??Date.now;this.sleep=options.sleep??(ms=>new Promise(resolve=>setTimeout(resolve,ms)));this.deadline=options.deadlineMs??8000;if(!Number.isFinite(this.deadline)||this.deadline<1||this.deadline>8000)throw new RangeError('Invalid request deadline');}
 snapshot(){return {active:this.current?1:0,queued:this.waiting.length,quarantined:this.quarantined?1:0};}
 run<T>(provider:string,operation:(signal:AbortSignal)=>Promise<T>,signal?:AbortSignal):Promise<T>{
  check(signal);if(this.quarantined)return Promise.reject(new Error('Network circuit-open'));if(this.waiting.length>=64)return Promise.reject(new Error('Network queue-full'));
  return new Promise<T>((resolve,reject)=>{
   const job:Job={provider,operation,resolve:value=>resolve(value as T),reject,controller:new AbortController(),settled:false,signal};
   job.abort=()=>{if(this.current===job){this.quarantined=true;for(const pending of this.waiting.splice(0))this.finish(pending,new Error('Network circuit-open'));}else this.waiting=this.waiting.filter(item=>item!==job);this.finish(job,new Error('Search cancelled'));job.controller.abort();};signal?.addEventListener('abort',job.abort,{once:true});this.waiting.push(job);void this.pump();
  });
 }
 private finish(job:Job,error?:Error,value?:unknown){if(job.settled)return;job.settled=true;clearTimeout(job.timer);if(job.abort)job.signal?.removeEventListener('abort',job.abort);error?job.reject(error):job.resolve(value);}
 private async pump(){
  if(this.current||!this.waiting.length||this.quarantined)return;const job=this.waiting.shift()!;this.current=job;
  const health=this.health.get(job.provider)??{next:0,blocked:0,failures:0};this.health.set(job.provider,health);
  job.timer=setTimeout(()=>{health.failures++;if(health.failures>=3)health.blocked=Math.max(health.blocked,this.now()+60000);this.quarantined=true;this.finish(job,new Error('Provider request deadline'));job.controller.abort();for(const pending of this.waiting.splice(0))this.finish(pending,new Error('Network circuit-open'));},this.deadline);
  try{
   check(job.signal);if(health.blocked>this.now())throw new Error('Provider paused');
   const wait=health.next-this.now();if(wait>0)await this.sleep(wait);check(job.controller.signal);check(job.signal);
   health.next=this.now()+(job.provider==='open-library'?1000:250);const value=await job.operation(job.controller.signal);check(job.controller.signal);check(job.signal);health.failures=0;this.finish(job,undefined,value);
  }catch(error){
   if(!job.controller.signal.aborted&&!(error instanceof Error&&error.message==='Provider paused')){
    health.failures++;if(error instanceof ProviderRequestError&&error.status===429)health.blocked=Math.max(health.blocked,this.now()+Math.max(1000,error.retryAfterMs));if(health.failures>=3)health.blocked=Math.max(health.blocked,this.now()+60000);
   }
   this.finish(job,error instanceof Error?error:new Error('Provider failure'));
  }finally{clearTimeout(job.timer);if(job.abort)job.signal?.removeEventListener('abort',job.abort);this.current=null;this.quarantined=false;void this.pump();}
 }
}
export const sharedRequestQueue=new RequestQueue();
export class SearchService {
 private active=new Map<string,{promise:Promise<SearchResult>;signal?:AbortSignal}>();private now:()=>number;private sessions=new Map<string,Set<string>>();
 constructor(private providers:SearchProvider[],private cache:SearchCache,options:{now?:()=>number}={}){this.now=options.now??Date.now;if(providers.length>3||new Set(providers.map(p=>p.id)).size!==providers.length)throw new Error('Invalid provider set');}
 key(work:SearchWork){return JSON.stringify(['search-2',work.workId,queryPlans(work.fields),this.providers.map(p=>p.id).sort()]);}
 search(work:SearchWork,options:SearchPolicy):Promise<SearchResult>{
  check(options.signal);if(!options.online)return Promise.resolve(this.empty('offline'));if(!options.automatic&&!options.explicit)return Promise.resolve(this.empty('disabled'));
  const activeKey=this.key(work)+'|revision='+work.revision;const existing=this.active.get(activeKey);if(existing&&!existing.signal?.aborted)return existing.promise;
  const job=this.perform(work,options);this.active.set(activeKey,{promise:job,signal:options.signal});void job.finally(()=>{if(this.active.get(activeKey)?.promise===job)this.active.delete(activeKey);}).catch(()=>{});return job;
 }
 private empty(state:SearchResult['state']):SearchResult{return {state,candidates:[],requests:0,cacheHit:false,issues:[],nextPages:{},nextPlans:{}};}
 private async perform(work:SearchWork,options:SearchPolicy){
  check(options.signal);if(!options.online)return this.empty('offline');if(!options.automatic&&!options.explicit)return this.empty('disabled');
  const plans=queryPlans(work.fields),key=this.key(work);if(!plans.length)return this.empty('pending');
  if(!options.retry){const cached=await this.cache.load(key);check(options.signal);if(cached&&cached.expires>this.now())return {...cached.value,requests:0,cacheHit:true};}
  if(options.sessionId&&!options.explicit){
   const members=this.sessions.get(options.sessionId)??new Set<string>();if(!members.has(work.workId)&&members.size>=16)return {...this.empty('pending'),issues:['session-work-budget']};
   members.add(work.workId);this.sessions.set(options.sessionId,members);if(this.sessions.size>8)this.sessions.delete(this.sessions.keys().next().value!);
  }
  const result=this.empty('pending'),candidates=new Map<string,Candidate>();
  for(const provider of this.providers){
   if(provider.available===false){result.issues.push(provider.id+':unconfigured');continue;}
   for(const [planIndex,query] of plans.entries()){
    check(options.signal);
    try{result.requests++;const page=await provider.search(query,0,options.signal);check(options.signal);if(page.candidates.length>20)throw new Error('Provider candidate budget');for(const candidate of page.candidates)candidates.set(candidate.provider+'|'+candidate.id,candidate);if(page.nextPage!==null||result.nextPages[provider.id]===undefined){result.nextPages[provider.id]=page.nextPage;result.nextPlans![provider.id]=planIndex;}}
    catch(error){check(options.signal);result.issues.push(provider.id+':request-failed');break;}
   }
  }
  result.candidates=rankCandidates(work.fields,[...candidates.values()]).filter(row=>!work.fields.title||row.score>0);result.state=result.candidates.length?'review':result.issues.length?'pending':'no-match';
  check(options.signal);if(!result.issues.length)try{await this.cache.save(key,{expires:this.now()+(result.state==='no-match'?86400000:2592000000),value:result},options.signal);}catch(error){check(options.signal);result.issues.push('cache-write-failed');}check(options.signal);return result;
 }
 async more(work:SearchWork,providerId:string,page:number,options:{online:boolean;automatic:boolean;signal?:AbortSignal},planIndex=0){
  check(options.signal);if(!options.online)return this.empty('offline');if(!Number.isInteger(page)||page<1||page>1000)throw new RangeError('Invalid result page');
  const provider=this.providers.find(p=>p.id===providerId),query=queryPlans(work.fields)[planIndex];if(!provider||provider.available===false||!query)return this.empty('pending');
  const value=await provider.search(query,page,options.signal);check(options.signal);if(value.candidates.length>20)throw new Error('Provider candidate budget');const candidates=rankCandidates(work.fields,value.candidates).filter(row=>!work.fields.title||row.score>0);return {...this.empty(candidates.length?'review':'no-match'),requests:1,candidates,nextPages:{[providerId]:value.nextPage},nextPlans:{[providerId]:planIndex}};
 }
}
