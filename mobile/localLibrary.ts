import {Platform} from 'react-native';
import {copyAsync, deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, readAsStringAsync, readDirectoryAsync, StorageAccessFramework} from 'expo-file-system/legacy';
import {applyLocalMetadata, applyResolvedLocalMetadata, decodedPathParts, inferLocalBookMetadata, IdentificationConfidence, isGenericMediaTitle, LocalMetadataFields, parseLocalSidecar, logicalWorkKey, editionKey, sanitizeDiscoveredMetadata} from './libraryIntelligence';
import {MetadataCandidate, MetadataConflict, MetadataSource, resolveMetadataCandidates} from './metadataResolution';
import {extractEmbeddedMetadata} from './embeddedMetadata';
import {extractAudioMetadata} from './audioMetadata';
import {discoverEmbeddedCover} from './coverDiscovery';
import {lookupOnlineBook, mergeOnlineBookCandidate, shouldLookupBookOnline, OnlineBookCache, OnlineBookCandidate} from './onlineBookMetadata';
import {lookupOnlineComic, mergeOnlineComicCandidate, shouldLookupComicOnline, OnlineComicCache, OnlineComicCandidate} from './onlineComicMetadata';
import {audioWorkGroupKeys, canonicalMetadataForBooks, synchronizeLocalMetadataCooperative} from './metadataSync';

export type LocalBook = {
  id: number;
  uri: string;
  title: string;
  author: string;
  series: string;
  seriesNumber?: number;
  genre: string;
  publishedYear?: number;
  narrator?: string;
  publisher?: string;
  isbn?: string;
  asin?: string;
  language?: string;
  description?: string;
  workKey?: string;
  editionKey?: string;
  metadataProvenance?: Partial<Record<string, MetadataSource>>;
  metadataFieldConfidence?: Partial<Record<string, IdentificationConfidence>>;
  metadataConflicts?: MetadataConflict[];
  embeddedMetadata?: LocalMetadataFields;
  fileSize?: number;
  modificationTime?: number;
  rootUri?: string;
  format: string;
  space: string;
  available: boolean;
  identificationConfidence?: IdentificationConfidence;
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  metadataSource?: 'path' | 'embedded' | 'sidecar' | 'manual' | 'online';
  coverUri?: string;
  coverCandidates?: string[];
  onlineMetadataMatch?: OnlineBookCandidate;
  onlineMetadataAlternatives?: OnlineBookCandidate[];
  comicIssueNumber?: string;
  comicVolume?: number;
  comicSeriesAliases?: string[];
  comicCreators?: Array<{name:string;roles:string[]}>;
  comicStoryArcs?: string[];
  comicCharacters?: string[];
  comicTeams?: string[];
  comicUniverses?: string[];
  comicUpc?: string;
  comicSku?: string;
  comicExternalIds?: {metron?:number;comicVine?:number;gcd?:number};
  comicStoreDate?: string;
  comicCoverDate?: string;
  comicPageCount?: number;
  comicMetadataProvenance?: Partial<Record<string, MetadataSource>>;
  onlineComicMetadataMatch?: OnlineComicCandidate;
  onlineComicMetadataAlternatives?: OnlineComicCandidate[];
};

export type LocalSortMode = 'copy' | 'move';

export type LocalSortPreview = {
  id: string;
  asset: number;
  title: string;
  sourceUri: string;
  sourceRootUri: string;
  rootUri: string;
  sourceRelativePath: string;
  relativePath: string;
  from: string;
  to: string;
  state: 'ready' | 'same' | 'conflict' | 'review';
  reason?: string;
  metadataSummary?: string;
};

export type LocalSortAppliedItem = {
  id: string;
  title: string;
  uri: string;
  sourceUri: string;
  sourceRootUri: string;
  rootUri: string;
  sourceRelativePath: string;
  sourceRemoved: boolean;
};

export type LocalSortApplyResult = {
  copied: LocalSortAppliedItem[];
  failed: Array<{id: string; title: string; error: string}>;
};

export type LocalSortHistory = {
  id: string;
  createdAt: string;
  mode?: LocalSortMode;
  copied: LocalSortAppliedItem[];
  failed: Array<{id: string; title: string; error: string}>;
  complete?: boolean;
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
  phase: 'discovering' | 'reading-metadata' | 'matching' | 'checking-duplicates' | 'preparing' | 'covers' | 'online-books' | 'online-comics' | 'complete';
  currentFolder: string;
  entriesVisited: number;
  found: number;
  review: number;
  processed?: number;
  total?: number;
};

export type LocalMetadataOverride = {
  title: string;
  author: string;
  series: string;
  seriesNumber?: number;
  genre: string;
  publishedYear?: number;
  narrator?: string;
  publisher?: string;
  isbn?: string;
  asin?: string;
  language?: string;
  description?: string;
  coverUri?: string;
};

export type LocalScanResult = {
  folders: LocalFolder[];
  books: LocalBook[];
  skipped: number;
  truncated: boolean;
  truncatedReason?: 'book-limit' | 'entry-limit';
  identified: number;
  review: number;
  entriesVisited: number;
};

export type LocalScanOptions = {
  deferEmbeddedCovers?: boolean;
  deferEmbeddedMetadata?: boolean;
  refreshMetadata?: boolean;
  shouldContinue?:()=>boolean;
};

export type LocalEmbeddedMetadataEnrichmentResult = {
  books: LocalBook[];
  attempted: number;
  processed: number;
  updated: number;
  review: number;
  timedOut: number;
  skipped: number;
};

export type LocalCoverEnrichmentResult = {
  books: LocalBook[];
  attempted: number;
  updated: number;
  timedOut: number;
  skipped: number;
};

export type LocalOnlineMetadataEnrichmentResult = {
  books: LocalBook[];
  attempted: number;
  matched: number;
  review: number;
  updated: number;
  cache: OnlineBookCache;
};

export type LocalOnlineComicMetadataEnrichmentResult = {
  books: LocalBook[];
  attempted: number;
  matched: number;
  review: number;
  updated: number;
  rateLimited: boolean;
  cache: OnlineComicCache;
};

const supported = new Map<string, string>([
  ['epub', 'EPUB'],
  ['pdf', 'PDF'],
  ['cbz', 'Comic'],
  ['cbr', 'Comic'],
  ['cbt', 'Comic'],
  ['zip', 'Comic'],
  ['mp3', 'Audio'],
  ['m4a', 'Audio'],
  ['m4b', 'Audio'],
  ['aac', 'Audio'],
  ['ogg', 'Audio'],
  ['opus', 'Audio'],
  ['flac', 'Audio'],
]);

const maxEntriesPerScan = 100000;
const maxVisitedEntriesPerScan = 250000;
const uiFrameBudgetMs = 8;

function cooperativeYieldFactory(frameBudgetMs=uiFrameBudgetMs){
  let lastYield=Date.now();
  return async(force=false)=>{
    const now=Date.now();
    if(!force&&now-lastYield<frameBudgetMs)return;
    await new Promise<void>(resolve=>setTimeout(resolve,0));
    lastYield=Date.now();
  };
}

async function withOperationTimeout<T>(operation:Promise<T>,timeoutMs:number,label:string):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{
    timer=setTimeout(()=>reject(Object.assign(new Error(label+' timed out'),{code:'operation-timeout'})),timeoutMs);
  });
  try{return await Promise.race([operation,timeout]);}
  finally{if(timer)clearTimeout(timer);}
}
const knownNonDirectoryExtensions = new Set([
  ...supported.keys(),
  'cbr','cbt','opf','nfo','jpg','jpeg','png','webp','gif','txt','cue','m3u','m3u8','json','xml','srt',
]);

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
  if (Platform.OS === 'android') {
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
  if (Platform.OS === 'ios') return importIOSFolder();
  throw Error('Local folder access is available in the iOS and Android apps.');
}

const importableExtensions = new Set([
  ...supported.keys(),
  'opf','nfo','json','xml','jpg','jpeg','png','webp',
]);

