import {decodedPathParts, logicalWorkKey} from './libraryIntelligence';
import {canonicalMetadataForBooks} from './metadataSync';
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
  seriesNumber?: number;
  logicalWorkKey?: string;
  format: string;
  space: string;
  available: boolean;
  files: number;
  tracks: LocalBook[];
  needsReview: boolean;
  reviewReason: string;
  coverUri?: string;
  coverShape: 'portrait' | 'square';
};

export function groupLocalWorks(books: LocalBook[]): LocalWork[] {
  const groups = new Map<string, LocalBook[]>();
  const order: string[] = [];

  for (const book of books) {
    const key = localWorkKey(book);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(book);
  }

  return order.map(key => {
    const tracks = groups.get(key)!.slice().sort((a, b) => naturalCompare(a.uri, b.uri));
    const first = tracks[0];
    const audio = first.format === 'Audio';
    const folderTitle = audio ? audioFolderTitle(first.uri) : '';
    const canonical = canonicalMetadataForBooks(tracks);
    const title = audio ? (canonical.title || folderTitle || first.title) : first.title;
    const author = audio ? canonical.author : commonValue(tracks.map(item => item.author));
    const series = audio ? canonical.series : commonValue(tracks.map(item => item.series));
    const genre = audio ? canonical.genre : commonValue(tracks.map(item => item.genre));
    const seriesNumber = audio ? canonical.seriesNumber : tracks.find(item=>item.seriesNumber !== undefined)?.seriesNumber;
    const publishedYear = audio ? canonical.publishedYear : tracks.find(item=>item.publishedYear)?.publishedYear;
    const importantConflict=tracks.find(item=>(item.metadataConflicts||[]).some(conflict=>['title','author','series','seriesNumber','isbn','asin'].includes(String(conflict.field))));
    const unresolved=!title||!author;
    return {
      key,
      source: 'local' as const,
      title,
      author,
      series,
      genre,
      publishedYear,
      seriesNumber,
      logicalWorkKey: logicalWorkKey({title,author,series,seriesNumber}),
      format: first.format,
      space: first.space,
      available: tracks.some(item => item.available),
      files: tracks.length,
      tracks,
      needsReview: unresolved||!!importantConflict,
      reviewReason: importantConflict?.reviewReason || (unresolved?'Title or author still needs review.':''),
      coverUri: audio ? canonical.coverUri : tracks.find(item => item.coverUri)?.coverUri,
      coverShape: audio ? 'square' : 'portrait',
    };
  });
}

function localWorkKey(book: LocalBook) {
  if (book.format !== 'Audio') return 'asset:' + book.uri;
  const parts = decodedPathParts(book.uri);
  const dirs = parts.slice(0, -1).filter(Boolean);
  while (dirs.length && isLibraryRoot(dirs[0])) dirs.shift();
  if (!dirs.length) return 'audio-file:' + book.uri;
  const parent = dirs[dirs.length - 1];
  if (isLibraryRoot(parent)) return 'audio-file:' + book.uri;
  return 'audio-dir:' + book.space + ':' + dirs.join('/');
}

function audioFolderTitle(uri: string) {
  const parts = decodedPathParts(uri);
  const dirs = parts.slice(0, -1).filter(Boolean);
  while (dirs.length && isLibraryRoot(dirs[0])) dirs.shift();
  const parent = dirs[dirs.length - 1] || '';
  return isLibraryRoot(parent) ? '' : cleanLabel(parent);
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


export type LocalEditionGroup = {
  key: string;
  format: string;
  items: LocalBook[];
};

export type LogicalLocalWork = {
  key: string;
  title: string;
  author: string;
  series: string;
  seriesNumber?: number;
  formats: string[];
  editions: LocalEditionGroup[];
  items: LocalBook[];
};

export function groupLogicalLocalWorks(books: LocalBook[]): LogicalLocalWork[] {
  const grouped = new Map<string, LocalBook[]>();
  for (const book of books) {
    const key = book.workKey || ('asset:' + book.uri);
    const items = grouped.get(key) || [];
    items.push(book);
    grouped.set(key, items);
  }
  return [...grouped.entries()].map(([key, items]) => {
    const editions = new Map<string, LocalBook[]>();
    for (const item of items) {
      const editionKey = item.editionKey || (key + '|format:' + cleanLabel(item.format).toLowerCase());
      const editionItems = editions.get(editionKey) || [];
      editionItems.push(item);
      editions.set(editionKey, editionItems);
    }
    const first = items[0];
    return {
      key,
      title: first.title,
      author: commonValue(items.map(item => item.author)) || first.author,
      series: commonValue(items.map(item => item.series)) || first.series,
      seriesNumber: items.find(item => item.seriesNumber !== undefined)?.seriesNumber,
      formats: [...new Set(items.map(item => item.format).filter(Boolean))].sort(),
      editions: [...editions.entries()].map(([editionKey, editionItems]) => ({
        key: editionKey,
        format: editionItems[0]?.format || '',
        items: editionItems.slice().sort((a,b) => naturalCompare(a.uri,b.uri)),
      })),
      items: items.slice().sort((a,b) => naturalCompare(a.uri,b.uri)),
    };
  });
}

export function logicalSeriesGroups(books: LocalBook[]) {
  const grouped = new Map<string, LogicalLocalWork[]>();
  for (const work of groupLogicalLocalWorks(books)) {
    if (!work.series) continue;
    const key = cleanLabel(work.author).toLowerCase() + '|' + cleanLabel(work.series).toLowerCase();
    const works = grouped.get(key) || [];
    works.push(work);
    grouped.set(key, works);
  }
  return [...grouped.entries()].map(([key, works]) => ({
    key,
    author: works[0]?.author || '',
    series: works[0]?.series || '',
    works: works.slice().sort((a,b) =>
      (a.seriesNumber ?? Number.MAX_SAFE_INTEGER) - (b.seriesNumber ?? Number.MAX_SAFE_INTEGER)
      || a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'})
    ),
  }));
}
