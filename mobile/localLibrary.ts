import {NativeModules,Platform} from 'react-native';
import {getInfoAsync, readAsStringAsync, StorageAccessFramework} from 'expo-file-system/legacy';
import {applyLocalMetadata, inferLocalBookMetadata, IdentificationConfidence, LocalMetadataFields, parseLocalSidecar} from './libraryIntelligence';

export type LocalBook = {
  id: number;
  uri: string;
  title: string;
  author: string;
  series: string;
  genre: string;
  publishedYear?: number;
  publisher?: string;
  seriesIndex?: number;
  isbn?: string;
  identifiers?: string[];
  format: string;
  space: string;
  available: boolean;
  identificationConfidence?: IdentificationConfidence;
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  metadataSource?: 'path' | 'sidecar' | 'manual' | 'embedded' | 'online';
  coverUri?: string;
  livingBookCoverUri?: string;
  livingBookCoverSource?: 'embedded' | 'open-library' | 'google-books' | 'manual' | 'jacket' | 'none';
  livingBookCoverConfidence?: number;
  metadataProvider?: 'open-library' | 'google-books';
  metadataProviderId?: string;
  workTitleHint?: string;
  trackTitle?: string;
  trackNumber?: number;
  discNumber?: number;
  sourceUri?: string;
  documentId?: string;
  size?: number;
  modified?: number;
  metadataContextSignature?: string;
  assetSignature?: string;
  scanReused?: boolean;
};

export type LocalSortHistory = {
  id: string;
  createdAt: string;
  copied: Array<{id: string; title: string; uri: string}>;
  failed: Array<{id: string; title: string; error: string}>;
};

export type LocalSortRecoveryResult = {
  copied: Array<{id: string; title: string; uri: string}>;
  failed: Array<{id: string; title: string; error: string}>;
};

export type LocalFolder = {
  id: string;
  uri: string;
  name: string;
  status: string;
  itemCount: number;
  scannedAt?: string;
};

export type LocalScanProgress = {
  phase: 'discovering' | 'identifying' | 'complete';
  currentFolder: string;
  entriesVisited: number;
  found: number;
  review: number;
};

export type LocalMetadataOverride = {
  title: string;
  author: string;
  series: string;
  genre: string;
  publishedYear?: number;
  publisher?: string;
  seriesIndex?: number;
  isbn?: string;
  identifiers?: string[];
};

export type LocalScanResult = {
  folders: LocalFolder[];
  books: LocalBook[];
  skipped: number;
  truncated: boolean;
  truncatedReason?: 'book-limit' | 'entry-limit';
  identified: number;
  review: number;
};

export type LocalScanOptions = {
  reuse?: ReadonlyMap<string, LocalBook>;
  forceMetadata?: boolean;
};

const supported = new Map<string, string>([
  ['epub', 'EPUB'],
  ['pdf', 'PDF'],
  ['cbz', 'Comic'],
  ['zip', 'Comic'],
  ['cbr', 'Comic'],
  ['cbt', 'Comic'],
  ['mp3', 'Audio'],
  ['m4a', 'Audio'],
  ['m4b', 'Audio'],
  ['aac', 'Audio'],
  ['ogg', 'Audio'],
  ['opus', 'Audio'],
  ['flac', 'Audio'],
  ['wav', 'Audio'],
  ['wma', 'Audio'],
  ['aif', 'Audio'],
  ['aiff', 'Audio'],
  ['oga', 'Audio'],
  ['mka', 'Audio'],
]);

const maxEntriesPerScan = 10000;
const maxVisitedEntriesPerScan = 50000;
const knownNonDirectoryExtensions = new Set([
  ...supported.keys(),
  'cbr','cbt','opf','nfo','jpg','jpeg','png','webp','gif','txt','cue','m3u','m3u8','json','xml','srt',
]);
const maxDepth = 8;

export function localFolderName(uri: string) {
  try {
    const decoded = decodeURIComponent(uri);
    const marker = decoded.includes('/document/') ? decoded.split('/document/').pop() || decoded : decoded;
    const last = marker.split(/[/:]/).filter(Boolean).pop();
    return last || 'Phone folder';
  } catch {
    return 'Phone folder';
  }
}

export async function pickLocalFolder(): Promise<LocalFolder | null> {
  if (Platform.OS !== 'android') {
    throw Error('Folder access is available in the Android app.');
  }
  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!result.granted || !result.directoryUri) return null;
  return {
    id: result.directoryUri,
    uri: result.directoryUri,
    name: localFolderName(result.directoryUri),
    status: 'Ready to scan',
    itemCount: 0,
  };
}

type NativeLibraryScanItem = {
  uri: string;
  documentId: string;
  name: string;
  parentId: string;
  mimeType: string;
  size: number;
  modified: number;
  role: 'media' | 'sidecar' | 'artwork' | 'directory-context' | 'directory-end';
  format: string;
};