async function importIOSFolder(): Promise<LocalFolder | null> {
  const {Directory, File, Paths}=await import('expo-file-system');
  let selected: InstanceType<typeof Directory>;
  try {
    selected=await Directory.pickDirectoryAsync();
  } catch (error) {
    const message=String((error as Error)?.message||error||'');
    if (/cancel/i.test(message)) return null;
    throw error;
  }

  const libraryRoot=new Directory(Paths.document,'local-libraries');
  if(!libraryRoot.exists)libraryRoot.create({intermediates:true,idempotent:true});
  const sourceName=(selected.name||'Library').trim()||'Library';
  const safeName=sourceName.replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim()||'Library';
  const destination=new Directory(libraryRoot,String(Date.now())+'-'+safeName);
  destination.create({intermediates:true});

  let mediaCopied=0;
  const maxImportDepth=64;
  const copyTree=(source:InstanceType<typeof Directory>,target:InstanceType<typeof Directory>,depth:number)=>{
    if(depth>maxImportDepth)throw Error('This folder is nested too deeply to import safely.');
    for(const item of source.list()){
      if(item instanceof Directory){
        const child=target.createDirectory(item.name);
        copyTree(item,child,depth+1);
      }else if(item instanceof File){
        const ext=extension(item.name);
        if(!importableExtensions.has(ext))continue;
        item.copy(new File(target,item.name));
        if(supported.has(ext))mediaCopied+=1;
      }
    }
  };

  try {
    copyTree(selected,destination,0);
    if(!mediaCopied)throw Error('No supported books, audiobooks, comics or PDFs were found in that folder.');
  } catch (error) {
    try{destination.delete();}catch{}
    throw error;
  }

  return {
    id: destination.uri,
    uri: destination.uri,
    name: sourceName,
    status: `Imported ${mediaCopied} media file${mediaCopied===1?'':'s'}`,
    itemCount: mediaCopied,
  };
}

function isSAFUri(uri:string){return uri.startsWith('content://');}

async function listDirectoryEntries(uri:string):Promise<string[]>{
  if(isSAFUri(uri))return StorageAccessFramework.readDirectoryAsync(uri);
  const entries=await readDirectoryAsync(uri);
  const base=uri.replace(/\/$/,'');
  return entries.map(entry=>entry.includes('://')?entry:base+'/'+encodeURIComponent(entry));
}

async function copyLocalUri(from:string,to:string){
  if(isSAFUri(from)||isSAFUri(to)){
    const native=require('react-native').NativeModules?.ArchivistArchive;
    if(native?.copyDocument)return native.copyDocument(from,to);
    return StorageAccessFramework.copyAsync({from,to});
  }
  return copyAsync({from,to});
}

async function deleteLocalUri(uri:string){
  if(isSAFUri(uri))return StorageAccessFramework.deleteAsync(uri);
  return deleteAsync(uri,{idempotent:true});
}

export async function removeLocalFolderSource(folder:LocalFolder):Promise<void>{
  if(Platform.OS!=='ios')return;
  if(!documentDirectory)throw Error('Archivist storage is unavailable.');
  const importedRoot=documentDirectory.replace(/\/$/,'')+'/local-libraries/';
  const uri=String(folder.uri||'');
  if(!uri.startsWith(importedRoot))throw Error('Archivist will not delete a folder outside its private imported library.');
  await deleteAsync(uri,{idempotent:true});
}

