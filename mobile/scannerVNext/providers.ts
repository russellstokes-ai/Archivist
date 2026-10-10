import {sharedRequestQueue,RequestQueue,ProviderRequestError,type SearchProvider,type Candidate,type Query} from './search';
import {normalizeGenre} from './genre';
type BodyReader={read():Promise<{done:boolean;value?:Uint8Array}>;cancel():Promise<unknown>;releaseLock():void};
type ResponsePort={ok:boolean;status:number;headers:{get(name:string):string|null};body:{getReader():BodyReader}|null};
export type JsonRequest=(url:string,signal?:AbortSignal)=>Promise<unknown>;
export async function readBoundedJson(response:ResponsePort,signal?:AbortSignal):Promise<unknown>{
 const check=()=>{if(signal?.aborted)throw new Error('Provider request cancelled');};check();
 if(!response.ok){if(response.body){const reader=response.body.getReader();try{await reader.cancel();}finally{reader.releaseLock();}}const value=response.headers.get('Retry-After')??'';const delay=/^\d+$/.test(value)?Number(value)*1000:Math.max(0,Date.parse(value)-Date.now());throw new ProviderRequestError(response.status,Number.isFinite(delay)?delay:0);}
 if(!response.body)throw new Error('Bounded provider transport unavailable');const reader=response.body.getReader();let complete=false;
 try{
  const contentLength=Number(response.headers.get('Content-Length'));if(Number.isFinite(contentLength)&&contentLength>1048576)throw new Error('Provider response byte budget');
  let total=0;const chunks:Uint8Array[]=[];
  while(true){check();const value=await reader.read();check();if(value.done){complete=true;break;}if(!(value.value instanceof Uint8Array))throw new Error('Invalid provider byte stream');total+=value.value.length;if(total>1048576)throw new Error('Provider response byte budget');chunks.push(value.value);}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  check();return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }finally{if(!complete)try{await reader.cancel();}catch{}reader.releaseLock();}
}
const text=(value:unknown,max=512)=>typeof value==='string'?value.trim().slice(0,max):undefined;
const list=(value:unknown,max=20):unknown[]=>Array.isArray(value)?value.slice(0,max):[];
const image=(value:unknown)=>{const url=text(value,2048)?.replace(/^http:/,'https:');if(!url)return undefined;try{const parsed=new URL(url);return parsed.protocol==='https:'&&['books.google.com','books.googleusercontent.com','covers.openlibrary.org'].includes(parsed.hostname)&&!parsed.username&&!parsed.password?url:undefined;}catch{return undefined;}};
const quote=(value:string)=>JSON.stringify(value);
const providerGenre=(value:unknown)=>normalizeGenre(list(value,100).filter((v):v is string=>typeof v==='string').map(value=>({value:value.slice(0,512),source:'provider' as const}))).label;
export function createBookProviders(settings:{openLibrary:boolean;googleBooks:boolean;googleKey?:string},request:JsonRequest,queue:RequestQueue=sharedRequestQueue):SearchProvider[]{
 const providers:SearchProvider[]=[];
 if(settings.openLibrary)providers.push({id:'open-library',async search(query:Query,page,signal){
  const params=new URLSearchParams({limit:'20',offset:String(page*20),fields:'key,title,author_name,isbn,cover_i,first_publish_year,subject'});
  if(query.isbn)params.set('isbn',query.isbn);else{if(query.title)params.set('title',query.title);if(query.author)params.set('author',query.author);if(query.series)params.set('q',query.series+(query.seriesNumber?' '+query.seriesNumber:''));}
  const raw=await queue.run('open-library',inner=>request('https://openlibrary.org/search.json?'+params,inner),signal) as {docs?:unknown;numFound?:number};
  const docs=list(raw?.docs),candidates:Candidate[]=[];
  for(const value of docs){const row=value as Record<string,unknown>,id=text(row.key);if(!id||!/^\/works\/OL\d+W$/.test(id))continue;const title=text(row.title);if(!title)continue;const author=list(row.author_name,4).map(x=>text(x)).filter(Boolean).join(', '),genre=providerGenre(row.subject),cover=Number.isSafeInteger(row.cover_i)&&Number(row.cover_i)>0?'https://covers.openlibrary.org/b/id/'+row.cover_i+'-L.jpg':undefined;
   candidates.push({id,provider:'open-library',identifiers:list(row.isbn).map(x=>text(x,64)).filter((x):x is string=>!!x),fields:{title,...(author?{author}:{}),...(genre?{genre}:{}),...(cover?{coverUrl:cover}:{})}});
  }
  return {candidates,nextPage:typeof raw.numFound==='number'&&page*20+docs.length<raw.numFound?page+1:null};
 }});
 if(settings.googleBooks)providers.push({id:'google-books',available:!!settings.googleKey,async search(query,page,signal){
  if(!settings.googleKey)throw new Error('Google Books is unconfigured');
  const terms=query.isbn?'isbn:'+quote(query.isbn):[query.title?'intitle:'+quote(query.title):'',query.author?'inauthor:'+quote(query.author):'',query.series?quote(query.series):''].filter(Boolean).join(' ');
  const params=new URLSearchParams({q:terms,startIndex:String(page*20),maxResults:'20',key:settings.googleKey,fields:'items(id,volumeInfo(title,authors,categories,industryIdentifiers,imageLinks/thumbnail,language)),totalItems'});
  const raw=await queue.run('google-books',inner=>request('https://www.googleapis.com/books/v1/volumes?'+params,inner),signal) as {items?:unknown;totalItems?:number};
  const items=list(raw?.items),candidates:Candidate[]=[];
  for(const value of items){const row=value as {id?:unknown;volumeInfo?:Record<string,unknown>},info=row.volumeInfo,id=text(row.id);if(!id||!info)continue;const title=text(info.title);if(!title)continue;const author=list(info.authors,4).map(x=>text(x)).filter(Boolean).join(', '),genre=providerGenre(info.categories),cover=image((info.imageLinks as {thumbnail?:unknown}|undefined)?.thumbnail),language=text(info.language,32);
   candidates.push({id,provider:'google-books',identifiers:list(info.industryIdentifiers).map(x=>text((x as {identifier?:unknown})?.identifier,64)).filter((x):x is string=>!!x),fields:{title,...(author?{author}:{}),...(genre?{genre}:{}),...(cover?{coverUrl:cover}:{}),...(language?{language}:{})}});
  }
  return {candidates,nextPage:typeof raw.totalItems==='number'&&page*20+items.length<raw.totalItems?page+1:null};
 }});
 return providers;
}
