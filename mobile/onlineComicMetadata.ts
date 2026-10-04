export type OnlineComicConfidence='high'|'medium'|'low';

export type ComicCreator={name:string;roles:string[]};
export type ComicExternalIds={metron?:number;comicVine?:number;gcd?:number};

export type OnlineComicFields={
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
  comicIssueNumber?:string;
  comicVolume?:number;
  comicSeriesAliases?:string[];
  comicCreators?:ComicCreator[];
  comicStoryArcs?:string[];
  comicCharacters?:string[];
  comicTeams?:string[];
  comicUniverses?:string[];
  comicUpc?:string;
  comicSku?:string;
  comicExternalIds?:ComicExternalIds;
  comicStoreDate?:string;
  comicCoverDate?:string;
  comicPageCount?:number;
};

export type ComicLookupInput=OnlineComicFields&{
  uri?:string;
  format?:string;
  metadataProvenance?:Partial<Record<string,string>>;
  metadataFieldConfidence?:Partial<Record<string,OnlineComicConfidence>>;
  comicMetadataProvenance?:Partial<Record<string,string>>;
  coverUri?:string;
};

export type OnlineComicCandidate={
  provider:'metron';
  providerId:string;
  fields:OnlineComicFields;
  coverUri?:string;
  score:number;
  confidence:OnlineComicConfidence;
  exactIdentifier:boolean;
  exactIssue:boolean;
  seriesScore:number;
  reasons:string[];
  query:string;
};

export type OnlineComicLookupResult={
  key:string;
  status:'matched'|'review'|'none'|'unconfigured'|'offline'|'rate-limited';
  best?:OnlineComicCandidate;
  candidates:OnlineComicCandidate[];
  autoApply:boolean;
  queried:string[];
};

export type OnlineComicCacheEntry={expiresAt:number;result:OnlineComicLookupResult};
export type OnlineComicCache=Record<string,OnlineComicCacheEntry>;

type FetchHeaders={get?:(name:string)=>string|null};
type FetchResponse={ok:boolean;status:number;headers?:FetchHeaders;json:()=>Promise<any>};
type FetchLike=(url:string,init?:any)=>Promise<FetchResponse>;

export type OnlineComicLookupOptions={
  token?:string;
  fetcher?:FetchLike;
  cache?:OnlineComicCache;
  now?:()=>number;
  timeoutMs?:number;
};

const positiveTtl=30*24*60*60*1000;
const negativeTtl=24*60*60*1000;

