export type MetadataProvider = 'open-library' | 'google-books';

export type MetadataLookupInput = {
  title: string;
  author?: string;
  series?: string;
  publishedYear?: number;
  isbn?: string;
};

export type MetadataMatch = {
  provider: MetadataProvider;
  providerId: string;
  workId?: string;
  editionId?: string;
  title: string;
  authors: string[];
  publishedYear?: number;
  genres?: string[];
  description?: string;
  isbns?: string[];
  coverUri?: string;
  confidence: number;
};

function normalized(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(unabridged|abridged|audiobook|audio book|ebook|e-book)\b/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string) {
  return normalized(value).split(' ').filter(Boolean);
}

export function textSimilarity(a: string, b: string) {
  const left = normalized(a), right = normalized(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.startsWith(right + ' ') || right.startsWith(left + ' ')) return 0.96;
  const aa = new Set(tokens(left)), bb = new Set(tokens(right));
  let intersection = 0;
  for (const token of aa) if (bb.has(token)) intersection += 1;
  const union = new Set([...aa, ...bb]).size || 1;
  const jaccard = intersection / union;
  const containment = intersection / Math.max(1, Math.min(aa.size, bb.size));
  return Math.max(jaccard, containment * 0.92);
}

function isbn(value: string) {
  return String(value || '').toUpperCase().replace(/[^0-9X]/g, '');
}

function authorSimilarity(requested: string, authors: string[]) {
  if (!requested) return authors.length ? 0.7 : 0;
  if (!authors.length) return 0;
  return Math.max(...authors.map(author => textSimilarity(requested, author)));
}

export function scoreMetadataMatch(input: MetadataLookupInput, candidate: Omit<MetadataMatch,'confidence'>) {
  const requestedIsbn = isbn(input.isbn || '');
  if (requestedIsbn && (candidate.isbns || []).some(value => isbn(value) === requestedIsbn)) return 1;
  const title = textSimilarity(input.title, candidate.title);
  if (title < 0.68) return Math.min(0.55, title * 0.7);
  const author = authorSimilarity(input.author || '', candidate.authors || []);
  if (input.author && author < 0.45) return Math.min(0.69, title * 0.62 + author * 0.18);
  const year = input.publishedYear && candidate.publishedYear
    ? Math.max(0, 1 - Math.min(10, Math.abs(input.publishedYear - candidate.publishedYear)) / 10)
    : 0.55;
  const cover = candidate.coverUri ? 1 : 0;
  return Math.max(0, Math.min(1, title * 0.68 + author * 0.23 + year * 0.04 + cover * 0.05));
}

export function bestMetadataMatch(input: MetadataLookupInput, candidates: Array<Omit<MetadataMatch,'confidence'>>, minimum = 0.86): MetadataMatch | null {
  const scored = candidates
    .map(candidate => ({...candidate, confidence: scoreMetadataMatch(input, candidate)}))
    .filter(candidate => candidate.confidence >= minimum)
    .sort((a,b) => b.confidence - a.confidence || Number(!!b.coverUri) - Number(!!a.coverUri));
  return scored[0] || null;
}

function secureImage(uri?: string) {
  return uri ? uri.replace(/^http:/i, 'https:') : undefined;
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {signal: controller.signal, headers: {'Accept':'application/json'}});
    if (!response.ok) throw Error('Metadata provider returned ' + response.status);
    return await response.json() as any;
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupOpenLibrary(input: MetadataLookupInput): Promise<Array<Omit<MetadataMatch,'confidence'>>> {
  const params = new URLSearchParams();
  if (input.isbn) params.set('q', 'isbn:' + isbn(input.isbn));
  else {
    params.set('title', input.title);
    if (input.author) params.set('author', input.author);
  }
  params.set('fields', 'key,title,author_name,cover_i,first_publish_year,isbn,edition_key');
  params.set('limit', '8');
  const data = await fetchJson('https://openlibrary.org/search.json?' + params.toString());
  return (Array.isArray(data?.docs) ? data.docs : []).map((doc:any) => ({
    provider: 'open-library' as const,
    providerId: String(doc.key || ''),
    workId: String(doc.key || '').replace(/^\/works\//, '') || undefined,
    editionId: Array.isArray(doc.edition_key) ? String(doc.edition_key[0] || '') || undefined : undefined,
    title: String(doc.title || ''),
    authors: Array.isArray(doc.author_name) ? doc.author_name.map(String) : [],
    publishedYear: Number(doc.first_publish_year) || undefined,
    isbns: Array.isArray(doc.isbn) ? doc.isbn.map(String) : [],
    coverUri: doc.cover_i ? 'https://covers.openlibrary.org/b/id/' + encodeURIComponent(String(doc.cover_i)) + '-L.jpg?default=false' : undefined,
  })).filter((item:any) => item.providerId && item.title);
}

export async function lookupGoogleBooks(input: MetadataLookupInput): Promise<Array<Omit<MetadataMatch,'confidence'>>> {
  const query = input.isbn
    ? 'isbn:' + isbn(input.isbn)
    : ['intitle:"' + input.title + '"', input.author ? 'inauthor:"' + input.author + '"' : ''].filter(Boolean).join(' ');
  const params = new URLSearchParams({q:query, maxResults:'8', printType:'books', projection:'lite'});
  const data = await fetchJson('https://www.googleapis.com/books/v1/volumes?' + params.toString());
  return (Array.isArray(data?.items) ? data.items : []).map((item:any) => {
    const info = item?.volumeInfo || {};
    const image = info.imageLinks || {};
    const identifiers = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers.map((entry:any) => String(entry?.identifier || '')).filter(Boolean) : [];
    const yearMatch = String(info.publishedDate || '').match(/\d{4}/);
    return {
      provider: 'google-books' as const,
      providerId: String(item?.id || ''),
      editionId: String(item?.id || '') || undefined,
      title: String(info.title || ''),
      authors: Array.isArray(info.authors) ? info.authors.map(String) : [],
      publishedYear: yearMatch ? Number(yearMatch[0]) : undefined,
      genres: Array.isArray(info.categories) ? info.categories.map(String) : [],
      description: typeof info.description === 'string' ? info.description : undefined,
      isbns: identifiers,
      coverUri: secureImage(image.extraLarge || image.large || image.medium || image.small || image.thumbnail),
    };
  }).filter((item:any) => item.providerId && item.title);
}

export async function lookupBookMetadata(input: MetadataLookupInput, minimum = 0.86): Promise<MetadataMatch | null> {
  const results = await Promise.allSettled([lookupOpenLibrary(input), lookupGoogleBooks(input)]);
  const candidates: Array<Omit<MetadataMatch,'confidence'>> = [];
  for (const result of results) if (result.status === 'fulfilled') candidates.push(...result.value);
  return bestMetadataMatch(input, candidates, minimum);
}
