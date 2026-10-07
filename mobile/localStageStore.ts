import type {LocalBook} from './localLibrary';
import {getPersistedJSON,setPersistedJSON} from './stateStore';
import {retainPublishedSnapshots} from './publicationPipeline';
const webStageKey='archivist.localStage.web.v1';
let pending:Promise<void>=Promise.resolve();
function mutate(action:()=>Promise<void>){const next=pending.catch(()=>undefined).then(action);pending=next;return next;}
async function read():Promise<LocalBook[]>{
  const value=await getPersistedJSON<LocalBook[]>(webStageKey);
  return Array.isArray(value)?value.filter(book=>!!book?.uri):[];
}
async function write(books:LocalBook[],previous:LocalBook[]){
  const backupKey=webStageKey+'.test18-backup';
  if(await getPersistedJSON(backupKey)===null)await setPersistedJSON(backupKey,previous);
  await setPersistedJSON(webStageKey,retainPublishedSnapshots(books,previous));
}
export async function loadLocalStageBooks(){await pending.catch(()=>undefined);return read();}
export async function localStageHasAssets(){return (await loadLocalStageBooks()).length>0;}
export function replaceLocalStageBooks(books:LocalBook[]){return mutate(async()=>write(books,await read()));}
export function upsertLocalStageBooks(books:LocalBook[]){return mutate(async()=>{
  const current=await read(),byUri=new Map(current.map(book=>[book.uri,book]));
  for(const book of books)if(book.uri)byUri.set(book.uri,book);
  await write([...byUri.values()],current);
});}
export function migrateLegacyLocalStage(books:LocalBook[]){return mutate(async()=>{
  const current=await read();if(!current.length&&books.length)await write(books,current);
});}
export function commitLocalWorkEdit(patches:LocalBook[],expected:LocalBook[]){return mutate(async()=>{
  const current=await read(),before=new Map(expected.map(book=>[book.uri,JSON.stringify(book)]));
  const changes=new Map(patches.map(book=>[book.uri,book]));
  for(const book of patches){
    const original=current.find(row=>row.uri===book.uri);
    if(!original||JSON.stringify(original)!==before.get(book.uri))throw Error('The selected work has changed. Reopen it before saving.');
  }
  await write(current.map(book=>changes.get(book.uri)||book),current);
});}
