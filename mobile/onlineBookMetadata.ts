export type OnlineBookProvider='openlibrary'|'googlebooks';
export type OnlineBookConfidence='high'|'medium'|'low';

export type OnlineBookFields={
  title?:string;
  author?:string;
  series?:string;
  seriesNumber?:number;
  genre?:string;
  publishedYear?:number;
  publisher?:string;
  isbn?:string;
  language?:string;
  description?:string;
};

export type BookLookupInput=OnlineBookFields&{
  uri?:string;
  format?:string;
  metadataProvenance?:Partial<Record<string,string>>;
  metadataFieldConfidence?:Partial<Record<string,OnlineBookConfidence>>;
  coverUri?:string;
};

export type OnlineBookCandidate={
  provider:OnlineBookProvider;
  providerId:string;
  fields:OnlineBookFields;
  coverUri?:string;
  score:number;
  confidence:OnlineBookConfidence;
  exactIdentifier:boolean;
  identifiers?:string[];
  reasons:string[];
  query:string;
};

export type OnlineBookLookupResult={
  key:string;
  status:'matched'|'review'|'none'|'offline';
  best?:OnlineBookCandidate;
  candidates:OnlineBookCandidate[];
  autoApply:boolean;
  queried:string[];
};

export type OnlineBookCacheEntry={expiresAt:number;result:OnlineBookLookupResult};
export type OnlineBookCache=Record<string,OnlineBookCacheEntry>;

type FetchResponse={ok:boolean;status:number;json:()=>Promise<any>};
type FetchLike=(url:string,init?:any)=>Promise<FetchResponse>;

export type OnlineBookLookupOptions={
  fetcher?:FetchLike;
  googleBooksApiKey?:string;
  cache?:OnlineBookCache;
  now?:()=>number;
  timeoutMs?:number;
};

const positiveTtl=30*24*60*60*1000;
const negativeTtl=24*60*60*1000;
let lastOpenLibraryRequestAt=0;

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