export async function scanLocalFolders(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
  previousBooks: LocalBook[] = [],
  options: LocalScanOptions = {},
): Promise<LocalScanResult> {
  const books: LocalBook[] = [];
  const shouldContinue=options.shouldContinue||(()=>true);
  let skipped = 0;
  let truncated = false;
  let truncatedReason: 'book-limit' | 'entry-limit' | undefined;
  let entriesVisited = 0;
  let review = 0;
  let metadataStarted = false;
  const seen = new Set<string>();
  const sidecarCache = new Map<string, LocalMetadataFields>();
  const visitedDirectories = new Set<string>();
  const previousByUri = new Map(previousBooks.filter(book=>!!book.uri).map(book=>[book.uri,book]));
  const yieldToUi=cooperativeYieldFactory();

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

  async function scanDir(uri: string, space: string, depth: number, folderRoot: string, countUnreadable = true) {
    if (!shouldContinue() || truncated || visitedDirectories.has(uri)) return;
    visitedDirectories.add(uri);
    let children: string[];
    try {
      children = await listDirectoryEntries(uri);
      if(!shouldContinue())return;
    } catch {
      if (countUnreadable) skipped += 1;
      return;
    }

    const supportedFiles = children.filter(child => {
      const ext = extension(child);
      return !!ext && supported.has(ext);
    });
    const audioSiblingCount = supportedFiles.filter(child => supported.get(extension(child)) === 'Audio').length;
    const sidecarByStem = new Map<string, string>();
    let genericSidecar = '';
    const artworkByStem = new Map<string, string>();
    let genericCover = '';
    let genericCoverRank = 99;
    const multiTrackAudioFolder = supportedFiles.length > 1
      && supportedFiles.every(child => supported.get(extension(child)) === 'Audio')
      && supportedFiles.every(child => isGenericMediaTitle(fileStem(child),'Audio',supportedFiles.length));
    const genericBookLevelFilesAllowed = supportedFiles.length === 1 || multiTrackAudioFolder;
    for (const child of children) {
      const ext = extension(child);
      const stem = fileStem(child).toLowerCase();
      if (ext === 'opf' || ext === 'nfo' || ext === 'json' || ext === 'xml') {
        sidecarByStem.set(stem, child);
        if (stem === 'metadata' || stem === 'book' || stem === 'comicinfo') genericSidecar = child;
      }
      if (['jpg','jpeg','png','webp'].includes(ext)) {
        artworkByStem.set(stem, child);
        const rank = stem === 'cover' ? 0
          : stem === 'front' || stem === 'frontcover' || stem === 'front-cover' ? 1
          : stem === 'bookcover' || stem === 'book-cover' ? 2
          : stem === 'folder' ? 3
          : stem === 'coverart' || stem === 'artwork' ? 4
          : 99;
        if (genericBookLevelFilesAllowed && rank < genericCoverRank) {
          genericCover = child;
          genericCoverRank = rank;
        }
      }
    }
    if (!genericBookLevelFilesAllowed) genericSidecar = '';

    for (const child of children) {
      if(!shouldContinue())return;
      entriesVisited += 1;
      await yieldToUi();
      if(!shouldContinue())return;
      if (entriesVisited > maxVisitedEntriesPerScan) {
        truncated = true;
        truncatedReason = 'entry-limit';
        return;
      }
      if (entriesVisited === 1 || entriesVisited % 20 === 0) report(metadataStarted && !options.deferEmbeddedMetadata ? 'reading-metadata' : 'discovering', space);
      if (books.length >= maxEntriesPerScan) {
        truncated = true;
        truncatedReason = 'book-limit';
        return;
      }
      const ext = extension(child);
      const format = ext ? supported.get(ext) : undefined;
      if (format && !seen.has(child)) {
        seen.add(child);
        if (!metadataStarted) {
          metadataStarted = true;
          report(options.deferEmbeddedMetadata ? 'discovering' : 'reading-metadata', space);
        }
        let identity = inferLocalBookMetadata(child, format, {siblingMediaCount: format === 'Audio' ? audioSiblingCount : 1});
        const evidence: MetadataCandidate[] = [{
          source: 'path' as const,
          confidence: identity.confidence,
          fields: {
            title: identity.title, author: identity.author, series: identity.series, seriesNumber: identity.seriesNumber,
            genre: identity.genre, publishedYear: identity.publishedYear, narrator: identity.narrator, publisher: identity.publisher,
            isbn: identity.isbn, asin: identity.asin, language: identity.language, description: identity.description,
          },
        }];

        let sidecarFields:LocalMetadataFields={};
        const sidecarUri = sidecarByStem.get(fileStem(child).toLowerCase()) || genericSidecar;
        if (sidecarUri) {
          const rawFields = await cachedSidecarFields(sidecarUri);
          const fields = sanitizeDiscoveredMetadata(rawFields, format, identity.title, format === 'Audio' ? audioSiblingCount : 1);
          sidecarFields=fields;
          if (Object.keys(fields).length) {
            evidence.push({source:'sidecar' as const, confidence:'high' as const, fields});
            identity = applyLocalMetadata(identity, fields, 'sidecar');
          }
        }

        const fileInfo = await getInfoAsync(child).catch(()=>null);
        const fileSize = fileInfo && 'size' in fileInfo && typeof fileInfo.size==='number' ? fileInfo.size : undefined;
        const modificationTime = fileInfo && 'modificationTime' in fileInfo && typeof fileInfo.modificationTime==='number' ? fileInfo.modificationTime : undefined;
        const previous = previousByUri.get(child);
        const unchanged = !!previous && fileSize !== undefined && previous.fileSize === fileSize
          && modificationTime !== undefined && previous.modificationTime === modificationTime;
        // Initial catalogue publication deliberately avoids archive/audio parsing for new files.
        // Reuse known-good embedded metadata when the file is unchanged; otherwise the
        // bounded enrichment queue below reads it after the catalogue is already usable.
        const embeddedRawFields = unchanged && previous?.embeddedMetadata
          ? previous.embeddedMetadata
          : options.deferEmbeddedMetadata
            ? {}
            : format === 'Audio'
              ? await extractAudioMetadata(child, ext, {size:fileSize})
              : await extractEmbeddedMetadata(child, ext, {exists:fileInfo?.exists,size:fileSize});
        const embeddedFields = sanitizeDiscoveredMetadata(embeddedRawFields, format, identity.title, format === 'Audio' ? audioSiblingCount : 1);
        if (Object.keys(embeddedFields).length) {
          evidence.push({source:'embedded' as const, confidence:'high' as const, fields:embeddedFields});
          identity = applyLocalMetadata(identity, embeddedFields, 'embedded');
        }

        const override = overrides[child];
        if (override) {
          evidence.push({source:'manual' as const, confidence:'high' as const, fields:override});
          identity = applyLocalMetadata(identity, override, 'manual');
        }
        const resolvedMetadata = resolveMetadataCandidates(evidence);
        identity = applyResolvedLocalMetadata(identity, resolvedMetadata);
        if (override) identity = applyLocalMetadata(identity, override, 'manual');

        const comicFields:LocalMetadataFields=format==='Comic'?{...sidecarFields,...embeddedFields}:{};
        const comicMetadataProvenance:Partial<Record<string,MetadataSource>>={};
        if(format==='Comic'){
          for(const key of ['comicIssueNumber','comicVolume','comicSeriesAliases','comicCreators','comicStoryArcs','comicCharacters','comicTeams','comicUniverses','comicUpc','comicSku','comicVineId','comicGcdId','comicStoreDate','comicCoverDate','comicPageCount']){
            if((sidecarFields as any)[key]!==undefined)comicMetadataProvenance[key]='sidecar';
            if((embeddedFields as any)[key]!==undefined)comicMetadataProvenance[key]='embedded';
          }
        }

        const coverCandidates = [
          artworkByStem.get(fileStem(child).toLowerCase()),
          ...(genericBookLevelFilesAllowed ? [
            artworkByStem.get('cover'),
            artworkByStem.get('front'),
            artworkByStem.get('frontcover'),
            artworkByStem.get('front-cover'),
            artworkByStem.get('bookcover'),
            artworkByStem.get('book-cover'),
            artworkByStem.get('folder'),
            artworkByStem.get('coverart'),
            artworkByStem.get('artwork'),
          ] : []),
        ].filter((value,index,all): value is string => !!value && all.indexOf(value)===index);
        const discoveredCoverUri = coverCandidates[0] || genericCover || undefined;
        if(genericCover && !coverCandidates.includes(genericCover))coverCandidates.push(genericCover);
        let embeddedCoverUri: string | undefined;
        if(!discoveredCoverUri&&!override?.coverUri?.trim()){
          const reusable = unchanged && previous?.coverUri && (/\/covers\/embedded-/i.test(previous.coverUri)||previous.coverUri.startsWith('data:image/'))
            ? previous.coverUri
            : undefined;
          embeddedCoverUri = reusable;
          if(!embeddedCoverUri&&!options.deferEmbeddedCovers){
            embeddedCoverUri = await discoverEmbeddedCover(child, ext, {size:fileSize,modificationTime});
          }
          if(embeddedCoverUri&&!coverCandidates.includes(embeddedCoverUri))coverCandidates.push(embeddedCoverUri);
        }
        // A refresh must not erase a previously downloaded or extracted cover while enrichment runs.
        const coverUri = override?.coverUri?.trim() || discoveredCoverUri || embeddedCoverUri || (previous?.coverUri&&/\/covers\/(embedded-|online\/)/i.test(previous.coverUri)?previous.coverUri:undefined);
        if(coverUri&&!override?.coverUri&&!coverCandidates.includes(coverUri))coverCandidates.push(coverUri);
        if (identity.needsReview) review += 1;
        books.push({
          id: books.length + 1,
          uri: child,
          title: identity.title || titleFromUri(child),
          author: identity.author,
          series: identity.series,
          seriesNumber: identity.seriesNumber,
          genre: identity.genre,
          publishedYear: identity.publishedYear,
          narrator: identity.narrator,
          publisher: identity.publisher,
          isbn: identity.isbn,
          asin: identity.asin,
          language: identity.language,
          description: identity.description,
          workKey: logicalWorkKey(identity),
          editionKey: editionKey(identity, format),
          metadataProvenance: resolvedMetadata.provenance,
          metadataFieldConfidence: resolvedMetadata.confidence,
          metadataConflicts: resolvedMetadata.conflicts,
          embeddedMetadata: options.deferEmbeddedMetadata && !unchanged ? undefined : embeddedFields,
          fileSize,
          modificationTime,
          rootUri: folderRoot,
          format,
          space,
          available: true,
          identificationConfidence: identity.confidence,
          needsReview: identity.needsReview,
          reviewReason: identity.reviewReason,
          coverShape: identity.coverShape,
          metadataSource: identity.metadataSource,
          coverUri,
          coverCandidates,
          comicIssueNumber: comicFields.comicIssueNumber || (format==='Comic'&&identity.seriesNumber!==undefined?String(identity.seriesNumber):undefined),
          comicVolume: comicFields.comicVolume,
          comicSeriesAliases: comicFields.comicSeriesAliases,
          comicCreators: comicFields.comicCreators,
          comicStoryArcs: comicFields.comicStoryArcs,
          comicCharacters: comicFields.comicCharacters,
          comicTeams: comicFields.comicTeams,
          comicUniverses: comicFields.comicUniverses,
          comicUpc: comicFields.comicUpc,
          comicSku: comicFields.comicSku,
          comicExternalIds: format==='Comic'&&(comicFields.comicVineId||comicFields.comicGcdId)?{comicVine:comicFields.comicVineId,gcd:comicFields.comicGcdId}:undefined,
          comicStoreDate: comicFields.comicStoreDate,
          comicCoverDate: comicFields.comicCoverDate,
          comicPageCount: comicFields.comicPageCount,
          comicMetadataProvenance: format==='Comic'?comicMetadataProvenance:undefined,
        });
        if (books.length === 1 || books.length % 25 === 0) report(options.deferEmbeddedMetadata ? 'discovering' : 'reading-metadata', space);
      } else {
        if (!ext) {
          await scanDir(child, space, depth + 1, folderRoot);
        } else if (!knownNonDirectoryExtensions.has(ext)) {
          // SAF does not tell us whether a child is a file or directory.
          // Unknown extensions may be dotted folder names (for example "J.R.R. Tolkien"),
          // so probe them as directories without reporting ordinary unsupported files as errors.
          if(shouldContinue())await scanDir(child, space, depth + 1, folderRoot, false);
        }
      }
    }
  }

  const nextFolders: LocalFolder[] = [];
  for (const folder of folders) {
    const before = books.length;
    report('discovering', folder.name);
    await scanDir(folder.uri, folder.name, 0, folder.uri);
    const count = books.length - before;
    nextFolders.push({
      ...folder,
      status: truncated ? `Scanned first ${count} items` : `Scanned ${count} items`,
      itemCount: count,
      scannedAt: new Date().toISOString(),
    });
    if (truncated) break;
  }

  report('matching', '');
  const synchronized=(await synchronizeLocalMetadataCooperative(books,{shouldContinue})).books;
  review=synchronized.filter(book=>book.needsReview).length;
  return {
    folders: nextFolders.concat(folders.slice(nextFolders.length)),
    books:synchronized,
    skipped,
    truncated,
    truncatedReason,
    identified: synchronized.length - review,
    review,
    entriesVisited,
  };
}