type NativeLibraryScanBatch = {
  items: NativeLibraryScanItem[];
  done: boolean;
  visited: number;
  found: number;
  errors: number;
  lastError?: string;
};

type NativeDocumentMetadata = {
  uri:string;
  title?:string;
  author?:string;
  series?:string;
  seriesIndex?:number;
  genre?:string;
  publisher?:string;
  year?:number;
  isbn?:string;
  identifiers?:string[];
  error?:string;
};

type NativeAudioMetadata = {
  uri: string;
  title?: string;
  album?: string;
  artist?: string;
  albumArtist?: string;
  author?: string;
  genre?: string;
  track?: string;
  disc?: string;
  year?: string;
  duration?: string;
  error?: string;
};
type NativeLibraryScanner = {
  startTreeScan: (uri: string) => Promise<string>;
  readTreeScanBatch: (scanId: string, limit: number) => Promise<NativeLibraryScanBatch>;
  cancelTreeScan: (scanId: string) => Promise<boolean>;
  readAudioMetadataBatch?: (uris: string[]) => Promise<NativeAudioMetadata[]>;
  readDocumentMetadataBatch?: (items: Array<{uri:string;format:string;name:string}>) => Promise<NativeDocumentMetadata[]>;
  extractAudioArtwork?: (uri: string) => Promise<{uri:string;mimeType:string;width:number;height:number}|null>;
};

const nativeLibraryScanner = (NativeModules.ArchivistLibrary || null) as NativeLibraryScanner | null;

export async function extractLocalAudioArtwork(uri:string){
  if(Platform.OS!=='android'||!nativeLibraryScanner?.extractAudioArtwork)return null;
  return nativeLibraryScanner.extractAudioArtwork(uri);
}

function embeddedAudioWorkTitle(title:string|undefined,uri:string,oneFileWork:boolean){
  const raw=cleanMetadataValue(title);
  if(!raw)return '';
  if(oneFileWork)return raw;
  const generic=/^(?:chapter|chap|ch|part|pt|track|disc|disk|cd)\s*[-_. ]*0*\d{1,4}(?:\b.*)?$/i;
  if(generic.test(raw)||/^0*\d{1,4}(?:\s*[-._:]\s*.*)?$/.test(raw))return '';
  const patterns=[
    /^(.+?)\s+-\s+(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b.*)?$/i,
    /^(.+?)\s+(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b.*)?$/i,
    /^(.+?)\s+-\s+0*\d{1,4}(?:\s*[-._].*)?$/i,
    /^(.+?)[._-](?:ch|pt|track)0*\d{1,4}$/i,
  ];
  for(const pattern of patterns){
    const match=raw.match(pattern);
    const base=cleanMetadataValue(match?.[1]);
    if(base.length>=4)return base;
  }
  const file=fileNameFromUri(uri).replace(/\.[^.]+$/,'');
  if(file&&raw.toLowerCase()===file.toLowerCase())return '';
  return '';
}

function embeddedAudioTitleCounts(metadata:Iterable<NativeAudioMetadata>){
  const counts=new Map<string,number>();
  for(const item of metadata){
    const title=cleanMetadataValue(item.title);
    if(!title)continue;
    const author=cleanMetadataValue(item.albumArtist||item.author||item.artist);
    const key=(author+'|'+title).toLowerCase();
    counts.set(key,(counts.get(key)||0)+1);
  }
  return counts;
}

function repeatedEmbeddedAudioWorkTitle(item:NativeAudioMetadata|undefined,counts:Map<string,number>){
  if(!item)return '';
  const title=cleanMetadataValue(item.title);
  if(!title)return '';
  const author=cleanMetadataValue(item.albumArtist||item.author||item.artist);
  const key=(author+'|'+title).toLowerCase();
  if((counts.get(key)||0)<2)return '';
  if(/^(?:chapter|chap|ch|part|pt|track|disc|disk|cd)\b/i.test(title))return '';
  return title;
}

export type DeepScanEvidenceSummary={
  files:number;
  embeddedFiles:number;
  titleHints:string[];
  authors:string[];
  albums:string[];
  trackNumbers:number;
  identifiers:string[];
};

export function deepScanEvidenceSummary(tracks:LocalBook[]):DeepScanEvidenceSummary{
  const unique=(values:string[])=>[...new Set(values.map(cleanMetadataValue).filter(Boolean))];
  return {
    files:tracks.length,
    embeddedFiles:tracks.filter(track=>track.metadataSource==='embedded'||!!track.workTitleHint||!!track.trackTitle).length,
    titleHints:unique(tracks.flatMap(track=>[track.workTitleHint||'',track.title||''])).slice(0,6),
    authors:unique(tracks.map(track=>track.author||'')).slice(0,6),
    albums:unique(tracks.map(track=>track.workTitleHint||'')).slice(0,6),
    trackNumbers:tracks.filter(track=>!!track.trackNumber).length,
    identifiers:unique(tracks.flatMap(track=>[track.isbn||'',...(track.identifiers||[])])).slice(0,8),
  };
}

