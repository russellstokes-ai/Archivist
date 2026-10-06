import type {LocalBook} from './localLibrary';
import {getPersistedJSON,setPersistedJSON} from './stateStore';

const webStageKey='archivist.localStage.web.v1';

export async function loadLocalStageBooks():Promise<LocalBook[]>{
  const value=await getPersistedJSON<LocalBook[]>(webStageKey);
  return Array.isArray(value)?value.filter(book=>!!book?.uri):[];
}

export async function localStageHasAssets(){
  return (await loadLocalStageBooks()).length>0;
}

export async function replaceLocalStageBooks(books:LocalBook[]){
  await setPersistedJSON(webStageKey,books);
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