const resolvableMetadataFields:Array<keyof LocalMetadataFields>=[
  'title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description',
];

function metadataFieldsForSource(book:LocalBook,source:MetadataSource):LocalMetadataFields{
  const fields:LocalMetadataFields={};
  for(const field of resolvableMetadataFields){
    const provenance=book.metadataProvenance?.[field as string];
    const fallback=!provenance && (
      book.metadataSource===source ||
      (source==='path' && (!book.metadataSource || book.metadataSource==='online'))
    );
    if(provenance!==source&&!fallback)continue;
    const value=(book as any)[field];
    if(value!==undefined&&value!==null&&String(value).trim()!=='')(fields as any)[field]=value;
  }
  return fields;
}

function mergeEmbeddedMetadata(book:LocalBook,fields:LocalMetadataFields):LocalBook{
  if(!Object.keys(fields).length)return {...book,embeddedMetadata:{}};
  const candidates:MetadataCandidate[]=[];
  for(const source of ['manual','embedded','sidecar','path','online'] as MetadataSource[]){
    if(source==='embedded')continue;
    const candidate=metadataFieldsForSource(book,source);
    if(Object.keys(candidate).length)candidates.push({
      source,
      confidence:source==='path'?(book.identificationConfidence||'low'):'high',
      fields:candidate,
    });
  }
  candidates.push({source:'embedded',confidence:'high',fields});
  const resolution=resolveMetadataCandidates(candidates);
  const base={
    title:book.title,
    author:book.author,
    series:book.series,
    seriesNumber:book.seriesNumber,
    genre:book.genre,
    publishedYear:book.publishedYear,
    narrator:book.narrator,
    publisher:book.publisher,
    isbn:book.isbn,
    asin:book.asin,
    language:book.language,
    description:book.description,
    confidence:book.identificationConfidence||'low' as IdentificationConfidence,
    needsReview:!!book.needsReview,
    reviewReason:book.reviewReason||'',
    coverShape:book.coverShape||((book.format==='Audio')?'square':'portrait') as 'portrait'|'square',
    metadataSource:(book.metadataSource==='manual'||book.metadataSource==='embedded'||book.metadataSource==='sidecar'||book.metadataSource==='path')
      ? book.metadataSource
      : 'path' as const,
  };
  const identity=applyResolvedLocalMetadata(base,resolution);
  const patch:LocalBook={
    ...book,
    title:identity.title,
    author:identity.author,
    series:identity.series,
    seriesNumber:identity.seriesNumber,
    genre:identity.genre,
    publishedYear:identity.publishedYear,
    narrator:identity.narrator,
    publisher:identity.publisher,
    isbn:identity.isbn,
    asin:identity.asin,
    language:identity.language,
    description:identity.description,
    workKey:logicalWorkKey(identity),
    editionKey:editionKey(identity,book.format),
    identificationConfidence:identity.confidence,
    needsReview:identity.needsReview,
    reviewReason:identity.reviewReason,
    metadataSource:identity.metadataSource,
    metadataProvenance:resolution.provenance,
    metadataFieldConfidence:resolution.confidence,
    metadataConflicts:resolution.conflicts,
    embeddedMetadata:fields,
  };
  if(book.format==='Comic'){
    const provenance={...(book.comicMetadataProvenance||{})};
    const copyComic=(field:keyof LocalMetadataFields,target=field)=>{
      if((fields as any)[field]===undefined||provenance[String(target)]==='sidecar')return;
      (patch as any)[target]=(fields as any)[field];
      provenance[String(target)]='embedded';
    };
    for(const field of ['comicIssueNumber','comicVolume','comicSeriesAliases','comicCreators','comicStoryArcs','comicCharacters','comicTeams','comicUniverses','comicUpc','comicSku','comicStoreDate','comicCoverDate','comicPageCount'] as Array<keyof LocalMetadataFields>)copyComic(field);
    if(fields.comicVineId!==undefined||fields.comicGcdId!==undefined){
      patch.comicExternalIds={...(patch.comicExternalIds||{}),...(fields.comicVineId!==undefined?{comicVine:fields.comicVineId}:{}),...(fields.comicGcdId!==undefined?{gcd:fields.comicGcdId}:{})};
    }
    patch.comicMetadataProvenance=provenance;
  }
  return patch;
}

export async function enrichLocalEmbeddedMetadata(
  books:LocalBook[],
  options:{
    shouldContinue?:()=>boolean;
    refreshMetadata?:boolean;
    batchSize?:number;
    itemTimeoutMs?:number;
    maxConsecutiveTimeouts?:number;
    concurrency?:number;
    shouldInspect?:(book:LocalBook)=>boolean;
    onBatch?:(books:LocalBook[],progress:{attempted:number;processed:number;total:number;updated:number;review:number;timedOut:number;skipped:number;current?:string})=>void|Promise<void>;
  }={},
):Promise<LocalEmbeddedMetadataEnrichmentResult>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const batchSize=Math.max(1,Math.min(24,Math.trunc(options.batchSize||8)));
  const itemTimeoutMs=Math.max(25,Math.min(30000,Math.trunc(options.itemTimeoutMs||8000)));
  const concurrency=Math.max(1,Math.min(6,Math.trunc(options.concurrency||4)));
  let next=books.slice();
  const inspect=options.shouldInspect||(()=>true);
  const eligible=next.filter(book=>['EPUB','Comic','Audio'].includes(book.format)&&inspect(book));
  const eligibleUris=new Set(eligible.map(book=>book.uri));
  const audioFolderCounts=new Map<string,number>();
  for(const book of eligible.filter(book=>book.format==='Audio')){
    const parts=decodedPathParts(book.uri);
    const key=parts.slice(0,-1).join('/');
    audioFolderCounts.set(key,(audioFolderCounts.get(key)||0)+1);
  }
  let attempted=0,processed=0,updated=0,pending=0,timedOut=0,skipped=0,consecutiveTimeouts=0;
  let review=next.filter(book=>book.needsReview).length;
  let lastPublish=Date.now();
  const yieldToUi=cooperativeYieldFactory();

  const publish=async(current?:string,force=false)=>{
    if(!force&&pending<batchSize&&Date.now()-lastPublish<700)return;
    lastPublish=Date.now();pending=0;
    await options.onBatch?.(next,{attempted,processed,total:eligible.length,updated,review,timedOut,skipped,current});
    await yieldToUi(true);
  };

  const eligibleEntries=next
    .map((book,index)=>({book,index}))
    .filter(({book})=>eligibleUris.has(book.uri));

  for(let cursor=0;cursor<eligibleEntries.length;cursor+=concurrency){
    if(!shouldContinue())break;
    const batch=eligibleEntries.slice(cursor,cursor+concurrency);
    const results=await Promise.all(batch.map(async({book,index})=>{
      if(book.embeddedMetadata&&!options.refreshMetadata)return {book,index,reused:true,fields:{} as LocalMetadataFields,timedOut:false};
      attempted+=1;
      const ext=extension(book.uri);
      try{
        const raw=await withOperationTimeout(
          book.format==='Audio'
            ? extractAudioMetadata(book.uri,ext,{size:book.fileSize})
            : extractEmbeddedMetadata(book.uri,ext,{exists:true,size:book.fileSize}),
          itemTimeoutMs,
          'Embedded metadata read',
        );
        const parts=decodedPathParts(book.uri);
        const siblingCount=book.format==='Audio'?(audioFolderCounts.get(parts.slice(0,-1).join('/'))||1):1;
        const fields=sanitizeDiscoveredMetadata(raw,book.format,book.title,siblingCount);
        return {book,index,reused:false,fields,timedOut:false};
      }catch(error:any){
        return {book,index,reused:false,fields:{} as LocalMetadataFields,timedOut:error?.code==='operation-timeout'};
      }
    }));
    if(!shouldContinue())break;

    for(const result of results){
      const {book,index,fields,reused}=result;
      if(result.timedOut)timedOut+=1;
      if(!reused){
        const patch=mergeEmbeddedMetadata(book,fields);
        next[index]=patch;
        if(Object.keys(fields).length)updated+=1;
        if(!!book.needsReview!==!!patch.needsReview)review+=patch.needsReview?1:-1;
      }
      processed+=1;pending+=1;
    }
    const current=results.at(-1)?.book.title;
    await options.onBatch?.(next,{attempted,processed,total:eligible.length,updated,review,timedOut,skipped,current});
    pending=0;lastPublish=Date.now();
    await yieldToUi(true);
  }
  if(shouldContinue()){
    await options.onBatch?.(next,{attempted,processed,total:eligible.length,updated,review,timedOut,skipped});
  }
  return {books:next,attempted,processed,updated,review,timedOut,skipped};
}