export async function deepScanLocalTracks(tracks:LocalBook[]):Promise<LocalBook[]>{
  const next=tracks.map(track=>({...track}));
  if(Platform.OS!=='android'||!nativeLibraryScanner||!next.length)return next;

  const audio=next.filter(track=>track.format==='Audio');
  const audioByUri=new Map<string,NativeAudioMetadata>();
  if(audio.length&&nativeLibraryScanner.readAudioMetadataBatch){
    for(let offset=0;offset<audio.length;offset+=24){
      try{
        const metadata=await nativeLibraryScanner.readAudioMetadataBatch(audio.slice(offset,offset+24).map(track=>track.uri));
        for(const item of metadata||[])if(item?.uri)audioByUri.set(item.uri,item);
      }catch{
        // Deep scan is advisory. One unreadable file must not fail the work.
      }
      await yieldToUi();
    }
  }

  const deepAudioTitleCounts=embeddedAudioTitleCounts(audioByUri.values());

  const documents=next.filter(track=>track.format==='EPUB'||track.format==='Comic');
  const documentByUri=new Map<string,NativeDocumentMetadata>();
  if(documents.length&&nativeLibraryScanner.readDocumentMetadataBatch){
    for(let offset=0;offset<documents.length;offset+=24){
      try{
        const chunk=documents.slice(offset,offset+24);
        const metadata=await nativeLibraryScanner.readDocumentMetadataBatch(
          chunk.map(track=>({uri:track.uri,format:track.format,name:fileNameFromUri(track.uri)})),
        );
        for(const item of metadata||[])if(item?.uri)documentByUri.set(item.uri,item);
      }catch{
        // Keep any other evidence and continue.
      }
      await yieldToUi();
    }
  }

  return next.map(track=>{
    if(track.format==='Audio'){
      const embedded=audioByUri.get(track.uri);
      if(!embedded)return track;
      const embeddedAuthor=embedded.albumArtist||embedded.author||embedded.artist||'';
      const oneFileWork=audio.length===1;
      const embeddedWorkTitle=embedded.album||embeddedAudioWorkTitle(embedded.title,track.uri,oneFileWork)||repeatedEmbeddedAudioWorkTitle(embedded,deepAudioTitleCounts);
      const strong=!!cleanMetadataValue(embeddedWorkTitle||track.title)&&!!cleanMetadataValue(embeddedAuthor||track.author);
      const preserveManual=track.metadataSource==='manual';
      return {
        ...track,
        ...(!preserveManual&&embeddedWorkTitle?{title:embeddedWorkTitle}:{}),
        ...(!preserveManual&&embeddedAuthor?{author:embeddedAuthor}:{}),
        ...(!preserveManual&&embedded.genre?{genre:embedded.genre}:{}),
        ...(!preserveManual&&metadataYear(embedded.year)?{publishedYear:metadataYear(embedded.year)}:{}),
        ...(!preserveManual&&(embeddedWorkTitle||embeddedAuthor||embedded.genre||embedded.year)?{metadataSource:'embedded' as const}:{}),
        ...(!preserveManual&&strong?{identificationConfidence:'high' as const,needsReview:false,reviewReason:''}:{}),
        workTitleHint:embedded.album||embeddedAudioWorkTitle(embedded.title,track.uri,oneFileWork)||repeatedEmbeddedAudioWorkTitle(embedded,deepAudioTitleCounts)||track.workTitleHint,
        trackTitle:embedded.title||track.trackTitle,
        trackNumber:metadataIndex(embedded.track)||track.trackNumber,
        discNumber:metadataIndex(embedded.disc)||track.discNumber,
      };
    }

    const embedded=documentByUri.get(track.uri);
    if(!embedded)return track;
    const preserveManual=track.metadataSource==='manual';
    const resolvedTitle=cleanMetadataValue(embedded.title||track.title);
    const resolvedAuthor=cleanMetadataValue(embedded.author||track.author);
    const strong=!!resolvedTitle&&resolvedTitle.toLowerCase()!=='untitled'&&!!resolvedAuthor;
    return {
      ...track,
      ...(!preserveManual&&embedded.title?{title:embedded.title}:{}),
      ...(!preserveManual&&embedded.author?{author:embedded.author}:{}),
      ...(!preserveManual&&embedded.series?{series:embedded.series}:{}),
      ...(!preserveManual&&embedded.genre?{genre:embedded.genre}:{}),
      ...(!preserveManual&&embedded.publisher?{publisher:embedded.publisher}:{}),
      ...(!preserveManual&&embedded.seriesIndex!==undefined?{seriesIndex:embedded.seriesIndex}:{}),
      ...(!preserveManual&&embedded.year?{publishedYear:embedded.year}:{}),
      ...(!preserveManual&&embedded.isbn?{isbn:embedded.isbn}:{}),
      ...(!preserveManual&&embedded.identifiers?.length?{identifiers:embedded.identifiers}:{}),
      ...(!preserveManual&&(embedded.title||embedded.author||embedded.series||embedded.genre||embedded.publisher||embedded.year||embedded.isbn||embedded.identifiers?.length)?{metadataSource:'embedded' as const}:{}),
      ...(!preserveManual&&strong?{identificationConfidence:'high' as const,needsReview:false,reviewReason:''}:{}),
    };
  });
}

