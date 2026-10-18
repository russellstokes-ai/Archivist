import type {Candidate} from '../scannerVNext/search';
import type {AssistProvider} from './service';
const clean=(v:unknown,max=4096)=>typeof v==='string'?v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
const names=(v:unknown)=>Array.isArray(v)?v.slice(0,12).map(x=>clean(x?.name,256)).filter(Boolean).join(', '):'';
/** Public UK catalogue metadata only; no account, audio or playback requests. */
export function createAudibleProvider(request:(url:string,signal?:AbortSignal)=>Promise<unknown>):AssistProvider{
 return {id:'audible-uk',async search(query,page,signal){
  if(query.isbn||page>4||(!query.asin&&!query.title))return {candidates:[],nextPage:null};
  const params=new URLSearchParams({num_results:'20',page:String(page),response_groups:'contributors,product_desc,product_attrs,product_extended_attrs,media,series',products_sort_by:'Relevance'});
  if(query.asin)params.set('asins',query.asin);else params.set('keywords',[query.title,query.author].filter(Boolean).join(' '));
  const data=await request('https://api.audible.co.uk/1.0/catalog/products?'+params,signal) as {products?:unknown;total_results?:number};
  const products=Array.isArray(data?.products)?data.products.slice(0,20):[],candidates:Candidate[]=[];
  for(const p of products){
   const asin=clean(p?.asin,10),title=clean(p?.title,512);if(!/^[A-Z0-9]{10}$/.test(asin)||!title)continue;
   const fields:Record<string,string>={title,asin};
   for(const [key,value] of Object.entries({author:names(p.authors),narrator:names(p.narrators),publisher:clean(p.publisher_name),description:clean(p.publisher_summary),language:clean(p.language,64),publishedYear:clean(p.release_date,32).match(/^\d{4}/)?.[0]||''}))if(value)fields[key]=value;
   const cover=Object.values(p.product_images||{}).find(v=>typeof v==='string'&&/^https:\/\/(?:m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)\//.test(v));
   if(typeof cover==='string')fields.coverUrl=cover;
   // SearchWork does not yet identify media format. Review avoids applying an
   // audiobook edition to a print book with the same title and author.
   candidates.push({id:asin,provider:'audible-uk',fields,identifiers:[asin],relatedMatch:true});
  }
  return {candidates,nextPage:!query.asin&&page<4&&typeof data.total_results==='number'&&(page+1)*20<data.total_results?page+1:null};
 }};
}
