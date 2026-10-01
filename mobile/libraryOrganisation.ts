import {LibrarySource} from './librarySources';

export type SmartShelfDefinition = {
  id: string;
  name: string;
  source: LibrarySource;
  format: string;
  author: string;
  series: string;
  genre: string;
  space: string;
  readingState: string;
  minimumRating: number;
  favouriteOnly: boolean;
  availableOnly: boolean;
  sort: 'title' | 'author' | 'rating';
  createdAt: string;
};

export type LibraryCollection = {
  id: string;
  name: string;
  canonicalKeys: string[];
  createdAt: string;
};

type OrganisableWork = {
  source: 'local' | 'server' | 'downloaded';
  canonicalKey: string;
  title: string;
  author: string;
  series: string;
  genre: string;
  format: string;
  space: string;
  available: boolean;
  readingState: string;
  rating: number;
  favourite: boolean;
};

export function newOrganisationId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sanitizeSmartShelves(value: unknown): SmartShelfDefinition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw: any) => {
    if (!raw || typeof raw !== 'object' || !String(raw.id || '').trim() || !String(raw.name || '').trim()) return [];
    const source: LibrarySource = ['all', 'local', 'server', 'downloaded'].includes(raw.source) ? raw.source : 'all';
    const sort: SmartShelfDefinition['sort'] = ['title', 'author', 'rating'].includes(raw.sort) ? raw.sort : 'title';
    return [{
      id: String(raw.id), name: String(raw.name).trim(), source,
      format: String(raw.format || ''), author: String(raw.author || ''), series: String(raw.series || ''),
      genre: String(raw.genre || ''), space: String(raw.space || ''), readingState: String(raw.readingState || ''),
      minimumRating: Math.max(0, Math.min(10, Number(raw.minimumRating) || 0)),
      favouriteOnly: !!raw.favouriteOnly, availableOnly: !!raw.availableOnly, sort,
      createdAt: String(raw.createdAt || new Date(0).toISOString()),
    }];
  });
}

export function sanitizeCollections(value: unknown): LibraryCollection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw: any) => {
    if (!raw || typeof raw !== 'object' || !String(raw.id || '').trim() || !String(raw.name || '').trim()) return [];
    return [{
      id: String(raw.id), name: String(raw.name).trim(),
      canonicalKeys: [...new Set(Array.isArray(raw.canonicalKeys) ? raw.canonicalKeys.map(String).filter(Boolean) : [])],
      createdAt: String(raw.createdAt || new Date(0).toISOString()),
    }];
  });
}

export function applySmartShelf<T extends OrganisableWork>(items: T[], shelf: SmartShelfDefinition): T[] {
  const filtered = items.filter(work => {
    if (shelf.source !== 'all' && work.source !== shelf.source) return false;
    if (shelf.format && work.format !== shelf.format) return false;
    if (shelf.author && work.author !== shelf.author) return false;
    if (shelf.series && work.series !== shelf.series) return false;
    if (shelf.genre && work.genre !== shelf.genre) return false;
    if (shelf.space && work.space !== shelf.space) return false;
    if (shelf.readingState && work.readingState !== shelf.readingState) return false;
    if (shelf.minimumRating > 0 && work.rating < shelf.minimumRating) return false;
    if (shelf.favouriteOnly && !work.favourite) return false;
    if (shelf.availableOnly && !work.available) return false;
    return true;
  });
  return filtered.slice().sort((a, b) => {
    if (shelf.sort === 'rating') return b.rating - a.rating || a.title.localeCompare(b.title);
    if (shelf.sort === 'author') return (a.author || '').localeCompare(b.author || '') || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
}

export function collectionWorks<T extends {canonicalKey: string}>(items: T[], collection: LibraryCollection) {
  const wanted = new Set(collection.canonicalKeys);
  return items.filter(item => wanted.has(item.canonicalKey));
}

export function toggleCollectionWork(collection: LibraryCollection, canonicalKey: string): LibraryCollection {
  const keys = new Set(collection.canonicalKeys);
  if (keys.has(canonicalKey)) keys.delete(canonicalKey); else keys.add(canonicalKey);
  return {...collection, canonicalKeys: [...keys]};
}
