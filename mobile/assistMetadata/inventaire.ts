import type {AssistProvider} from './service';
import type {Candidate} from '../scannerVNext/search';
import {catalogueGenre} from './genres';
type Entity={uri?:string;type?:string;labels?:Record<string,string>;claims?:Record<string,string[]>;image?:{url?:string}};
const uri=(s:unknown):s is string=>typeof s==='string'&&/^(wd:Q\d+|inv:[a-f0-9]{32}|isbn:[0-9X]{10,13})$/.test(s);
const claim=(e:Entity,p:string)=>(Array.isArray(e.claims?.[p])?e.claims![p]:[]).filter(x=>typeof x==='string').slice(0,8);
const title=(e:Entity)=>e.labels?.en||claim(e,'wdt:P1476')[0]||e.labels?.fromclaims||'';
/** Inventaire exposes its own editions and linked Wikidata works/genres. */
export function createInventaireProvider(request:(url:string,signal?:AbortSignal)=>Promise<unknown>):AssistProvider{
 async function entities(ids:string[],signal?:AbortSignal):Promise<Record<string,Entity>>{
  if(!ids.length)return {};
  const data=await request('https://inventaire.io/api/entities/by-uris?uris='+encodeURIComponent([...new Set(ids.filter(uri))].slice(0,24).join('|')),signal) as {entities?:Record<string,Entity>};
  return data.entities||{};
 }
 return {id:'inventaire',async search(query,page,signal){
  if(page>0||query.asin||(!query.title&&!query.isbn))return {candidates:[],nextPage:null};
  let found:Record<string,Entity>;
  if(query.isbn){const isbn=query.isbn.replace(/[-\s]/g,'');if(!/^([0-9]{13}|[0-9]{9}[0-9X])$/.test(isbn))return {candidates:[],nextPage:null};found=await entities(['isbn:'+isbn],signal);}
  else{
   const params=new URLSearchParams({search:query.title!,types:'works',lang:'en',limit:'5'});
   const result=await request('https://inventaire.io/api/search?'+params,signal) as {results?:{uri?:string}[]};
   found=await entities((result.results||[]).slice(0,5).map(r=>r.uri).filter(uri),signal);
  }
  const editions=Object.values(found).filter(e=>e.type==='edition'||e.type==='work').slice(0,5);
  const works=await entities(editions.flatMap(e=>e.type==='edition'?claim(e,'wdt:P629'):[]),signal);
  const workFor=(e:Entity)=>e.type==='edition'?works[claim(e,'wdt:P629')[0]]||{}:e;
  const related=await entities(editions.flatMap(e=>{const w=workFor(e);return [...claim(w,'wdt:P50'),...claim(w,'wdt:P136'),...claim(w,'wdt:P179'),...claim(e,'wdt:P123'),...claim(e,'wdt:P407')];}),signal);
  const labels=(e:Entity,p:string)=>claim(e,p).map(id=>related[id]?.labels?.en).filter((s):s is string=>!!s);
  const candidates:Candidate[]=[];
  for(const e of editions){const w=workFor(e),name=title(e)||title(w);if(!name||!e.uri)continue;
   const fields:Record<string,string>={title:name};
   const genre=catalogueGenre(labels(w,'wdt:P136'));
   const year=claim(e,'wdt:P577')[0]?.match(/^(\d{4})/)?.[1];
   for(const [key,value]of Object.entries({author:labels(w,'wdt:P50').join(', '),genre,series:labels(w,'wdt:P179')[0],publisher:labels(e,'wdt:P123')[0],language:labels(e,'wdt:P407')[0],publishedYear:year}))if(value)fields[key]=value;
   const isbn=claim(e,'wdt:P212')[0]?.replace(/[-\s]/g,'');if(isbn)fields.isbn=isbn;
   if(e.image?.url&&/^\/img\/entities\/[a-f0-9]+$/.test(e.image.url))fields.coverUrl='https://inventaire.io'+e.image.url;
   candidates.push({id:e.uri,provider:'inventaire',fields,identifiers:isbn?[isbn]:[],relatedMatch:true});
  }
  return {candidates,nextPage:null};
 }};
}
