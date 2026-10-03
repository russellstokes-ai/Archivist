import {Platform} from 'react-native';
import {getInfoAsync, readAsStringAsync, StorageAccessFramework} from 'expo-file-system/legacy';
import {applyLocalMetadata, inferLocalBookMetadata, IdentificationConfidence, LocalMetadataFields, parseLocalSidecar, logicalWorkKey, editionKey} from './libraryIntelligence';
import {MetadataCandidate, MetadataConflict, MetadataSource, resolveMetadataCandidates} from './metadataResolution';
import {extractEmbeddedMetadata} from './embeddedMetadata';
import {extractAudioMetadata} from './audioMetadata';

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
  format: string;
  space: string;
  available: boolean;
  identificationConfidence?: IdentificationConfidence;
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  metadataSource?: 'path' | 'embedded' | 'sidecar' | 'manual';
  coverUri?: string;
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

export async function scanLocalFolders(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
  previousBooks: LocalBook[] = [],
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

  async function scanDir(uri: string, space: string, depth: number, countUnreadable = true) {
    if (truncated || visitedDirectories.has(uri)) return;
    visitedDirectories.add(uri);
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
      if (ext === 'opf' || ext === 'nfo' || ext === 'json' || ext === 'xml') {
        sidecarByStem.set(stem, child);
        if (stem === 'metadata' || stem === 'book' || stem === 'comicinfo') genericSidecar = child;
      }
      if (['jpg','jpeg','png','webp'].includes(ext)) {
        artworkByStem.set(stem, child);
        const rank = stem === 'cover' ? 0 : stem === 'front' ? 1 : stem === 'folder' ? 2 : stem === 'coverart' ? 3 : 99;
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
        let identity = inferLocalBookMetadata(child, format);
        const evidence: MetadataCandidate[] = [{
          source: 'path' as const,
          confidence: identity.confidence,
          fields: {
            title: identity.title, author: identity.author, series: identity.series, seriesNumber: identity.seriesNumber,
            genre: identity.genre, publishedYear: identity.publishedYear,
          },
        }];

        const sidecarUri = sidecarByStem.get(fileStem(child).toLowerCase()) || genericSidecar;
        if (sidecarUri) {
          const fields = await cachedSidecarFields(sidecarUri);
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
        const embeddedFields = unchanged && previous?.embeddedMetadata
          ? previous.embeddedMetadata
          : format === 'Audio'
            ? await extractAudioMetadata(child, ext, {size:fileSize})
            : await extractEmbeddedMetadata(child, ext, {exists:fileInfo?.exists,size:fileSize});
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

        const discoveredCoverUri = artworkByStem.get(fileStem(child).toLowerCase()) || genericCover || undefined;
        const coverUri = override?.coverUri?.trim() || discoveredCoverUri;
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
          format,
          space,
          available: true,
          identificationConfidence: identity.confidence,
          needsReview: identity.needsReview,
          reviewReason: identity.reviewReason,
          coverShape: identity.coverShape,
          metadataSource: identity.metadataSource,
          coverUri,
        });
        if (books.length === 1 || books.length % 25 === 0) report('discovering', space);
      } else {
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
    report('discovering', folder.name);
    await scanDir(folder.uri, folder.name, 0);
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
  };
}

export function previewLocalSort(books: LocalBook[], template: string): LocalSortPreview[] {
  return previewLocalSortToRoot(books, template);
}

export function previewLocalSortToRoot(books: LocalBook[], template: string, destinationRootUri?: string): LocalSortPreview[] {
  const destinations = new Map<string, number>();
  const previews = books.map(book => {
    const filename = fileNameFromUri(book.uri);
    const target = targetPath(book, filename, template);
    const from = displayPath(book.uri);
    const count = destinations.get(target) || 0;
    destinations.set(target, count + 1);
    return {
      id: `local-${book.id}`,
      asset: book.id,
      title: book.title,
      sourceUri: book.uri,
      rootUri: destinationRootUri || rootUriFromFileUri(book.uri),
      relativePath: target,
      from,
      to: target,
      state: book.needsReview ? 'review' as const : from.endsWith(target) ? 'same' as const : 'ready' as const,
      metadataSummary: [
        book.author ? 'Author: '+book.author : '',
        book.series ? 'Series: '+book.series+(book.seriesNumber !== undefined ? ' #'+book.seriesNumber : '') : '',
        book.format ? 'Format: '+book.format : '',
      ].filter(Boolean).join(' · '),
    };
  });
  return previews.map(preview => preview.state === 'review' ? preview : destinations.get(preview.to)! > 1 ? {...preview, state: 'conflict'} : preview);
}

export async function applyLocalSortCopies(
  previews: LocalSortPreview[],
  onCheckpoint?: (result: LocalSortApplyResult) => void | Promise<void>,
): Promise<LocalSortApplyResult> {
  const copied: LocalSortApplyResult['copied'] = [];
  const failed: LocalSortApplyResult['failed'] = [];
  for (const preview of previews) {
    if (preview.state !== 'ready') continue;
    try {
      const target = await createTargetFile(preview.rootUri, preview.relativePath);
      const sourceInfo = await getInfoAsync(preview.sourceUri).catch(() => null);
      await StorageAccessFramework.copyAsync({from: preview.sourceUri, to: target});
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
      await StorageAccessFramework.deleteAsync(item.uri);
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

async function createTargetFile(rootUri: string, relativePath: string) {
  const parts = relativePath.split('/').filter(Boolean);
  if (!parts.length) throw Error('Missing destination file name');
  const filename = parts.pop()!;
  let dir = rootUri;
  for (const part of parts) {
    dir = await ensureDirectory(dir, part);
  }
  const children = await StorageAccessFramework.readDirectoryAsync(dir);
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
  return StorageAccessFramework.createFileAsync(dir, name, mimeType(ext));
}

async function ensureDirectory(parent: string, name: string) {
  const children = await StorageAccessFramework.readDirectoryAsync(parent);
  const existing = children.find(child => lastPathPart(child) === name && !extension(child));
  if (existing) return existing;
  return StorageAccessFramework.makeDirectoryAsync(parent, name);
}

function rootUriFromFileUri(uri: string) {
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
