import {Platform} from 'react-native';
import {getInfoAsync, readAsStringAsync, StorageAccessFramework} from 'expo-file-system/legacy';
import {applyLocalMetadata, inferLocalBookMetadata, IdentificationConfidence, parseLocalSidecar} from './libraryIntelligence';

export type LocalBook = {
  id: number;
  uri: string;
  title: string;
  author: string;
  series: string;
  format: string;
  space: string;
  available: boolean;
  identificationConfidence?: IdentificationConfidence;
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  metadataSource?: 'path' | 'sidecar' | 'manual';
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
  state: 'ready' | 'same' | 'conflict';
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
  phase: 'discovering' | 'complete';
  currentFolder: string;
  entriesVisited: number;
  found: number;
  review: number;
};

export type LocalMetadataOverride = {
  title: string;
  author: string;
  series: string;
};

export type LocalScanResult = {
  folders: LocalFolder[];
  books: LocalBook[];
  skipped: number;
  truncated: boolean;
  identified: number;
  review: number;
};

const supported = new Map<string, string>([
  ['epub', 'EPUB'],
  ['pdf', 'PDF'],
  ['cbz', 'Comic'],
  ['cbr', 'Comic'],
  ['zip', 'Comic'],
  ['mp3', 'Audio'],
  ['m4a', 'Audio'],
  ['m4b', 'Audio'],
  ['aac', 'Audio'],
  ['ogg', 'Audio'],
  ['opus', 'Audio'],
  ['flac', 'Audio'],
]);

const maxEntriesPerScan = 5000;
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

export async function scanLocalFolders(
  folders: LocalFolder[],
  onProgress?: (progress: LocalScanProgress) => void,
  overrides: Record<string, LocalMetadataOverride> = {},
): Promise<LocalScanResult> {
  const books: LocalBook[] = [];
  let skipped = 0;
  let truncated = false;
  let entriesVisited = 0;
  let review = 0;
  const seen = new Set<string>();

  const report = (phase: LocalScanProgress['phase'], currentFolder: string) => {
    onProgress?.({phase, currentFolder, entriesVisited, found: books.length, review});
  };

  async function scanDir(uri: string, space: string, depth: number) {
    if (truncated || depth > maxDepth) return;
    let children: string[];
    try {
      children = await StorageAccessFramework.readDirectoryAsync(uri);
    } catch {
      skipped += 1;
      return;
    }

    const supportedFiles = children.filter(child => {
      const ext = extension(child);
      return !!ext && supported.has(ext);
    });
    const sidecarByStem = new Map<string, string>();
    let genericSidecar = '';
    for (const child of children) {
      const ext = extension(child);
      if (ext !== 'opf' && ext !== 'nfo') continue;
      const stem = fileStem(child).toLowerCase();
      sidecarByStem.set(stem, child);
      if (stem === 'metadata' || stem === 'book') genericSidecar = child;
    }
    if (supportedFiles.length !== 1) genericSidecar = '';

    for (const child of children) {
      entriesVisited += 1;
      if (entriesVisited === 1 || entriesVisited % 20 === 0) report('discovering', space);
      if (books.length >= maxEntriesPerScan) {
        truncated = true;
        return;
      }
      const ext = extension(child);
      const format = ext ? supported.get(ext) : undefined;
      if (format && !seen.has(child)) {
        seen.add(child);
        let identity = inferLocalBookMetadata(child, format);

        const sidecarUri = sidecarByStem.get(fileStem(child).toLowerCase()) || genericSidecar;
        if (sidecarUri) {
          try {
            const info = await getInfoAsync(sidecarUri);
            if (info.exists && (!('size' in info) || typeof info.size !== 'number' || info.size <= 2 * 1024 * 1024)) {
              const text = await readAsStringAsync(sidecarUri);
              const fields = parseLocalSidecar(text, extension(sidecarUri));
              if (fields.title || fields.author || fields.series) {
                identity = applyLocalMetadata(identity, fields, 'sidecar');
              }
            }
          } catch {
            // Sidecars are enrichment only. A malformed/unreadable one must never fail the scan.
          }
        }

        const override = overrides[child];
        if (override) identity = applyLocalMetadata(identity, override, 'manual');

        if (identity.needsReview) review += 1;
        books.push({
          id: books.length + 1,
          uri: child,
          title: identity.title || titleFromUri(child),
          author: identity.author,
          series: identity.series,
          format,
          space,
          available: true,
          identificationConfidence: identity.confidence,
          needsReview: identity.needsReview,
          reviewReason: identity.reviewReason,
          coverShape: identity.coverShape,
          metadataSource: identity.metadataSource,
        });
        report('discovering', space);
      } else if (!ext && depth < maxDepth) {
        await scanDir(child, space, depth + 1);
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
      state: from.endsWith(target) ? 'same' as const : 'ready' as const,
    };
  });
  return previews.map(preview => destinations.get(preview.to)! > 1 ? {...preview, state: 'conflict'} : preview);
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
  if (ext === 'cbr') return 'application/vnd.comicbook-rar';
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
