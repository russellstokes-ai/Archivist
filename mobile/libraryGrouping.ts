import {LocalBook} from './localLibrary';
import {decodedPathParts, logicalWorkKey} from './libraryIntelligence';

export type LocalEditionGroup = {
  key: string;
  format: string;
  items: LocalBook[];
};

export type LocalWorkGroup = {
  key: string;
  title: string;
  author: string;
  series: string;
  seriesNumber?: number;
  formats: string[];
  editions: LocalEditionGroup[];
  items: LocalBook[];
  isMultipartAudio: boolean;
};

function normal(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parentPath(book: LocalBook) {
  const parts = decodedPathParts(book.uri);
  return parts.slice(0, -1).join('/').toLowerCase();
}

function parentLabel(book: LocalBook) {
  const parts = decodedPathParts(book.uri);
  return parts.length > 1 ? parts[parts.length - 2] : '';
}

function filenameStem(book: LocalBook) {
  const parts = decodedPathParts(book.uri);
  return (parts[parts.length - 1] || '').replace(/\.[^.]+$/, '');
}

function trackLike(book: LocalBook) {
  return book.format === 'Audio' && /^(?:(?:cd|disc|disk|track)\s*)?#?\d+(?:[ ._-]+|$)/i.test(filenameStem(book));
}

function bestText(items: LocalBook[], field: 'title'|'author'|'series') {
  const ranked = items
    .map(item => ({value: String(item[field] || '').trim(), confidence: item.identificationConfidence || 'low'}))
    .filter(item => !!item.value)
    .sort((a,b) => {
      const score = {high:3, medium:2, low:1};
      return score[b.confidence] - score[a.confidence] || b.value.length - a.value.length;
    });
  return ranked[0]?.value || '';
}

function audioContainerCounts(books: LocalBook[]) {
  const counts = new Map<string, number>();
  for (const book of books) {
    if (book.format !== 'Audio') continue;
    const parent = parentPath(book);
    counts.set(parent, (counts.get(parent) || 0) + 1);
  }
  return counts;
}

function workKeyFor(book: LocalBook, audioCounts: Map<string, number>) {
  const parent = parentPath(book);
  if (book.format === 'Audio' && (audioCounts.get(parent) || 0) > 1 && trackLike(book)) {
    return 'audio-folder:' + parent;
  }
  return book.workKey || logicalWorkKey(book);
}

function editionKeyFor(book: LocalBook, groupKey: string) {
  if (groupKey.startsWith('audio-folder:')) return groupKey + '|format:audio';
  return book.editionKey || groupKey + '|format:' + normal(book.format);
}

export function groupLocalWorks(books: LocalBook[]): LocalWorkGroup[] {
  const audioCounts = audioContainerCounts(books);
  const grouped = new Map<string, LocalBook[]>();

  for (const book of books) {
    const key = workKeyFor(book, audioCounts);
    const items = grouped.get(key) || [];
    items.push(book);
    grouped.set(key, items);
  }

  return [...grouped.entries()].map(([key, items]) => {
    const editions = new Map<string, LocalBook[]>();
    for (const item of items) {
      const editionKey = editionKeyFor(item, key);
      const editionItems = editions.get(editionKey) || [];
      editionItems.push(item);
      editions.set(editionKey, editionItems);
    }

    const multipartAudio = key.startsWith('audio-folder:') && items.length > 1;
    const sharedSeriesNumber = items.map(item => item.seriesNumber).find(value => value !== undefined);
    const title = multipartAudio
      ? (bestText(items, 'title') && items.every(item => normal(item.title) === normal(items[0].title)) ? bestText(items, 'title') : parentLabel(items[0]))
      : bestText(items, 'title');

    return {
      key,
      title,
      author: bestText(items, 'author'),
      series: bestText(items, 'series'),
      seriesNumber: sharedSeriesNumber,
      formats: [...new Set(items.map(item => item.format).filter(Boolean))].sort(),
      editions: [...editions.entries()].map(([editionKey, editionItems]) => ({
        key: editionKey,
        format: editionItems[0]?.format || '',
        items: editionItems.slice().sort((a,b) => a.uri.localeCompare(b.uri, undefined, {numeric:true})),
      })),
      items: items.slice().sort((a,b) => a.uri.localeCompare(b.uri, undefined, {numeric:true})),
      isMultipartAudio: multipartAudio,
    };
  }).sort((a,b) => a.author.localeCompare(b.author) || a.title.localeCompare(b.title, undefined, {numeric:true}));
}

export function seriesGroups(books: LocalBook[]) {
  const works = groupLocalWorks(books);
  const grouped = new Map<string, LocalWorkGroup[]>();
  for (const work of works) {
    if (!work.series) continue;
    const key = normal(work.author) + '|' + normal(work.series);
    const items = grouped.get(key) || [];
    items.push(work);
    grouped.set(key, items);
  }
  return [...grouped.entries()].map(([key, works]) => ({
    key,
    author: works[0]?.author || '',
    series: works[0]?.series || '',
    works: works.slice().sort((a,b) =>
      (a.seriesNumber ?? Number.MAX_SAFE_INTEGER) - (b.seriesNumber ?? Number.MAX_SAFE_INTEGER)
      || a.title.localeCompare(b.title, undefined, {numeric:true})
    ),
  }));
}
