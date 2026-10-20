import type {Candidate} from '../scannerVNext/search';
import type {AssistProvider} from './service';
import {parseSearchClues} from './core';
import {catalogueGenre} from './genres';
const clean=(v:unknown,max=512)=>typeof v==='string'?v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
const issueUrl=(v:unknown):v is string=>typeof v==='string'&&/^https:\/\/www\.comics\.org\/api\/issue\/\d+\/$/.test(v);
export function createGcdProvider(request:(url:string,signal?:AbortSignal)=>Promise<unknown>):AssistProvider{
 const cache=new Map<string,{expires:number;data:any}>();let blocked=0;
 async function get(url:string,signal?:AbortSignal):Promise<any>{
  if(signal?.aborted)throw Error('Search cancelled');
  const prior=cache.get(url);if(prior&&prior.expires>Date.now())return prior.data;
  if(blocked>Date.now())throw Error('GCD temporarily unavailable');
  try{const data=await request(url,signal);if(signal?.aborted)throw Error('Search cancelled');
   if(cache.size>=64)cache.delete(cache.keys().next().value!);cache.set(url,{expires:Date.now()+3600000,data});return data;
  }catch(error){const e=error as {status?:number;retryAfterMs?:number};if(e.status===429)blocked=Date.now()+Math.max(60000,e.retryAfterMs||3600000);else if(e.status===401||e.status===403)blocked=Date.now()+600000;throw error;}
 }
 return {id:'gcd',async search(query,page,signal){
  const empty={candidates:[] as Candidate[],nextPage:null};if(page>0||query.asin||query.isbn)return empty;
  const raw=clean(query.title||query.series),clues=parseSearchClues(raw);
  const numbered=raw.match(/^(.*?)\s*(?:#|\bissue\s+|\bno\.\s*)([\d]+[A-Za-z]?)\s*$/i);
  const number=clues.annualLabel||query.seriesNumber||numbered?.[2];
  const series=clean(clues.series||query.series||numbered?.[1]);
  if(!series||!number||!/^\d{1,6}[A-Za-z]?$/.test(number))return empty;
  const data=await get('https://www.comics.org/api/series/name/'+encodeURIComponent(series)+'/issue/'+encodeURIComponent(number)+'/',signal);
  const rows=Array.isArray(data)?data:Array.isArray(data?.results)?data.results:[];
  const candidates:Candidate[]=[];
  for(const row of rows.slice(0,3)){
   if(!issueUrl(row?.api_url))continue;
   const d=await get(row.api_url,signal);if(d.api_url!==row.api_url)continue;
   const name=clean(d.series_name).replace(/\s*\(\d{4} series\)$/i,'');if(!name)continue;
   const issue=clean(d.number,32);if(issue!==number)continue;
   const fields:Record<string,string>={title:name+' '+issue,series:name,seriesNumber:issue};
   const stories=Array.isArray(d.story_set)?d.story_set.slice(0,80).filter((s:any)=>s.type==='comic story'):[];
   const authors=[...new Set(stories.map((s:any)=>clean(s.script)).filter((s:string)=>s&&!/^(none|unknown|\?)$/i.test(s)))];
   if(authors.length)fields.author=authors.join('; ').slice(0,512);
   const genre=catalogueGenre(stories.flatMap((s:any)=>clean(s.genre).split(';')));if(genre)fields.genre=genre;
   const year=clean(d.key_date||d.publication_date).match(/^(\d{4})/);if(year)fields.publishedYear=year[1];
   let publisher=clean(d.indicia_publisher);
   if(!publisher&&typeof d.series==='string'&&/^https:\/\/www\.comics\.org\/api\/series\/\d+\/$/.test(d.series)){
    try{const seriesData=await get(d.series,signal);
     if(typeof seriesData.publisher==='string'&&/^https:\/\/www\.comics\.org\/api\/publisher\/\d+\/$/.test(seriesData.publisher))publisher=clean((await get(seriesData.publisher,signal)).name);
    }catch{if(signal?.aborted)throw Error('Search cancelled');}
   }
   if(publisher)fields.publisher=publisher;
   const isbn=clean(d.isbn).replace(/[-\s]/g,'');if(/^(\d{13}|\d{9}[\dX])$/.test(isbn))fields.isbn=isbn;
   const cover=clean(d.cover,2048);if(/^https:\/\/(?:www\.comics\.org|files\d+\.comics\.org)\//.test(cover))fields.coverUrl=cover;
   candidates.push({id:row.api_url.match(/\d+/)![0],provider:'gcd',fields,identifiers:fields.isbn?[fields.isbn]:[],relatedMatch:true});
  }
  return {candidates,nextPage:null};
 }};
}