export function applyCoverEnrichment<T extends {uri?:string;coverUri?:string;coverCandidates?:string[]}>(
  current: T[],
  enriched: Array<{uri?:string;coverUri?:string;coverCandidates?:string[]}>,
): T[] {
  const patches=new Map(enriched.filter(item=>item.uri&&item.coverUri).map(item=>[item.uri!,item]));
  let changed=false;
  const next=current.map(item=>{
    if(!item.uri||item.coverUri)return item;
    const patch=patches.get(item.uri);
    if(!patch?.coverUri)return item;
    const candidates=[...(item.coverCandidates||[])];
    for(const candidate of patch.coverCandidates||[])if(candidate&&!candidates.includes(candidate))candidates.push(candidate);
    if(!candidates.includes(patch.coverUri))candidates.push(patch.coverUri);
    changed=true;
    return {...item,coverUri:patch.coverUri,coverCandidates:candidates};
  });
  return changed?next:current;
}

export async function enrichLocalBookCovers(
  books: LocalBook[],
  options: {
    shouldContinue?: () => boolean;
    batchSize?: number;
    itemTimeoutMs?: number;
    maxConsecutiveTimeouts?: number;
    onBatch?: (books: LocalBook[], progress: {attempted:number;updated:number;timedOut:number;skipped:number;current?:string}) => void | Promise<void>;
  } = {},
): Promise<LocalCoverEnrichmentResult> {
  const shouldContinue=options.shouldContinue || (()=>true);
  const batchSize=Math.max(1,Math.min(24,Math.trunc(options.batchSize || 6)));
  let next=books.slice();
  let attempted=0;
  let updated=0;
  let pendingSinceBatch=0;
  let timedOut=0,skipped=0,consecutiveTimeouts=0;
  const itemTimeoutMs=Math.max(25,Math.min(30000,Math.trunc(options.itemTimeoutMs||8000)));
  const maxConsecutiveTimeouts=Math.max(1,Math.min(10,Math.trunc(options.maxConsecutiveTimeouts||3)));
  let lastPublish=Date.now();
  const yieldToUi=cooperativeYieldFactory();
  const audioKeys=audioWorkGroupKeys(next);
  const audioGroupCover=new Map<string,string>();
  for(const book of next){
    if(book.format==='Audio'&&book.coverUri){
      const key=audioKeys.get(book.uri);
      if(key&&!audioGroupCover.has(key))audioGroupCover.set(key,book.coverUri);
    }
  }

  for(let index=0;index<next.length;index+=1){
    if(!shouldContinue())break;
    await yieldToUi();
    const book=next[index];
    if(book.coverUri)continue;
    const ext=extension(book.uri);
    if(!['epub','pdf','cbz','cbr','cbt','zip','mp3','m4a','m4b'].includes(ext))continue;

    attempted+=1;
    pendingSinceBatch+=1;
    const audioKey=book.format==='Audio'?audioKeys.get(book.uri):undefined;
    const sharedCover=audioKey?audioGroupCover.get(audioKey):undefined;
    if(sharedCover){
      const candidates=[sharedCover,...(book.coverCandidates||[]).filter(uri=>uri!==sharedCover)];
      next[index]={...book,coverUri:sharedCover,coverCandidates:candidates};
      updated+=1;
      if(pendingSinceBatch>=batchSize||Date.now()-lastPublish>=1200){
        lastPublish=Date.now();pendingSinceBatch=0;
        await options.onBatch?.(next,{attempted,updated,timedOut,skipped,current:book.title});
      }
      continue;
    }
    await options.onBatch?.(next,{attempted,updated,timedOut,skipped,current:book.title});
    let coverUri:string|undefined;
    try{
      coverUri=await withOperationTimeout((async()=>{
        const info=await getInfoAsync(book.uri).catch(()=>null);
        const fileSize=info&&'size' in info&&typeof info.size==='number'?info.size:book.fileSize;
        const modificationTime=info&&'modificationTime' in info&&typeof info.modificationTime==='number'?info.modificationTime:book.modificationTime;
        return discoverEmbeddedCover(book.uri,ext,{size:fileSize,modificationTime});
      })(),itemTimeoutMs,'Embedded cover read');
      consecutiveTimeouts=0;
    }catch(error:any){
      if(error?.code==='operation-timeout'){timedOut+=1;consecutiveTimeouts+=1;}
      else consecutiveTimeouts=0;
    }
    if(!shouldContinue())break;
    if(coverUri){
      const candidates=[...(book.coverCandidates||[])];
      if(!candidates.includes(coverUri))candidates.push(coverUri);
      next[index]={...book,coverUri,coverCandidates:candidates};
      if(audioKey)audioGroupCover.set(audioKey,coverUri);
      updated+=1;
    }
    if(pendingSinceBatch>=batchSize||Date.now()-lastPublish>=1200){
      lastPublish=Date.now();
      pendingSinceBatch=0;
      await options.onBatch?.(next,{attempted,updated,timedOut,skipped,current:book.title});
    }
    if(consecutiveTimeouts>=maxConsecutiveTimeouts){
      skipped=next.slice(index+1).filter(candidate=>{
        if(candidate.coverUri)return false;
        const candidateExt=extension(candidate.uri);
        return ['epub','pdf','cbz','cbr','cbt','zip','mp3','m4a','m4b'].includes(candidateExt);
      }).length;
      await options.onBatch?.(next,{attempted,updated,timedOut,skipped,current:'Skipped remaining cover reads after repeated timeouts'});
      break;
    }
  }

  if(pendingSinceBatch>0&&shouldContinue()){
    await options.onBatch?.(next,{attempted,updated,timedOut,skipped});
  }
  return {books:next,attempted,updated,timedOut,skipped};
}

export function applyOnlineMetadataEnrichment(current:LocalBook[],enriched:LocalBook[]):LocalBook[] {
  const patches=new Map(enriched.filter(item=>!!item.uri).map(item=>[item.uri,item]));
  let changed=false;
  const next=current.map(item=>{
    const patch=patches.get(item.uri);
    if(!patch)return item;
    if(patch===item)return item;
    const protectedFields=new Set(
      Object.entries(item.metadataProvenance||{})
        .filter(([,source])=>source==='manual')
        .map(([field])=>field),
    );
    const merged:LocalBook={...patch};
    for(const field of protectedFields){
      if(field in item)(merged as any)[field]=(item as any)[field];
      if(item.metadataProvenance?.[field])merged.metadataProvenance={...(merged.metadataProvenance||{}),[field]:item.metadataProvenance[field]};
      if(item.metadataFieldConfidence?.[field])merged.metadataFieldConfidence={...(merged.metadataFieldConfidence||{}),[field]:item.metadataFieldConfidence[field]};
    }
    const cachedReplacement=!!patch.coverUri?.startsWith('file:') && /^https?:/i.test(item.coverUri||'') && !!patch.coverCandidates?.includes(item.coverUri!);
    if(item.coverUri&&item.coverUri!==patch.coverUri&&!cachedReplacement){
      merged.coverUri=item.coverUri;
      merged.coverCandidates=[item.coverUri,...(patch.coverCandidates||[]).filter(value=>value!==item.coverUri)];
    }
    changed=true;
    return merged;
  });
  return changed?next:current;
}

