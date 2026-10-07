import type {LocalBook,LocalMetadataOverride} from './localLibrary';

type Storage={
  load:()=>Promise<LocalBook[]>;
  commit:(patches:LocalBook[],expected:LocalBook[])=>Promise<void>;
};
const encoded=(value:unknown)=>JSON.stringify(value??null);

// Called after cancelling scanner writers. Keep unrelated assets from the
// durable catalogue, verify every edited field, and never report a false save.
export async function persistWorkEdit(
  proposed:LocalBook[],targets:string[],overrides:Record<string,LocalMetadataOverride>,storage:Storage,expectedRevision:LocalBook[],
){
  const wanted=new Set(targets);
  if(!wanted.size)throw Error('No files selected for this edit.');
  const patches=new Map(proposed.filter(book=>wanted.has(book.uri)).map(book=>[book.uri,book]));
  const expectedByUri=new Map(expectedRevision.filter(book=>wanted.has(book.uri)).map(book=>[book.uri,book]));
  const current=await storage.load();
  const existing=new Set(current.map(book=>book.uri));
  for(const uri of wanted)if(!existing.has(uri)||!patches.has(uri)||!overrides[uri]||!expectedByUri.has(uri))throw Error('The selected work has changed. Reopen it before saving.');
  const changes=[...patches.values()].map(book=>({...book,manualOverride:overrides[book.uri]}));
  await storage.commit(changes,[...wanted].map(uri=>expectedByUri.get(uri)!));
  const merged=await storage.load();
  const saved=new Map(merged.map(book=>[book.uri,book]));
  for(const uri of wanted){
    const expected=patches.get(uri)!;
    const actual=saved.get(uri);
    if(!actual||encoded(actual.manualOverride)!==encoded(overrides[uri]))throw Error('Metadata save could not be verified. Please retry.');
    for(const field of Object.keys(overrides[uri])){
      if(field==='clearedFields')continue;
      if(encoded((actual as any)[field])!==encoded((expected as any)[field]))throw Error('Metadata save could not be verified: '+field+'. Please retry.');
    }
    if(encoded(actual.embeddedMetadata)!==encoded(expected.embeddedMetadata))throw Error('Chapter metadata verification failed. Please retry.');
  }
  return merged;
}