function cleanMetadataValue(value:string|undefined){
  return String(value||'').replace(/\s+/g,' ').trim();
}

const yieldToUi = () => new Promise<void>(resolve => setTimeout(resolve, 0));

type NativeDirectoryContextFile={uri:string;size:number;modified:number};

function signatureHash(value:string){
  let h=2166136261;
  for(let index=0;index<value.length;index++){
    h^=value.charCodeAt(index);
    h=Math.imul(h,16777619);
  }
  return (h>>>0).toString(16).padStart(8,'0');
}

function directoryContextSignature(context:{
  sidecars:Map<string,NativeDirectoryContextFile>;
  artwork:Map<string,NativeDirectoryContextFile>;
}){
  const parts:string[]=[];
  for(const [stem,file] of context.sidecars){
    parts.push('s:'+stem+':'+file.uri+':'+file.size+':'+file.modified);
  }
  for(const [stem,file] of context.artwork){
    parts.push('a:'+stem+':'+file.uri+':'+file.size+':'+file.modified);
  }
  if(!parts.length)return 'none';
  return signatureHash(parts.sort().join('|'));
}

export function localAssetSignature(input:{
  documentId?:string;
  size?:number;
  modified?:number;
  contextSignature?:string;
}){
  const modified=Number(input.modified)||0;
  // A provider that does not expose modification time cannot safely prove the
  // content is unchanged, so deliberately force metadata inspection.
  if(modified<=0)return '';
  return signatureHash([
    String(input.documentId||''),
    String(Number(input.size)||0),
    String(modified),
    String(input.contextSignature||'none'),
  ].join('|'));
}

function reusableScanBook(previous:LocalBook|undefined,signature:string,sourceUri:string){
  return !!signature&&!!previous&&previous.assetSignature===signature&&previous.sourceUri===sourceUri;
}