function clean(value:unknown){
  return String(value??'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
}
function normalize(value:unknown){
  return clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function tokens(value:unknown){
  return new Set(normalize(value).split(' ').filter(token=>token.length>1&&!['the','and','of','a','an','comic','comics'].includes(token)));
}
function similarity(a:unknown,b:unknown){
  const na=normalize(a),nb=normalize(b);
  if(!na||!nb)return 0;
  if(na===nb)return 1;
  const aa=tokens(na),bb=tokens(nb);
  if(!aa.size||!bb.size)return 0;
  let common=0;for(const token of aa)if(bb.has(token))common++;
  return Math.min(1,(2*common)/(aa.size+bb.size)+((na.includes(nb)||nb.includes(na))?.1:0));
}
function unique<T>(values:T[]){return values.filter((value,index)=>values.indexOf(value)===index);}
function safeNumber(value:unknown){
  const number=Number(String(value??'').trim());
  return Number.isFinite(number)?number:undefined;
}
function safeYear(value:unknown){
  const match=String(value??'').match(/(?:18|19|20)\d{2}/);
  if(!match)return undefined;
  const year=Number(match[0]);return year>=1800&&year<=2100?year:undefined;
}
export function normalizeComicIssueNumber(value:unknown){
  let raw=clean(value).replace(/^#\s*/,'').replace(/\s+/g,'').toUpperCase();
  if(!raw)return '';
  if(/^-?0*\d+(?:\.0+)?$/.test(raw))return String(Number(raw));
  raw=raw.replace(/^(-?)0+(?=\d)/,'$1');
  raw=raw.replace(/^(ANNUAL)0+(?=\d)/,'$1');
  return raw;
}
function numericIssue(value:unknown){
  const normalized=normalizeComicIssueNumber(value);
  if(!/^\d+(?:\.\d+)?$/.test(normalized))return undefined;
  const number=Number(normalized);return Number.isFinite(number)?number:undefined;
}
function nameOf(value:any){
  return clean(value?.name??value?.series??value?.title??value??'')||undefined;
}
function listNames(value:any):string[]|undefined{
  if(!Array.isArray(value))return undefined;
  const names=value.map(item=>nameOf(item)).filter((item):item is string=>!!item);
  return names.length?unique(names):undefined;
}
function compact<T extends Record<string,any>>(fields:T):T{
  const out:any={};
  for(const [key,value] of Object.entries(fields)){
    if(value===undefined||value===null)continue;
    if(Array.isArray(value)&&!value.length)continue;
    if(typeof value==='string'&&!value.trim())continue;
    out[key]=value;
  }
  return out;
}
function decodeUri(value:string){try{return decodeURIComponent(value);}catch{return value;}}
function stripExtension(value:string){return value.replace(/\.[^.]+$/,'');}
function cleanComicStem(value:string){
  return clean(value)
    .replace(/\[(?:digital|retail|scan|web|hq|fixed|empire|webrip)[^\]]*\]/ig,' ')
    .replace(/\((?:digital|retail|scan|web|hq|fixed)[^)]*\)/ig,' ')
    .replace(/\s+/g,' ').trim();
}
function folderParts(uri?:string){
  if(!uri)return [] as string[];
  const decoded=decodeUri(uri).split('?')[0].replace(/^.*\/document\//,'').replace(/^primary:/,'');
  return decoded.split(/[\\/]/).filter(Boolean).map(clean);
}
function parseSeriesFolder(value:string){
  const year=safeYear(value);
  const volumeMatch=value.match(/\b(?:v|vol(?:ume)?\.?)[\s._-]*(\d{1,3})\b/i);
  let series=clean(value).replace(/\((?:18|19|20)\d{2}\)/g,' ').replace(/\b(?:v|vol(?:ume)?\.?)[\s._-]*\d{1,3}\b/ig,' ').replace(/\s+/g,' ').trim();
  return {series,year,volume:volumeMatch?safeNumber(volumeMatch[1]):undefined};
}
function parseStem(value:string){
  const raw=cleanComicStem(stripExtension(value));
  const year=safeYear(raw);
  const volumeMatch=raw.match(/\b(?:v|vol(?:ume)?\.?)[\s._-]*(\d{1,3})\b/i);
  let issue='';
  const hash=raw.match(/#\s*([0-9]+(?:\.[0-9]+)?[A-Za-z]?|[A-Za-z]+\d*)\b/i);
  const named=raw.match(/\b(?:issue|no\.?|number)\s*#?\s*([0-9]+(?:\.[0-9]+)?[A-Za-z]?|[A-Za-z]+\d*)\b/i);
  const dashed=raw.split(/\s+-\s+/).map(clean).filter(Boolean);
  let series='';
  let title='';
  if(hash){
    issue=normalizeComicIssueNumber(hash[1]);
    series=clean(raw.slice(0,hash.index)).replace(/\((?:18|19|20)\d{2}\)/g,' ').replace(/\b(?:v|vol(?:ume)?\.?)[\s._-]*\d{1,3}\b/ig,' ').trim();
    title=clean(raw.slice((hash.index||0)+hash[0].length)).replace(/^[-:]+/,'').trim();
  }else if(named){
    issue=normalizeComicIssueNumber(named[1]);
    series=clean(raw.slice(0,named.index)).replace(/\((?:18|19|20)\d{2}\)/g,' ').replace(/\b(?:v|vol(?:ume)?\.?)[\s._-]*\d{1,3}\b/ig,' ').trim();
    title=clean(raw.slice((named.index||0)+named[0].length)).replace(/^[-:]+/,'').trim();
  }else{
    const seriesIssueTitle=raw.match(/^(.*?)\s+(#?(?:-?\d+(?:\.\d+)?(?:[A-Za-z]+)?(?:\/\d+)?|ANNUAL\s*\d+))\s*[-:]\s*(.+)$/i);
    if(seriesIssueTitle&&clean(seriesIssueTitle[1])){
      series=clean(seriesIssueTitle[1]).replace(/\((?:18|19|20)\d{2}\)/g,' ').replace(/\b(?:v|vol(?:ume)?\.?)[\s._-]*\d{1,3}\b/ig,' ').trim();
      issue=normalizeComicIssueNumber(seriesIssueTitle[2]);
      title=clean(seriesIssueTitle[3]);
      return {series:clean(series),issue,title:clean(title),year,volume:volumeMatch?safeNumber(volumeMatch[1]):undefined};
    }
    const issueIndex=dashed.findIndex(part=>/^#?(?:-?0*\d+(?:\.\d+)?(?:[A-Za-z]+)?(?:\/\d+)?|ANNUAL\s*\d+)$/i.test(part));
    if(issueIndex>=0){
      issue=normalizeComicIssueNumber(dashed[issueIndex]);
      series=dashed.slice(0,issueIndex).join(' - ');
      title=dashed.slice(issueIndex+1).join(' - ');
    }else if(/^#?(?:-?0*\d+(?:\.\d+)?(?:[A-Za-z]+)?(?:\/\d+)?|ANNUAL\s*\d+)$/i.test(raw)){
      issue=normalizeComicIssueNumber(raw);
    }else{
      const withoutYear=raw.replace(/\((?:18|19|20)\d{2}\)/g,' ').replace(/\b(?:v|vol(?:ume)?\.?)[\s._-]*\d{1,3}\b/ig,' ').trim();
      const trailing=withoutYear.match(/^(.*?)\s+[._-]?\s*((?:-?0*\d{1,4}(?:\.\d+)?(?:[A-Za-z]+)?(?:\/\d+)?)|(?:ANNUAL\s*\d+))$/i);
      if(trailing&&clean(trailing[1])){
        series=clean(trailing[1]);issue=normalizeComicIssueNumber(trailing[2]);
      }
    }
  }
  return {series:clean(series),issue,title:clean(title),year,volume:volumeMatch?safeNumber(volumeMatch[1]):undefined};
}

export function buildComicLookupHints(input:ComicLookupInput){
  const parts=folderParts(input.uri);
  const filename=parts.at(-1)||'';
  const parsed=parseStem(filename);
  const parent=parseSeriesFolder(parts.at(-2)||'');
  const series=unique([input.series,parsed.series,parent.series].map(clean).filter(Boolean));
  const issueNumbers=unique([
    input.comicIssueNumber,
    input.seriesNumber===undefined?'':String(input.seriesNumber),
    parsed.issue,
  ].map(normalizeComicIssueNumber).filter(Boolean));
  const volumes=unique([input.comicVolume,parsed.volume,parent.volume].filter((value):value is number=>typeof value==='number'&&Number.isFinite(value)));
  const years=unique([input.publishedYear,parsed.year,parent.year].filter((value):value is number=>typeof value==='number'&&Number.isFinite(value)));
  return {
    series,
    issueNumbers,
    volumes,
    years,
    publisher:clean(input.publisher),
    upc:clean(input.comicUpc).replace(/\s+/g,''),
    sku:clean(input.comicSku),
    externalIds:input.comicExternalIds||{},
    title:clean(input.title||parsed.title),
  };
}

type QueryPlan={kind:'metron'|'external'|'upc'|'sku'|'series-issue'|'series';params:Record<string,string>;id?:string};
function queryPlans(input:ComicLookupInput){
  const hints=buildComicLookupHints(input);
  const plans:QueryPlan[]=[];
  if(hints.externalIds.metron)plans.push({kind:'metron',params:{},id:String(hints.externalIds.metron)});
  if(hints.externalIds.comicVine)plans.push({kind:'external',params:{cv_id:String(hints.externalIds.comicVine)}});
  if(hints.externalIds.gcd)plans.push({kind:'external',params:{gcd_id:String(hints.externalIds.gcd)}});
  if(hints.upc)plans.push({kind:'upc',params:hints.upc.length===12?{upc_starts_with:hints.upc}:{upc:hints.upc}});
  if(hints.sku)plans.push({kind:'sku',params:{sku:hints.sku}});
  for(const series of hints.series.slice(0,3)){
    for(const issue of hints.issueNumbers.slice(0,2)){
      const params:Record<string,string>={series_q:series,number:issue};
      if(hints.volumes[0]!==undefined)params.series_volume=String(hints.volumes[0]);
      if(hints.years[0]!==undefined)params.cover_year=String(hints.years[0]);
      if(hints.publisher)params.publisher_name=hints.publisher;
      plans.push({kind:'series-issue',params});
    }
    if(!hints.issueNumbers.length)plans.push({kind:'series',params:{series_q:series}});
  }
  const seen=new Set<string>();
  return plans.filter(plan=>{const key=plan.kind+':'+(plan.id||'')+':'+JSON.stringify(plan.params);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,8);
}

function creatorCredits(value:any):ComicCreator[]|undefined{
  if(!Array.isArray(value))return undefined;
  const byName=new Map<string,ComicCreator>();
  for(const credit of value){
    const name=nameOf(credit?.creator??credit?.name);
    if(!name)continue;
    const rawRoles=credit?.roles??credit?.role??[];
    const roles=(Array.isArray(rawRoles)?rawRoles:[rawRoles]).map((role:any)=>nameOf(role)).filter((role):role is string=>!!role);
    const key=name.toLowerCase();
    const current=byName.get(key)||{name,roles:[]};
    for(const role of roles)if(!current.roles.includes(role))current.roles.push(role);
    byName.set(key,current);
  }
  return byName.size?[...byName.values()]:undefined;
}
function primaryWriter(creators?:ComicCreator[]){
  if(!creators?.length)return undefined;
  const writers=creators.filter(creator=>creator.roles.some(role=>/writer|script|story/i.test(role))).map(creator=>creator.name);
  return writers.length?writers.join(' & '):undefined;
}
function issueSeries(item:any){
  return item?.series||{};
}
function externalIds(item:any):ComicExternalIds|undefined{
  const metron=safeNumber(item?.id),comicVine=safeNumber(item?.cv_id),gcd=safeNumber(item?.gcd_id);
  return metron||comicVine||gcd?compact({metron,comicVine,gcd}):undefined;
}
function issueFields(item:any,detail=false):OnlineComicFields{
  const series=issueSeries(item);
  const issueNumber=normalizeComicIssueNumber(item?.number??item?.issue_number);
  const creators=creatorCredits(item?.credits);
  const explicitTitle=clean(item?.title??item?.name);
  const seriesName=nameOf(series);
  const displayTitle=explicitTitle||(seriesName&&issueNumber?seriesName+' #'+issueNumber:undefined);
  const genres=listNames(series?.genres??item?.genres);
  const publisher=nameOf(series?.publisher??item?.publisher);
  const coverDate=clean(item?.cover_date);
  const storeDate=clean(item?.store_date);
  return compact({
    title:displayTitle,
    author:primaryWriter(creators),
    series:seriesName,
    seriesNumber:numericIssue(issueNumber),
    genre:genres?.[0],
    publishedYear:safeYear(coverDate||storeDate),
    publisher,
    isbn:clean(item?.isbn)||undefined,
    language:clean(series?.language??item?.language)||undefined,
    description:clean(item?.desc??item?.description)||undefined,
    comicIssueNumber:issueNumber||undefined,
    comicVolume:safeNumber(series?.volume??item?.volume),
    comicSeriesAliases:listNames(series?.alt_names) || (Array.isArray(series?.alt_names)?series.alt_names.map((value:any)=>clean(value)).filter(Boolean):undefined),
    comicCreators:creators,
    comicStoryArcs:listNames(item?.arcs),
    comicCharacters:listNames(item?.characters),
    comicTeams:listNames(item?.teams),
    comicUniverses:listNames(item?.universes),
    comicUpc:clean(item?.upc)||undefined,
    comicSku:clean(item?.sku)||undefined,
    comicExternalIds:externalIds(item),
    comicStoreDate:storeDate||undefined,
    comicCoverDate:coverDate||undefined,
    comicPageCount:safeNumber(item?.page_count),
  });
}
function rawCandidate(item:any,query:string):Omit<OnlineComicCandidate,'score'|'confidence'|'exactIdentifier'|'exactIssue'|'seriesScore'|'reasons'>{
  return {
    provider:'metron',
    providerId:String(item?.id??''),
    fields:issueFields(item),
    coverUri:clean(item?.image)||undefined,
    query,
  };
}

function sameExternal(input?:ComicExternalIds,candidate?:ComicExternalIds){
  if(!input||!candidate)return false;
  if(input.metron&&candidate.metron&&input.metron===candidate.metron)return true;
  if(input.comicVine&&candidate.comicVine&&input.comicVine===candidate.comicVine)return true;
  if(input.gcd&&candidate.gcd&&input.gcd===candidate.gcd)return true;
  return false;
}

export function scoreOnlineComicCandidate(input:ComicLookupInput,candidate:Omit<OnlineComicCandidate,'score'|'confidence'|'exactIdentifier'|'exactIssue'|'seriesScore'|'reasons'>){
  const hints=buildComicLookupHints(input);
  const reasons:string[]=[];
  let score=0;
  let exactIdentifier=sameExternal(hints.externalIds,candidate.fields.comicExternalIds);
  if(exactIdentifier){score+=85;reasons.push('external ID match');}
  if(hints.upc&&candidate.fields.comicUpc){
    if(hints.upc===candidate.fields.comicUpc){score+=82;exactIdentifier=true;reasons.push('UPC match');}
    else score-=60;
  }
  if(hints.sku&&candidate.fields.comicSku){
    if(normalize(hints.sku)===normalize(candidate.fields.comicSku)){score+=75;exactIdentifier=true;reasons.push('SKU match');}
    else score-=40;
  }
  const candidateSeries=[candidate.fields.series,...(candidate.fields.comicSeriesAliases||[])].filter(Boolean);
  const seriesScore=hints.series.length&&candidateSeries.length?Math.max(...hints.series.flatMap(series=>candidateSeries.map(candidateSeriesName=>similarity(series,candidateSeriesName)))):0;
  if(seriesScore){score+=seriesScore*48;if(seriesScore>=.88)reasons.push('strong series match');}
  const candidateIssue=normalizeComicIssueNumber(candidate.fields.comicIssueNumber);
  const exactIssue=!!candidateIssue&&hints.issueNumbers.includes(candidateIssue);
  if(hints.issueNumbers.length){
    if(exactIssue){score+=38;reasons.push('issue number match');}
    else if(candidateIssue)score-=55;
    else score-=30;
  }
  if(hints.volumes.length&&candidate.fields.comicVolume!==undefined){
    if(hints.volumes.includes(candidate.fields.comicVolume)){score+=8;reasons.push('volume match');}
    else score-=8;
  }
  if(hints.years.length&&candidate.fields.publishedYear){
    const delta=Math.min(...hints.years.map(year=>Math.abs(year-candidate.fields.publishedYear!)));
    if(delta===0){score+=7;reasons.push('year match');}else if(delta===1)score+=4;else if(delta>=5)score-=6;
  }
  if(hints.publisher&&candidate.fields.publisher){
    const publisherScore=similarity(hints.publisher,candidate.fields.publisher);
    score+=publisherScore*5;
  }
  if(!exactIdentifier&&seriesScore<.4)score-=45;
  if(candidate.coverUri)score+=1;
  score=Math.max(0,Math.min(100,Math.round(score)));
  const confidence:OnlineComicConfidence=exactIdentifier||score>=82?'high':score>=64?'medium':'low';
  return {...candidate,score,confidence,exactIdentifier,exactIssue,seriesScore,reasons};
}

function rankCandidates(input:ComicLookupInput,raw:Array<Omit<OnlineComicCandidate,'score'|'confidence'|'exactIdentifier'|'exactIssue'|'seriesScore'|'reasons'>>){
  const ranked=raw.map(candidate=>scoreOnlineComicCandidate(input,candidate)).sort((a,b)=>b.score-a.score);
  const seen=new Set<string>();const out:OnlineComicCandidate[]=[];
  for(const candidate of ranked){
    const key=candidate.providerId||normalize(candidate.fields.series)+'|'+normalizeComicIssueNumber(candidate.fields.comicIssueNumber);
    if(seen.has(key))continue;seen.add(key);out.push(candidate);
  }
  return out.slice(0,10);
}

async function fetchJson(fetcher:FetchLike,url:string,token:string,timeoutMs:number){
  const controller=typeof AbortController!=='undefined'?new AbortController():undefined;
  const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):undefined;
  try{
    const response=await fetcher(url,{headers:{Accept:'application/json',Authorization:'Bearer '+token,'User-Agent':'Archivist/0.9.4 (+https://github.com/russellstokes-ai/Archivist)'},signal:controller?.signal});
    if(response.status===429){
      const error:any=new Error('Metron rate limit reached');error.code='rate-limited';throw error;
    }
    if(!response.ok)throw new Error('Metron returned '+response.status);
    return await response.json();
  }finally{if(timer)clearTimeout(timer);}
}
function queryLabel(plan:QueryPlan){return new URLSearchParams(plan.params).toString();}
async function searchMetron(fetcher:FetchLike,plan:QueryPlan,token:string,timeoutMs:number){
  const query=queryLabel(plan);
  if(plan.kind==='metron'&&plan.id){
    const detail=await fetchJson(fetcher,'https://metron.cloud/api/issue/'+encodeURIComponent(plan.id)+'/',token,timeoutMs);
    return [rawCandidate(detail,'id='+plan.id)];
  }
  const json=await fetchJson(fetcher,'https://metron.cloud/api/issue/?'+query,token,timeoutMs);
  const results=Array.isArray(json?.results)?json.results:Array.isArray(json)?json:[];
  return results.slice(0,25).map((item:any)=>rawCandidate(item,query));
}
async function hydrateCandidate(fetcher:FetchLike,input:ComicLookupInput,candidate:OnlineComicCandidate,token:string,timeoutMs:number){
  if(!candidate.providerId)return candidate;
  try{
    const detail=await fetchJson(fetcher,'https://metron.cloud/api/issue/'+encodeURIComponent(candidate.providerId)+'/',token,timeoutMs);
    const raw=rawCandidate(detail,candidate.query);
    return scoreOnlineComicCandidate(input,raw);
  }catch(error:any){
    if(error?.code==='rate-limited')throw error;
    return candidate;
  }
}

export function onlineComicCacheKey(input:ComicLookupInput){
  const hints=buildComicLookupHints(input);
  return [
    hints.externalIds.metron||'',hints.externalIds.comicVine||'',hints.externalIds.gcd||'',hints.upc,hints.sku,
    normalize(hints.series[0]),hints.issueNumbers[0]||'',hints.volumes[0]??'',hints.years[0]??'',
  ].join('|');
}
export function shouldLookupComicOnline(input:ComicLookupInput){
  if(String(input.format||'').toLowerCase()!=='comic')return false;
  const provenance=input.comicMetadataProvenance||{};
  const complete=!!input.series&&!!input.comicIssueNumber&&!!input.publisher&&!!input.description&&!!input.coverUri&&!!input.comicCreators?.length;
  if(complete&&provenance.comicIssueNumber==='manual'&&provenance.comicVolume==='manual')return false;
  return true;
}

export async function lookupOnlineComic(input:ComicLookupInput,options:OnlineComicLookupOptions={}):Promise<OnlineComicLookupResult>{
  const token=clean(options.token);
  const key=onlineComicCacheKey(input);
  if(!token)return {key,status:'unconfigured',candidates:[],autoApply:false,queried:[]};
  const now=options.now||Date.now;
  const cached=options.cache?.[key];
  if(cached&&cached.expiresAt>now())return cached.result;
  const fetcher=options.fetcher||(globalThis.fetch as unknown as FetchLike);
  if(typeof fetcher!=='function')return {key,status:'offline',candidates:[],autoApply:false,queried:[]};
  const timeoutMs=Math.max(2500,Math.min(20000,options.timeoutMs||8000));
  const plans=queryPlans(input);const queried:string[]=[];const raw:Array<Omit<OnlineComicCandidate,'score'|'confidence'|'exactIdentifier'|'exactIssue'|'seriesScore'|'reasons'>>=[];
  try{
    for(const plan of plans){
      const found=await searchMetron(fetcher,plan,token,timeoutMs);
      queried.push(queryLabel(plan));raw.push(...found);
      const ranked=rankCandidates(input,raw);
      if(ranked[0]?.exactIdentifier||(ranked[0]?.exactIssue&&ranked[0]?.seriesScore>=.88&&ranked[0]?.score>=88))break;
    }
    let ranked=rankCandidates(input,raw);
    const hydrate=ranked.slice(0,2).filter(candidate=>candidate.score>=(ranked[0]?.score||0)-12&&(!candidate.fields.description||!candidate.fields.comicCreators?.length));
    if(hydrate.length){
      const detailed:typeof raw=[];
      for(const candidate of hydrate){
        const hydrated=await hydrateCandidate(fetcher,input,candidate,token,timeoutMs);
        detailed.push({provider:'metron',providerId:hydrated.providerId,fields:hydrated.fields,coverUri:hydrated.coverUri||candidate.coverUri,query:hydrated.query});
      }
      const hydratedIds=new Set(detailed.map(item=>item.providerId));
      ranked=rankCandidates(input,[...detailed,...raw.filter(item=>!hydratedIds.has(item.providerId))]);
    }
    const best=ranked[0],second=ranked[1];
    const margin=best?best.score-(second?.score||0):0;
    const autoApply=!!best&&best.confidence==='high'&&(best.exactIdentifier||(best.exactIssue&&best.seriesScore>=.88&&margin>=6));
    const status:OnlineComicLookupResult['status']=!best||best.confidence==='low'?'none':autoApply?'matched':'review';
    const result={key,status,best,candidates:ranked,autoApply,queried};
    if(options.cache)options.cache[key]={expiresAt:now()+(status==='none'?negativeTtl:positiveTtl),result};
    return result;
  }catch(error:any){
    return {key,status:error?.code==='rate-limited'?'rate-limited':'offline',candidates:[],autoApply:false,queried};
  }
}

function canReplaceCommon(book:ComicLookupInput,field:keyof OnlineComicFields,candidate:OnlineComicCandidate){
  const current=(book as any)[field];
  if(current===undefined||current===null||String(current).trim()==='')return true;
  const source=book.metadataProvenance?.[field as string];
  if(source==='manual'||source==='embedded'||source==='sidecar')return false;
  if(candidate.exactIdentifier&&(source==='path'||!source))return true;
  const confidence=book.metadataFieldConfidence?.[field as string];
  return candidate.confidence==='high'&&(source==='path'||source==='online'||confidence==='low'||confidence==='medium'||!confidence);
}
const comicSpecificFields:Array<keyof OnlineComicFields>=[
  'comicIssueNumber','comicVolume','comicSeriesAliases','comicCreators','comicStoryArcs','comicCharacters','comicTeams','comicUniverses',
  'comicUpc','comicSku','comicExternalIds','comicStoreDate','comicCoverDate','comicPageCount',
];
const commonFields:Array<keyof OnlineComicFields>=['title','author','series','seriesNumber','genre','publishedYear','publisher','isbn','language','description'];

export function mergeOnlineComicCandidate<T extends ComicLookupInput&{
  comicMetadataProvenance?:Partial<Record<string,string>>;
  coverCandidates?:string[];
  needsReview?:boolean;
  reviewReason?:string;
  identificationConfidence?:OnlineComicConfidence;
  metadataSource?:string;
}>(book:T,candidate:OnlineComicCandidate,autoApply=true):T{
  if(!autoApply)return {...book,needsReview:true,reviewReason:book.reviewReason||'Online comic metadata match needs review.'};
  const next:any={...book};
  const provenance={...(book.metadataProvenance||{})};
  const confidence={...(book.metadataFieldConfidence||{})};
  for(const field of commonFields){
    const value=candidate.fields[field];
    if(value===undefined||value===null||(typeof value==='string'&&!value.trim()))continue;
    if(!canReplaceCommon(book,field,candidate))continue;
    next[field]=value;provenance[field as string]='online';confidence[field as string]=candidate.confidence;
  }
  const comicProvenance={...(book.comicMetadataProvenance||{})};
  for(const field of comicSpecificFields){
    const value=candidate.fields[field];
    if(value===undefined||value===null||(Array.isArray(value)&&!value.length)||(typeof value==='string'&&!value.trim()))continue;
    const current=(book as any)[field];
    const source=comicProvenance[field as string];
    const protectedLocal=source==='manual'||source==='embedded'||source==='sidecar';
    if(current!==undefined&&current!==null&&String(current).trim()!==''&&protectedLocal)continue;
    if(current!==undefined&&current!==null&&String(current).trim()!==''&&!candidate.exactIdentifier&&candidate.confidence!=='high')continue;
    next[field]=value;comicProvenance[field as string]='online';
  }
  next.metadataProvenance=provenance;next.metadataFieldConfidence=confidence;next.comicMetadataProvenance=comicProvenance;
  if(candidate.coverUri){
    const covers=unique([...(book.coverCandidates||[]),candidate.coverUri]);
    next.coverCandidates=covers;if(!book.coverUri)next.coverUri=candidate.coverUri;
  }
  const identified=!!next.series&&!!next.comicIssueNumber;
  next.needsReview=!identified;
  next.reviewReason=identified?'':'Series or issue number still needs review.';
  next.identificationConfidence=identified?'high':book.identificationConfidence;
  if(provenance.title==='online'||provenance.series==='online'||provenance.author==='online')next.metadataSource='online';
  return next as T;
}
