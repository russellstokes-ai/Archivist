import {audioMultipartWorkTitle,decodedPathParts,editionKey,inferLocalBookMetadata,isGenericMediaTitle,isLibraryRootLabel,logicalWorkKey} from './libraryIntelligence';

export type SyncSource='manual'|'sidecar'|'embedded'|'online'|'path';
export type SyncConfidence='high'|'medium'|'low';
export type SynchronizableBook={
  uri:string;
  format:string;
  space?:string;
  rootUri?:string;
  fileSize?:number;
  title:string;
  author?:string;
  series?:string;
  seriesNumber?:number;
  genre?:string;
  publishedYear?:number;
  narrator?:string;
  publisher?:string;
  isbn?:string;
  asin?:string;
  language?:string;
  description?:string;
  workKey?:string;
  editionKey?:string;
  coverUri?:string;
  coverCandidates?:string[];
  metadataSource?:string;
  metadataProvenance?:Partial<Record<string,string>>;
  metadataFieldConfidence?:Partial<Record<string,SyncConfidence>>;
  metadataConflicts?:Array<{field?:string}>;
  needsReview?:boolean;
  reviewReason?:string;
  identificationConfidence?:SyncConfidence;
  onlineMetadataMatch?:{fields?:Partial<Record<string,unknown>>;confidence?:SyncConfidence};
  embeddedMetadata?:{workTitle?:string;trackNumber?:number;discNumber?:number};
};

export type CanonicalMetadata={
  title:string;
  author:string;
  series:string;
  seriesNumber?:number;
  genre:string;
  publishedYear?:number;
  narrator:string;
  publisher:string;
  isbn:string;
  asin:string;
  language:string;
  description:string;
  coverUri?:string;
  provenance:Partial<Record<string,SyncSource>>;
  confidence:Partial<Record<string,SyncConfidence>>;
};

const fields=['title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description'] as const;
type SyncField=typeof fields[number];

const sourceRank:Record<SyncSource,number>={manual:600,sidecar:520,embedded:500,online:430,path:260};
const confidenceRank:Record<SyncConfidence,number>={high:30,medium:15,low:0};

