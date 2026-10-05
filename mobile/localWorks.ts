import {decodedPathParts} from './libraryIntelligence';
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
  format: string;
  space: string;
  available: boolean;
  files: number;
  tracks: LocalBook[];
  needsReview: boolean;
  reviewReason: string;
  coverUri?: string;
  coverShape: 'portrait' | 'square';
  livingBookCoverUri?: string;
  livingBookCoverSource?: LocalBook['livingBookCoverSource'];
  livingBookCoverConfidence?: number;
};

export function groupLocalWorks(books: LocalBook[]): LocalWork[] {
  const groups = new Map<string, LocalBook[]>();
  const order: string[] = [];
  const rootAudioCandidates = new Map<string, string>();
  const rootAudioCounts = new Map<string, number>();
  for (const book of books) {
    if (book.format !== 'Audio') continue;
    const metadataCandidate = book.workTitleHint ? 'meta:' + normalKey(book.author) + '|' + normalKey(book.workTitleHint) : '';
    const filenameCandidate = rootAudioClusterCandidate(book.uri);
    const candidate = metadataCandidate || filenameCandidate;
    if (!candidate) continue;
    rootAudioCandidates.set(book.uri, candidate);
    rootAudioCounts.set(candidate, (rootAudioCounts.get(candidate) || 0) + 1);
  }

  for (const book of books) {
    const candidate = rootAudioCandidates.get(book.uri) || '';
    const key = localWorkKey(book, candidate && (rootAudioCounts.get(candidate) || 0) > 1 ? candidate : '');
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(book);
  }

  return order.map(key => {
    const tracks = groups.get(key)!.slice().sort((a, b) => ((a.discNumber || 0) - (b.discNumber || 0)) || ((a.trackNumber || 0) - (b.trackNumber || 0)) || naturalCompare(a.uri, b.uri));
    const first = tracks[0];
    const audio = first.format === 'Audio';
    const embeddedTitle = audio ? commonValue(tracks.map(item => item.workTitleHint || '')) : '';
    const folderTitle = audio ? audioFolderTitle(first.uri) : '';
    const rootTitle = audio && !folderTitle && tracks.length > 1 ? rootAudioClusterTitle(first.uri) : '';
    const title = audio && (embeddedTitle || folderTitle || rootTitle) ? (embeddedTitle || folderTitle || rootTitle) : first.title;
    const author = commonValue(tracks.map(item => item.author));
    const series = commonValue(tracks.map(item => item.series));
    const genre = commonValue(tracks.map(item => item.genre));
    const reviewItem = tracks.find(item => item.needsReview);
    return {
      key,
      source: 'local' as const,
      title,
      author,
      series,
      genre,
      publishedYear: tracks.find(item=>item.publishedYear)?.publishedYear,
      format: first.format,
      space: first.space,
      available: tracks.some(item => item.available),
      files: tracks.length,
      tracks,
      needsReview: !!reviewItem,
      reviewReason: reviewItem?.reviewReason || '',
      coverUri: tracks.find(item => item.coverUri)?.coverUri,
      coverShape: tracks.find(item=>item.coverUri)?.coverShape || (audio ? 'square' : 'portrait'),
      livingBookCoverUri: tracks.find(item=>item.livingBookCoverUri)?.livingBookCoverUri,
      livingBookCoverSource: tracks.find(item=>item.livingBookCoverSource)?.livingBookCoverSource,
      livingBookCoverConfidence: tracks.find(item=>item.livingBookCoverConfidence)?.livingBookCoverConfidence,
    };
  });
}

function localWorkKey(book: LocalBook, rootCandidate = '') {
  if (book.format !== 'Audio') return 'asset:' + book.uri;
  const parts = decodedPathParts(book.uri);
  const dirs = parts.slice(0, -1).filter(Boolean);
  while (dirs.length && isLibraryRoot(dirs[0])) dirs.shift();
  if (!dirs.length) return rootCandidate ? 'audio-root:' + book.space + ':' + rootCandidate : 'audio-file:' + book.uri;
  const parent = dirs[dirs.length - 1];
  if (isLibraryRoot(parent)) return rootCandidate ? 'audio-root:' + book.space + ':' + rootCandidate : 'audio-file:' + book.uri;
  return 'audio-dir:' + book.space + ':' + dirs.join('/');
}

function rootAudioClusterCandidate(uri: string) {
  const title = rootAudioClusterTitle(uri);
  return title ? normalKey(title) : '';
}

function rootAudioClusterTitle(uri: string) {
  const parts = decodedPathParts(uri);
  const filename = cleanLabel(parts[parts.length - 1] || '').replace(/\.[^.]+$/, '');
  const patterns = [
    /^(.+?)\s+-\s+(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b.*)?$/i,
    /^(.+?)\s+(?:chapter|chap|ch|part|pt|track)\s*0*\d{1,4}(?:\b.*)?$/i,
    /^(.+?)\s+-\s+0*\d{2,4}(?:\s*[-._].*)?$/i,
    /^(.+?)[._-](?:ch|pt|track)?0*\d{2,4}$/i,
    /^(.+?)\s+0*\d{2,4}\s+-\s+.+$/i,
  ];
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    const base = cleanLabel(match?.[1] || '');
    if (base.length >= 4 && !/^chapter|part|track$/i.test(base)) return base;
  }
  return '';
}

function normalKey(value: string) {
  return cleanLabel(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