async function scanLocalFoldersNative(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
  onBooks?: (books: LocalBook[], progress: LocalScanProgress) => void | Promise<void>,
  options: LocalScanOptions = {},
): Promise<LocalScanResult> {
  if (!nativeLibraryScanner) throw Error('Native library scanner is unavailable.');
  const books: LocalBook[] = [];
  let skipped = 0;
  let review = 0;
  let entriesVisited = 0;
  let visitedBeforeFolder = 0;
  const sidecarCache = new Map<string, LocalMetadataFields>();

  async function cachedSidecarFields(uri: string): Promise<LocalMetadataFields> {
    const cached = sidecarCache.get(uri);
    if (cached) return cached;
    let fields: LocalMetadataFields = {};
    try {
      const info = await getInfoAsync(uri);
      if (info.exists && (!('size' in info) || typeof info.size !== 'number' || info.size <= 2 * 1024 * 1024)) {
        fields = parseLocalSidecar(await readAsStringAsync(uri), extension(uri));
      }
    } catch {}
    sidecarCache.set(uri,fields);
    return fields;
  }

  const progress = (phase: LocalScanProgress['phase'], currentFolder: string): LocalScanProgress => ({
    phase,currentFolder,entriesVisited,found:books.length,review,
  });
  const report = (phase: LocalScanProgress['phase'], currentFolder: string) => {
    onProgress?.(progress(phase,currentFolder));
  };
  const nextFolders: LocalFolder[] = [];

  for (const folder of folders) {
    const contexts = new Map<string,{
      sidecars:Map<string,NativeDirectoryContextFile>;
      artwork:Map<string,NativeDirectoryContextFile>;
      mediaCount:number;
      audioOnly:boolean;
    }>();
    let mediaBuffer:NativeLibraryScanItem[]=[];
    let mediaParent='';
    let scanId = '';
    let lastVisited = 0;
    let nativeErrors = 0;
    const before = books.length;
    report('discovering',folder.name);

    const contextFor=(parentId:string)=>{
      const existing=contexts.get(parentId);
      if(existing)return existing;
      const created:{sidecars:Map<string,NativeDirectoryContextFile>;artwork:Map<string,NativeDirectoryContextFile>;mediaCount:number;audioOnly:boolean}={
        sidecars:new Map<string,NativeDirectoryContextFile>(),
        artwork:new Map<string,NativeDirectoryContextFile>(),
        mediaCount:0,
        audioOnly:false,
      };
      contexts.set(parentId,created);
      return created;
    };

    const identifyMedia=async(items:NativeLibraryScanItem[])=>{
      if(!items.length)return;
      report('identifying',folder.name);

      const signatures=new Map<string,{contextSignature:string;assetSignature:string;previous?:LocalBook}>();
      const changedAudio:NativeLibraryScanItem[]=[];
      for(const item of items){
        const context=contextFor(item.parentId);
        const contextSignature=directoryContextSignature(context);
        const assetSignature=localAssetSignature({
          documentId:item.documentId,
          size:item.size,
          modified:item.modified,
          contextSignature,
        });
        const previous=options.reuse?.get(item.uri);
        signatures.set(item.uri,{contextSignature,assetSignature,previous});
        if(
          item.format==='Audio'&&
          (!reusableScanBook(previous,assetSignature,folder.uri)||options.forceMetadata)
        ){
          changedAudio.push(item);
        }
      }

      const audioMetadataByUri=new Map<string,NativeAudioMetadata>();
      if(nativeLibraryScanner.readAudioMetadataBatch&&changedAudio.length){
        try{
          const metadata=await nativeLibraryScanner.readAudioMetadataBatch(changedAudio.map(item=>item.uri));
          for(const item of metadata||[])audioMetadataByUri.set(item.uri,item);
        }catch{
          // Embedded tags improve identity but never make discovery fail.
        }
      }

      const normalAudioTitleCounts=embeddedAudioTitleCounts(audioMetadataByUri.values());

      const documentMetadataByUri=new Map<string,NativeDocumentMetadata>();
      const changedDocuments=items.filter(item=>{
        if(item.format!=='EPUB'&&item.format!=='Comic')return false;
        const signature=signatures.get(item.uri);
        return !!signature&&(options.forceMetadata||!reusableScanBook(signature.previous,signature.assetSignature,folder.uri));
      });
      if(nativeLibraryScanner.readDocumentMetadataBatch&&changedDocuments.length){
        for(let offset=0;offset<changedDocuments.length;offset+=24){
          try{
            const chunk=changedDocuments.slice(offset,offset+24);
            const metadata=await nativeLibraryScanner.readDocumentMetadataBatch(
              chunk.map(item=>({uri:item.uri,format:item.format,name:item.name})),
            );
            for(const item of metadata||[])documentMetadataByUri.set(item.uri,item);
          }catch{
            // Embedded document metadata is evidence only; path/sidecar fallback remains available.
          }
        }
      }

      const produced:LocalBook[]=[];
      for(const item of items){
        const context=contextFor(item.parentId);
        const signature=signatures.get(item.uri)!;
        if(!options.forceMetadata&&reusableScanBook(signature.previous,signature.assetSignature,folder.uri)){
          const reused:LocalBook={
            ...signature.previous!,
            id:books.length+1,
            sourceUri:folder.uri,
            documentId:item.documentId,
            size:item.size,
            modified:item.modified,
            metadataContextSignature:signature.contextSignature,
            assetSignature:signature.assetSignature,
            scanReused:true,
            available:true,
          };
          if(reused.needsReview)review+=1;
          books.push(reused);
          produced.push(reused);
          continue;
        }

        let identity=inferLocalBookMetadata(item.uri,item.format);
        const embeddedDocument=documentMetadataByUri.get(item.uri);
        if(
          embeddedDocument&&
          (embeddedDocument.title||embeddedDocument.author||embeddedDocument.series||embeddedDocument.genre||
           embeddedDocument.publisher||embeddedDocument.year||embeddedDocument.isbn||embeddedDocument.identifiers?.length)
        ){
          identity=applyLocalMetadata(identity,{
            ...(embeddedDocument.title?{title:embeddedDocument.title}:{}),
            ...(embeddedDocument.author?{author:embeddedDocument.author}:{}),
            ...(embeddedDocument.series?{series:embeddedDocument.series}:{}),
            ...(embeddedDocument.genre?{genre:embeddedDocument.genre}:{}),
            ...(embeddedDocument.publisher?{publisher:embeddedDocument.publisher}:{}),
            ...(embeddedDocument.seriesIndex!==undefined?{seriesIndex:embeddedDocument.seriesIndex}:{}),
            ...(embeddedDocument.year?{publishedYear:embeddedDocument.year}:{}),
            ...(embeddedDocument.isbn?{isbn:embeddedDocument.isbn}:{}),
            ...(embeddedDocument.identifiers?.length?{identifiers:embeddedDocument.identifiers}:{}),
          },'embedded');
        }

        const embedded=item.format==='Audio'?audioMetadataByUri.get(item.uri):undefined;
        const embeddedAuthor=embedded?.albumArtist||embedded?.author||embedded?.artist||'';
        const oneFileWork=context.mediaCount===1;
        const embeddedWorkTitle=embedded?.album||embeddedAudioWorkTitle(embedded?.title,item.uri,oneFileWork)||repeatedEmbeddedAudioWorkTitle(embedded,normalAudioTitleCounts);
        if(embeddedWorkTitle||embeddedAuthor||embedded?.genre||embedded?.year){
          identity=applyLocalMetadata(identity,{
            ...(embeddedWorkTitle?{title:embeddedWorkTitle}:{}),
            ...(embeddedAuthor?{author:embeddedAuthor}:{}),
            ...(embedded?.genre?{genre:embedded.genre}:{}),
            ...(metadataYear(embedded?.year)?{publishedYear:metadataYear(embedded?.year)}:{}),
          },'embedded');
        }

        const stem=fileStem(item.name).toLowerCase();
        const genericAllowed=context.mediaCount===1||context.audioOnly;
        const sidecar=context.sidecars.get(stem)||(genericAllowed?(context.sidecars.get('metadata')||context.sidecars.get('book')):undefined);
        if(sidecar){
          const fields=await cachedSidecarFields(sidecar.uri);
          if(fields.title||fields.author||fields.series||fields.genre||fields.isbn||fields.identifiers?.length){
            identity=applyLocalMetadata(identity,fields,'sidecar');
          }
        }

        const override=overrides[item.uri];
        if(override)identity=applyLocalMetadata(identity,override,'manual');
        if(identity.needsReview)review+=1;

        const book:LocalBook={
          id:books.length+1,
          uri:item.uri,
          title:identity.title||titleFromUri(item.uri),
          author:identity.author,
          series:identity.series,
          genre:identity.genre,
          publishedYear:identity.publishedYear,
          publisher:identity.publisher,
          seriesIndex:identity.seriesIndex,
          isbn:identity.isbn,
          identifiers:identity.identifiers,
          format:item.format,
          space:folder.name,
          available:true,
          identificationConfidence:identity.confidence,
          needsReview:identity.needsReview,
          reviewReason:identity.reviewReason,
          coverShape:identity.coverShape,
          metadataSource:identity.metadataSource,
          coverUri:(
            context.artwork.get(stem) ||
            (genericAllowed?(context.artwork.get('cover')||context.artwork.get('folder')):undefined)
          )?.uri,
          workTitleHint:embedded?.album||embeddedAudioWorkTitle(embedded?.title,item.uri,oneFileWork)||repeatedEmbeddedAudioWorkTitle(embedded,normalAudioTitleCounts)||undefined,
          trackTitle:embedded?.title||undefined,
          trackNumber:metadataIndex(embedded?.track),
          discNumber:metadataIndex(embedded?.disc),
          sourceUri:folder.uri,
          documentId:item.documentId,
          size:item.size,
          modified:item.modified,
          metadataContextSignature:signature.contextSignature,
          assetSignature:signature.assetSignature||undefined,
          scanReused:false,
        };
        books.push(book);
        produced.push(book);
      }

      if(produced.length)await onBooks?.(produced,progress('identifying',folder.name));
      report('identifying',folder.name);
      await yieldToUi();
    };
    const flushMedia=async(parentId?:string)=>{
      if(!mediaBuffer.length)return;
      if(parentId&&mediaParent&&parentId!==mediaParent)return;
      const current=mediaBuffer;
      mediaBuffer=[];
      mediaParent='';
      await identifyMedia(current);
    };

    try {
      scanId=await nativeLibraryScanner.startTreeScan(folder.uri);
      let done=false;
      while(!done){
        const batch=await nativeLibraryScanner.readTreeScanBatch(scanId,240);
        lastVisited=batch.visited;
        nativeErrors=batch.errors;
        entriesVisited=visitedBeforeFolder+batch.visited;

        for(const item of batch.items||[]){
          if(item.role==='sidecar'){
            const context=contextFor(item.parentId);
            context.sidecars.set(fileStem(item.name).toLowerCase(),{uri:item.uri,size:item.size,modified:item.modified});
            continue;
          }
          if(item.role==='artwork'){
            const context=contextFor(item.parentId);
            const stem=fileStem(item.name).toLowerCase();
            if(stem&&!context.artwork.has(stem))context.artwork.set(stem,{uri:item.uri,size:item.size,modified:item.modified});
            continue;
          }
          if(item.role==='directory-context'){
            const context=contextFor(item.parentId);
            context.mediaCount=Math.max(0,Math.round(item.size||0));
            context.audioOnly=item.format==='audio-only';
            continue;
          }
          if(item.role==='media'){
            if(mediaParent&&mediaParent!==item.parentId)await flushMedia(mediaParent);
            mediaParent=item.parentId;
            mediaBuffer.push(item);
            if(mediaBuffer.length>=48)await flushMedia(item.parentId);
            continue;
          }
          if(item.role==='directory-end'){
            await flushMedia(item.parentId);
            contexts.delete(item.parentId);
          }
        }

        report('discovering',folder.name);
        done=!!batch.done;
        if(!done&&(!batch.items||batch.items.length===0)){
          await new Promise<void>(resolve=>setTimeout(resolve,12));
        }else{
          await yieldToUi();
        }
      }
      await flushMedia();
    } catch {
      skipped+=1;
      mediaBuffer=[];
      if(scanId){try{await nativeLibraryScanner.cancelTreeScan(scanId);}catch{}}
    }

    skipped+=nativeErrors;
    visitedBeforeFolder+=lastVisited;
    entriesVisited=visitedBeforeFolder;
    const count=books.length-before;
    nextFolders.push({...folder,status:`Scanned ${count} items`,itemCount:count,scannedAt:new Date().toISOString()});
    await yieldToUi();
  }

  report('complete','');
  return {
    folders:nextFolders.concat(folders.slice(nextFolders.length)),
    books,
    skipped,
    truncated:false,
    identified:books.length-review,
    review,
  };
}

