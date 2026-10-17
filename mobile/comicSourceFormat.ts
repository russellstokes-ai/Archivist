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

export function effectiveLocalReaderFormat(format:string,uri?:string):string{
  const kind=comicContainerFromUri(String(uri||''));
  if(format==='Comic'&&kind==='pdf')return 'PDF';
  if(format==='Comic'||format==='Audio'||format==='PDF'||format==='EPUB')return format;
  if(kind==='cbr'||kind==='cbz'||kind==='cbt')return 'Comic';
  if(kind==='pdf')return 'PDF';
  if(kind==='epub')return 'EPUB';
  return format;
}
