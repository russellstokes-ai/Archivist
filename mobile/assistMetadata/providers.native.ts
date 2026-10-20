import {fetch as expoFetch} from 'expo/fetch';
import {readBoundedJson,createBookProviders} from '../scannerVNext/providers';
import {RequestQueue,type Candidate,type Query} from '../scannerVNext/search';
import type {MetadataSettings} from '../metadataSettings';
import {lookupOnlineComic} from '../onlineComicMetadata';
import {ProviderQueue,parseSearchClues} from './core';
import type {AssistProvider} from './service';
import {createAudibleProvider} from './audible';
import {catalogueGenre} from './genres';
import {createGcdProvider} from './gcd';
import {createInventaireProvider} from './inventaire';
const queues=new ProviderQueue();
const clean=(value:unknown,max=512)=>typeof value==='string'?value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max):undefined;
const hosts=new Set(['openlibrary.org','www.googleapis.com','metron.cloud','api.audible.co.uk','inventaire.io','www.comics.org']);
async function request(url:string,signal?:AbortSignal,token?:string){
 const target=new URL(url);if(target.protocol!=='https:'||!hosts.has(target.hostname)||target.username||target.password)throw Error('Unapproved catalogue endpoint');
 const headers:Record<string,string>={Accept:'application/json','User-Agent':'Archivist/0.9.4 (+https://github.com/russellstokes-ai/Archivist)'};
 if(token){if(target.hostname!=='metron.cloud')throw Error('Credential origin mismatch');headers.Authorization='Bearer '+token;}
 return readBoundedJson(await expoFetch(url,{signal,headers,redirect:'error'}),signal);
}
export function createAssistProviders(settings:MetadataSettings,googleKey?:string,metronToken?:string):AssistProvider[]{
 const out:AssistProvider[]=[];
 if(settings.books.enabled&&settings.books.openLibrary){
  const provider=createBookProviders({openLibrary:true,googleBooks:false},request,new RequestQueue())[0] as AssistProvider;
  provider.details=async(candidate,signal)=>{
   if(!/^\/works\/OL\d+W$/.test(candidate.id))return candidate;
   const detail=await queues.run('open-library-detail',s=>request('https://openlibrary.org'+candidate.id+'.json',s),signal,1100) as Record<string,any>;
   const description=clean(typeof detail.description==='string'?detail.description:detail.description?.value,4096);
   const genre=catalogueGenre(detail.subjects);
   return {...candidate,fields:{...candidate.fields,...(description?{description}:{}),...(genre?{genre}:{})}};
  };
  const original=provider.search.bind(provider);
  provider.search=async(query,page,signal)=>{
   if(query.asin&&!query.title&&!query.isbn)throw Error('ASIN lookup requires an audiobook-capable provider');
   return original(query,page,signal);
  };
  out.push(provider);
 }
 if(settings.books.enabled&&settings.books.googleBooks){
  const provider=createBookProviders({openLibrary:false,googleBooks:true,googleKey},request,new RequestQueue())[0] as AssistProvider;
  provider.details=async(candidate,signal)=>{
   if(!googleKey||!/^[-A-Za-z0-9_]+$/.test(candidate.id))return candidate;
   const detail=await queues.run('google-books-detail',s=>request('https://www.googleapis.com/books/v1/volumes/'+encodeURIComponent(candidate.id)+'?key='+encodeURIComponent(googleKey),s),signal,300) as {volumeInfo?:Record<string,any>};
   const v=detail.volumeInfo||{},description=clean(v.description,4096),publisher=clean(v.publisher);
   return {...candidate,fields:{...candidate.fields,...(description?{description}:{}),...(publisher?{publisher}:{})}};
  };out.push(provider);
 }
 if(settings.comics.enabled&&settings.comics.gcd!==false)out.push(createGcdProvider((url,signal)=>queues.run('gcd',s=>request(url,s),signal,1500)));
 if(settings.comics.enabled&&settings.comics.metron){
  out.push({id:'metron',available:!!metronToken,async search(query:Query,page,signal){
   if(!metronToken||page>0)return {candidates:[],nextPage:null};
   const raw=query.title||query.series||'',clues=parseSearchClues(raw);
   if(!clues.annualLabel&&!query.series&&!/\b(?:comic|annual|issue|#\s*\d)/i.test(raw))return {candidates:[],nextPage:null};
   const input={format:'Comic',title:raw,series:clues.series||query.series||raw,comicIssueNumber:clues.annualLabel||query.seriesNumber,isbn:query.isbn};
   const options={token:metronToken,timeoutMs:8000,fetcher:async(url:string)=>{
    const payload=await queues.run('metron',s=>request(url,s,metronToken),signal,3100);
    return {ok:true,status:200,json:async()=>payload};
   }};
   let result=await lookupOnlineComic(input,options);
   // Annual cover labels are not necessarily catalogue issue numbers. Keep
   // the returned facts unchanged and offer broader results for review.
   if(clues.annualLabel&&result.status==='none'&&!result.candidates.length&&!signal?.aborted)
    result=await lookupOnlineComic({...input,comicIssueNumber:undefined},options);
   if(['offline','rate-limited','unconfigured'].includes(result.status))throw Error('Comic catalogue unavailable');
   const candidates:Candidate[]=result.candidates.slice(0,20).map(c=>{
    const fields:Record<string,string>={};
    for(const key of ['title','author','series','genre','publisher','description','language','isbn','publishedYear'] as const){const value=c.fields[key];if(value!==undefined&&String(value).trim())fields[key]=String(value).trim();}
    if(c.fields.comicIssueNumber)fields.seriesNumber=c.fields.comicIssueNumber;
    if(c.coverUri)fields.coverUrl=c.coverUri;
    return {id:c.providerId,provider:'metron',fields,identifiers:c.fields.isbn?[c.fields.isbn]:[]};
   });return {candidates,nextPage:null};
  }});
 }
 if(settings.books.enabled&&settings.books.audible)out.push(createAudibleProvider((url,signal)=>queues.run('audible-uk',s=>request(url,s),signal,1000)));
 if(settings.books.enabled&&settings.books.inventaire!==false)out.push(createInventaireProvider((url,signal)=>queues.run('inventaire',s=>request(url,s),signal,1000)));
 return out;
}