type LocalBookLookupUnit={indexes:number[];target:LocalBook};

function localBookLookupUnits(books:LocalBook[]):LocalBookLookupUnit[]{
  const units:LocalBookLookupUnit[]=[];
  const audioKeys=audioWorkGroupKeys(books);
  const audioGroups=new Map<string,number[]>();

  books.forEach((book,index)=>{
    const format=String(book.format||'').toLowerCase();
    if(format==='audio'){
      const key=audioKeys.get(book.uri)||('audio-file:'+book.uri);
      const indexes=audioGroups.get(key)||[];
      indexes.push(index);
      audioGroups.set(key,indexes);
      return;
    }
    if(format==='epub'||format==='pdf')units.push({indexes:[index],target:book});
  });

  for(const indexes of audioGroups.values()){
    const group=indexes.map(index=>books[index]);
    const first=group[0];
    const canonical=canonicalMetadataForBooks(group);
    const metadataProvenance={...(first.metadataProvenance||{})};
    const metadataFieldConfidence={...(first.metadataFieldConfidence||{})};
    for(const [field,source] of Object.entries(canonical.provenance)){
      if(source)metadataProvenance[field]=source as MetadataSource;
    }
    for(const [field,confidence] of Object.entries(canonical.confidence)){
      if(confidence)metadataFieldConfidence[field]=confidence as IdentificationConfidence;
    }
    const target:LocalBook={
      ...first,
      title:canonical.title||first.title,
      author:canonical.author||first.author,
      series:canonical.series||first.series,
      seriesNumber:canonical.seriesNumber??first.seriesNumber,
      genre:canonical.genre||first.genre,
      publishedYear:canonical.publishedYear??first.publishedYear,
      narrator:canonical.narrator||first.narrator,
      publisher:canonical.publisher||first.publisher,
      isbn:canonical.isbn||first.isbn,
      asin:canonical.asin||first.asin,
      language:canonical.language||first.language,
      description:canonical.description||first.description,
      coverUri:canonical.coverUri||first.coverUri,
      metadataProvenance,
      metadataFieldConfidence,
    };
    units.push({indexes,target});
  }
  return units.filter(unit=>shouldLookupBookOnline(unit.target));
}

export function countLocalBookOnlineLookupUnits(books:LocalBook[]){
  return localBookLookupUnits(books).length;
}

export async function enrichLocalBookMetadataOnline(
  books:LocalBook[],
  options:{
    cache?:OnlineBookCache;
    googleBooksApiKey?:string;
    openLibraryEnabled?:boolean;
    applyHighConfidence?:boolean;
    ignoreCache?:boolean;
    shouldContinue?:()=>boolean;
    batchSize?:number;
    concurrency?:number;
    onBatch?:(books:LocalBook[],progress:{attempted:number;matched:number;review:number;updated:number;cache:OnlineBookCache})=>void|Promise<void>;
  }={},
):Promise<LocalOnlineMetadataEnrichmentResult>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const batchSize=Math.max(1,Math.min(24,Math.trunc(options.batchSize||4)));
  const concurrency=Math.max(1,Math.min(6,Math.trunc(options.concurrency||4)));
  const cache:OnlineBookCache={...(options.cache||{})};
  let next=books.slice();
  const units=localBookLookupUnits(next);
  let attempted=0,matched=0,review=0,updated=0,pending=0;
  let lastPublish=Date.now();
  const yieldToUi=cooperativeYieldFactory();

  for(let cursor=0;cursor<units.length;cursor+=concurrency){
    if(!shouldContinue())break;
    const active=units.slice(cursor,cursor+concurrency);
    attempted+=active.length;
    pending+=active.length;
    const results=await Promise.all(active.map(async unit=>({
      unit,
      result:await lookupOnlineBook(unit.target,{
        cache,
        googleBooksApiKey:options.googleBooksApiKey,
        openLibraryEnabled:options.openLibraryEnabled,
        ignoreCache:options.ignoreCache,
      }),
    })));
    if(!shouldContinue())break;
    for(const {unit,result} of results){
      if(result.best){
        const candidate=result.best;
        if(result.autoApply&&options.applyHighConfidence!==false){
          for(const index of unit.indexes){
            const book=next[index];
            let patch=mergeOnlineBookCandidate(book,candidate,true);
            patch={
              ...patch,
              workKey:logicalWorkKey({...patch,title:unit.target.title||patch.title}),
              editionKey:editionKey({...patch,title:unit.target.title||patch.title},patch.format),
              metadataSource:(patch.metadataProvenance?.title==='online'||patch.metadataProvenance?.author==='online')?'online':patch.metadataSource,
              onlineMetadataMatch:candidate,
              onlineMetadataAlternatives:result.candidates.slice(1,5),
            };
            next[index]=patch;
            updated+=1;
          }
          matched+=1;
        }else if(result.status==='review'||result.status==='matched'){
          for(const index of unit.indexes){
            const book=next[index];
            next[index]={
              ...book,
              needsReview:true,
              reviewReason:'A possible online metadata match needs review.',
              onlineMetadataMatch:candidate,
              onlineMetadataAlternatives:result.candidates.slice(1,5),
            };
          }
          review+=1;
        }
      }
    }
    if(pending>=batchSize||Date.now()-lastPublish>=1200||cursor+concurrency>=units.length){
      lastPublish=Date.now();
      pending=0;
      await options.onBatch?.(next,{attempted,matched,review,updated,cache});
      await yieldToUi(true);
    }
  }
  if(pending&&shouldContinue())await options.onBatch?.(next,{attempted,matched,review,updated,cache});
  return {books:next,attempted,matched,review,updated,cache};
}

export async function enrichLocalComicMetadataOnline(
  books:LocalBook[],
  options:{
    token?:string;
    cache?:OnlineComicCache;
    applyHighConfidence?:boolean;
    ignoreCache?:boolean;
    shouldContinue?:()=>boolean;
    batchSize?:number;
    onBatch?:(books:LocalBook[],progress:{attempted:number;matched:number;review:number;updated:number;rateLimited:boolean;cache:OnlineComicCache})=>void|Promise<void>;
  }={},
):Promise<LocalOnlineComicMetadataEnrichmentResult>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const batchSize=Math.max(1,Math.min(10,Math.trunc(options.batchSize||3)));
  const cache:OnlineComicCache={...(options.cache||{})};
  let next=books.slice();
  let attempted=0,matched=0,review=0,updated=0,pending=0,rateLimited=false;
  let lastPublish=Date.now();
  const yieldToUi=cooperativeYieldFactory();

  for(let index=0;index<next.length;index+=1){
    if(!shouldContinue()||rateLimited)break;
    const book=next[index];
    if(!shouldLookupComicOnline(book))continue;
    attempted+=1;pending+=1;
    const result=await lookupOnlineComic(book,{token:options.token,cache,ignoreCache:options.ignoreCache});
    if(!shouldContinue())break;
    if(result.status==='rate-limited'){rateLimited=true;break;}
    if(result.best){
      const candidate=result.best;
      if(result.autoApply&&options.applyHighConfidence!==false){
        let patch=mergeOnlineComicCandidate(book,candidate,true) as LocalBook;
        patch={
          ...patch,
          workKey:logicalWorkKey(patch),
          editionKey:editionKey(patch,patch.format),
          onlineComicMetadataMatch:candidate,
          onlineComicMetadataAlternatives:result.candidates.slice(1,5),
        };
        next[index]=patch;updated+=1;
        matched+=1;
      }else if(result.status==='review'||result.status==='matched'){
        next[index]={...book,needsReview:true,reviewReason:'A possible online comic issue match needs review.',onlineComicMetadataMatch:candidate,onlineComicMetadataAlternatives:result.candidates.slice(1,5)};
        review+=1;
      }
    }
    if(pending>=batchSize||Date.now()-lastPublish>=1200){
      lastPublish=Date.now();
      pending=0;
      await options.onBatch?.(next,{attempted,matched,review,updated,rateLimited,cache});
      await yieldToUi(true);
    }
  }
  if(pending&&shouldContinue())await options.onBatch?.(next,{attempted,matched,review,updated,rateLimited,cache});
  return {books:next,attempted,matched,review,updated,rateLimited,cache};
}

