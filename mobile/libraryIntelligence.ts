export type IdentificationConfidence = 'high' | 'medium' | 'low';

export type LocalIdentity = {
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
  confidence: IdentificationConfidence;
  needsReview: boolean;
  reviewReason: string;
  coverShape: 'portrait' | 'square';
  metadataSource: 'path' | 'embedded' | 'sidecar' | 'manual';
};

export type LocalMetadataFields = {
  title?: string;
  author?: string;
  series?: string;
  seriesNumber?: number;
  genre?: string;
  publishedYear?: number;
  narrator?: string;
  publisher?: string;
  isbn?: string;
  asin?: string;
  language?: string;
  description?: string;
};

export function inferLocalBookMetadata(uri: string, format: string): LocalIdentity {
  const parts = decodedPathParts(uri);
  const filename = parts[parts.length - 1] || 'Untitled';
  const stem = cleanLabel(filename.replace(/\.[^.]+$/, ''));
  const rawDirs = parts.slice(0, -1).filter(Boolean).map(cleanLabel);
  const dirs = [...rawDirs];
  while (dirs.length && isLibraryRoot(dirs[0])) dirs.shift();
  const parent = cleanLabel(dirs[dirs.length - 1] || '');
  const grandparent = cleanLabel(dirs[dirs.length - 2] || '');
  const greatGrandparent = cleanLabel(dirs[dirs.length - 3] || '');

  let title = stem || 'Untitled';
  let author = '';
  let series = '';
  let seriesNumber: number | undefined;
  let genre = '';
  let confidence: IdentificationConfidence = 'low';
  let reviewReason = 'Could not confidently identify author and series from the file path.';

  const dashed = stem.split(/\s+-\s+/).map(cleanLabel).filter(Boolean);
  if (dashed.length >= 4 && looksIndex(dashed[2])) {
    author = dashed[0];
    series = dashed[1];
    seriesNumber = numericIndex(dashed[2]);
    title = dashed.slice(3).join(' - ');
    confidence = 'high';
    reviewReason = '';
  } else if (dashed.length >= 3 && looksIndex(dashed[1])) {
    author = dashed[0];
    seriesNumber = numericIndex(dashed[1]);
    title = dashed.slice(2).join(' - ');
    series = sensibleFolder(parent, title) ? parent : '';
    confidence = 'medium';
    reviewReason = series ? '' : 'Title and author inferred from filename; series was not clear.';
  } else if (dashed.length >= 2 && !looksIndex(dashed[0])) {
    author = dashed[0];
    title = dashed.slice(1).join(' - ');
    confidence = 'medium';
    reviewReason = 'Author and title inferred from filename.';
  } else if (format === 'Audio' && dirs.length >= 3) {
    author = greatGrandparent;
    series = grandparent;
    confidence = author ? 'high' : 'medium';
    reviewReason = author ? '' : 'Audiobook folders were only partly identifiable.';
  } else if (format === 'Audio' && dirs.length >= 2) {
    author = grandparent;
    series = '';
    confidence = author ? 'medium' : 'low';
    reviewReason = author ? '' : 'Audiobook author could not be identified confidently.';
  } else if (dirs.length >= 3 && equivalent(parent, stem)) {
    author = greatGrandparent;
    series = grandparent;
    confidence = author && series ? 'high' : 'medium';
    reviewReason = confidence === 'high' ? '' : 'Folder layout was only partly identifiable.';
  } else if (dirs.length >= 2 && sensibleFolder(parent, stem) && sensibleFolder(grandparent, stem)) {
    author = grandparent;
    series = parent;
    confidence = 'high';
    reviewReason = '';
  } else {
    const numbered = stem.match(/^\s*(\d+(?:\.\d+)?)\s*[-._:]\s*(.+)$/);
    if (numbered && sensibleFolder(parent, stem)) {
      series = parent;
      seriesNumber = numericIndex(numbered[1]);
      title = cleanLabel(numbered[2]);
      const possibleAuthor = cleanLabel(grandparent);
      if (possibleAuthor && !isLibraryRoot(possibleAuthor) && looksAuthorLike(possibleAuthor)) {
        author = possibleAuthor;
        confidence = 'high';
        reviewReason = '';
      }
      confidence = 'medium';
      reviewReason = 'Series and title inferred from numbered filename; author needs review.';
    } else if (sensibleFolder(parent, stem) && looksAuthorLike(parent)) {
      author = parent;
      confidence = 'medium';
      reviewReason = 'Author inferred from parent folder.';
    }
  }

  title = cleanLabel(title) || 'Untitled';
  author = normalizeAuthorName(author);
  series = cleanLabel(series);
  genre = cleanLabel(genre);

  const needsReview = confidence === 'low' || title === 'Untitled';
  return {
    title,
    author,
    series,
    seriesNumber,
    genre,
    confidence,
    needsReview,
    reviewReason: needsReview ? reviewReason : '',
    coverShape: format === 'Audio' ? 'square' : 'portrait',
    metadataSource: 'path',
  };
}

