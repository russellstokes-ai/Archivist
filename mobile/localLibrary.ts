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
  format: string;
  space: string;
  available: boolean;
  identificationConfidence?: IdentificationConfidence;
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  metadataSource?: 'path' | 'sidecar' | 'manual' | 'embedded';
  coverUri?: string;
  workTitleHint?: string;
  trackTitle?: string;
  trackNumber?: number;
  discNumber?: number;
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
  name: string;
  parentId: string;
  mimeType: string;
  size: number;
  modified: number;
  role: 'media' | 'sidecar' | 'artwork';
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
  extractAudioArtwork?: (uri: string) => Promise<{uri:string;mimeType:string;width:number;height:number}|null>;
};

const nativeLibraryScanner = (NativeModules.ArchivistLibrary || null) as NativeLibraryScanner | null;

export async function extractLocalAudioArtwork(uri:string){
  if(Platform.OS!=='android'||!nativeLibraryScanner?.extractAudioArtwork)return null;
  return nativeLibraryScanner.extractAudioArtwork(uri);
}

const yieldToUi = () => new Promise<void>(resolve => setTimeout(resolve, 0));

async function scanLocalFoldersNative(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
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
    sidecarCache.set(uri, fields);
    return fields;
  }

  const report = (phase: LocalScanProgress['phase'], currentFolder: string) => {
    onProgress?.({phase, currentFolder, entriesVisited, found: books.length, review});
  };
  const nextFolders: LocalFolder[] = [];

  for (const folder of folders) {
    const pending: NativeLibraryScanItem[] = [];
    const sidecarsByParent = new Map<string, Map<string, string>>();
    const coversByParent = new Map<string, string>();
    let scanId = '';
    let lastVisited = 0;
    let nativeErrors = 0;
    report('discovering', folder.name);

    try {
      scanId = await nativeLibraryScanner.startTreeScan(folder.uri);
      let done = false;
      while (!done) {
        const batch = await nativeLibraryScanner.readTreeScanBatch(scanId, 240);
        lastVisited = batch.visited;
        nativeErrors = batch.errors;
        entriesVisited = visitedBeforeFolder + batch.visited;

        for (const item of batch.items || []) {
          if (item.role === 'media') {
            pending.push(item);
            continue;
          }
          if (item.role === 'sidecar') {
            const byStem = sidecarsByParent.get(item.parentId) || new Map<string, string>();
            byStem.set(fileStem(item.name).toLowerCase(), item.uri);
            sidecarsByParent.set(item.parentId, byStem);
            continue;
          }
          if (item.role === 'artwork') {
            const stem = fileStem(item.name).toLowerCase();
            if (stem === 'cover' || (!coversByParent.has(item.parentId) && stem === 'folder')) {
              coversByParent.set(item.parentId, item.uri);
            }
          }
        }

        report('discovering', folder.name);
        done = !!batch.done;
        if (!done && (!batch.items || batch.items.length === 0)) {
          await new Promise<void>(resolve => setTimeout(resolve, 12));
        } else {
          await yieldToUi();
        }
      }
    } catch {
      skipped += 1;
      if (scanId) { try { await nativeLibraryScanner.cancelTreeScan(scanId); } catch {} }
    }

    skipped += nativeErrors;
    visitedBeforeFolder += lastVisited;
    entriesVisited = visitedBeforeFolder;

    const audioMetadataByUri = new Map<string, NativeAudioMetadata>();
    const audioItems = pending.filter(item => item.format === 'Audio');
    if (nativeLibraryScanner.readAudioMetadataBatch && audioItems.length) {
      for (let offset = 0; offset < audioItems.length; offset += 48) {
        report('identifying', folder.name);
        try {
          const metadata = await nativeLibraryScanner.readAudioMetadataBatch(audioItems.slice(offset, offset + 48).map(item => item.uri));
          for (const item of metadata || []) audioMetadataByUri.set(item.uri, item);
        } catch {
          // Embedded tags are evidence, not a reason to fail the scan.
        }
        await yieldToUi();
      }
    }

    const mediaCountByParent = new Map<string, number>();
    const audioOnlyByParent = new Map<string, boolean>();
    for (const item of pending) {
      mediaCountByParent.set(item.parentId, (mediaCountByParent.get(item.parentId) || 0) + 1);
      audioOnlyByParent.set(item.parentId, (audioOnlyByParent.get(item.parentId) ?? true) && item.format === 'Audio');
    }

    const before = books.length;
    for (let index = 0; index < pending.length; index += 1) {
      const item = pending[index];
      let identity = inferLocalBookMetadata(item.uri, item.format);
      const embedded = item.format === 'Audio' ? audioMetadataByUri.get(item.uri) : undefined;
      const embeddedAuthor = embedded?.albumArtist || embedded?.author || embedded?.artist || '';
      const oneFileWork = (mediaCountByParent.get(item.parentId) || 0) === 1;
      const embeddedWorkTitle = embedded?.album || (oneFileWork ? embedded?.title : '') || '';
      if (embeddedWorkTitle || embeddedAuthor || embedded?.genre || embedded?.year) {
        identity = applyLocalMetadata(identity, {
          ...(embeddedWorkTitle ? {title: embeddedWorkTitle} : {}),
          ...(embeddedAuthor ? {author: embeddedAuthor} : {}),
          ...(embedded?.genre ? {genre: embedded.genre} : {}),
          ...(metadataYear(embedded?.year) ? {publishedYear: metadataYear(embedded?.year)} : {}),
        }, 'embedded');
      }
      const sidecars = sidecarsByParent.get(item.parentId);
      const stem = fileStem(item.name).toLowerCase();
      const genericAllowed = (mediaCountByParent.get(item.parentId) || 0) === 1 || !!audioOnlyByParent.get(item.parentId);
      const sidecarUri = sidecars?.get(stem) || (genericAllowed ? (sidecars?.get('metadata') || sidecars?.get('book')) : undefined);

      if (sidecarUri) {
        const fields = await cachedSidecarFields(sidecarUri);
        if (fields.title || fields.author || fields.series || fields.genre) {
          identity = applyLocalMetadata(identity, fields, 'sidecar');
        }
      }
      const override = overrides[item.uri];
      if (override) identity = applyLocalMetadata(identity, override, 'manual');
      if (identity.needsReview) review += 1;

      books.push({
        id: books.length + 1,
        uri: item.uri,
        title: identity.title || titleFromUri(item.uri),
        author: identity.author,
        series: identity.series,
        genre: identity.genre,
        publishedYear: identity.publishedYear,
        format: item.format,
        space: folder.name,
        available: true,
        identificationConfidence: identity.confidence,
        needsReview: identity.needsReview,
        reviewReason: identity.reviewReason,
        coverShape: identity.coverShape,
        metadataSource: identity.metadataSource,
        coverUri: coversByParent.get(item.parentId),
        workTitleHint: embedded?.album || undefined,
        trackTitle: embedded?.title || undefined,
        trackNumber: metadataIndex(embedded?.track),
        discNumber: metadataIndex(embedded?.disc),
      });

      if (index % 80 === 79) {
        report('discovering', folder.name);
        await yieldToUi();
      }
    }

    const count = books.length - before;
    nextFolders.push({...folder, status: `Scanned ${count} items`, itemCount: count, scannedAt: new Date().toISOString()});
    await yieldToUi();
  }

  report('complete', '');
  return {
    folders: nextFolders.concat(folders.slice(nextFolders.length)),
    books,
    skipped,
    truncated: false,
    identified: books.length - review,
    review,
  };
}
export async function scanLocalFolders(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
): Promise<LocalScanResult> {
  if (Platform.OS === 'android' && nativeLibraryScanner?.startTreeScan) {
    return scanLocalFoldersNative(folders, onProgress, overrides);
  }
  const books: LocalBook[] = [];
  let skipped = 0;
  let truncated = false;
  let truncatedReason: 'book-limit' | 'entry-limit' | undefined;
  let entriesVisited = 0;
  let review = 0;
  const seen = new Set<string>();
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
          if (fields.title || fields.author || fields.series || fields.genre) {
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

export function previewLocalSort(books: LocalBook[], template: string): LocalSortPreview[] {
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
      rootUri: rootUriFromFileUri(book.uri),
      relativePath: target,
      from,
      to: target,
      state: book.needsReview ? 'review' as const : from.endsWith(target) ? 'same' as const : 'ready' as const,
    };
  });
  return previews.map(preview => preview.state === 'review' ? preview : destinations.get(preview.to)! > 1 ? {...preview, state: 'conflict'} : preview);
}

export async function applyLocalSortCopies(previews: LocalSortPreview[]): Promise<LocalSortApplyResult> {
  const copied: LocalSortApplyResult['copied'] = [];
  const failed: LocalSortApplyResult['failed'] = [];
  for (const preview of previews) {
    if (preview.state !== 'ready') continue;
    try {
      const target = await createTargetFile(preview.rootUri, preview.relativePath);
      await StorageAccessFramework.copyAsync({from: preview.sourceUri, to: target});
      copied.push({id: preview.id, title: preview.title, uri: target});
    } catch (e) {
      failed.push({id: preview.id, title: preview.title, error: (e as Error).message});
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

function targetPath(book: LocalBook, filename: string, template: string) {
  const author = cleanPart(book.author || 'Unknown author');
  const series = cleanPart(book.series || 'Standalone');
  const title = cleanPart(book.title || filename.replace(/\.[^.]+$/, ''));
  const format = cleanPart(book.format || 'Books');
  if (template === 'author-series-title') return `${author}/${series}/${title}/${filename}`;
  if (template === 'format-author-title') return `${format}/${author}/${title}/${filename}`;
  return `${author}/${title}/${filename}`;
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