export function previewLocalSort(books: LocalBook[], template: string): LocalSortPreview[] {
  return previewLocalSortToRoot(books, template);
}

export function previewLocalSortToRoot(books: LocalBook[], template: string, destinationRootUri?: string): LocalSortPreview[] {
  const destinations = new Map<string, number>();
  const audioKeys=audioWorkGroupKeys(books);
  const audioGroups=new Map<string,LocalBook[]>();
  for(const book of books){
    if(book.format!=='Audio')continue;
    const key=audioKeys.get(book.uri)||('audio-file:'+book.uri);
    const group=audioGroups.get(key)||[];group.push(book);audioGroups.set(key,group);
  }
  const audioCanonical=new Map([...audioGroups.entries()].map(([key,group])=>[key,canonicalMetadataForBooks(group)]));
  const previews = books.map(book => {
    const filename = fileNameFromUri(book.uri);
    const audioKey=book.format==='Audio'?(audioKeys.get(book.uri)||('audio-file:'+book.uri)):'';
    const canonical=audioKey?audioCanonical.get(audioKey):undefined;
    const sortBook=canonical?{
      ...book,
      title:canonical.title||book.title,
      author:canonical.author||book.author,
      series:canonical.series||book.series,
      seriesNumber:canonical.seriesNumber??book.seriesNumber,
    }:book;
    const target = targetPath(sortBook, filename, template);
    const sourceRootUri = book.rootUri || rootUriFromFileUri(book.uri);
    const rootUri = destinationRootUri || sourceRootUri;
    const from = displayPath(book.uri);
    const currentRelative = relativePathWithinRoot(book.uri, sourceRootUri);
    const destinationKey = normalizePathKey(rootUri)+'|'+normalizePathKey(target);
    const count = destinations.get(destinationKey) || 0;
    destinations.set(destinationKey, count + 1);
    const same = normalizePathKey(sourceRootUri)===normalizePathKey(rootUri)
      && normalizePathKey(currentRelative) === normalizePathKey(target);
    return {
      id: `local-${book.id}`,
      asset: book.id,
      title: book.title,
      sourceUri: book.uri,
      sourceRootUri,
      rootUri,
      sourceRelativePath: currentRelative,
      relativePath: target,
      from,
      to: target,
      state: book.needsReview ? 'review' as const : same ? 'same' as const : 'ready' as const,
      reason: book.needsReview ? (book.reviewReason || 'Review metadata before organising this file.') : same ? 'Already matches the selected layout.' : undefined,
      metadataSummary: [
        sortBook.author ? 'Author: '+sortBook.author : '',
        sortBook.series ? 'Series: '+sortBook.series+(sortBook.seriesNumber !== undefined ? ' #'+sortBook.seriesNumber : '') : '',
        sortBook.format ? 'Format: '+sortBook.format : '',
      ].filter(Boolean).join(' · '),
    };
  });
  return previews.map(preview => {
    if(preview.state === 'review' || preview.state === 'same') return preview;
    const key=normalizePathKey(preview.rootUri)+'|'+normalizePathKey(preview.to);
    return destinations.get(key)! > 1
      ? {...preview, state:'conflict' as const, reason:'More than one file would use this destination.'}
      : preview;
  });
}

export async function previewLocalSortSafely(
  books: LocalBook[],
  template: string,
  destinationRootUri?: string,
  onProgress?: (done:number,total:number)=>void,
): Promise<LocalSortPreview[]> {
  const previews=previewLocalSortToRoot(books,template,destinationRootUri);
  const cache=new Map<string,string[]>();
  const checked:LocalSortPreview[]=[];
  for(const preview of previews){
    if(checked.length%20===0){onProgress?.(checked.length,previews.length);await new Promise(resolve=>setTimeout(resolve,0));}
    if(preview.state!=='ready'){
      checked.push(preview);
      continue;
    }
    const preflight=await inspectLocalSortDestination(preview.rootUri,preview.relativePath,cache);
    checked.push(preflight.exists
      ? {...preview,state:'conflict',reason:preflight.reason || 'Destination already exists.'}
      : preview);
  }
  return checked;
}

async function verifyLocalCopy(sourceUri:string,targetUri:string){
  const sourceInfo=await getInfoAsync(sourceUri).catch(()=>null);
  const verification=await getInfoAsync(targetUri);
  if(!verification.exists)throw Error('Destination verification failed after copy');
  if(sourceInfo?.exists&&typeof sourceInfo.size==='number'&&sourceInfo.size>0
    &&typeof verification.size==='number'&&verification.size!==sourceInfo.size){
    throw Error('Destination size verification failed after copy');
  }
}

export async function applyLocalSort(
  previews: LocalSortPreview[],
  mode:LocalSortMode='copy',
  onCheckpoint?: (result: LocalSortApplyResult) => void | Promise<void>,
): Promise<LocalSortApplyResult> {
  const copied: LocalSortApplyResult['copied'] = [];
  const failed: LocalSortApplyResult['failed'] = [];
  for (const preview of previews) {
    if (preview.state !== 'ready') continue;
    await new Promise(resolve=>setTimeout(resolve,0));
    let target:string|undefined;
    let applied:LocalSortAppliedItem|undefined;
    try {
      target = await createTargetFile(preview.rootUri, preview.relativePath);
      await copyLocalUri(preview.sourceUri,target);
      await verifyLocalCopy(preview.sourceUri,target);
      applied={
        id:preview.id,title:preview.title,uri:target,sourceUri:preview.sourceUri,
        sourceRootUri:preview.sourceRootUri,rootUri:preview.rootUri,sourceRelativePath:preview.sourceRelativePath,sourceRemoved:false,
      };
      copied.push(applied);
      // Persist a verified-copy checkpoint before a destructive source delete.
      await onCheckpoint?.({copied:copied.map(item=>({...item})),failed:failed.slice()});

      if(mode==='move'){
        let removed=false;
        try{
          await deleteLocalUri(preview.sourceUri);
          const sourceAfter=await getInfoAsync(preview.sourceUri).catch(()=>null);
          removed=sourceAfter?.exists===false;
          if(!removed)throw Error('Source deletion could not be verified');
        }catch(error){
          const sourceAfter=await getInfoAsync(preview.sourceUri).catch(()=>null);
          removed=sourceAfter?.exists===false;
          if(!removed){
            failed.push({id:preview.id,title:preview.title,error:'Verified copy was kept, but the original could not be removed safely: '+((error as Error).message||'unknown error')});
            await onCheckpoint?.({copied:copied.map(item=>({...item})),failed:failed.slice()});
            continue;
          }
        }
        applied.sourceRemoved=true;
        await onCheckpoint?.({copied:copied.map(item=>({...item})),failed:failed.slice()});
      }
    } catch (e) {
      if(target&&!applied)await deleteLocalUri(target).catch(()=>undefined);
      failed.push({id: preview.id, title: preview.title, error: (e as Error).message});
      await onCheckpoint?.({copied: copied.map(item=>({...item})), failed: failed.slice()});
    }
  }
  return {copied, failed};
}

export async function applyLocalSortCopies(
  previews: LocalSortPreview[],
  onCheckpoint?: (result: LocalSortApplyResult) => void | Promise<void>,
): Promise<LocalSortApplyResult> {
  return applyLocalSort(previews,'copy',onCheckpoint);
}

