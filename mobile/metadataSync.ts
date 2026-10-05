import {decodedPathParts,editionKey,inferLocalBookMetadata,isGenericMediaTitle,isLibraryRootLabel,logicalWorkKey} from './libraryIntelligence';

export type SyncSource='manual'|'sidecar'|'embedded'|'online'|'path';
export type SyncConfidence='high'|'medium'|'low';
export type SynchronizableBook={
  uri:string;
  format:string;
  space?:string;
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
  embeddedMetadata?:{workTitle?:string};
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
function rootAudioTrackFamily(stem:string){
  const value=clean(stem);
  const patterns=[
    /^(.*?)\s*[-._:]?\s*(?:part|pt|chapter|ch|track|disc|disk|cd)\s*[-_.:#]?\s*\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?(?:\s*[-._:].*)?$/i,
    /^(.*?)\s*[-._:]\s*\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?(?:\s*[-._:].*)?$/i,
    /^(.*?)\s*\((?:part|pt|chapter|ch|track)\s*\d{1,4}\)\s*$/i,
  ];
  for(const pattern of patterns){
    const match=value.match(pattern);
    const family=clean(match?.[1]||'');
    if(normal(family).length>=3)return family;
  }
  return '';
}
function rootAudioIdentityKey(book:SynchronizableBook){
  const scope=normal(book.space||'library');
  const id=normal(book.asin||book.isbn||'');
  if(id)return 'audio-root:'+scope+':id:'+id;
  const workTitle=clean(book.embeddedMetadata?.workTitle||'');
  if(workTitle){
    const author=normal(book.author||'');
    return 'audio-root:'+scope+':work:'+normal(workTitle)+(author?'|'+author:'');
  }
  const family=rootAudioTrackFamily(fileStem(book.uri));
  if(family){
    const author=normal(book.author||'');
    return 'audio-root:'+scope+':name:'+normal(family)+(author?'|'+author:'');
  }
  return '';
}

function shouldGroupAudioBooks(books:SynchronizableBook[]){
  if(books.length<=1)return true;
  const trackLike=books.every(book=>isGenericMediaTitle(fileStem(book.uri),'Audio',books.length));
  if(trackLike)return true;
  const inferred=new Set(books.map(book=>{
    const identity=inferLocalBookMetadata(book.uri,'Audio',{siblingMediaCount:books.length});
    return [normal(identity.title),normal(identity.author),normal(identity.series),identity.seriesNumber??''].join('|');
  }));
  if(inferred.size===1)return true;
  const explicit=new Set(books.map(book=>String(book.workKey||'')).filter(key=>key&&key!=='unknown'));
  return explicit.size===1&&explicit.size>0;
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
  for(const [dir,group] of directories){
    if(shouldGroupAudioBooks(group)){
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

function canonicalField(books:SynchronizableBook[],field:SyncField,audio:boolean){
  const entries=books.flatMap(book=>{
    const values:Array<{book:SynchronizableBook;value:any;source:SyncSource;confidence:SyncConfidence;key:string;workHint?:boolean}>=[];
    const value=(book as any)[field];
    const genericRootValue=field==='author'&&present(value)&&isLibraryRootLabel(String(value));
    if(present(value)&&!genericRootValue){
      const source=sourceFor(book,field);
      const confidence=confidenceFor(book,field);
      values.push({book,value,source,confidence,key:normal(value)});
    }
    if(audio&&['title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description'].includes(field)){
      if(field==='title'){
        const workTitle=book.embeddedMetadata?.workTitle;
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
      const inferred=inferLocalBookMetadata(book.uri,'Audio',{siblingMediaCount:books.length});
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

export function canonicalMetadataForBooks(books:SynchronizableBook[]):CanonicalMetadata{
  const audio=books.some(book=>book.format==='Audio');
  const selected:Partial<Record<SyncField,ReturnType<typeof canonicalField>>>={};
  for(const field of fields)selected[field]=canonicalField(books,field,audio);

  // Album/work title is work-level evidence, while TIT2/©nam is commonly a
  // chapter title. When the grouped tracks agree on one embedded work title,
  // use it explicitly unless the user supplied a manual title.
  if(audio&&selected.title?.source!=='manual'){
    const workTitles=books.map(book=>clean(book.embeddedMetadata?.workTitle||'')).filter(Boolean);
    const normalized=[...new Set(workTitles.map(normal))];
    if(workTitles.length>0&&normalized.length===1){
      selected.title={
        book:books.find(book=>normal(book.embeddedMetadata?.workTitle||'')===normalized[0])||books[0],
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
  if(!present(target))return true;
  if(field==='author'&&isLibraryRootLabel(String(target)))return true;
  const targetSource=sourceFor(book,field);
  if(targetSource==='manual')return false;
  const canonicalSource=canonical.provenance[field]||'path';
  if(field==='title'&&book.format==='Audio'&&targetSource==='embedded'&&!isGenericMediaTitle(String(target),'Audio',2))return false;
  return sourceRank[canonicalSource]>sourceRank[targetSource];
}

function applyCanonical<T extends SynchronizableBook>(book:T,canonical:CanonicalMetadata,audioGroupSize:number):T{
  const next:any={...book};
  const provenance={...(book.metadataProvenance||{})};
  const confidence={...(book.metadataFieldConfidence||{})};
  for(const field of fields){
    const value=(canonical as any)[field];
    if(!present(value)||!canPropagate(book,field,canonical))continue;
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
  for(const indexes of audioGroups.values()){
    const group=indexes.map(index=>next[index]);
    const canonical=canonicalMetadataForBooks(group);
    for(const index of indexes){
      const before=next[index];
      const after=applyCanonical(before,canonical,indexes.length);
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
  for(const indexes of audioGroups.values()){
    if(!shouldContinue())break;
    const group=indexes.map(index=>next[index]);
    const canonical=canonicalMetadataForBooks(group);
    for(const index of indexes){
      if(!shouldContinue())break;
      const before=next[index];
      const after=applyCanonical(before,canonical,indexes.length);
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
