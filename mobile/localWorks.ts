import {decodedPathParts} from './libraryIntelligence';
import {LocalBook} from './localLibrary';

export type LocalWork = {
  key: string;
  source?: 'local' | 'downloaded';
  originServer?: string;
  originWorkId?: number;
  title: string;
  author: string;
  series: string;
  genre: string;
  publishedYear?: number;
  format: string;
  space: string;
  available: boolean;
  files: number;
  tracks: LocalBook[];
  needsReview: boolean;
  reviewReason: string;
  coverUri?: string;
  coverShape: 'portrait' | 'square';
  livingBookCoverUri?: string;
  livingBookCoverSource?: LocalBook['livingBookCoverSource'];
  livingBookCoverConfidence?: number;
};

type AudioEvidence={
  embeddedKey:string;
  embeddedTitle:string;
  filenameKey:string;
  filenameTitle:string;
  directoryKey:string;
  directoryTitle:string;
  anchorKey:string;
  chapterLike:boolean;
  resolvedTitleKey:string;
  resolvedTitle:string;
  resolvedSharedIdentity:boolean;
};

export function groupLocalWorks(books: LocalBook[]): LocalWork[] {
  const groups = new Map<string, LocalBook[]>();
  const order: string[] = [];
  const evidence = new Map<string,AudioEvidence>();
  const directoryMembers=new Map<string,LocalBook[]>();

  for(const book of books){
    if(book.format!=='Audio')continue;
    const item=audioEvidence(book);
    evidence.set(book.uri,item);
    const members=directoryMembers.get(item.directoryKey)||[];
    members.push(book);
    directoryMembers.set(item.directoryKey,members);
  }

  const directoryFallback=new Map<string,string>();
  for(const [directoryKey,members] of directoryMembers){
    if(members.length<2)continue;
    const fallback=folderFallbackCandidate(members,evidence);
    if(fallback)directoryFallback.set(directoryKey,fallback);
  }

  for (const book of books) {
    const key = book.format==='Audio'
      ? audioWorkKey(book,evidence.get(book.uri)!,directoryFallback)
      : 'asset:' + book.uri;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(book);
  }

  return order.map(key => {
    const tracks = groups.get(key)!.slice().sort((a, b) => ((a.discNumber || 0) - (b.discNumber || 0)) || ((a.trackNumber || 0) - (b.trackNumber || 0)) || naturalCompare(a.uri, b.uri));
    const first = tracks[0];
    const audio = first.format === 'Audio';
    const embeddedTitle = audio ? commonValue(tracks.map(item => item.workTitleHint || '')) : '';
    const sharedResolvedTitle=audio ? commonValue(tracks.filter(item=>isResolvedSharedIdentity(item)).map(item=>item.title||'')) : '';
    const filenameTitle=audio ? commonValue(tracks.map(item=>evidence.get(item.uri)?.filenameTitle||'')) : '';
    const folderTitle = audio && tracks.length>1 ? commonValue(tracks.map(item=>evidence.get(item.uri)?.directoryTitle||'')) : '';
    const title = audio && (embeddedTitle || sharedResolvedTitle || filenameTitle || folderTitle)
      ? (embeddedTitle || sharedResolvedTitle || filenameTitle || folderTitle)
      : first.title;
    const author = commonValue(tracks.map(item => item.author));
    const series = commonValue(tracks.map(item => item.series));
    const genre = commonValue(tracks.map(item => item.genre));
    const reviewItem = tracks.find(item => item.needsReview);
    return {
      key,
      source: 'local' as const,
      title,
      author,
      series,
      genre,
      publishedYear: tracks.find(item=>item.publishedYear)?.publishedYear,
      format: first.format,
      space: first.space,
      available: tracks.some(item => item.available),
      files: tracks.length,
      tracks,
      needsReview: !!reviewItem,
      reviewReason: reviewItem?.reviewReason || '',
      coverUri: tracks.find(item => item.coverUri)?.coverUri,
      coverShape: tracks.find(item=>item.coverUri)?.coverShape || (audio ? 'square' : 'portrait'),
      livingBookCoverUri: tracks.find(item=>item.livingBookCoverUri)?.livingBookCoverUri,
      livingBookCoverSource: tracks.find(item=>item.livingBookCoverSource)?.livingBookCoverSource,
      livingBookCoverConfidence: tracks.find(item=>item.livingBookCoverConfidence)?.livingBookCoverConfidence,
    };
  });
}

function audioEvidence(book:LocalBook):AudioEvidence{
  const directory=audioDirectory(book.uri);
  const anchor=audioAnchor(book.uri);
  const embeddedTitle=cleanLabel(book.workTitleHint||'');
  const embeddedKey=embeddedTitle
    ? ['meta',sourceScope(book),anchor.key,normalKey(book.author),normalKey(embeddedTitle)].join(':')
    : '';
  const filenameTitle=filenameClusterTitle(book.uri);
  const filenameKey=filenameTitle
    ? ['name',sourceScope(book),anchor.key,normalKey(book.author),normalKey(filenameTitle)].join(':')
    : '';
  const resolvedTitle=cleanLabel(book.title||'');
  return {
    embeddedKey,
    embeddedTitle,
    filenameKey,
    filenameTitle,
    directoryKey:['dir',sourceScope(book),directory.key].join(':'),
    directoryTitle:directory.title,
    anchorKey:anchor.key,
    chapterLike:chapterEvidence(book),
    resolvedTitleKey:normalKey(resolvedTitle),
    resolvedTitle,
    resolvedSharedIdentity:isResolvedSharedIdentity(book),
  };
}

