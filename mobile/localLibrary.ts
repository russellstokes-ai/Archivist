import {Platform} from 'react-native';
import {copyAsync, deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, readAsStringAsync, readDirectoryAsync, StorageAccessFramework} from 'expo-file-system/legacy';
import {applyLocalMetadata, applyResolvedLocalMetadata, inferLocalBookMetadata, IdentificationConfidence, isGenericMediaTitle, LocalMetadataFields, parseLocalSidecar, logicalWorkKey, editionKey, sanitizeDiscoveredMetadata} from './libraryIntelligence';
import {MetadataCandidate, MetadataConflict, MetadataSource, resolveMetadataCandidates} from './metadataResolution';
import {extractEmbeddedMetadata} from './embeddedMetadata';
import {extractAudioMetadata} from './audioMetadata';
import {discoverEmbeddedCover} from './coverDiscovery';
import {lookupOnlineBook, mergeOnlineBookCandidate, shouldLookupBookOnline, OnlineBookCache, OnlineBookCandidate} from './onlineBookMetadata';
import {lookupOnlineComic, mergeOnlineComicCandidate, shouldLookupComicOnline, OnlineComicCache, OnlineComicCandidate} from './onlineComicMetadata';

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

export type LocalSortPreview = {
  id: string;
  asset: number;
  title: string;
  sourceUri: string;
  rootUri: string;
  relativePath: string;
  from: string;
  to: string;
  state: 'ready' | 'same' | 'conflict' | 'review';
  reason?: string;
  metadataSummary?: string;
};

export type LocalSortApplyResult = {
  copied: Array<{id: string; title: string; uri: string}>;
  failed: Array<{id: string; title: string; error: string}>;
};

export type LocalSortHistory = {
  id: string;
  createdAt: string;
  copied: Array<{id: string; title: string; uri: string}>;
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
  phase: 'discovering' | 'reading-metadata' | 'matching' | 'checking-duplicates' | 'preparing' | 'complete';
  currentFolder: string;
  entriesVisited: number;
  found: number;
  review: number;
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
  refreshMetadata?: boolean;
};

