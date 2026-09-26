export type IdentificationConfidence = 'high' | 'medium' | 'low';

export type LocalIdentity = {
  title: string;
  author: string;
  series: string;
  confidence: IdentificationConfidence;
  needsReview: boolean;
  reviewReason: string;
  coverShape: 'portrait' | 'square';
  metadataSource: 'path' | 'sidecar' | 'manual';
};

export type LocalMetadataFields = {
  title?: string;
  author?: string;
  series?: string;
};

export function inferLocalBookMetadata(uri: string, format: string): LocalIdentity {
  const parts = decodedPathParts(uri);
  const filename = parts[parts.length - 1] || 'Untitled';
  const stem = cleanLabel(filename.replace(/\.[^.]+$/, ''));
  const dirs = parts.slice(0, -1).filter(Boolean);
  const parent = cleanLabel(dirs[dirs.length - 1] || '');
  const grandparent = cleanLabel(dirs[dirs.length - 2] || '');
  const greatGrandparent = cleanLabel(dirs[dirs.length - 3] || '');

  let title = stem || 'Untitled';
  let author = '';
  let series = '';
  let confidence: IdentificationConfidence = 'low';
  let reviewReason = 'Could not confidently identify author and series from the file path.';

  const dashed = stem.split(/\s+-\s+/).map(cleanLabel).filter(Boolean);
  if (dashed.length >= 4 && looksIndex(dashed[2])) {
    author = dashed[0];
    series = dashed[1];
    title = dashed.slice(3).join(' - ');
    confidence = 'high';
    reviewReason = '';
  } else if (dashed.length >= 3 && looksIndex(dashed[1])) {
    author = dashed[0];
    title = dashed.slice(2).join(' - ');
    series = sensibleFolder(parent, title) ? parent : '';
    confidence = 'medium';
    reviewReason = series ? '' : 'Title and author inferred from filename; series was not clear.';
  } else if (dashed.length >= 2) {
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
      title = cleanLabel(numbered[2]);
      confidence = 'medium';
      reviewReason = 'Series and title inferred from numbered filename; author needs review.';
    } else if (sensibleFolder(parent, stem) && looksAuthorLike(parent)) {
      author = parent;
      confidence = 'medium';
      reviewReason = 'Author inferred from parent folder.';
    }
  }

  title = cleanLabel(title) || 'Untitled';
  author = cleanLabel(author);
  series = cleanLabel(series);

  const needsReview = confidence === 'low' || title === 'Untitled';
  return {
    title,
    author,
    series,
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
  source: 'sidecar' | 'manual',
): LocalIdentity {
  const title = cleanLabel(fields.title || '') || base.title;
  const author = fields.author === undefined ? base.author : cleanLabel(fields.author);
  const series = fields.series === undefined ? base.series : cleanLabel(fields.series);
  const manual = source === 'manual';
  const completeEnough = title !== 'Untitled' && (!!author || manual);
  return {
    ...base,
    title,
    author,
    series,
    confidence: 'high',
    needsReview: !completeEnough,
    reviewReason: completeEnough ? '' : 'Metadata was found, but the author still needs review.',
    metadataSource: source,
  };
}

export function parseLocalSidecar(text: string, extension: string): LocalMetadataFields {
  if (!text || text.length > 2 * 1024 * 1024) return {};
  const ext = extension.toLowerCase();
  const title = xmlValue(text, ['dc:title', 'title']);
  const author = xmlValue(text, ['dc:creator', 'creator', 'author', 'writer']);

  let series = xmlValue(text, ['series']);
  if (!series && ext === 'opf') {
    const calibre = text.match(/<meta\b[^>]*name\s*=\s*["']calibre:series["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)
      || text.match(/<meta\b[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']calibre:series["'][^>]*>/i);
    if (calibre) series = decodeXml(calibre[1]);

    if (!series) {
      const collection = text.match(/<meta\b[^>]*property\s*=\s*["'][^"']*belongs-to-collection["'][^>]*>([\s\S]*?)<\/meta>/i);
      if (collection) series = stripXml(collection[1]);
    }
  }

  return {
    title: cleanLabel(title || '') || undefined,
    author: cleanLabel(author || '') || undefined,
    series: cleanLabel(series || '') || undefined,
  };
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
  return !/^(books?|ebooks?|audiobooks?|comics?|pdfs?|downloads?|documents?|media)$/i.test(value);
}

function looksIndex(value: string) {
  return /^#?\d+(?:\.\d+)?$/.test(value.trim());
}

function looksAuthorLike(value: string) {
  if (!value || /\d/.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  return words.length >= 2 || value.includes(',');
}