function audioWorkKey(
  book:LocalBook,
  item:AudioEvidence,
  directoryFallback:Map<string,string>,
){
  if(item.embeddedKey)return item.embeddedKey;
  if(item.filenameKey)return item.filenameKey;
  const fallback=directoryFallback.get(item.directoryKey);
  if(fallback)return fallback;
  return 'audio-file:'+sourceScope(book)+':'+book.uri;
}

function folderFallbackCandidate(
  members:LocalBook[],
  evidence:Map<string,AudioEvidence>,
){
  const items=members.map(book=>evidence.get(book.uri)!).filter(Boolean);
  if(items.length<2)return '';

  const sharedIdentity=commonValue(
    members
      .filter(isResolvedSharedIdentity)
      .map(book=>book.title||''),
  );
  if(sharedIdentity && members.filter(isResolvedSharedIdentity).length===members.length){
    return ['identity',sourceScope(members[0]),items[0].directoryKey,normalKey(members[0].author),normalKey(sharedIdentity)].join(':');
  }

  const chapterCount=items.filter(item=>item.chapterLike).length;
  const strongChapterEvidence=
    chapterCount>=2 &&
    chapterCount>=Math.ceil(members.length*.6);

  // Track/disc tags alone are not work identity. Standalone M4Bs in an author
  // or series folder often all report track=1 (or arbitrary playlist indexes).
  // Without a shared trusted title/album, require filename-level chapter evidence.
  if(!strongChapterEvidence)return '';
  const directoryTitle=items[0].directoryTitle;
  if(!directoryTitle||isLibraryRoot(directoryTitle)||looksLikeAuthorContainer(directoryTitle,members))return '';
  return ['folder',sourceScope(members[0]),items[0].directoryKey,normalKey(directoryTitle)].join(':');
}

function isResolvedSharedIdentity(book:LocalBook){
  return (
    (book.metadataSource==='sidecar'||book.metadataSource==='manual'||book.metadataSource==='embedded'||book.metadataSource==='online') &&
    !!cleanLabel(book.title)
  );
}

function chapterEvidence(book:LocalBook){
  const parts=decodedPathParts(book.uri);
  const filename=cleanLabel(parts[parts.length-1]||'').replace(/\.[^.]+$/,'');
  if(/^(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}\b/i.test(filename))return true;
  if(/^0*\d{1,4}\s*(?:[-._ ]|$)/i.test(filename))return true;
  if(/(?:^|\s)(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b|$)/i.test(filename))return true;
  return !!filenameClusterTitle(book.uri);
}

function filenameClusterTitle(uri:string){
  const parts=decodedPathParts(uri);
  const filename=cleanLabel(parts[parts.length-1]||'').replace(/\.[^.]+$/,'');
  const patterns=[
    /^(.+?)\s+-\s+(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b.*)?$/i,
    /^(.+?)\s+(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b.*)?$/i,
    /^(.+?)\s+-\s+0*\d{2,4}(?:\s*[-._].*)?$/i,
    /^(.+?)[._-](?:ch|pt|track)0*\d{1,4}$/i,
    /^(.+?)\s+0*\d{2,4}\s+-\s+.+$/i,
  ];
  for(const pattern of patterns){
    const match=filename.match(pattern);
    const base=cleanLabel(match?.[1]||'');
    if(validClusterBase(base))return base;
  }
  return '';
}

function validClusterBase(value:string){
  const key=normalKey(value);
  if(key.length<4)return false;
  if(/^(book|books|volume|vol|chapter|chap|part|track|disc|disk|cd|audio|audiobook|untitled)$/i.test(key))return false;
  return true;
}

function audioDirectory(uri:string){
  const dirs=relativeAudioDirs(uri);
  const title=cleanLabel(dirs[dirs.length-1]||'');
  return {key:dirs.join('/'),title};
}

function audioAnchor(uri:string){
  const dirs=relativeAudioDirs(uri);
  const trimmed=dirs.slice();
  while(trimmed.length&&isDiscFolder(trimmed[trimmed.length-1]))trimmed.pop();
  return {key:trimmed.join('/'),title:cleanLabel(trimmed[trimmed.length-1]||'')};
}

function relativeAudioDirs(uri:string){
  const parts=decodedPathParts(uri);
  const dirs=parts.slice(0,-1).filter(Boolean);
  while(dirs.length&&isLibraryRoot(dirs[0]))dirs.shift();
  return dirs;
}

function sourceScope(book:LocalBook){
  return normalKey(book.sourceUri||book.space||'local');
}

function isDiscFolder(value:string){
  return /^(?:cd|disc|disk)\s*[-_. ]*0*\d{1,3}$/i.test(cleanLabel(value));
}

function looksLikeAuthorContainer(directoryTitle:string,members:LocalBook[]){
  const directory=normalKey(directoryTitle);
  if(!directory)return false;
  const authors=[...new Set(members.map(book=>normalKey(book.author)).filter(Boolean))];
  return authors.length===1&&authors[0]===directory;
}

function normalKey(value: string) {
  return cleanLabel(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function commonValue(values: string[]) {
  const clean = values.map(cleanLabel).filter(Boolean);
  if (!clean.length) return '';
  const first = clean[0];
  return clean.every(value => value === first) ? first : '';
}

function naturalCompare(a: string, b: string) {
  return decode(a).localeCompare(decode(b), undefined, {numeric: true, sensitivity: 'base'});
}

function cleanLabel(value: string) {
  return String(value || '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isLibraryRoot(value: string) {
  return /^(books?|ebooks?|audiobooks?|comics?|pdfs?|downloads?|documents?|media|library|libraries)$/i.test(cleanLabel(value));
}

function decode(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}
