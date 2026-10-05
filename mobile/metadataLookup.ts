export type MetadataProvider = 'open-library' | 'google-books';

export type MetadataLookupInput = {
  title: string;
  author?: string;
  series?: string;
  publishedYear?: number;
  isbn?: string;
  identifiers?: string[];
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
  identifiers?: string[];
  series?: string[];
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
  if (!requested || !authors.length) return 0;
  return Math.max(...authors.map(author => textSimilarity(requested, author)));
}

function identifierSet(input: MetadataLookupInput) {
  const values = [input.isbn || '', ...(input.identifiers || [])]
    .map(value => isbn(value))
    .filter(value => value.length === 10 || value.length === 13);
  return new Set(values);
}

function candidateIdentifiers(candidate: Omit<MetadataMatch,'confidence'>) {
  return new Set(
    [...(candidate.isbns || []), ...(candidate.identifiers || [])]
      .map(value => isbn(value))
      .filter(value => value.length === 10 || value.length === 13),
  );
}

function seriesSimilarity(requested: string, candidate: Omit<MetadataMatch,'confidence'>) {
  if (!requested) return 0.5;
  const values = candidate.series || [];
  if (!values.length) return 0.5;
  return Math.max(...values.map(value => textSimilarity(requested, value)));
}

export function scoreMetadataMatch(input: MetadataLookupInput, candidate: Omit<MetadataMatch,'confidence'>) {
  const requestedIds = identifierSet(input);
  const candidateIds = candidateIdentifiers(candidate);
  if (requestedIds.size) {
    for (const value of requestedIds) if (candidateIds.has(value)) return 1;
    // A known ISBN is stronger evidence than fuzzy text. Do not silently
    // substitute a different edition/work when identifier lookup misses.
    return 0.25;
  }

  const title = textSimilarity(input.title, candidate.title);
  if (title < 0.82) return Math.min(0.59, title * 0.7);

  // Automatic fuzzy publication is never title-only. Missing author evidence is
  // deliberately capped below the default acceptance threshold.
  const requestedAuthor = String(input.author || '').trim();
  const author = authorSimilarity(requestedAuthor, candidate.authors || []);
  if (!requestedAuthor || author < 0.72) {
    return Math.min(0.79, title * 0.62 + author * 0.24);
  }

  const series = seriesSimilarity(input.series || '', candidate);
  if (input.series && candidate.series?.length && series < 0.58) {
    return Math.min(0.81, title * 0.52 + author * 0.25 + series * 0.08);
  }

  const year = input.publishedYear && candidate.publishedYear
    ? Math.max(0, 1 - Math.min(12, Math.abs(input.publishedYear - candidate.publishedYear)) / 12)
    : 0.6;
  const cover = candidate.coverUri ? 1 : 0;

  // Title + author carry almost all identity weight. Series/year/cover can
  // resolve close candidates, but cannot rescue a weak author or title.
  return Math.max(0, Math.min(1,
    title * 0.60 +
    author * 0.28 +
    series * 0.06 +
    year * 0.04 +
    cover * 0.02
  ));
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
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt++){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {signal: controller.signal, headers: {'Accept':'application/json'}});
      if (response.ok) return await response.json() as any;
      const retryable=response.status===429||response.status>=500;
      if(!retryable||attempt===1)throw Error('Metadata provider returned ' + response.status);
      const retryAfter=Number(response.headers?.get?.('retry-after')||0);
      await new Promise(resolve=>setTimeout(resolve,Math.min(1500,Math.max(250,retryAfter*1000||350))));
    } catch(error) {
      lastError=error;
      const aborted=controller.signal.aborted;
      if(attempt===1||(!aborted&&!(error instanceof TypeError)))throw error;
      await new Promise(resolve=>setTimeout(resolve,350));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error?lastError:Error('Metadata lookup failed.');
}

export async function lookupOpenLibrary(input: MetadataLookupInput): Promise<Array<Omit<MetadataMatch,'confidence'>>> {
  const params = new URLSearchParams();
  if (input.isbn) params.set('q', 'isbn:' + isbn(input.isbn));
  else {
    params.set('title', input.title);
    if (input.author) params.set('author', input.author);
  }
  params.set('fields', 'key,title,author_name,cover_i,first_publish_year,isbn,edition_key,series');
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
    identifiers: Array.isArray(doc.isbn) ? doc.isbn.map(String) : [],
    series: Array.isArray(doc.series) ? doc.series.map(String) : [],
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
      identifiers,
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
