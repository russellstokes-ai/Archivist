/**
 * Reader-time identification only. This does NOT change scanner results,
 * publication state, file names, metadata or the canonical comic presentation.
 * SAF document IDs commonly percent-encode their filename and extension.
 */
export type ComicContainer='cbr'|'cbz'|'cbt'|'pdf'|'epub'|'unknown';
export function comicContainerFromUri(uri:string):ComicContainer{
  let candidate=String(uri||'').split('?')[0].split('#')[0];
  for(let pass=0;pass<3;pass++){
    const found=candidate.match(/\.(cbr|cbz|cbt|pdf|epub)(?=$|[\\/;:])/i);
    if(found)return found[1].toLowerCase() as ComicContainer;
    try{
      const next=decodeURIComponent(candidate);
      if(next===candidate)break;
      candidate=next;
    }catch{break;}
  }
  return 'unknown';
}

export function readerFormatFromContainer(format:string,kind:ComicContainer):string{
  if(format==='Comic'&&kind==='pdf')return 'PDF';
  if(format==='Comic'||format==='Audio'||format==='PDF'||format==='EPUB')return format;
  if(kind==='cbr'||kind==='cbz'||kind==='cbt')return 'Comic';
  if(kind==='pdf')return 'PDF';
  if(kind==='epub')return 'EPUB';
  return format;
}
export function effectiveLocalReaderFormat(format:string,uri?:string):string{
  return readerFormatFromContainer(format,comicContainerFromUri(String(uri||'')));
}

// Opaque SAF document IDs need read-only provider metadata. Return only enum.
declare const require:any;
export async function comicContainerFromDocument(
  uri:string,lookup?:((uri:string)=>Promise<unknown>),timeoutMs=1500
):Promise<ComicContainer>{
  const known=comicContainerFromUri(uri);
  if(known!=='unknown')return known;
  if(!String(uri).startsWith('content://'))return 'unknown';
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    const read=lookup||((path:string)=>require('react-native').NativeModules?.ArchivistArchive?.readerContainer?.(path));
    const result=await Promise.race([
      Promise.resolve(read(uri)),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('SAF reader descriptor timed out')),Math.max(1,Math.min(2500,timeoutMs)));}),
    ]);
    return result==='cbr'||result==='cbz'||result==='cbt'||result==='pdf'||result==='epub' ?result:'unknown';
  }catch{return 'unknown';}
  finally{if(timer)clearTimeout(timer);}
}
