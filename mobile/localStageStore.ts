import type {LocalBook} from './localLibrary';
import {getPersistedJSON,setPersistedJSON} from './stateStore';

export type LocalStageWriteProgress={stage:'waiting'|'saving'|'committed';processed:number;total:number};
export type LocalStageWriteOptions={shouldContinue?:()=>boolean;onProgress?:(progress:LocalStageWriteProgress)=>void};
const webStageKey='archivist.localStage.web.v1';

export async function loadLocalStageBooks():Promise<LocalBook[]>{
  const value=await getPersistedJSON<LocalBook[]>(webStageKey);
  return Array.isArray(value)?value.filter(book=>!!book?.uri):[];
}

export async function localStageHasAssets(){
  return (await loadLocalStageBooks()).length>0;
}

export async function replaceLocalStageBooks(books:LocalBook[],options:LocalStageWriteOptions={}){
  const check=()=>{if(options.shouldContinue?.()===false)throw new Error('Catalogue save cancelled');};
  const total=books.length;
  const report=(stage:LocalStageWriteProgress['stage'],processed:number)=>{try{options.onProgress?.({stage,processed,total});}catch{/* observational only */}};
  check();report('waiting',0);check();report('saving',0);
  // Web storage exposes one atomic write, unlike native SQLite's row batches.
  // The caller retains scan ownership until this real write settles.
  await setPersistedJSON(webStageKey,books);
  report('committed',total);
}

export async function upsertLocalStageBooks(books:LocalBook[]){
  if(!books.length)return;
  const current=await loadLocalStageBooks();
  const byUri=new Map(current.map(book=>[book.uri,book]));
  for(const book of books)if(book.uri)byUri.set(book.uri,book);
  await replaceLocalStageBooks([...byUri.values()]);
}

export async function migrateLegacyLocalStage(books:LocalBook[]){
  if(await localStageHasAssets())return;
  if(books.length)await replaceLocalStageBooks(books);
}
