import type {Candidate,Query,SearchWork,SearchProvider,SearchCache,SearchPolicy,SearchResult} from '../scannerVNext/search';
import {hasGenre} from './genres';
import {clueQueries,parseSearchClues,rankAssistCandidates,selectAutomatic} from './core';
export type AssistPolicy=SearchPolicy&{clues?:string};
export type AssistProvider=SearchProvider&{details?:(candidate:Candidate,signal?:AbortSignal)=>Promise<Candidate>};
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw Error('Search cancelled');};
const empty=(state:SearchResult['state']):SearchResult=>({state,candidates:[],requests:0,cacheHit:false,issues:[],nextPages:{},nextPlans:{}});
function plans(work:SearchWork,options:AssistPolicy):Query[]{
 if(options.clues!==undefined){
  const clues=parseSearchClues(options.clues);
  if(clues.isbn)return [{isbn:clues.isbn}];
  if(clues.asin)return [{asin:clues.asin}];
  return clueQueries(options.clues).map(title=>({title,...(clues.author?{author:clues.author}:{}),broad:false}));
 }
 const f=work.fields;
 if(f.isbn)return [{isbn:f.isbn,...(f.title?{title:f.title}:{}),...(f.author?{author:f.author}:{})}];
 if(!f.title&&!f.author&&!f.asin)return [];
 const initial:Query={...f};const queries=[initial];
 if(f.title)queries.push({title:f.title,broad:true});
 return queries;
}
export function createAssistSearchService(providers:AssistProvider[],cache:SearchCache){
 if(providers.length>6||new Set(providers.map(p=>p.id)).size!==providers.length)throw Error('Invalid Assist providers');
 async function search(work:SearchWork,options:AssistPolicy):Promise<SearchResult>{
  check(options.signal);if(!options.online)return empty('offline');
  if(!options.automatic&&!options.explicit)return empty('disabled');
  const queries=plans(work,options);if(!queries.length)return empty('pending');
  const key=JSON.stringify(['assist-search-v4',queries,providers.map(p=>[p.id,p.available!==false])]);
  const rankingFields=options.clues!==undefined?parseSearchClues(options.clues):work.fields;
  if(!options.retry){try{const entry=await cache.load(key);check(options.signal);if(entry&&entry.expires>Date.now())return {...entry.value,requests:0,cacheHit:true,candidates:rankAssistCandidates(rankingFields,entry.value.candidates.map(x=>x.candidate))};}catch{check(options.signal);}}
  const result=empty('pending'),found=new Map<string,Candidate>();
  for(const provider of providers){
   check(options.signal);
   if(provider.available===false){result.issues.push(provider.id+':unconfigured');continue;}
   for(const [index,query]of queries.entries()){
    check(options.signal);
    try{
     result.requests++;const page=await provider.search(query,0,options.signal);check(options.signal);
     if(!Array.isArray(page.candidates)||page.candidates.length>20)throw Error('Provider result budget');
     for(const c of page.candidates){if(c.provider!==provider.id||!c.id||!c.fields?.title)continue;found.set(c.provider+'|'+c.id,c);}
     result.nextPages[provider.id]=page.nextPage;result.nextPlans![provider.id]=index;
     if(found.size>120)throw Error('Assist candidate budget');
     if(selectAutomatic({fields:rankingFields},[...found.values()]))break;
    }catch{check(options.signal);result.issues.push(provider.id+':request-failed');break;}
   }
   if((()=>{const match=selectAutomatic({fields:rankingFields},[...found.values()]);return hasGenre(match?.fields.genre)&&!!match?.fields.coverUrl&&!!match?.fields.publishedYear;})())break;
  }
  // Conflicts prevent automatic acceptance, but must not hide a relevant title from review.
  let ranked=rankAssistCandidates(rankingFields,[...found.values()]).filter(x=>x.score+x.conflicts.length*150>0||!rankingFields.title);
  for(const row of ranked.slice(0,2)){
   const provider=providers.find(p=>p.id===row.candidate.provider);
   if(!provider?.details)continue;
   const fields=row.candidate.fields as Record<string,string|undefined>;
   if(fields.description&&fields.publisher&&fields.publishedYear&&fields.coverUrl)continue;
   try{result.requests++;const detailed=await provider.details(row.candidate,options.signal);check(options.signal);if(detailed.id!==row.candidate.id||detailed.provider!==row.candidate.provider)throw Error('Detail identity mismatch');found.set(detailed.provider+'|'+detailed.id,detailed);}
   catch{check(options.signal);result.issues.push(row.candidate.provider+':detail-unavailable');}
  }
  ranked=rankAssistCandidates(rankingFields,[...found.values()]).filter(x=>x.score+x.conflicts.length*150>0||!rankingFields.title);
  result.candidates=ranked;result.state=ranked.length?'review':result.issues.length?'pending':'no-match';
  check(options.signal);
  if(!result.issues.length){try{await cache.save(key,{expires:Date.now()+(ranked.length?7*86400000:3600000),value:result},options.signal);}catch{check(options.signal);}}
  return result;
 }
 async function more(work:SearchWork,providerId:string,page:number,options:{online:boolean;automatic:boolean;signal?:AbortSignal;clues?:string},planIndex=0):Promise<SearchResult>{
  check(options.signal);if(!options.online)return empty('offline');
  if(!Number.isSafeInteger(page)||page<1||page>50)throw Error('Invalid provider page');
  const provider=providers.find(p=>p.id===providerId),query=plans(work,{...options,explicit:true})[planIndex];
  if(!provider||provider.available===false||!query)return empty('pending');
  const response=await provider.search(query,page,options.signal);check(options.signal);
  if(response.candidates.length>20)throw Error('Provider result budget');
  return {...empty(response.candidates.length?'review':'no-match'),requests:1,candidates:rankAssistCandidates(options.clues!==undefined?parseSearchClues(options.clues):work.fields,response.candidates),nextPages:{[providerId]:response.nextPage},nextPlans:{[providerId]:planIndex}};
 }
 return {search,more};
}
