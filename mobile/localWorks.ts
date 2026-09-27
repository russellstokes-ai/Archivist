import {decodedPathParts} from './libraryIntelligence';
import {LocalBook} from './localLibrary';

export type LocalWork = {
  key: string;
  title: string;
  author: string;
  series: string;
  genre: string;
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
    const title = audio && folderTitle ? folderTitle : first.title;
    const author = commonValue(tracks.map(item => item.author));
    const series = commonValue(tracks.map(item => item.series));
    const genre = commonValue(tracks.map(item => item.genre));
    const reviewItem = tracks.find(item => item.needsReview);
    return {
      key,
      title,
      author,
      series,
      genre,
      format: first.format,
      space: first.space,
      available: tracks.some(item => item.available),
      files: tracks.length,
      tracks,
      needsReview: !!reviewItem,
      reviewReason: reviewItem?.reviewReason || '',
      coverUri: tracks.find(item => item.coverUri)?.coverUri,
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