export async function scanLocalFolders(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
  onBooks?: (books: LocalBook[], progress: LocalScanProgress) => void | Promise<void>,
  options: LocalScanOptions = {},
): Promise<LocalScanResult> {
  if (Platform.OS === 'android' && nativeLibraryScanner?.startTreeScan) {
    return scanLocalFoldersNative(folders, onProgress, overrides, onBooks, options);
  }
  const books: LocalBook[] = [];
  let skipped = 0;
  let truncated = false;
  let truncatedReason: 'book-limit' | 'entry-limit' | undefined;
  let entriesVisited = 0;
  let review = 0;
  const seen = new Set<string>();
  const sidecarCache = new Map<string, LocalMetadataFields>();
  let fallbackBatch:LocalBook[]=[];
  const flushFallbackBatch=async(currentFolder:string)=>{
    if(!fallbackBatch.length)return;
    const current=fallbackBatch;
    fallbackBatch=[];
    await onBooks?.(current,{phase:'identifying',currentFolder,entriesVisited,found:books.length,review});
  };

  async function cachedSidecarFields(uri: string): Promise<LocalMetadataFields> {
    const cached = sidecarCache.get(uri);
    if (cached) return cached;
    let fields: LocalMetadataFields = {};
    try {
      const info = await getInfoAsync(uri);
      if (info.exists && (!('size' in info) || typeof info.size !== 'number' || info.size <= 2 * 1024 * 1024)) {
        fields = parseLocalSidecar(await readAsStringAsync(uri), extension(uri));
      }
    } catch {
      // Sidecars enrich the scan only. Cache a miss so one broken file cannot
      // be retried for every track in a large audiobook folder.
    }
    sidecarCache.set(uri, fields);
    return fields;
  }

  const report = (phase: LocalScanProgress['phase'], currentFolder: string) => {
    onProgress?.({phase, currentFolder, entriesVisited, found: books.length, review});
  };

  let currentSourceUri = '';
  async function scanDir(uri: string, space: string, depth: number, countUnreadable = true) {
    if (truncated || depth > maxDepth) return;
    let children: string[];
    try {
      children = await StorageAccessFramework.readDirectoryAsync(uri);
    } catch {
      if (countUnreadable) skipped += 1;
      return;
    }

    const supportedFiles = children.filter(child => {
      const ext = extension(child);
      return !!ext && supported.has(ext);
    });
    const sidecarByStem = new Map<string, string>();
    let genericSidecar = '';
    const artworkByStem = new Map<string, string>();
    let genericCover = '';
    let genericCoverRank = 99;
    const genericBookLevelFilesAllowed = supportedFiles.length === 1 || (
      supportedFiles.length > 1 && supportedFiles.every(child => supported.get(extension(child)) === 'Audio')
    );
    for (const child of children) {
      const ext = extension(child);
      const stem = fileStem(child).toLowerCase();
      if (ext === 'opf' || ext === 'nfo') {
        sidecarByStem.set(stem, child);
        if (stem === 'metadata' || stem === 'book') genericSidecar = child;
      }
      if (['jpg','jpeg','png','webp'].includes(ext)) {
        artworkByStem.set(stem, child);
        const rank = stem === 'cover' ? 0 : stem === 'folder' ? 1 : 99;
        if (genericBookLevelFilesAllowed && rank < genericCoverRank) {
          genericCover = child;
          genericCoverRank = rank;
        }
      }
    }
    if (!genericBookLevelFilesAllowed) genericSidecar = '';

    for (const child of children) {
      entriesVisited += 1;
      if (entriesVisited > maxVisitedEntriesPerScan) {
        truncated = true;
        truncatedReason = 'entry-limit';
        return;
      }
      if (entriesVisited === 1 || entriesVisited % 20 === 0) report('discovering', space);
      if (books.length >= maxEntriesPerScan) {
        truncated = true;
        truncatedReason = 'book-limit';
        return;
      }
      const ext = extension(child);
      const format = ext ? supported.get(ext) : undefined;
      if (format && !seen.has(child)) {
        seen.add(child);
        let identity = inferLocalBookMetadata(child, format);

        const sidecarUri = sidecarByStem.get(fileStem(child).toLowerCase()) || genericSidecar;
        if (sidecarUri) {
          const fields = await cachedSidecarFields(sidecarUri);
          if (fields.title || fields.author || fields.series || fields.genre || fields.isbn || fields.identifiers?.length) {
            identity = applyLocalMetadata(identity, fields, 'sidecar');
          }
        }

        const override = overrides[child];
        if (override) identity = applyLocalMetadata(identity, override, 'manual');

        const coverUri = artworkByStem.get(fileStem(child).toLowerCase()) || genericCover || undefined;
        if (identity.needsReview) review += 1;
        books.push({
          id: books.length + 1,
          uri: child,
          title: identity.title || titleFromUri(child),
          author: identity.author,
          series: identity.series,
          genre: identity.genre,
          publishedYear: identity.publishedYear,
          publisher:identity.publisher,
          seriesIndex:identity.seriesIndex,
          isbn:identity.isbn,
          identifiers:identity.identifiers,
          format,
          space,
          available: true,
          identificationConfidence: identity.confidence,
          needsReview: identity.needsReview,
          reviewReason: identity.reviewReason,
          coverShape: identity.coverShape,
          metadataSource: identity.metadataSource,
          coverUri,
          sourceUri: currentSourceUri,
        });
        fallbackBatch.push(books[books.length-1]);
        if(fallbackBatch.length>=25)await flushFallbackBatch(space);
        if (books.length === 1 || books.length % 25 === 0) report('discovering', space);
      } else if (depth < maxDepth) {
        if (!ext) {
          await scanDir(child, space, depth + 1);
        } else if (!knownNonDirectoryExtensions.has(ext)) {
          // SAF does not tell us whether a child is a file or directory.
          // Unknown extensions may be dotted folder names (for example "J.R.R. Tolkien"),
          // so probe them as directories without reporting ordinary unsupported files as errors.
          await scanDir(child, space, depth + 1, false);
        }
      }
    }
  }

  const nextFolders: LocalFolder[] = [];
  for (const folder of folders) {
    const before = books.length;
    currentSourceUri = folder.uri;
    report('discovering', folder.name);
    await scanDir(folder.uri, folder.name, 0);
    const count = books.length - before;
    nextFolders.push({
      ...folder,
      status: truncated ? `Scanned first ${count} items` : `Scanned ${count} items`,
      itemCount: count,
      scannedAt: new Date().toISOString(),
    });
    await flushFallbackBatch(folder.name);
    if (truncated) break;
  }

  report('complete', '');
  return {
    folders: nextFolders.concat(folders.slice(nextFolders.length)),
    books,
    skipped,
    truncated,
    truncatedReason,
    identified: books.length - review,
    review,
  };
}

