import type {LocalBook,LocalMetadataOverride} from './localLibrary';

type Storage={
  load:()=>Promise<LocalBook[]>;
  replace:(books:LocalBook[])=>Promise<void>;
  saveOverrides:(overrides:Record<string,LocalMetadataOverride>)=>Promise<void>;
  loadOverrides:()=>Promise<Record<string,LocalMetadataOverride>|null>;
};
const encoded=(value:unknown)=>JSON.stringify(value??null);

// Called after cancelling scanner writers. Keep unrelated assets from the
// durable catalogue, verify every edited field, and never report a false save.
export async function persistWorkEdit(
  proposed:LocalBook[],targets:string[],overrides:Record<string,LocalMetadataOverride>,storage:Storage,
){
  const wanted=new Set(targets);
  if(!wanted.size)throw Error('No files selected for this edit.');
  const patches=new Map(proposed.filter(book=>wanted.has(book.uri)).map(book=>[book.uri,book]));
  const current=await storage.load();
  const existing=new Set(current.map(book=>book.uri));
  for(const uri of wanted)if(!existing.has(uri)||!patches.has(uri)||!overrides[uri])throw Error('The selected work has changed. Reopen it before saving.');
  const merged=current.map(book=>patches.get(book.uri)||book);
  await storage.saveOverrides(overrides);
  await storage.replace(merged);
  const saved=new Map((await storage.load()).map(book=>[book.uri,book]));
  const savedOverrides=await storage.loadOverrides();
  for(const uri of wanted){
    const expected=patches.get(uri)!;
    const actual=saved.get(uri);
    if(!actual||encoded(savedOverrides?.[uri])!==encoded(overrides[uri]))throw Error('Metadata save could not be verified. Please retry.');
    for(const field of Object.keys(overrides[uri])){
      if(field==='clearedFields')continue;
      if(encoded((actual as any)[field])!==encoded((expected as any)[field]))throw Error('Metadata save could not be verified: '+field+'. Please retry.');
    }
    if(encoded(actual.embeddedMetadata)!==encoded(expected.embeddedMetadata))throw Error('Chapter metadata verification failed. Please retry.');
  }
  return merged;
}