function clean(value:unknown){return String(value??'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();}
function normal(value:unknown){return clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
// A multi-disc audiobook may have per-file ©alb/TALB tags that differ only
// by disc/part number. Normalize ONLY these qualified album suffixes when
// deriving the logical work boundary. Never rewrite the physical track tags.
function albumWorkTitle(value:unknown){
  const original=clean(value);
  if(!original||/^(?:unknown(?: album)?|n\/a|none|null|untitled)$/i.test(original))return '';
  // Device ID3/TALB pollution: some encoders mistakenly put a chapter, track
  // or disc label in the ALBUM field. That is NOT negative book identity.
  // Retain real distinct album names (Dune vs Project Hail Mary), but ignore
  // generic sequence-only labels before deciding to split a folder.
  if(/^(?:(?:chapter|chap(?:ter)?|ch|track|disc|disk|cd|part|pt|section|scene)\s*#?\s*\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?|(?:introduction|intro|outro|prologue|epilogue))$/i.test(original))return '';
  const withoutPart=original.replace(/(?:\s*[\[(]\s*|\s*[-:–]\s*|\s+)(?:disc|disk|cd|part|pt)\s*#?\s*\d{1,3}(?:\s*(?:of|\/)\s*\d{1,3})?\s*[\])]?\s*$/i,'').trim();
  return withoutPart||original;
}
function present(value:unknown){return value!==undefined&&value!==null&&clean(value)!=='';}

function shallowRecordEqual(a:unknown,b:unknown){
  const left=a&&typeof a==='object'?a as Record<string,unknown>:{};
  const right=b&&typeof b==='object'?b as Record<string,unknown>:{};
  const keys=new Set([...Object.keys(left),...Object.keys(right)]);
  for(const key of keys)if(left[key]!==right[key])return false;
  return true;
}
function syncMateriallyChanged(a:SynchronizableBook,b:SynchronizableBook){
  for(const field of fields)if((a as any)[field]!== (b as any)[field])return true;
  return a.coverUri!==b.coverUri
    ||a.workKey!==b.workKey
    ||a.editionKey!==b.editionKey
    ||a.needsReview!==b.needsReview
    ||a.reviewReason!==b.reviewReason
    ||!shallowRecordEqual(a.metadataProvenance,b.metadataProvenance)
    ||!shallowRecordEqual(a.metadataFieldConfidence,b.metadataFieldConfidence);
}

function sourceFor(book:SynchronizableBook,field:SyncField):SyncSource{
  const explicit=book.metadataProvenance?.[field];
  if(explicit){
    const source=String(explicit);
    return source==='manual'||source==='sidecar'||source==='embedded'||source==='online'?source:'path';
  }
  // Once field-level provenance exists, a coarse legacy metadataSource must not
  // claim unrelated fields. Unlabelled fields remain path-derived evidence.
  if(book.metadataProvenance&&Object.keys(book.metadataProvenance).length)return 'path';
  const source=String(book.metadataSource||'path');
  return source==='manual'||source==='sidecar'||source==='embedded'||source==='online'?source:'path';
}
function confidenceFor(book:SynchronizableBook,field:SyncField):SyncConfidence{
  return book.metadataFieldConfidence?.[field]||book.identificationConfidence||'low';
}
function audioDirectoryKey(book:SynchronizableBook){
  const parts=decodedPathParts(book.uri);
  const dirs=parts.slice(0,-1).filter(Boolean);
  if(book.rootUri){
    const root=decodedPathParts(book.rootUri).filter(Boolean);
    const sameRoot=dirs.length===root.length&&dirs.every((value,index)=>normal(value)===normal(root[index]||''));
    if(sameRoot)return '';
  }
  while(dirs.length&&isLibraryRootLabel(dirs[0]))dirs.shift();
  if(!dirs.length)return '';
  return (book.space||'')+':'+dirs.map(normal).join('/');
}
function fileStem(uri:string){
  const parts=decodedPathParts(uri);
  return clean((parts[parts.length-1]||'').replace(/\.[^.]+$/,''));
}
function audioBookFolderTitle(uri:string){
  const parts=decodedPathParts(uri);
  const parent=clean(parts[parts.length-2]||'');
  if(!parent||isLibraryRootLabel(parent))return '';
  const indexed=parent.match(/^(?:(?:book|bk|vol(?:ume)?)\s*)?#?\s*\d+(?:\.\d+)?\s*[-._:]\s*(.+)$/i);
  return clean(indexed?.[1]||parent);
}
function rootAudioTrackFamily(stem:string){return audioMultipartWorkTitle(stem);}
function looksLikeLibraryContainer(value:string){
  const label=clean(value);
  if(!label)return true;
  if(isLibraryRootLabel(label))return true;
  // Container detection must not reject real books named "Book 01 - Title",
  // "The Library Book", or "A Collection of ..." as library roots.
  return /^(?:(?:my|all|shared|mixed|digital|local|the)\s+)*(?:library|libraries|collections?|media|audiobooks?|audio\s*books?|ebooks?|books?|comics?|downloads?|unsorted|misc)$/i.test(label);
}
function rootAudioIdentityKey(book:SynchronizableBook){
  const scope=normal(book.space||'library');
  const id=normal(book.asin||book.isbn||'');
  if(id)return 'audio-root:'+scope+':id:'+id;
  const workTitle=albumWorkTitle(book.embeddedMetadata?.workTitle);
  if(workTitle){
    const author=normal(book.author||'');
    return 'audio-root:'+scope+':work:'+normal(workTitle)+(author?'|'+author:'');
  }
  const family=rootAudioTrackFamily(fileStem(book.uri));
  if(family){
    const author=normal(book.author||'');
    return 'audio-root:'+scope+':name:'+normal(family)+(author?'|'+author:'');
  }

  // If the selected source is the audiobook folder itself, generic tracks such
  // as "01 - Opening" have no filename family. The selected folder title is
  // still strong work evidence, provided it does not look like a library-level
  // container. This deliberately refuses ambiguous roots such as "Audiobooks".
  if(book.rootUri&&isGenericMediaTitle(fileStem(book.uri),'Audio',2)){
    const inferred=inferLocalBookMetadata(book.uri,'Audio',{siblingMediaCount:2,rootUri:book.rootUri});
    const folderWorkTitle=clean(inferred.title);
    if(folderWorkTitle&&!looksLikeLibraryContainer(folderWorkTitle)){
      return 'audio-root:'+scope+':folder:'+normal(folderWorkTitle);
    }
  }
  return '';
}

function audiobookFolderLooksLikeOneWork(books:SynchronizableBook[]){
  if(books.length<2)return false;
  const first=books[0];
  const dirs=decodedPathParts(first.uri).slice(0,-1).filter(Boolean);
  const root=first.rootUri?decodedPathParts(first.rootUri).filter(Boolean):[];
  const belongsToRoot=root.length>0&&dirs.length>=root.length
    &&root.every((part,index)=>normal(dirs[index])===normal(part));
  // A library-level folder is a container, never an individual book. The
  // library may have a selected SAF tree root or only a content URI.
  const relative=belongsToRoot?dirs.slice(root.length):
    dirs.filter((part,index)=>!(index===0&&isLibraryRootLabel(clean(part).replace(/^primary:/i,''))));
  const folder=clean(relative[relative.length-1]||'');
  // The selected SAF root commonly contains book folders directly. There
  // need only be one path component *beneath* the selected library root.
  // Distinct album identities, multi-part family evidence and container names
  // are independently guarded below; file-count alone must not define a work.
  if(relative.length<1||!folder||looksLikeLibraryContainer(folder))return false;
  const distinctAlbums=new Set(books.map(book=>normal(albumWorkTitle(book.embeddedMetadata?.workTitle))).filter(Boolean));
  if(distinctAlbums.size>1)return false;
  const stems=books.map(book=>fileStem(book.uri));
  const multipartFamilies=new Set(stems.map(rootAudioTrackFamily).map(normal).filter(Boolean));
  if(multipartFamilies.size>1)return false;
  // Strong book-folder structure, supplemented by common work tags or
  // chapter-style filenames. Mixed descriptive chapter titles are expected.
  const chapterLike=stems.filter(stem=>
    /^(?:(?:chapter|ch|part|pt|track|disc|cd|scene|section)\b|\d{1,4}(?:\s*[-._:]|\s+))/i.test(stem)
    ||/\b(?:chapter|part|track)\s*\d{1,4}\b/i.test(stem)
  ).length;
  // Multiple standalone M4B/M4A books under an author folder must not merge,
  // but chapter-numbered multipart M4B/M4A are still legitimate book parts.
  const mostlySingleFileBooks=books.every(book=>/\.(?:m4b|m4a)$/i.test(book.uri.split('?')[0]));
  if(mostlySingleFileBooks&&!distinctAlbums.size&&chapterLike<2)return false;
  return distinctAlbums.size===1||chapterLike>=2||books.length>=4;
}

/**
 * Distinguish complete numbered novels sharing a SERIES folder from numbered
 * CHAPTERS of one work. Discworld's real NAS MP3s are each 100–230 MB, use
 * "01. The Colour of Magic" etc., and must never be one audiobook.
 *
 * Do not rely on just filename numbering, which also describes chapters.
 * Verified distinct series positions OR large independent audiobook-sized
 * numbered files with substantive titles provide the independent evidence.
 * An explicit shared embedded album/work title defeats the heuristic.
 */
function standaloneSeriesAudioUris(books:SynchronizableBook[]):Set<string>{
  const standalone=new Set<string>();
  if(books.length<3)return standalone;
  const albums=new Set(books.map(book=>normal(albumWorkTitle(book.embeddedMetadata?.workTitle))).filter(Boolean));
  const parentName=normal(audioBookFolderTitle(books[0].uri));
  // A common *book* album ID is authoritative. A common album tag equal to
  // the parent SERIES folder is not enough to collapse separate novels.
  if(albums.size===1&&![...albums].includes(parentName))return standalone;
  const numbered=books.filter(book=>{
    const stem=fileStem(book.uri);
    const match=stem.match(/^\s*\d{1,3}\s*\.\s+(.{4,})$/);
    const descriptive=clean(match?.[1]||'');
    return !!descriptive
      && !/^(?:chapter|ch|track|part|pt|disc|disk|cd|scene|section|intro|introduction|epilogue|prologue)\b/i.test(descriptive)
      && !book.embeddedMetadata?.trackNumber && !book.embeddedMetadata?.discNumber;
  });
  if(numbered.length<3||numbered.length<Math.ceil(books.length*.5))return standalone;
  if(new Set(numbered.map(book=>normal(fileStem(book.uri)))).size!==numbered.length)return standalone;
  const credibleSizes=numbered.every(book=>typeof book.fileSize==='number'&&book.fileSize>=64*1024*1024);
  const namedSeries=numbered.map(book=>normal(book.series)).filter(Boolean);
  const positions=numbered.map(book=>book.seriesNumber).filter((value):value is number=>typeof value==='number'&&Number.isFinite(value));
  const credibleSeries=namedSeries.length===numbered.length
    && new Set(namedSeries).size===1
    && positions.length===numbered.length
    && new Set(positions).size===numbered.length;
  if(!credibleSizes&&!credibleSeries)return standalone;
  for(const book of numbered)standalone.add(book.uri);
  // Series folders sometimes include additional, unnumbered full audiobooks.
  // Require audiobook-sized assets and substantive non-chapter filenames.
  for(const book of books){
    if(standalone.has(book.uri))continue;
    if(typeof book.fileSize!=='number'||book.fileSize<64*1024*1024)continue;
    if(book.embeddedMetadata?.trackNumber||book.embeddedMetadata?.discNumber)continue;
    const stem=fileStem(book.uri);
    if(stem.length<9||/^(?:\d{1,4}|chapter|track|part|pt|disc|disk|cd|scene|section)\b/i.test(stem))continue;
    if(book.embeddedMetadata?.workTitle
      && normal(albumWorkTitle(book.embeddedMetadata.workTitle))!==parentName)continue;
    standalone.add(book.uri);
  }
  return standalone;
}
function shouldGroupAudioBooks(books:SynchronizableBook[]){
  if(books.length<=1)return true;
  // Distinct embedded work titles are an explicit boundary: a mixed folder
  // must never collapse multiple actual books, even if filenames look generic.
  const distinctAlbums=new Set(books.map(book=>normal(albumWorkTitle(book.embeddedMetadata?.workTitle))).filter(Boolean));
  if(distinctAlbums.size>1)return false;
  const trackLike=books.every(book=>isGenericMediaTitle(fileStem(book.uri),'Audio',books.length));
  if(trackLike)return true;
  // Album/work tags are work-level evidence even when individual filenames are
  // descriptive chapter names. Require every sibling to provide the same value
  // so unrelated standalone audiobooks in one folder are never collapsed.
  const embeddedWorkTitles=books.map(book=>albumWorkTitle(book.embeddedMetadata?.workTitle)).filter(Boolean);
  if(embeddedWorkTitles.length===books.length&&new Set(embeddedWorkTitles.map(normal)).size===1)return true;
  const inferred=new Set(books.map(book=>{
    const identity=inferLocalBookMetadata(book.uri,'Audio',{siblingMediaCount:books.length});
    return [normal(identity.title),normal(identity.author),normal(identity.series),identity.seriesNumber??''].join('|');
  }));
  if(inferred.size===1)return true;
  const explicit=new Set(books.map(book=>String(book.workKey||'')).filter(key=>key&&key!=='unknown'));
  if(explicit.size===1&&explicit.size>0)return true;
  // Per-file scanner keys are not authoritative negative evidence; once a
  // nested audiobook folder is identified as a single work, keep it together.
  return audiobookFolderLooksLikeOneWork(books);
}
export function audioWorkGroupKeys<T extends SynchronizableBook>(books:T[]){
  const result=new Map<string,string>();
  const directories=new Map<string,T[]>();
  const rootCandidates=new Map<string,T[]>();
  const rootUngrouped:T[]=[];
  for(const book of books){
    if(book.format!=='Audio')continue;
    const dir=audioDirectoryKey(book);
    if(!dir){
      const rootKey=rootAudioIdentityKey(book);
      if(rootKey){
        const group=rootCandidates.get(rootKey)||[];
        group.push(book);rootCandidates.set(rootKey,group);
      }else rootUngrouped.push(book);
      continue;
    }
    const group=directories.get(dir)||[];group.push(book);directories.set(dir,group);
  }
  for(const [dir,allBooks] of directories){
    const solo=standaloneSeriesAudioUris(allBooks);
    for(const book of allBooks)if(solo.has(book.uri))result.set(book.uri,'audio-series-file:'+book.uri);
    const group=allBooks.filter(book=>!solo.has(book.uri));
    if(!group.length)continue;
    const albums=new Set(group.map(book=>normal(albumWorkTitle(book.embeddedMetadata?.workTitle))).filter(Boolean));
    if(albums.size>1){
      // Multiple album identities in one physical folder: partition only the
      // positively identified tracks, leaving ambiguous tracks independent.
      for(const book of group){
        const album=normal(albumWorkTitle(book.embeddedMetadata?.workTitle));
        result.set(book.uri,album?'audio-album:'+dir+':'+album:'audio-file:'+book.uri);
      }
    }else if(shouldGroupAudioBooks(group)){
      for(const book of group)result.set(book.uri,'audio-dir:'+dir);
    }else{
      for(const book of group)result.set(book.uri,'audio-file:'+book.uri);
    }
  }
  for(const [key,group] of rootCandidates){
    if(group.length>1){
      for(const book of group)result.set(book.uri,key);
    }else result.set(group[0].uri,'audio-file:'+group[0].uri);
  }
  for(const book of rootUngrouped)result.set(book.uri,'audio-file:'+book.uri);
  return result;
}
function coverScore(uri:string){
  const value=String(uri||'');
  if(!value)return -1;
  if(/manual-cover-/i.test(value))return 1000;
  if(/\/covers\/embedded-/i.test(value)||value.startsWith('data:image/'))return 930;
  if(value.startsWith('content://'))return 900;
  if(value.startsWith('file:')&&/\/covers\/online\//i.test(value))return 850;
  if(value.startsWith('file:'))return 880;
  if(/^https?:/i.test(value))return 600;
  return 500;
}
function bestCover(books:SynchronizableBook[]){
  const candidates:string[]=[];
  for(const book of books){
    if(book.coverUri)candidates.push(book.coverUri);
    for(const uri of book.coverCandidates||[])if(uri)candidates.push(uri);
  }
  return candidates
    .filter((value,index,all)=>all.indexOf(value)===index)
    .sort((a,b)=>coverScore(b)-coverScore(a))[0];
}

function canonicalField(books:SynchronizableBook[],field:SyncField,audio:boolean,inferredByUri:Map<string,ReturnType<typeof inferLocalBookMetadata>>){
  const entries=books.flatMap(book=>{
    const values:Array<{book:SynchronizableBook;value:any;source:SyncSource;confidence:SyncConfidence;key:string;workHint?:boolean}>=[];
    const value=(book as any)[field];
    const genericRootValue=field==='author'&&present(value)&&isLibraryRootLabel(String(value));
    if(sourceFor(book,field)==='manual'){
      return [{book,value,source:'manual' as const,confidence:'high' as const,key:normal(value)}];
    }
    if(present(value)&&!genericRootValue){
      const source=sourceFor(book,field);
      const confidence=confidenceFor(book,field);
      values.push({book,value,source,confidence,key:normal(value)});
    }
    if(audio&&['title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description'].includes(field)){
      if(field==='title'){
        const workTitle=albumWorkTitle(book.embeddedMetadata?.workTitle);
        if(present(workTitle)&&normal(workTitle)!==normal(value)){
          values.push({book,value:workTitle,source:'embedded',confidence:'high',key:normal(workTitle),workHint:true});
        }
      }
      const onlineValue=book.onlineMetadataMatch?.fields?.[field];
      if(present(onlineValue)&&normal(onlineValue)!==normal(value)){
        values.push({
          book,
          value:onlineValue,
          source:'online',
          confidence:book.onlineMetadataMatch?.confidence||'high',
          key:normal(onlineValue),
          workHint:true,
        });
      }
      let inferred=inferredByUri.get(book.uri);
      if(!inferred){inferred=inferLocalBookMetadata(book.uri,'Audio',{siblingMediaCount:books.length,rootUri:book.rootUri});inferredByUri.set(book.uri,inferred);}
      const pathValue=(inferred as any)[field];
      if(present(pathValue)&&normal(pathValue)!==normal(value)){
        values.push({book,value:pathValue,source:'path',confidence:inferred.confidence,key:normal(pathValue)});
      }
      if(field==='title'&&books.length>1&&isGenericMediaTitle(fileStem(book.uri),'Audio',books.length)){
        const folderTitle=audioBookFolderTitle(book.uri);
        if(folderTitle&&normal(folderTitle)!==normal(value)&&normal(folderTitle)!==normal(pathValue)){
          values.push({book,value:folderTitle,source:'path',confidence:'high',key:normal(folderTitle),workHint:true});
        }else if(folderTitle&&normal(folderTitle)===normal(pathValue)){
          const candidate=values.find(item=>item.source==='path'&&item.key===normal(folderTitle));
          if(candidate)candidate.workHint=true;
        }
      }
    }
    return values;
  });
  if(!entries.length)return undefined;
  const frequency=new Map<string,number>();
  for(const entry of entries)frequency.set(entry.key,(frequency.get(entry.key)||0)+1);
  const groupSize=Math.max(1,books.length);
  const ranked=entries.map(entry=>{
    let score=sourceRank[entry.source]+confidenceRank[entry.confidence]+Math.min(90,Math.max(0,(frequency.get(entry.key)||1)-1)*18)+(entry.workHint?120:0);
    const repeated=(frequency.get(entry.key)||1)/groupSize;
    let authority=entry.source==='manual'?3:entry.source==='sidecar'?2:entry.source==='embedded'?1:0;
    if(audio){
      if(field==='title'){
        // TIT2/©nam often contains chapter names. An embedded title must have a
        // strict majority across a multi-track audiobook before it can beat the
        // folder/path work identity. This keeps chapter names on tracks without
        // allowing a 2-track 50/50 split to become the book title.
        if(groupSize>1&&entry.source==='embedded'&&repeated<=.5){score-=280;authority=0;}
        if(isGenericMediaTitle(String(entry.value),'Audio',groupSize))score-=320;
      }else if(groupSize>1&&['author','series','seriesNumber','genre','publishedYear','narrator','isbn','asin'].includes(field)){
        // Work-level audiobook tags should converge across tracks. A single
        // embedded/provider outlier may still fill an otherwise empty field,
        // but it must not overrule repeated work evidence from the library path
        // or the majority of sibling tracks.
        if((entry.source==='embedded'||entry.source==='online')&&repeated<=.5){
          score-=250;
          if(entry.source==='embedded')authority=0;
        }
      }
    }
    return {...entry,score,authority};
  }).sort((a,b)=>b.authority-a.authority||b.score-a.score);
  return ranked[0];
}

export function canonicalMetadataForBooks(books:SynchronizableBook[],standaloneSeries=false):CanonicalMetadata{
  const audio=books.some(book=>book.format==='Audio');
  const selected:Partial<Record<SyncField,ReturnType<typeof canonicalField>>>={};
  const inferredByUri=new Map<string,ReturnType<typeof inferLocalBookMetadata>>();
  for(const field of fields)selected[field]=canonicalField(books,field,audio,inferredByUri);

  // Multipart filenames can carry a reliable work title even when each
  // per-track title is only "Chapter 01". Require every grouped track to agree.
  if(audio&&selected.title?.source!=='manual'){
    const filenameTitles=books.map(book=>audioMultipartWorkTitle(fileStem(book.uri))).filter(Boolean);
    const filenameNormalized=[...new Set(filenameTitles.map(normal))];
    if(filenameTitles.length===books.length&&filenameNormalized.length===1){
      selected.title={
        book:books[0],
        value:filenameTitles[0],
        source:'path',
        confidence:'high',
        key:filenameNormalized[0],
        workHint:true,
        score:Number.MAX_SAFE_INTEGER-1,
        authority:0,
      } as any;
    }
  }

  // Descriptive chapter titles (e.g. "An unexpected visitor") are not
  // competing book identities. If a positively identified book folder holds
  // multiple distinct chapter titles, use the enclosing folder as the *work*
  // title. The individual track titles stay untouched. Repeated authoritative
  // work titles, explicit manual identity and embedded album/work titles win.
  if(audio&&books.length>1&&selected.title?.source!=='manual'
    &&!(selected.title?.source==='online'&&selected.title.confidence==='high'&&selected.title.workHint)
    &&!(selected.title?.source==='sidecar'&&selected.title.confidence==='high')
    &&audiobookFolderLooksLikeOneWork(books)){
    const folderTitle=audioBookFolderTitle(books[0].uri);
    const titleVotes=books.filter(book=>normal(book.title)===normal(selected.title?.value)).length;
    const distinctTitles=new Set(books.map(book=>normal(book.title)).filter(Boolean));
    if(folderTitle&&distinctTitles.size>1&&titleVotes<=books.length/2){
      selected.title={
        book:books[0],value:folderTitle,source:'path',confidence:'high',
        key:normal(folderTitle),workHint:true,score:Number.MAX_SAFE_INTEGER-2,authority:0,
      } as any;
    }
  }

  // Album/work title is stronger work-level evidence, while TIT2/©nam is
  // commonly a chapter title. When grouped tracks agree on one embedded work
  // title, use it explicitly unless the user supplied a manual title.
  if(audio&&selected.title?.source!=='manual'){
    // Always use validated work-level album evidence; a repeated "Disc 2" or
    // "Chapter 03" TALB is not an audiobook title or a work identity.
    const workTitles=books.map(book=>albumWorkTitle(book.embeddedMetadata?.workTitle)).filter(Boolean);
    const normalized=[...new Set(workTitles.map(normal))];
    if(workTitles.length>0&&normalized.length===1){
      selected.title={
        book:books.find(book=>normal(albumWorkTitle(book.embeddedMetadata?.workTitle))===normalized[0])||books[0],
        value:workTitles[0],
        source:'embedded',
        confidence:'high',
        key:normalized[0],
        workHint:true,
        score:Number.MAX_SAFE_INTEGER,
        authority:1,
      } as any;
    }
  }

  // A folder marked as a multi-book series has one independently sized audio
  // file per edition. Recover each title from its filename if discovery
  // mistakenly used the shared parent series folder as the work title.
  if(audio&&standaloneSeries&&books.length===1){
    const book=books[0],stem=fileStem(book.uri),folderTitle=audioBookFolderTitle(book.uri);
    const numbered=stem.match(/^\s*(\d{1,3})\s*\.\s+(.+)$/);
    const filenameTitle=clean(numbered?.[2]||stem);
    const manual=sourceFor(book,'title')==='manual';
    const trusted=selected.title?.source==='embedded'||selected.title?.source==='sidecar'
      ||selected.title?.source==='online';
    if(!manual&&!trusted&&filenameTitle
      && !isGenericMediaTitle(filenameTitle,'Audio',1)
      && (normal(selected.title?.value)===normal(folderTitle)||normal(book.title)===normal(folderTitle)
        ||normal(selected.title?.value)===normal(stem)||!selected.title)){
      selected.title={book,value:filenameTitle,source:'path',confidence:'high',
        key:normal(filenameTitle),workHint:true,score:Number.MAX_SAFE_INTEGER,authority:0} as any;
    }
    if(folderTitle&&!selected.series){
      selected.series={book,value:folderTitle,source:'path',confidence:'medium',
        key:normal(folderTitle),workHint:true,score:1,authority:0} as any;
    }
    if(numbered&&!selected.seriesNumber){
      selected.seriesNumber={book,value:Number(numbered[1]),source:'path',confidence:'medium',
        key:normal(numbered[1]),workHint:true,score:1,authority:0} as any;
    }
  }

  const value=(field:SyncField)=>selected[field]?.value;
  const provenance:CanonicalMetadata['provenance']={};
  const confidence:CanonicalMetadata['confidence']={};
  for(const field of fields){
    const item=selected[field];
    if(item){provenance[field]=item.source;confidence[field]=item.confidence;}
  }
  return {
    title:clean(value('title')),
    author:clean(value('author')),
    series:clean(value('series')),
    seriesNumber:present(value('seriesNumber'))?Number(value('seriesNumber')):undefined,
    genre:clean(value('genre')),
    publishedYear:present(value('publishedYear'))?Number(value('publishedYear')):undefined,
    narrator:clean(value('narrator')),
    publisher:clean(value('publisher')),
    isbn:clean(value('isbn')),
    asin:clean(value('asin')),
    language:clean(value('language')),
    description:clean(value('description')),
    coverUri:bestCover(books),
    provenance,
    confidence,
  };
}

function canPropagate(book:SynchronizableBook,field:SyncField,canonical:CanonicalMetadata){
  const target=(book as any)[field];
  if(sourceFor(book,field)==='manual')return false;
  if(!present(target))return true;
  if(field==='author'&&isLibraryRootLabel(String(target)))return true;
  const targetSource=sourceFor(book,field);
  if(targetSource==='manual')return false;
  const canonicalSource=canonical.provenance[field]||'path';
  if(field==='title'&&book.format==='Audio'&&targetSource==='embedded'&&!isGenericMediaTitle(String(target),'Audio',2))return false;
  return sourceRank[canonicalSource]>sourceRank[targetSource];
}

function applyCanonical<T extends SynchronizableBook>(book:T,canonical:CanonicalMetadata,audioGroupSize:number,standaloneSeries=false):T{
  const next:any={...book};
  const provenance={...(book.metadataProvenance||{})};
  const confidence={...(book.metadataFieldConfidence||{})};
  for(const field of fields){
    const value=(canonical as any)[field];
    const correctedSeriesTitle=field==='title'&&standaloneSeries
      && sourceFor(book,'title')==='path'
      && (normal(book.title)===normal(audioBookFolderTitle(book.uri))
          ||normal(book.title)===normal(fileStem(book.uri)))
      && normal(book.title)!==normal(canonical.title);
    if(!present(value)||(!correctedSeriesTitle&&!canPropagate(book,field,canonical)))continue;
    next[field]=value;
    provenance[field]=canonical.provenance[field]||'path';
    confidence[field]=canonical.confidence[field]||'low';
  }
  next.metadataProvenance=provenance;
  next.metadataFieldConfidence=confidence;
  if(!next.coverUri&&canonical.coverUri){
    next.coverUri=canonical.coverUri;
    next.coverCandidates=[canonical.coverUri,...(book.coverCandidates||[]).filter((uri:string)=>uri!==canonical.coverUri)];
  }else if(next.coverUri&&canonical.coverUri){
    next.coverCandidates=[next.coverUri,canonical.coverUri,...(book.coverCandidates||[]).filter((uri:string)=>uri!==next.coverUri&&uri!==canonical.coverUri)];
  }
  if(book.format==='Audio'){
    const identity={
      title:canonical.title||next.title,
      author:canonical.author||next.author,
      series:canonical.series||next.series,
      seriesNumber:canonical.seriesNumber??next.seriesNumber,
      isbn:canonical.isbn||next.isbn,
      asin:canonical.asin||next.asin,
    };
    next.workKey=logicalWorkKey(identity);
    next.editionKey=editionKey(identity,book.format);
    const importantConflict=(next.metadataConflicts||[]).some((conflict:any)=>['title','author','series','seriesNumber','isbn','asin'].includes(String(conflict?.field||'')));
    const resolved=!!canonical.title&&!!canonical.author&&!isGenericMediaTitle(canonical.title,'Audio',audioGroupSize);
    next.needsReview=!resolved||importantConflict;
    next.reviewReason=next.needsReview?(importantConflict?'Conflicting metadata needs review.':'Title or author still needs review.'):'';
  }else{
    next.workKey=logicalWorkKey(next);
    next.editionKey=editionKey(next,book.format);
  }
  return next as T;
}

export function synchronizeLocalMetadata<T extends SynchronizableBook>(books:T[]):{books:T[];updated:number;audioGroups:number}{
  let next=books.slice();
  const audioGroups=new Map<string,number[]>();
  const audioKeys=audioWorkGroupKeys(next);
  next.forEach((book,index)=>{
    if(book.format!=='Audio')return;
    const key=audioKeys.get(book.uri)||('audio-file:'+book.uri);
    const indexes=audioGroups.get(key)||[];
    indexes.push(index);audioGroups.set(key,indexes);
  });
  let updated=0;
  for(const [key,indexes] of audioGroups.entries()){
    const group=indexes.map(index=>next[index]);
    const canonical=canonicalMetadataForBooks(group,key.startsWith('audio-series-file:'));
    for(const index of indexes){
      const before=next[index];
      const after=applyCanonical(before,canonical,indexes.length,key.startsWith('audio-series-file:'));
      if(syncMateriallyChanged(before,after)){next[index]=after;updated++;}
    }
  }

  // Conservative cross-format synchronization: only records already agreeing on
  // exact normalized title+author share missing work-level fields. Edition-specific
  // identifiers, narrator and cover art never cross formats.
  const exactWorks=new Map<string,number[]>();
  next.forEach((book,index)=>{
    if(!book.title||!book.author)return;
    const key=normal(book.title)+'|'+normal(book.author);
    if(!key.replace(/\|/g,''))return;
    const indexes=exactWorks.get(key)||[];indexes.push(index);exactWorks.set(key,indexes);
  });
  for(const indexes of exactWorks.values()){
    if(indexes.length<2)continue;
    const group=indexes.map(index=>next[index]);
    const canonical=canonicalMetadataForBooks(group);
    for(const index of indexes){
      const before=next[index],after:any={...before};
      let changed=false;
      for(const field of ['series','seriesNumber','genre','publishedYear','description'] as SyncField[]){
        const value=(canonical as any)[field];
        if(!present((after as any)[field])&&present(value)){
          (after as any)[field]=value;
          after.metadataProvenance={...(after.metadataProvenance||{}),[field]:canonical.provenance[field]||'path'};
          after.metadataFieldConfidence={...(after.metadataFieldConfidence||{}),[field]:canonical.confidence[field]||'low'};
          changed=true;
        }
      }
      if(changed){
        after.workKey=logicalWorkKey(after);
        after.editionKey=editionKey(after,after.format);
        next[index]=after;updated++;
      }
    }
  }
  return {books:next,updated,audioGroups:audioGroups.size};
}


export async function synchronizeLocalMetadataCooperative<T extends SynchronizableBook>(
  books:T[],
  options:{shouldContinue?:()=>boolean;batchSize?:number}={},
):Promise<{books:T[];updated:number;audioGroups:number}>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const batchSize=Math.max(8,Math.min(256,Math.trunc(options.batchSize||48)));
  let operations=0;
  const yieldIfNeeded=async(force=false)=>{
    operations+=1;
    if(!force&&operations%batchSize!==0)return;
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  };

  let next=books.slice();
  const audioGroups=new Map<string,number[]>();
  const audioKeys=audioWorkGroupKeys(next);
  next.forEach((book,index)=>{
    if(book.format!=='Audio')return;
    const key=audioKeys.get(book.uri)||('audio-file:'+book.uri);
    const indexes=audioGroups.get(key)||[];
    indexes.push(index);
    audioGroups.set(key,indexes);
  });

  let updated=0;
  for(const [key,indexes] of audioGroups.entries()){
    if(!shouldContinue())break;
    const group=indexes.map(index=>next[index]);
    const canonical=canonicalMetadataForBooks(group,key.startsWith('audio-series-file:'));
    for(const index of indexes){
      if(!shouldContinue())break;
      const before=next[index];
      const after=applyCanonical(before,canonical,indexes.length,key.startsWith('audio-series-file:'));
      if(syncMateriallyChanged(before,after)){next[index]=after;updated++;}
      await yieldIfNeeded();
    }
  }

  if(shouldContinue()){
    const exactWorks=new Map<string,number[]>();
    next.forEach((book,index)=>{
      if(!book.title||!book.author)return;
      const key=normal(book.title)+'|'+normal(book.author);
      if(!key.replace(/\|/g,''))return;
      const indexes=exactWorks.get(key)||[];
      indexes.push(index);
      exactWorks.set(key,indexes);
    });
    for(const indexes of exactWorks.values()){
      if(!shouldContinue())break;
      if(indexes.length<2)continue;
      const group=indexes.map(index=>next[index]);
      const canonical=canonicalMetadataForBooks(group);
      for(const index of indexes){
        if(!shouldContinue())break;
        const before=next[index],after:any={...before};
        let changed=false;
        for(const field of ['series','seriesNumber','genre','publishedYear','description'] as SyncField[]){
          const value=(canonical as any)[field];
          if(!present((after as any)[field])&&present(value)){
            (after as any)[field]=value;
            after.metadataProvenance={...(after.metadataProvenance||{}),[field]:canonical.provenance[field]||'path'};
            after.metadataFieldConfidence={...(after.metadataFieldConfidence||{}),[field]:canonical.confidence[field]||'low'};
            changed=true;
          }
        }
        if(changed){
          after.workKey=logicalWorkKey(after);
          after.editionKey=editionKey(after,after.format);
          next[index]=after;
          updated+=1;
        }
        await yieldIfNeeded();
      }
    }
  }

  await yieldIfNeeded(true);
  return {books:next,updated,audioGroups:audioGroups.size};
}