export async function removeLocalSortCopies(history: LocalSortHistory): Promise<LocalSortRecoveryResult> {
  const removed: LocalSortRecoveryResult['copied'] = [];
  const failed: LocalSortRecoveryResult['failed'] = [];
  for (const item of history.copied) {
    try {
      await StorageAccessFramework.deleteAsync(item.uri);
      removed.push(item);
    } catch (e) {
      failed.push({id: item.id, title: item.title, error: (e as Error).message});
    }
  }
  return {copied: removed, failed};
}

function metadataIndex(value?: string) {
  const match = String(value || '').match(/\d+/);
  const number = match ? Number(match[0]) : 0;
  return number > 0 ? number : undefined;
}

function metadataYear(value?: string) {
  const match = String(value || '').match(/(?:^|\D)(\d{4})(?:\D|$)/);
  const year = match ? Number(match[1]) : 0;
  return year >= 1000 && year <= new Date().getFullYear() + 2 ? year : undefined;
}

function extension(uri: string) {
  const clean = decodeUriPart(uri).split('?')[0];
  const name = clean.split('/').pop() || clean;
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

function titleFromUri(uri: string) {
  const clean = decodeUriPart(uri).split('?')[0];
  const name = clean.split('/').pop() || clean;
  const withoutExt = name.replace(/\.[^.]+$/, '');
  return withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled';
}

function fileNameFromUri(uri: string) {
  const clean = decodeUriPart(uri).split('?')[0];
  return clean.split('/').pop() || 'item';
}

function fileStem(uri: string) {
  return fileNameFromUri(uri).replace(/\.[^.]+$/, '');
}

function decodeUriPart(uri: string) {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}