function clean(value:unknown){
  return String(value??'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
}
function normalize(value:unknown){
  return clean(value)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/&/g,' and ')
    .replace(/\b(?:audiobook|ebook|epub|pdf|unabridged|retail|edition)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function tokens(value:unknown){
  return new Set(normalize(value).split(' ').filter(token=>token.length>1&&!['the','and','of','a','an'].includes(token)));
}
function similarity(a:unknown,b:unknown){
  const na=normalize(a),nb=normalize(b);
  if(!na||!nb)return 0;
  if(na===nb)return 1;
  const aa=tokens(na),bb=tokens(nb);
  if(!aa.size||!bb.size)return 0;
  let common=0;
  for(const token of aa)if(bb.has(token))common++;
  const dice=(2*common)/(aa.size+bb.size);
  const contains=(na.includes(nb)||nb.includes(na))?0.12:0;
  return Math.min(1,dice+contains);
}
function authorSimilarity(a:unknown,b:unknown){
  const direct=similarity(a,b);
  const last=(value:unknown)=>normalize(value).split(' ').filter(Boolean).pop()||'';
  return Math.max(direct,last(a)&&last(a)===last(b)?0.72:0);
}
export function normalizeIsbn(value:unknown){
  const raw=String(value??'').replace(/[^0-9Xx]/g,'').toUpperCase();
  return /^(?:\d{9}[\dX]|\d{13})$/.test(raw)?raw:'';
}
function safeYear(value:unknown){
  const match=String(value??'').match(/(?:18|19|20)\d{2}/);
  if(!match)return undefined;
  const year=Number(match[0]);
  return year>=1800&&year<=2100?year:undefined;
}
function useful(value:unknown){
  const n=normalize(value);
  return !!n&&!/^(?:unknown|untitled|unclassified|none|null|n a)$/.test(n);
}
function decodeUri(value:string){
  try{return decodeURIComponent(value);}catch{return value;}
}
function stem(value:string){return clean(value.replace(/\.[^.]+$/,'').replace(/[._]+/g,' '));}
function unique<T>(values:T[]){return values.filter((value,index)=>values.indexOf(value)===index);}

function folderHints(uri?:string){
  if(!uri)return {titles:[] as string[],authors:[] as string[],series:[] as string[]};
  const decoded=decodeUri(uri).split('?')[0].replace(/^.*\/document\//,'').replace(/^primary:/,'');
  const parts=decoded.split(/[\\/]/).filter(Boolean).map(clean);
  if(!parts.length)return {titles:[],authors:[],series:[]};
  const file=stem(parts.pop()||'');
  const dirs=parts.filter(part=>!/^(?:books?|ebooks?|audiobooks?|comics?|pdfs?|library|libraries|media|downloads?|documents?)$/i.test(part));
  const titles:string[]=[];
  const authors:string[]=[];
  const series:string[]=[];
  const numbered=file.match(/^\s*\d+(?:\.\d+)?\s*[-._:]\s*(.+)$/);
  const dashed=file.split(/\s+-\s+/).map(clean).filter(Boolean);
  if(numbered)titles.push(numbered[1]); else if(file)titles.push(file);
  if(dashed.length>=2){
    titles.push(dashed[dashed.length-1]);
    if(dashed.length===2)authors.push(dashed[0]);
    if(dashed.length>=3){authors.push(dashed[0]);series.push(dashed[1]);}
  }
  const parent=dirs.at(-1)||'',grand=dirs.at(-2)||'',great=dirs.at(-3)||'';
  if(parent){
    const indexed=parent.match(/^\s*\d+(?:\.\d+)?\s*[-._:]\s*(.+)$/);
    if(indexed)titles.push(indexed[1]);
    else if(similarity(parent,file)<.95)series.push(parent);
  }
  if(grand)authors.push(grand);
  if(great)authors.push(great);
  return {titles:unique(titles.filter(useful)),authors:unique(authors.filter(useful)),series:unique(series.filter(useful))};
}

export function buildBookLookupHints(input:BookLookupInput){
  const path=folderHints(input.uri);
  return {
    isbn:normalizeIsbn(input.isbn),
    titles:unique([input.title,...path.titles].filter(useful).map(clean)),
    authors:unique([input.author,...path.authors].filter(useful).map(clean)),
    series:unique([input.series,...path.series].filter(useful).map(clean)),
    publishedYear:input.publishedYear,
  };
}

type QueryPlan={kind:'isbn'|'title-author'|'title';title?:string;author?:string;isbn?:string};
function queryPlans(input:BookLookupInput){
  const hints=buildBookLookupHints(input);
  const plans:QueryPlan[]=[];
  if(hints.isbn)plans.push({kind:'isbn',isbn:hints.isbn});
  for(const title of hints.titles.slice(0,3)){
    for(const author of hints.authors.slice(0,2))plans.push({kind:'title-author',title,author});
    plans.push({kind:'title',title});
  }
  const seen=new Set<string>();
  return plans.filter(plan=>{const key=JSON.stringify(plan);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,6);
}

function selectGenre(values:unknown){
  const subjects=Array.isArray(values)?values.map(clean).filter(Boolean):[];
  if(!subjects.length)return undefined;
  const preferred=['Science Fiction','Fantasy','Mystery','Thriller','Romance','History','Biography','Memoir','Horror','Crime','Adventure','Young Adult','Children','Classics','Philosophy','Science','Technology','Business','Travel','Poetry'];
  for(const label of preferred){
    const hit=subjects.find(subject=>normalize(subject).includes(normalize(label)));
    if(hit)return label;
  }
  return subjects.find(subject=>subject.length<=48&&!/accessible book|protected daisy|internet archive/i.test(subject));
}
function firstString(value:unknown){
  if(Array.isArray(value))return clean(value.find(item=>useful(item))||'')||undefined;
  return useful(value)?clean(value):undefined;
}
function descriptionValue(value:any){
  if(typeof value==='string')return clean(value)||undefined;
  if(value&&typeof value==='object'&&typeof value.value==='string')return clean(value.value)||undefined;
  return undefined;
}
function coverUrlOpenLibrary(doc:any){
  const id=Number(doc?.cover_i);
  return Number.isFinite(id)&&id>0?'https://covers.openlibrary.org/b/id/'+id+'-L.jpg?default=false':undefined;
}
function compact<T extends Record<string,any>>(fields:T):T{
  const out:any={};
  for(const [key,value] of Object.entries(fields))if(value!==undefined&&value!==null&&String(value).trim()!=='')out[key]=value;
  return out;
}
function openLibraryIdentifiers(doc:any){return unique((Array.isArray(doc?.isbn)?doc.isbn:[]).map(normalizeIsbn).filter(Boolean));}
function openLibraryFields(doc:any):OnlineBookFields{
  const isbns=openLibraryIdentifiers(doc);
  return compact({
    title:firstString(doc?.title),author:firstString(doc?.author_name),series:firstString(doc?.series),genre:selectGenre(doc?.subject),
    publishedYear:safeYear(doc?.first_publish_year)||safeYear(Array.isArray(doc?.publish_year)?doc.publish_year[0]:undefined),
    publisher:firstString(doc?.publisher),isbn:isbns.find((value:string)=>value.length===13)||isbns[0],language:firstString(doc?.language),description:firstString(doc?.first_sentence),
  });
}
function googleIdentifiers(item:any){return unique((Array.isArray(item?.volumeInfo?.industryIdentifiers)?item.volumeInfo.industryIdentifiers:[]).map((entry:any)=>normalizeIsbn(entry?.identifier)).filter(Boolean));}
function googleFields(item:any):OnlineBookFields{
  const info=item?.volumeInfo||{};
  const ids=googleIdentifiers(item);
  return compact({title:firstString(info.title),author:firstString(info.authors),genre:selectGenre(info.categories),publishedYear:safeYear(info.publishedDate),publisher:firstString(info.publisher),isbn:ids.find((value:string)=>value.length===13)||ids[0],language:firstString(info.language),description:firstString(info.description)});
}
function googleCover(item:any){
  const links=item?.volumeInfo?.imageLinks||{};
  const raw=links.extraLarge||links.large||links.medium||links.small||links.thumbnail||links.smallThumbnail;
  return raw?String(raw).replace(/^http:/,'https:'):undefined;
}

export function scoreOnlineBookCandidate(input:BookLookupInput,candidate:Omit<OnlineBookCandidate,'score'|'confidence'|'reasons'>){
  const hints=buildBookLookupHints(input);
  const reasons:string[]=[];
  let score=0;
  const candidateIsbn=normalizeIsbn(candidate.fields.isbn);
  const candidateIdentifiers=unique([candidateIsbn,...(candidate.identifiers||[]).map(normalizeIsbn)].filter(Boolean));
  let exactIdentifier=false;
  if(hints.isbn){
    if(candidateIdentifiers.includes(hints.isbn)){score+=72;exactIdentifier=true;reasons.push('ISBN match');}
    else if(candidateIdentifiers.length){score-=55;reasons.push('ISBN conflict');}
  }
  const titleScores=hints.titles.map(title=>similarity(title,candidate.fields.title));
  const titleScore=titleScores.length?Math.max(...titleScores):0;
  if(titleScore){score+=titleScore*50;if(titleScore>=.88)reasons.push('strong title match');}
  const authorScores=hints.authors.map(author=>authorSimilarity(author,candidate.fields.author));
  const authorScore=authorScores.length?Math.max(...authorScores):0;
  if(authorScore){score+=authorScore*32;if(authorScore>=.72)reasons.push('author match');}
  if(hints.series.length&&candidate.fields.series){
    const seriesScore=Math.max(...hints.series.map(series=>similarity(series,candidate.fields.series)));
    score+=seriesScore*10;if(seriesScore>=.8)reasons.push('series match');
  }
  if(hints.publishedYear&&candidate.fields.publishedYear){
    const delta=Math.abs(hints.publishedYear-candidate.fields.publishedYear);if(delta===0)score+=5;else if(delta<=2)score+=3;else if(delta>=10)score-=4;
  }
  if(!hints.isbn){if(titleScore<.38)score-=32;if(hints.authors.length&&authorScore<.25)score-=22;}
  if(candidate.coverUri)score+=2;
  score=Math.max(0,Math.min(100,Math.round(score)));
  const confidence:OnlineBookConfidence=exactIdentifier||score>=80?'high':score>=62?'medium':'low';
  return {...candidate,score,confidence,exactIdentifier,reasons};
}

function rankCandidates(input:BookLookupInput,candidates:Array<Omit<OnlineBookCandidate,'score'|'confidence'|'reasons'>>){
  const ranked=candidates.map(candidate=>scoreOnlineBookCandidate(input,candidate)).sort((a,b)=>b.score-a.score);
  const deduped:OnlineBookCandidate[]=[];const seen=new Set<string>();
  for(const candidate of ranked){
    const key=normalize(candidate.fields.title)+'|'+normalize(candidate.fields.author)+'|'+normalizeIsbn(candidate.fields.isbn);
    if(seen.has(key))continue;seen.add(key);deduped.push(candidate);
  }
  return deduped.slice(0,8);
}

async function fetchJson(fetcher:FetchLike,url:string,timeoutMs:number,init:any={}){
  const controller=typeof AbortController!=='undefined'?new AbortController():undefined;
  const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):undefined;
  try{
    const response=await fetcher(url,{...init,signal:controller?.signal});
    if(!response.ok)throw Object.assign(new Error('Metadata provider returned '+response.status),{status:response.status});
    return await response.json();
  }finally{if(timer)clearTimeout(timer);}
}
async function throttleOpenLibrary(){
  const wait=Math.max(0,1050-(Date.now()-lastOpenLibraryRequestAt));if(wait)await sleep(wait);lastOpenLibraryRequestAt=Date.now();
}
function openLibraryQuery(plan:QueryPlan){
  if(plan.kind==='isbn')return 'isbn:'+plan.isbn;
  return [plan.title?'title:"'+plan.title+'"':'',plan.author?'author:"'+plan.author+'"':''].filter(Boolean).join(' ');
}
async function searchOpenLibrary(fetcher:FetchLike,plan:QueryPlan,timeoutMs:number){
  await throttleOpenLibrary();
  const q=openLibraryQuery(plan);
  const url='https://openlibrary.org/search.json?'+new URLSearchParams({q,limit:'8',fields:'key,title,author_name,first_publish_year,publish_year,publisher,isbn,language,subject,cover_i,series,first_sentence'}).toString();
  const json=await fetchJson(fetcher,url,timeoutMs,{headers:{Accept:'application/json'}});
  const docs=Array.isArray(json?.docs)?json.docs:[];
  return docs.map((doc:any)=>({provider:'openlibrary' as const,providerId:clean(doc?.key)||clean(doc?.edition_key?.[0])||normalize(openLibraryFields(doc).title),fields:openLibraryFields(doc),coverUri:coverUrlOpenLibrary(doc),exactIdentifier:false,identifiers:openLibraryIdentifiers(doc),query:q}));
}
async function hydrateOpenLibrary(fetcher:FetchLike,candidate:OnlineBookCandidate,timeoutMs:number){
  if(candidate.provider!=='openlibrary'||!candidate.providerId.startsWith('/works/'))return candidate;
  if(candidate.fields.description&&candidate.fields.genre)return candidate;
  try{
    await throttleOpenLibrary();
    const json=await fetchJson(fetcher,'https://openlibrary.org'+candidate.providerId+'.json',timeoutMs,{headers:{Accept:'application/json'}});
    return {...candidate,fields:compact({...candidate.fields,description:candidate.fields.description||descriptionValue(json?.description),genre:candidate.fields.genre||selectGenre(json?.subjects)})};
  }catch{return candidate;}
}
function googleQuery(plan:QueryPlan){
  if(plan.kind==='isbn')return 'isbn:'+plan.isbn;
  return [plan.title?'intitle:'+plan.title:'',plan.author?'inauthor:'+plan.author:''].filter(Boolean).join(' ');
}
async function searchGoogleBooks(fetcher:FetchLike,plan:QueryPlan,apiKey:string,timeoutMs:number){
  const q=googleQuery(plan);
  const url='https://www.googleapis.com/books/v1/volumes?'+new URLSearchParams({q,maxResults:'8',printType:'books',projection:'full',key:apiKey}).toString();
  const json=await fetchJson(fetcher,url,timeoutMs,{headers:{Accept:'application/json'}});
  const items=Array.isArray(json?.items)?json.items:[];
  return items.map((item:any)=>({provider:'googlebooks' as const,providerId:clean(item?.id)||normalize(googleFields(item).title),fields:googleFields(item),coverUri:googleCover(item),exactIdentifier:false,identifiers:googleIdentifiers(item),query:q}));
}

export function onlineBookCacheKey(input:BookLookupInput){
  const hints=buildBookLookupHints(input);
  return [hints.isbn,normalize(hints.titles[0]),normalize(hints.authors[0]),normalize(hints.series[0]),input.format||''].join('|');
}

export function shouldLookupBookOnline(input:BookLookupInput){
  const format=String(input.format||'').toLowerCase();
  if(format&&format!=='epub'&&format!=='pdf')return false;
  const provenance=input.metadataProvenance||{};
  if(provenance.title==='manual'&&provenance.author==='manual'&&input.coverUri&&input.description&&input.genre)return false;
  if(!useful(input.title)&&!normalizeIsbn(input.isbn)&&!input.uri)return false;
  return !input.coverUri||!useful(input.author)||!input.genre||!input.description||!input.publisher||!input.publishedYear||!!normalizeIsbn(input.isbn);
}

export async function lookupOnlineBook(input:BookLookupInput,options:OnlineBookLookupOptions={}):Promise<OnlineBookLookupResult>{
  const now=options.now||Date.now;
  const key=onlineBookCacheKey(input);
  const cached=options.cache?.[key];
  if(cached&&cached.expiresAt>now())return cached.result;
  const fetcher=options.fetcher||(globalThis.fetch as unknown as FetchLike);
  if(typeof fetcher!=='function')return {key,status:'offline',candidates:[],autoApply:false,queried:[]};
  const timeoutMs=Math.max(2500,Math.min(20000,options.timeoutMs||8000));
  const plans=queryPlans(input);const queried:string[]=[];const raw:Array<Omit<OnlineBookCandidate,'score'|'confidence'|'reasons'>>=[];
  try{
    for(const plan of plans){
      const found=await searchOpenLibrary(fetcher,plan,timeoutMs);queried.push('openlibrary:'+openLibraryQuery(plan));raw.push(...found);
      const ranked=rankCandidates(input,raw);if(ranked[0]?.exactIdentifier||ranked[0]?.score>=88)break;if(raw.length>=18)break;
    }
    let ranked=rankCandidates(input,raw);
    if(options.googleBooksApiKey&&(!ranked[0]||ranked[0].confidence!=='high')){
      for(const plan of plans.slice(0,3)){
        try{const found=await searchGoogleBooks(fetcher,plan,options.googleBooksApiKey,timeoutMs);queried.push('googlebooks:'+googleQuery(plan));raw.push(...found);ranked=rankCandidates(input,raw);if(ranked[0]?.exactIdentifier||ranked[0]?.score>=88)break;}catch{}
      }
    }
    ranked=rankCandidates(input,raw);
    let best=ranked[0];if(best?.confidence==='high')best=await hydrateOpenLibrary(fetcher,best,timeoutMs);
    if(best){const idx=ranked.findIndex(item=>item.provider===best.provider&&item.providerId===best.providerId);if(idx>=0)ranked[idx]=best;}
    const second=ranked[1];const margin=best?best.score-(second?.score||0):0;
    const autoApply=!!best&&best.confidence==='high'&&(best.exactIdentifier||margin>=7);
    const status:OnlineBookLookupResult['status']=!best||best.confidence==='low'?'none':autoApply?'matched':'review';
    const result={key,status,best,candidates:ranked,autoApply,queried};
    if(options.cache)options.cache[key]={expiresAt:now()+(status==='none'?negativeTtl:positiveTtl),result};
    return result;
  }catch{return {key,status:'offline',candidates:[],autoApply:false,queried};}
}

function canReplaceField(book:BookLookupInput,field:keyof OnlineBookFields,candidate:OnlineBookCandidate){
  const current=(book as any)[field];
  if(current===undefined||current===null||String(current).trim()==='')return true;
  const source=book.metadataProvenance?.[field as string];
  if(source==='manual'||source==='embedded'||source==='sidecar')return false;
  if(candidate.exactIdentifier&&source==='path')return true;
  const confidence=book.metadataFieldConfidence?.[field as string];
  return candidate.confidence==='high'&&(confidence==='low'||confidence==='medium'||!confidence);
}

export function mergeOnlineBookCandidate<T extends BookLookupInput&{metadataProvenance?:Partial<Record<string,string>>;metadataFieldConfidence?:Partial<Record<string,OnlineBookConfidence>>;coverCandidates?:string[];needsReview?:boolean;reviewReason?:string}>(book:T,candidate:OnlineBookCandidate,autoApply=true):T{
  if(!autoApply)return {...book,needsReview:true,reviewReason:book.reviewReason||'Online metadata match needs review.'};
  const next:any={...book};const provenance={...(book.metadataProvenance||{})};const confidence={...(book.metadataFieldConfidence||{})};
  for(const field of Object.keys(candidate.fields) as Array<keyof OnlineBookFields>){
    const value=candidate.fields[field];if(value===undefined||value===null||String(value).trim()==='')continue;
    if(!canReplaceField(book,field,candidate))continue;
    next[field]=value;provenance[field as string]='online';confidence[field as string]=candidate.confidence;
  }
  next.metadataProvenance=provenance;next.metadataFieldConfidence=confidence;
  if(candidate.coverUri&&!book.coverUri){next.coverUri=candidate.coverUri;next.coverCandidates=unique([...(book.coverCandidates||[]),candidate.coverUri]);}
  next.needsReview=!useful(next.title)||!useful(next.author);next.reviewReason=next.needsReview?'Title or author still needs review.':'';
  return next as T;
}