export function applyLocalMetadata(
  base: LocalIdentity,
  fields: LocalMetadataFields,
  source: 'embedded' | 'sidecar' | 'manual',
): LocalIdentity {
  const title = cleanLabel(fields.title || '') || base.title;
  const author = fields.author === undefined ? base.author : normalizeAuthorName(fields.author);
  const series = fields.series === undefined ? base.series : cleanLabel(fields.series);
  const seriesNumber = fields.seriesNumber === undefined ? base.seriesNumber : fields.seriesNumber;
  const genre = fields.genre === undefined ? base.genre : cleanLabel(fields.genre);
  const manual = source === 'manual';
  const completeEnough = title !== 'Untitled' && (!!author || manual);
  return {
    ...base,
    title,
    author,
    series,
    seriesNumber,
    genre,
    publishedYear: fields.publishedYear ?? base.publishedYear,
    narrator: cleanOptional(fields.narrator) ?? base.narrator,
    publisher: cleanOptional(fields.publisher) ?? base.publisher,
    isbn: normalizeIdentifier(fields.isbn) ?? base.isbn,
    asin: normalizeIdentifier(fields.asin) ?? base.asin,
    language: cleanOptional(fields.language) ?? base.language,
    description: cleanOptional(fields.description) ?? base.description,
    confidence: 'high',
    needsReview: !completeEnough,
    reviewReason: completeEnough ? '' : 'Metadata was found, but the author still needs review.',
    metadataSource: source,
  };
}