export type LocalCoverEnrichmentResult = {
  books: LocalBook[];
  attempted: number;
  updated: number;
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
  if(isSAFUri(from)||isSAFUri(to))return StorageAccessFramework.copyAsync({from,to});
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
    if (truncated || visitedDirectories.has(uri)) return;
    visitedDirectories.add(uri);
    let children: string[];
    try {
      children = await listDirectoryEntries(uri);
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
      entriesVisited += 1;
      if(entriesVisited%12===0)await new Promise(resolve=>setTimeout(resolve,0));
      if (entriesVisited > maxVisitedEntriesPerScan) {
        truncated = true;
        truncatedReason = 'entry-limit';
        return;
      }
      if (entriesVisited === 1 || entriesVisited % 20 === 0) report(metadataStarted ? 'reading-metadata' : 'discovering', space);
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
          report('reading-metadata', space);
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
        const embeddedRawFields = !options.refreshMetadata && unchanged && previous?.embeddedMetadata && Object.keys(previous.embeddedMetadata).length
          ? previous.embeddedMetadata
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
        const coverUri = override?.coverUri?.trim() || discoveredCoverUri || embeddedCoverUri;
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
          embeddedMetadata: Object.keys(embeddedFields).length ? embeddedFields : undefined,
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
        if (books.length === 1 || books.length % 25 === 0) report('discovering', space);
      } else {
        if (!ext) {
          await scanDir(child, space, depth + 1, folderRoot);
        } else if (!knownNonDirectoryExtensions.has(ext)) {
          // SAF does not tell us whether a child is a file or directory.
          // Unknown extensions may be dotted folder names (for example "J.R.R. Tolkien"),
          // so probe them as directories without reporting ordinary unsupported files as errors.
          await scanDir(child, space, depth + 1, folderRoot, false);
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
  return {
    folders: nextFolders.concat(folders.slice(nextFolders.length)),
    books,
    skipped,
    truncated,
    truncatedReason,
    identified: books.length - review,
    review,
    entriesVisited,
  };
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
    onBatch?: (books: LocalBook[], progress: {attempted:number;updated:number}) => void | Promise<void>;
  } = {},
): Promise<LocalCoverEnrichmentResult> {
  const shouldContinue=options.shouldContinue || (()=>true);
  const batchSize=Math.max(1,Math.min(24,Math.trunc(options.batchSize || 6)));
  let next=books.slice();
  let attempted=0;
  let updated=0;
  let pendingSinceBatch=0;

  for(let index=0;index<next.length;index+=1){
    if(!shouldContinue())break;
    await new Promise(resolve=>setTimeout(resolve,0));
    const book=next[index];
    if(book.coverUri)continue;
    const ext=extension(book.uri);
    if(!['epub','pdf','cbz','cbr','cbt','zip','mp3','m4a','m4b'].includes(ext))continue;

    attempted+=1;
    pendingSinceBatch+=1;
    const info=await getInfoAsync(book.uri).catch(()=>null);
    if(!shouldContinue())break;
    const fileSize=info&&'size' in info&&typeof info.size==='number'?info.size:book.fileSize;
    const modificationTime=info&&'modificationTime' in info&&typeof info.modificationTime==='number'?info.modificationTime:book.modificationTime;
    const coverUri=await discoverEmbeddedCover(book.uri,ext,{size:fileSize,modificationTime});
    if(!shouldContinue())break;
    if(coverUri){
      const candidates=[...(book.coverCandidates||[])];
      if(!candidates.includes(coverUri))candidates.push(coverUri);
      next[index]={...book,coverUri,coverCandidates:candidates};
      updated+=1;
    }
    if(pendingSinceBatch>=batchSize){
      pendingSinceBatch=0;
      await options.onBatch?.(next.slice(),{attempted,updated});
    }
  }

  if(pendingSinceBatch>0&&shouldContinue()){
    await options.onBatch?.(next.slice(),{attempted,updated});
  }
  return {books:next,attempted,updated};
}

export function applyOnlineMetadataEnrichment(current:LocalBook[],enriched:LocalBook[]):LocalBook[] {
  const patches=new Map(enriched.filter(item=>!!item.uri).map(item=>[item.uri,item]));
  let changed=false;
  const next=current.map(item=>{
    const patch=patches.get(item.uri);
    if(!patch)return item;
    if(JSON.stringify(patch)===JSON.stringify(item))return item;
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
    if(item.coverUri&&item.coverUri!==patch.coverUri){
      merged.coverUri=item.coverUri;
      merged.coverCandidates=[item.coverUri,...(patch.coverCandidates||[]).filter(value=>value!==item.coverUri)];
    }
    changed=true;
    return merged;
  });
  return changed?next:current;
}

export async function enrichLocalBookMetadataOnline(
  books:LocalBook[],
  options:{
    cache?:OnlineBookCache;
    googleBooksApiKey?:string;
    shouldContinue?:()=>boolean;
    batchSize?:number;
    onBatch?:(books:LocalBook[],progress:{attempted:number;matched:number;review:number;updated:number;cache:OnlineBookCache})=>void|Promise<void>;
  }={},
):Promise<LocalOnlineMetadataEnrichmentResult>{
  const shouldContinue=options.shouldContinue||(()=>true);
  const batchSize=Math.max(1,Math.min(12,Math.trunc(options.batchSize||4)));
  const cache:OnlineBookCache={...(options.cache||{})};
  let next=books.slice();
  let attempted=0,matched=0,review=0,updated=0,pending=0;

  for(let index=0;index<next.length;index+=1){
    if(!shouldContinue())break;
    const book=next[index];
    if(!shouldLookupBookOnline(book))continue;
    attempted+=1;pending+=1;
    const result=await lookupOnlineBook(book,{cache,googleBooksApiKey:options.googleBooksApiKey});
    if(!shouldContinue())break;
    if(result.best){
      const candidate=result.best;
      let patch:LocalBook;
      if(result.autoApply){
        patch=mergeOnlineBookCandidate(book,candidate,true);
        patch={
          ...patch,
          workKey:logicalWorkKey(patch),
          editionKey:editionKey(patch,patch.format),
          metadataSource:(patch.metadataProvenance?.title==='online'||patch.metadataProvenance?.author==='online')?'online':patch.metadataSource,
          onlineMetadataMatch:candidate,
          onlineMetadataAlternatives:result.candidates.slice(1,5),
        };
        if(JSON.stringify(patch)!==JSON.stringify(book)){next[index]=patch;updated+=1;}
        matched+=1;
      }else if(result.status==='review'){
        patch={...book,needsReview:true,reviewReason:'A possible online metadata match needs review.',onlineMetadataMatch:candidate,onlineMetadataAlternatives:result.candidates.slice(1,5)};
        next[index]=patch;review+=1;
      }
    }
    if(pending>=batchSize){
      pending=0;
      await options.onBatch?.(next.slice(),{attempted,matched,review,updated,cache});
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }
  if(pending&&shouldContinue())await options.onBatch?.(next.slice(),{attempted,matched,review,updated,cache});
  return {books:next,attempted,matched,review,updated,cache};
}

export async function enrichLocalComicMetadataOnline(
  books:LocalBook[],
  options:{
    token?:string;
    cache?:OnlineComicCache;
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

  for(let index=0;index<next.length;index+=1){
    if(!shouldContinue()||rateLimited)break;
    const book=next[index];
    if(!shouldLookupComicOnline(book))continue;
    attempted+=1;pending+=1;
    const result=await lookupOnlineComic(book,{token:options.token,cache});
    if(!shouldContinue())break;
    if(result.status==='rate-limited'){rateLimited=true;break;}
    if(result.best){
      const candidate=result.best;
      if(result.autoApply){
        let patch=mergeOnlineComicCandidate(book,candidate,true) as LocalBook;
        patch={
          ...patch,
          workKey:logicalWorkKey(patch),
          editionKey:editionKey(patch,patch.format),
          onlineComicMetadataMatch:candidate,
          onlineComicMetadataAlternatives:result.candidates.slice(1,5),
        };
        if(JSON.stringify(patch)!==JSON.stringify(book)){next[index]=patch;updated+=1;}
        matched+=1;
      }else if(result.status==='review'){
        next[index]={...book,needsReview:true,reviewReason:'A possible online comic issue match needs review.',onlineComicMetadataMatch:candidate,onlineComicMetadataAlternatives:result.candidates.slice(1,5)};
        review+=1;
      }
    }
    if(pending>=batchSize){
      pending=0;
      await options.onBatch?.(next.slice(),{attempted,matched,review,updated,rateLimited,cache});
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }
  if(pending&&shouldContinue())await options.onBatch?.(next.slice(),{attempted,matched,review,updated,rateLimited,cache});
  return {books:next,attempted,matched,review,updated,rateLimited,cache};
}

export function previewLocalSort(books: LocalBook[], template: string): LocalSortPreview[] {
  return previewLocalSortToRoot(books, template);
}

export function previewLocalSortToRoot(books: LocalBook[], template: string, destinationRootUri?: string): LocalSortPreview[] {
  const destinations = new Map<string, number>();
  const previews = books.map(book => {
    const filename = fileNameFromUri(book.uri);
    const target = targetPath(book, filename, template);
    const rootUri = destinationRootUri || book.rootUri || rootUriFromFileUri(book.uri);
    const from = displayPath(book.uri);
    const currentRelative = relativePathWithinRoot(book.uri, rootUri);
    const destinationKey = normalizePathKey(rootUri)+'|'+normalizePathKey(target);
    const count = destinations.get(destinationKey) || 0;
    destinations.set(destinationKey, count + 1);
    const same = normalizePathKey(currentRelative) === normalizePathKey(target);
    return {
      id: `local-${book.id}`,
      asset: book.id,
      title: book.title,
      sourceUri: book.uri,
      rootUri,
      relativePath: target,
      from,
      to: target,
      state: book.needsReview ? 'review' as const : same ? 'same' as const : 'ready' as const,
      reason: book.needsReview ? (book.reviewReason || 'Review metadata before organising this file.') : same ? 'Already matches the selected layout.' : undefined,
      metadataSummary: [
        book.author ? 'Author: '+book.author : '',
        book.series ? 'Series: '+book.series+(book.seriesNumber !== undefined ? ' #'+book.seriesNumber : '') : '',
        book.format ? 'Format: '+book.format : '',
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
): Promise<LocalSortPreview[]> {
  const previews=previewLocalSortToRoot(books,template,destinationRootUri);
  const cache=new Map<string,string[]>();
  const checked:LocalSortPreview[]=[];
  for(const preview of previews){
    if(checked.length%20===0)await new Promise(resolve=>setTimeout(resolve,0));
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

export async function applyLocalSortCopies(
  previews: LocalSortPreview[],
  onCheckpoint?: (result: LocalSortApplyResult) => void | Promise<void>,
): Promise<LocalSortApplyResult> {
  const copied: LocalSortApplyResult['copied'] = [];
  const failed: LocalSortApplyResult['failed'] = [];
  for (const preview of previews) {
    if (preview.state !== 'ready') continue;
    await new Promise(resolve=>setTimeout(resolve,0));
    try {
      const target = await createTargetFile(preview.rootUri, preview.relativePath);
      const sourceInfo = await getInfoAsync(preview.sourceUri).catch(() => null);
      await copyLocalUri(preview.sourceUri,target);
      const verification = await getInfoAsync(target);
      if (!verification.exists) throw Error('Destination verification failed after copy');
      if (sourceInfo?.exists && typeof sourceInfo.size === 'number' && sourceInfo.size > 0
        && typeof verification.size === 'number' && verification.size !== sourceInfo.size) {
        await StorageAccessFramework.deleteAsync(target).catch(() => undefined);
        throw Error('Destination size verification failed after copy');
      }
      copied.push({id: preview.id, title: preview.title, uri: target});
      await onCheckpoint?.({copied: copied.slice(), failed: failed.slice()});
    } catch (e) {
      failed.push({id: preview.id, title: preview.title, error: (e as Error).message});
      await onCheckpoint?.({copied: copied.slice(), failed: failed.slice()});
    }
  }
  return {copied, failed};
}

export async function removeLocalSortCopies(history: LocalSortHistory): Promise<LocalSortApplyResult> {
  const removed: LocalSortApplyResult['copied'] = [];
  const failed: LocalSortApplyResult['failed'] = [];
  for (const item of history.copied) {
    try {
      await deleteLocalUri(item.uri);
      removed.push(item);
    } catch (e) {
      failed.push({id: item.id, title: item.title, error: (e as Error).message});
    }
  }
  return {copied: removed, failed};
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