export async function recoverLocalSortOperation(history: LocalSortHistory): Promise<LocalSortApplyResult> {
  const recovered: LocalSortApplyResult['copied'] = [];
  const failed: LocalSortApplyResult['failed'] = [];
  const mode:LocalSortMode=history.mode==='move'?'move':'copy';
  for (const item of history.copied) {
    try {
      if(mode==='copy'){
        await deleteLocalUri(item.uri);
        recovered.push(item);
        continue;
      }
      const sourceInfo=await getInfoAsync(item.sourceUri).catch(()=>null);
      const targetInfo=await getInfoAsync(item.uri).catch(()=>null);
      if(targetInfo?.exists!==true){
        if(sourceInfo?.exists===true){recovered.push(item);continue;}
        throw Error('Cannot restore this move because neither the original nor organised copy can be verified.');
      }
      if(sourceInfo?.exists===true){
        await deleteLocalUri(item.uri);
        recovered.push({...item,sourceRemoved:false});
        continue;
      }
      if(sourceInfo===null)throw Error('Original file state cannot be verified safely.');
      if(!item.sourceRootUri||!item.sourceRelativePath)throw Error('Original path is unavailable for this move history item.');
      const restoredUri=await createTargetFile(item.sourceRootUri,item.sourceRelativePath);
      try{
        await copyLocalUri(item.uri,restoredUri);
        await verifyLocalCopy(item.uri,restoredUri);
      }catch(error){
        await deleteLocalUri(restoredUri).catch(()=>undefined);
        throw error;
      }
      await deleteLocalUri(item.uri);
      recovered.push({...item,sourceUri:restoredUri,sourceRemoved:false});
    } catch (e) {
      failed.push({id: item.id, title: item.title, error: (e as Error).message});
    }
  }
  return {copied: recovered, failed};
}

export async function removeLocalSortCopies(history: LocalSortHistory): Promise<LocalSortApplyResult> {
  if(history.mode==='move')throw Error('Move history must be restored, not deleted.');
  return recoverLocalSortOperation({...history,mode:'copy'});
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

function targetPath(book: LocalBook, filename: string, template: string) {
  const author = cleanPart(book.author || 'Unknown author');
  const series = cleanPart(book.series || 'Standalone');
  const title = cleanPart(book.title || filename.replace(/\.[^.]+$/, ''));
  const orderedTitle = book.series && book.seriesNumber !== undefined ? cleanPart(seriesNumberLabel(book.seriesNumber) + ' - ' + title) : title;
  const format = cleanPart(book.format || 'Books');
  if (template === 'author-series-title') return `${author}/${series}/${orderedTitle}/${filename}`;
  if (template === 'format-author-title') return `${format}/${author}/${title}/${filename}`;
  return `${author}/${title}/${filename}`;
}

function seriesNumberLabel(value: number) {
  if (!Number.isFinite(value)) return '';
  if (!Number.isInteger(value)) return String(value);
  return value < 10 ? '0' + value : String(value);
}

function fileNameFromUri(uri: string) {
  const clean = decodeUriPart(uri).split('?')[0];
  return clean.split('/').pop() || 'item';
}

function fileStem(uri: string) {
  return fileNameFromUri(uri).replace(/\.[^.]+$/, '');
}

function normalizePathKey(value:string){
  return decodeUriPart(value).replace(/\\/g,'/').replace(/\/+/g,'/').replace(/^\.\//,'').replace(/\/$/,'').toLocaleLowerCase();
}

function relativePathWithinRoot(uri:string,rootUri:string){
  const full=displayPath(uri).replace(/\\/g,'/').replace(/^\/+|\/+$/g,'');
  const root=displayPath(rootUri).replace(/\\/g,'/').replace(/^\/+|\/+$/g,'');
  if(!root)return full;
  const fullKey=full.toLocaleLowerCase(),rootKey=root.toLocaleLowerCase();
  if(fullKey===rootKey)return '';
  if(fullKey.startsWith(rootKey+'/'))return full.slice(root.length+1);
  return full;
}

async function inspectLocalSortDestination(rootUri:string,relativePath:string,cache:Map<string,string[]>){
  const parts=relativePath.split('/').filter(Boolean);
  if(!parts.length)return {exists:true,reason:'Missing destination file name.'};
  const filename=parts.pop()!;
  let dir=rootUri;
  for(const part of parts){
    let children=cache.get(dir);
    if(!children){
      try{children=await listDirectoryEntries(dir);}
      catch{return {exists:true,reason:'Destination folder cannot be inspected safely.'};}
      cache.set(dir,children);
    }
    const child=children.find(value=>lastPathPart(value).localeCompare(part,undefined,{sensitivity:'accent'})===0);
    if(!child)return {exists:false};
    dir=child;
  }
  let children=cache.get(dir);
  if(!children){
    try{children=await listDirectoryEntries(dir);}
    catch{return {exists:true,reason:'Destination folder cannot be inspected safely.'};}
    cache.set(dir,children);
  }
  const wantedStem=filename.replace(/\.[^.]+$/,'');
  const collision=children.some(child=>{
    const childName=lastPathPart(child);
    return childName.localeCompare(filename,undefined,{sensitivity:'accent'})===0
      || childName.localeCompare(wantedStem,undefined,{sensitivity:'accent'})===0;
  });
  return collision
    ? {exists:true,reason:'Destination already exists: '+filename}
    : {exists:false};
}

async function createTargetFile(rootUri: string, relativePath: string) {
  const parts = relativePath.split('/').filter(Boolean);
  if (!parts.length) throw Error('Missing destination file name');
  const filename = parts.pop()!;
  let dir = rootUri;
  for (const part of parts) dir = await ensureDirectory(dir, part);
  const children = await listDirectoryEntries(dir);
  const wantedStem = filename.replace(/\.[^.]+$/, '');
  const collision = children.some(child => {
    const childName = lastPathPart(child);
    return childName.localeCompare(filename, undefined, {sensitivity:'accent'}) === 0
      || childName.localeCompare(wantedStem, undefined, {sensitivity:'accent'}) === 0;
  });
  if (collision) throw Error('Destination already exists: ' + filename);
  const dot = filename.lastIndexOf('.');
  const name = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase() : '';
  if(isSAFUri(dir))return StorageAccessFramework.createFileAsync(dir, name, mimeType(ext));
  return dir.replace(/\/$/,'')+'/'+encodeURIComponent(filename);
}

async function ensureDirectory(parent: string, name: string) {
  const children = await listDirectoryEntries(parent);
  const existing = children.find(child => lastPathPart(child) === name);
  if (existing) return existing;
  if(isSAFUri(parent))return StorageAccessFramework.makeDirectoryAsync(parent, name);
  const target=parent.replace(/\/$/,'')+'/'+encodeURIComponent(name);
  await makeDirectoryAsync(target,{intermediates:true});
  return target;
}

function rootUriFromFileUri(uri: string) {
  if(uri.startsWith('file://')){
    const clean=uri.split('?')[0].replace(/\/$/,'');
    return clean.slice(0,Math.max(0,clean.lastIndexOf('/'))) || clean;
  }
  const marker = '/document/';
  if (!uri.includes(marker)) return uri;
  const prefix = uri.split(marker)[0];
  const doc = uri.split(marker)[1] || '';
  const root = doc.split('%2F')[0].split('/')[0];
  return `${prefix}/tree/${root}/document/${root}`;
}

function lastPathPart(uri: string) {
  const clean = displayPath(uri);
  return clean.split('/').filter(Boolean).pop() || clean;
}

function mimeType(ext: string) {
  if (ext === 'epub') return 'application/epub+zip';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'cbz' || ext === 'zip') return 'application/zip';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'm4a' || ext === 'm4b') return 'audio/mp4';
  if (ext === 'flac') return 'audio/flac';
  if (ext === 'ogg' || ext === 'opus') return 'audio/ogg';
  return 'application/octet-stream';
}

function displayPath(uri: string) {
  const clean = decodeUriPart(uri).split('/document/').pop() || decodeUriPart(uri);
  return clean.replace(/^primary:/, '');
}

function cleanPart(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Unknown';
}

function decodeUriPart(uri: string) {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}
