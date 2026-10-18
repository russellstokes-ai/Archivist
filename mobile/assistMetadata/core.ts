/** Catalogue metadata only. No inference model or generated bibliographic facts. */
import type {Candidate,SearchFields,RankedCandidate} from '../scannerVNext/search';
import type {MetadataWork,WorkFields} from '../scannerVNext/fieldEvidence';
export type SearchClues={text:string;title?:string;author?:string;isbn?:string;asin?:string;series?:string;annualLabel?:string};
export const canonicalText=(value:unknown)=>String(value??'').normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]/gu,'');
const clean=(value:unknown)=>String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const annualLabel=(value:string)=>(value.match(/\b((?:18|19|20)\d{2})\s+annual\b/i)||value.match(/\bannual\s+((?:18|19|20)\d{2})\b/i))?.[1];
const identifier=(value:unknown)=>clean(value).replace(/[-\s]/g,'').toUpperCase();
function validISBN(value:string){
 if(/^\d{13}$/.test(value))return [...value].reduce((sum,c,i)=>sum+Number(c)*(i%2?3:1),0)%10===0;
 if(/^\d{9}[\dX]$/.test(value))return [...value].reduce((sum,c,i)=>sum+(c==='X'?10:Number(c))*(10-i),0)%11===0;
 return false;
}
export function parseSearchClues(raw:string):SearchClues{
 if(typeof raw!=='string'||raw.length>512)throw Error('Search clues must be at most 512 characters.');
 if(/[\r\n]|(?:content|file):\/\/|[a-z]:[\\/]/i.test(raw))throw Error('Use bibliographic clues, not file paths.');
 const text=clean(raw),out:SearchClues={text};if(!text)return out;
 const isbn=identifier(text.replace(/^ISBN(?:-1[03])?\s*:?\s*/i,''));
 if(validISBN(isbn)){out.isbn=isbn;return out;}
 const asin=identifier(text.replace(/^ASIN\s*:?\s*/i,''));
 if(/^B[0-9A-Z]{9}$/.test(asin)){out.asin=asin;return out;}
 const by=text.match(/^(.{2,}?)\s+by\s+(.{2,})$/i);
 if(by){out.title=by[1].trim();out.author=by[2].trim();}else out.title=text;
 const annual=text.match(/\b((?:18|19|20)\d{2})\s+annual\b/i)||text.match(/\bannual\s+((?:18|19|20)\d{2})\b/i);
 if(annual){out.annualLabel=annual[1];out.series=clean(text.replace(new RegExp('\\b'+annual[1]+'\\b'),'').replace(/\bannual\b/i,'')+' Annual');}
 return out;
}
export function clueQueries(raw:string):string[]{
 const c=parseSearchClues(raw);if(!c.text)return [];
 const variants=[c.text];
 if(c.annualLabel&&c.series)variants.push(c.series+' '+c.annualLabel);
 const from=c.text.match(/\bfrom\s+.{5,}$/i);if(from&&from[0]!==c.text)variants.push(from[0]);
 variants.push(c.title||c.text);
 return [...new Set(variants.map(clean))].filter(Boolean).slice(0,3);
}
const words=(s:unknown)=>new Set(clean(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu,' ').split(' ').filter(x=>x.length>1));
function overlap(a:unknown,b:unknown){const left=words(a),right=words(b);if(!left.size||!right.size)return 0;let n=0;for(const x of left)if(right.has(x))n++;return n/Math.max(left.size,right.size);}
function equalTitle(a?:string,b?:string){return !!a&&!!b&&canonicalText(a)===canonicalText(b);}
function ids(c:Candidate){return [...new Set([...c.identifiers,c.fields.isbn,c.fields.asin].filter((x):x is string=>!!x).map(identifier))];}
export function rankAssistCandidates(fields:WorkFields,candidates:Candidate[]):RankedCandidate[]{
 return candidates.map(candidate=>{
  const title=equalTitle(fields.title,candidate.fields.title),author=!!fields.author&&canonicalText(fields.author)===canonicalText(candidate.fields.author);
  const own=[fields.isbn,fields.asin].filter((x):x is string=>!!x).map(identifier),other=ids(candidate),exactId=own.some(x=>other.includes(x));
  const conflicts:string[]=[];
  const requestedAnnual=annualLabel(fields.title||'');
  const returnedAnnual=annualLabel(candidate.fields.title||'');
  if(requestedAnnual&&returnedAnnual&&requestedAnnual!==returnedAnnual)conflicts.push('annual-label');
  if(fields.author&&candidate.fields.author&&!author)conflicts.push('author');
  if(own.length&&other.length&&!exactId)conflicts.push('identifier');
  for(const field of ['isbn','asin'] as const){
   if(fields[field]&&candidate.fields[field]&&identifier(fields[field])!==identifier(candidate.fields[field])&&!conflicts.includes('identifier'))conflicts.push('identifier');
  }
  for(const field of ['series','language','publishedYear','narrator'] as const){
   const incoming=(candidate.fields as WorkFields)[field];
   if(fields[field]&&incoming&&canonicalText(fields[field])!==canonicalText(incoming))conflicts.push(field);
  }
  if(fields.seriesNumber&&candidate.fields.seriesNumber&&canonicalText(fields.seriesNumber)!==canonicalText(candidate.fields.seriesNumber))conflicts.push('series-number');
  if(candidate.anthology)conflicts.push('anthology');
  if(exactId&&fields.title&&candidate.fields.title&&!title&&overlap(fields.title,candidate.fields.title)<.45)conflicts.push('title');
  const clue=overlap(fields.title,[candidate.fields.title,candidate.fields.author,candidate.fields.series].filter(Boolean).join(' '));
  const score=(exactId?1000:0)+(title?100:Math.round(clue*70))+(author?40:0)-(conflicts.length*150);
  return {candidate,score,conflicts,automaticEligible:!candidate.relatedMatch&&!conflicts.length&&(exactId||title&&author)};
 }).sort((a,b)=>b.score-a.score||a.candidate.id.localeCompare(b.candidate.id));
}
export function selectAutomatic(work:Pick<MetadataWork,'fields'>,candidates:Candidate[]):Candidate|null{
 const eligible=rankAssistCandidates(work.fields,candidates).filter(x=>x.automaticEligible);
 if(!eligible.length)return null;const best=eligible[0].candidate;
 const reference=ids(best);
 for(const {candidate}of eligible.slice(1)){
  if(candidate.provider===best.provider&&candidate.id===best.id)continue;
  const other=ids(candidate);
  if(reference.length&&other.length&&!other.some(x=>reference.includes(x)))return null;
  if(!equalTitle(best.fields.title,candidate.fields.title)||canonicalText(best.fields.author)!==canonicalText(candidate.fields.author))return null;
  for(const field of ['series','seriesNumber','language','publishedYear','narrator','isbn','asin'] as const){
   const a=(best.fields as Record<string,string|undefined>)[field],b=(candidate.fields as Record<string,string|undefined>)[field];
   if(a&&b&&canonicalText(a)!==canonicalText(b))return null;
  }
 }
 const merged={...best.fields};
 for(const field of ['genre','publishedYear','description','publisher','narrator','language','coverUrl'] as const){
  if((merged as Record<string,string|undefined>)[field])continue;
  const values=new Set(eligible.map(x=>(x.candidate.fields as Record<string,string|undefined>)[field]).filter((x):x is string=>!!x));
  if(values.size===1)(merged as Record<string,string|undefined>)[field]=[...values][0];
 }
 return {...best,fields:merged};
}
export function missingMetadata(work:Pick<MetadataWork,'fields'|'manual'>,audio=false):(keyof WorkFields)[]{
 const keys:(keyof WorkFields)[]=['title','author','genre','publishedYear','description','publisher','language','coverUri'];
 if(audio)keys.push('narrator');
 return keys.filter(k=>!work.manual[k]&&!clean(work.fields[k]));
}
export function shouldEnrich(book:{title?:string;author?:string;format?:string;[key:string]:unknown}):boolean{
 const fields=book as WorkFields;
 return missingMetadata({fields,manual:{}},book.format==='Audio').length>0;
}
export function fillMissing(work:Pick<MetadataWork,'fields'|'manual'>,candidate:Candidate):WorkFields{
 const result:WorkFields={};
 const allowed=new Set(['title','author','series','seriesNumber','genre','publishedYear','description','publisher','narrator','language','coverUri','isbn','asin']);
 for(const [key,value]of Object.entries(candidate.fields)){
  const field=(key==='coverUrl'?'coverUri':key) as keyof WorkFields;
  if(!allowed.has(field)||work.manual[field]||clean(work.fields[field])||typeof value!=='string'||!value.trim())continue;
  result[field]=value.trim();
 }
 return result;
}
export class ProviderQueue{
 private tails=new Map<string,Promise<unknown>>();private next=new Map<string,number>();
 private count=new Map<string,number>();
 run<T>(provider:string,operation:(signal:AbortSignal)=>Promise<T>,signal?:AbortSignal,interval=1000,deadline=8000):Promise<T>{
  if(signal?.aborted)return Promise.reject(Error('Search cancelled'));
  if((this.count.get(provider)||0)>=32)return Promise.reject(Error('Provider queue full'));
  this.count.set(provider,(this.count.get(provider)||0)+1);
  const previous=this.tails.get(provider)||Promise.resolve();
  let abortHandler:()=>void=()=>{};
  const cancellation=new Promise<never>((_,reject)=>{abortHandler=()=>reject(Error('Search cancelled'));signal?.addEventListener('abort',abortHandler,{once:true});});
  const run=previous.catch(()=>{}).then(async()=>{
   if(signal?.aborted)throw Error('Search cancelled');
   const wait=Math.max(0,(this.next.get(provider)||0)-Date.now());
   if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
   if(signal?.aborted)throw Error('Search cancelled');
   const inner=new AbortController();const abort=()=>inner.abort();signal?.addEventListener('abort',abort,{once:true});
   this.next.set(provider,Date.now()+Math.max(0,interval));let timer:ReturnType<typeof setTimeout>|undefined;
   try{return await Promise.race([operation(inner.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{inner.abort();reject(Error('Provider deadline'));},deadline);})]);}
   finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  });
  const result=Promise.race([run,cancellation]);
  const tail=run.finally(()=>{this.count.set(provider,Math.max(0,(this.count.get(provider)||1)-1));if(this.tails.get(provider)===tail)this.tails.delete(provider);});
  this.tails.set(provider,tail);void tail.catch(()=>{});
  return result.finally(()=>signal?.removeEventListener('abort',abortHandler));
 }
}