export function parseLocalSidecar(text: string, extension: string): LocalMetadataFields {
  if (!text || text.length > 2 * 1024 * 1024) return {};
  const ext = extension.toLowerCase();
  if (ext === 'json') return parseJsonSidecar(text);
  const title = xmlValue(text, ['dc:title', 'title', 'Title']);
  const author = xmlValue(text, ['dc:creator', 'creator', 'author', 'writer', 'Writer']);

  let series = xmlValue(text, ['series', 'Series']);
  let seriesNumber = numberValue(xmlValue(text, ['seriesindex', 'series_index', 'number', 'Number', 'volume', 'Volume']));
  const genre = xmlValue(text, ['dc:subject', 'subject', 'genre', 'Genre']);
  const narrator = xmlValue(text, ['narrator', 'Narrator']);
  const publisher = xmlValue(text, ['dc:publisher', 'publisher', 'Publisher']);
  const isbn = xmlValue(text, ['isbn', 'ISBN']);
  const asin = xmlValue(text, ['asin', 'ASIN']);
  const language = xmlValue(text, ['dc:language', 'language', 'Language']);
  const description = xmlValue(text, ['dc:description', 'description', 'Description', 'summary', 'Summary', 'comments', 'Comments']);
  if (!series && ext === 'opf') {
    const calibre = text.match(/<meta\b[^>]*name\s*=\s*["']calibre:series["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)
      || text.match(/<meta\b[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']calibre:series["'][^>]*>/i);
    if (calibre) series = decodeXml(calibre[1]);
    const calibreIndex = text.match(/<meta\b[^>]*name\s*=\s*["']calibre:series_index["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)
      || text.match(/<meta\b[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']calibre:series_index["'][^>]*>/i);
    if (seriesNumber === undefined && calibreIndex) seriesNumber = numberValue(calibreIndex[1]);

    if (!series) {
      const collection = text.match(/<meta\b[^>]*property\s*=\s*["'][^"']*belongs-to-collection["'][^>]*>([\s\S]*?)<\/meta>/i);
      if (collection) series = stripXml(collection[1]);
    }
  }

  const year = publicationYear(xmlValue(text,['dc:date','date','year','Year']));
  return compactFields({
    title: cleanLabel(title || '') || undefined,
    author: normalizeAuthorName(author || '') || undefined,
    series: cleanLabel(series || '') || undefined,
    seriesNumber,
    genre: cleanLabel(genre || '') || undefined,
    publishedYear: year,
    narrator: cleanOptional(narrator),
    publisher: cleanOptional(publisher),
    isbn: normalizeIdentifier(isbn),
    asin: normalizeIdentifier(asin),
    language: cleanOptional(language),
    description: cleanOptional(description),
  });
}

export function decodedPathParts(uri: string): string[] {
  let value = uri;
  try { value = decodeURIComponent(value); } catch {}
  value = value.split('?')[0];
  const marker = '/document/';
  if (value.includes(marker)) value = value.split(marker).pop() || value;
  value = value.replace(/^primary:/, '');
  return value.split(/[\\/]/).map(part => part.trim()).filter(Boolean);
}

function xmlValue(text: string, tags: string[]) {
  for (const tag of tags) {
    const match = text.match(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i'));
    if (match) return stripXml(match[1]);
  }
  return '';
}

function stripXml(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function normalizeAuthorName(value: string) {
  let author = cleanLabel(value);
  if (!author) return '';
  const comma = author.match(/^([^,]+),\s*([^,]+)$/);
  if (comma && !/\b(?:jr\.?|sr\.?|ii|iii|iv)$/i.test(comma[2])) author = cleanLabel(comma[2] + ' ' + comma[1]);
  return author.replace(/\s+/g, ' ').trim();
}

export function logicalWorkKey(fields: LocalMetadataFields) {
  const semantic = [
    normalizedKey(fields.author),
    normalizedKey(fields.series),
    fields.seriesNumber === undefined ? '' : String(fields.seriesNumber),
    normalizedKey(fields.title),
  ].join('|');
  if (semantic.replace(/\|/g,'')) return semantic;
  const strong = normalizeIdentifier(fields.isbn) || normalizeIdentifier(fields.asin);
  return strong ? 'id:' + strong.toLowerCase() : 'unknown';
}

export function editionKey(fields: LocalMetadataFields, format = '') {
  const strong = normalizeIdentifier(fields.isbn) || normalizeIdentifier(fields.asin);
  return logicalWorkKey(fields) + '|edition:' + (strong ? strong.toLowerCase() : 'unspecified') + '|format:' + normalizedKey(format);
}

function filenameQualifiers(value:string) {
  let stem=value;
  let narrator:string|undefined;
  let isbn:string|undefined;
  let asin:string|undefined;
  let publishedYear:number|undefined;

  stem=stem.replace(/\[\s*ASIN\s*[:#-]?\s*([A-Z0-9]{10})\s*\]/ig,(match,id)=>{
    asin=normalizeIdentifier(id);
    return '';
  });
  stem=stem.replace(/\[\s*ISBN(?:-1[03])?\s*[:#-]?\s*([0-9Xx -]{10,20})\s*\]/ig,(match,id)=>{
    isbn=normalizeIdentifier(id)?.replace(/-/g,'');
    return '';
  });
  stem=stem.replace(/\{([^{}]{2,100})\}\s*$/,(match,name)=>{
    narrator=cleanLabel(name);
    return '';
  });
  stem=stem.replace(/\(\s*((?:19|20)\d{2})\s*\)\s*$/,(match,year)=>{
    publishedYear=publicationYear(year);
    return '';
  });
  return {stem:cleanLabel(stem),narrator,isbn,asin,publishedYear};
}

function parseJsonSidecar(text: string): LocalMetadataFields {
  try {
    const raw = JSON.parse(text);
    const metadata = raw && typeof raw === 'object' && raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : raw;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = metadata?.[key];
        if (value !== undefined && value !== null && String(value).trim()) return String(value);
      }
      return '';
    };
    return compactFields({
      title: pick('title','name'),
      author: normalizeAuthorName(pick('author','creator','writer')) || undefined,
      series: pick('series','collection') || undefined,
      seriesNumber: numberValue(pick('seriesNumber','series_index','seriesIndex','number','volume')),
      genre: pick('genre','subject') || undefined,
      publishedYear: publicationYear(pick('publishedYear','year','date','published')),
      narrator: pick('narrator') || undefined,
      publisher: pick('publisher') || undefined,
      isbn: normalizeIdentifier(pick('isbn','ISBN')),
      asin: normalizeIdentifier(pick('asin','ASIN')),
      language: pick('language') || undefined,
      description: pick('description','summary','comments') || undefined,
    });
  } catch {
    return {};
  }
}

function compactFields(fields: LocalMetadataFields): LocalMetadataFields {
  const out: LocalMetadataFields = {};
  for (const [key,value] of Object.entries(fields)) {
    if (value === undefined || value === null || String(value).trim() === '') continue;
    (out as any)[key] = value;
  }
  return out;
}

function cleanOptional(value: unknown) {
  const result = cleanLabel(String(value ?? ''));
  return result || undefined;
}

function normalizeIdentifier(value: unknown) {
  const result = String(value ?? '').trim().replace(/\s+/g,'').replace(/^urn:(?:isbn|asin):/i,'');
  return result || undefined;
}

function numberValue(value: unknown) {
  const match = String(value ?? '').trim().match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : undefined;
}

function numericIndex(value: string) {
  const number = Number(String(value).replace(/^#/,'').trim());
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function normalizedKey(value: unknown) {
  return cleanLabel(String(value ?? '')).toLowerCase().replace(/[^a-z0-9]+/g,'');
}

function cleanLabel(value: string) {
  return value
    .replace(/[_]+/g, ' ')
    .replace(/\s*\[(?:unabridged|audiobook|ebook|retail|scan)\]\s*/gi, ' ')
    .replace(/\s*\((?:unabridged|audiobook|ebook)\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function equivalent(a: string, b: string) {
  const normal = (value: string) => cleanLabel(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
  return !!a && normal(a) === normal(b);
}

function sensibleFolder(value: string, title: string) {
  if (!value || equivalent(value, title)) return false;
  return !isLibraryRoot(value);
}

function isLibraryRoot(value: string) {
  return /^(books?|ebooks?|audiobooks?|comics?|pdfs?|downloads?|documents?|media|library|libraries)$/i.test(cleanLabel(value));
}

function looksIndex(value: string) {
  return /^#?\d+(?:\.\d+)?$/.test(value.trim());
}

function looksAuthorLike(value: string) {
  if (!value || /\d/.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  return words.length >= 2 || value.includes(',');
}

export function publicationYear(raw:unknown):number|undefined {
  const match=String(raw??'').trim().match(/^(\d{4})(?:$|[-/])/);
  const year=match?Number(match[1]):0;
  return year>=1000&&year<=new Date().getFullYear()+2?year:undefined;
}
