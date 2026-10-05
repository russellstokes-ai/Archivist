import type {MetadataResolution} from './metadataResolution';

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
  workTitle?: string;
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
  comicIssueNumber?: string;
  comicVolume?: number;
  comicSeriesAliases?: string[];
  comicCreators?: Array<{name:string;roles:string[]}>;
  comicStoryArcs?: string[];
  comicCharacters?: string[];
  comicTeams?: string[];
  comicUniverses?: string[];
  comicUpc?: string;
  comicSku?: string;
  comicVineId?: number;
  comicGcdId?: number;
  comicStoreDate?: string;
  comicCoverDate?: string;
  comicPageCount?: number;
};

export type LocalMetadataContext = {
  siblingMediaCount?: number;
  rootUri?: string;
};

export function audioMultipartWorkTitle(value:string){
  const stem=cleanLabel(String(value||'').replace(/\.[^.]+$/,''));
  const patterns=[
    /^(.*?)\s*[-._:]?\s*(?:part|pt|chapter|ch|track|disc|disk|cd)\s*[-_.:#]?\s*\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?(?:\s*[-._:].*)?$/i,
    /^(.*?)\s*[-._:]\s*\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?(?:\s*[-._:].*)?$/i,
    /^(.*?)\s*\((?:part|pt|chapter|ch|track)\s*\d{1,4}\)\s*$/i,
  ];
  for(const pattern of patterns){
    const match=stem.match(pattern);
    const title=cleanLabel(match?.[1]||'');
    if(title.length>=3)return title;
  }
  return '';
}

export function inferLocalBookMetadata(uri: string, format: string, context: LocalMetadataContext = {}): LocalIdentity {
  const parts = decodedPathParts(uri);
  const filename = parts[parts.length - 1] || 'Untitled';
  const rawStem = cleanLabel(filename.replace(/\.[^.]+$/, ''));
  const qualifiers = filenameQualifiers(rawStem);
  const stem = qualifiers.stem;
  const rawDirs = parts.slice(0, -1).filter(Boolean).map(cleanLabel);
  const selectedRootDirs=context.rootUri?decodedPathParts(context.rootUri).map(cleanLabel):[];
  const atSelectedRoot=selectedRootDirs.length>0
    && rawDirs.length===selectedRootDirs.length
    && rawDirs.every((value,index)=>equivalent(value,selectedRootDirs[index]||''));
  const dirs = [...rawDirs];
  while (dirs.length && isLibraryRootLabel(dirs[0])) dirs.shift();
  const inferredGenre = inferGenreFromDirectories(dirs);
  const semanticDirs = dirs.filter((value,index) => !(index < dirs.length - 1 && canonicalGenre(value)));
  const parent = cleanLabel(semanticDirs[semanticDirs.length - 1] || '');
  const grandparent = cleanLabel(semanticDirs[semanticDirs.length - 2] || '');
  const greatGrandparent = cleanLabel(semanticDirs[semanticDirs.length - 3] || '');

  const rootMultipartTitle=format==='Audio'&&(!parent||atSelectedRoot)?audioMultipartWorkTitle(stem):'';
  let title = rootMultipartTitle || stem || 'Untitled';
  let author = '';
  let series = '';
  let seriesNumber: number | undefined;
  let genre = inferredGenre;
  let narrator = qualifiers.narrator;
  let isbn = qualifiers.isbn;
  let asin = qualifiers.asin;
  let publishedYear = qualifiers.publishedYear;
  let confidence: IdentificationConfidence = 'low';
  let reviewReason = 'Could not confidently identify author and series from the file path.';

  const genericAudioTrack = format === 'Audio' && (
    !!rootMultipartTitle || genericAudioTrackTitle(stem) || ((context.siblingMediaCount || 0) > 1 && numberedAudioTrackTitle(stem))
  );
  if(rootMultipartTitle){
    confidence='medium';
    reviewReason='Audiobook title inferred from multipart filenames; author still needs metadata or review.';
  }
  const indexedParent = indexedFolderLabel(parent);
  if (genericAudioTrack && sensibleFolder(parent, stem)) {
    title = indexedParent?.title || parent;
    seriesNumber = indexedParent?.index ?? seriesNumber;
    if (semanticDirs.length >= 3) {
      author = greatGrandparent;
      series = grandparent;
      confidence = author ? 'high' : 'medium';
      reviewReason = author ? '' : 'Audiobook title came from its folder; author still needs review.';
    } else if (semanticDirs.length >= 2) {
      author = grandparent;
      confidence = author ? 'high' : 'medium';
      reviewReason = author ? '' : 'Audiobook title came from its folder; author still needs review.';
    } else {
      confidence = 'medium';
      reviewReason = 'Audiobook title came from its folder; author still needs review.';
    }
  }

  const dashed = stem.split(/\s+-\s+/).map(cleanLabel).filter(Boolean);
  if (!genericAudioTrack && dashed.length >= 4 && looksIndex(dashed[2])) {
    author = dashed[0];
    series = dashed[1];
    seriesNumber = numericIndex(dashed[2]);
    title = dashed.slice(3).join(' - ');
    confidence = 'high';
    reviewReason = '';
  } else if (!genericAudioTrack && dashed.length >= 3 && looksIndex(dashed[1])) {
    author = dashed[0];
    seriesNumber = numericIndex(dashed[1]);
    title = dashed.slice(2).join(' - ');
    series = sensibleFolder(parent, title) ? parent : '';
    confidence = 'medium';
    reviewReason = series ? '' : 'Title and author inferred from filename; series was not clear.';
  } else if (!genericAudioTrack && dashed.length >= 2 && !looksIndex(dashed[0])) {
    author = dashed[0];
    title = dashed.slice(1).join(' - ');
    confidence = 'medium';
    reviewReason = 'Author and title inferred from filename.';
  } else if (!genericAudioTrack && indexedParent && semanticDirs.length >= 3 && equivalent(indexedParent.title, stem) && looksAuthorLike(greatGrandparent)) {
    author = greatGrandparent;
    series = grandparent;
    seriesNumber = indexedParent.index;
    title = stem;
    confidence = 'high';
    reviewReason = '';
  } else if (!genericAudioTrack && format === 'Audio' && semanticDirs.length >= 3) {
    author = greatGrandparent;
    series = grandparent;
    confidence = author ? 'high' : 'medium';
    reviewReason = author ? '' : 'Audiobook folders were only partly identifiable.';
  } else if (!genericAudioTrack && format === 'Audio' && semanticDirs.length >= 2) {
    author = grandparent;
    series = '';
    confidence = author ? 'medium' : 'low';
    reviewReason = author ? '' : 'Audiobook author could not be identified confidently.';
  } else if (!genericAudioTrack && semanticDirs.length >= 3 && equivalent(parent, stem)) {
    author = greatGrandparent;
    series = grandparent;
    confidence = author && series ? 'high' : 'medium';
    reviewReason = confidence === 'high' ? '' : 'Folder layout was only partly identifiable.';
  } else if (!genericAudioTrack && semanticDirs.length >= 2 && sensibleFolder(parent, stem) && sensibleFolder(grandparent, stem)) {
    author = grandparent;
    series = parent;
    confidence = 'high';
    reviewReason = '';
  } else if (!genericAudioTrack) {
    const numbered = stem.match(/^\s*(\d+(?:\.\d+)?)\s*[-._:]\s*(.+)$/);
    if (numbered && sensibleFolder(parent, stem)) {
      series = parent;
      seriesNumber = numericIndex(numbered[1]);
      title = cleanLabel(numbered[2]);
      const possibleAuthor = cleanLabel(grandparent);
      if (possibleAuthor && !isLibraryRootLabel(possibleAuthor) && looksAuthorLike(possibleAuthor)) {
        author = possibleAuthor;
        confidence = 'high';
        reviewReason = '';
      } else {
        confidence = 'medium';
        reviewReason = 'Series and title inferred from numbered filename; author needs review.';
      }
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

  const needsReview = confidence === 'low' || title === 'Untitled' || (format === 'Audio' && !author);
  return {
    title,
    author,
    series,
    seriesNumber,
    genre,
    narrator,
    isbn,
    asin,
    publishedYear,
    confidence,
    needsReview,
    reviewReason: needsReview ? reviewReason : '',
    coverShape: format === 'Audio' ? 'square' : 'portrait',
    metadataSource: 'path',
  };
}

export function isGenericMediaTitle(value: string, format = 'Audio', siblingMediaCount = 1) {
  const clean = cleanLabel(value);
  if (!clean) return true;
  if (/^(?:untitled|unknown(?: title)?|n\/?a|none|null)$/i.test(clean)) return true;
  if (format !== 'Audio') return false;
  return genericAudioTrackTitle(clean) || (siblingMediaCount > 1 && numberedAudioTrackTitle(clean));
}

export function sanitizeDiscoveredMetadata(
  fields: LocalMetadataFields,
  format: string,
  fallbackTitle: string,
  siblingMediaCount = 1,
): LocalMetadataFields {
  const out: LocalMetadataFields = {...fields};
  const placeholder = (value: unknown) => /^(?:unknown(?: author| artist| genre| series)?|unclassified|n\/?a|none|null|untitled)$/i.test(cleanLabel(String(value ?? '')));
  if (out.title && (placeholder(out.title) || (isGenericMediaTitle(out.title, format, siblingMediaCount) && !isGenericMediaTitle(fallbackTitle, format, siblingMediaCount)))) delete out.title;
  if (out.author && (placeholder(out.author) || isLibraryRootLabel(out.author))) delete out.author;
  if (out.series && placeholder(out.series)) delete out.series;
  if (out.genre && placeholder(out.genre)) delete out.genre;
  if (out.genre) out.genre = canonicalGenre(out.genre) || cleanLabel(out.genre);
  return compactFields(out);
}

export function applyResolvedLocalMetadata(base: LocalIdentity, resolution: MetadataResolution): LocalIdentity {
  const fields = resolution.fields;
  const title = cleanLabel(fields.title || '') || base.title;
  const author = fields.author === undefined ? base.author : normalizeAuthorName(fields.author);
  const series = fields.series === undefined ? base.series : cleanLabel(fields.series);
  const genre = fields.genre === undefined ? base.genre : (canonicalGenre(fields.genre) || cleanLabel(fields.genre));
  const importantConflict = resolution.conflicts.some(conflict => ['title','author','series','seriesNumber','isbn','asin'].includes(String(conflict.field)));
  const keyConfidence = [resolution.confidence.title, resolution.confidence.author].filter(Boolean);
  let confidence: IdentificationConfidence = base.confidence;
  if (!author || !title || title === 'Untitled') confidence = 'low';
  else if (keyConfidence.includes('low')) confidence = 'low';
  else if (keyConfidence.includes('medium')) confidence = 'medium';
  else if (keyConfidence.length >= 2) confidence = 'high';
  const needsReview = confidence === 'low' || importantConflict || title === 'Untitled' || !author;
  const provenance = resolution.provenance.title || resolution.provenance.author;
  const metadataSource = provenance === 'manual' || provenance === 'embedded' || provenance === 'sidecar' || provenance === 'path'
    ? provenance
    : base.metadataSource;
  return {
    ...base,
    title,
    author,
    series,
    seriesNumber: fields.seriesNumber ?? base.seriesNumber,
    genre,
    publishedYear: fields.publishedYear ?? base.publishedYear,
    narrator: cleanOptional(fields.narrator) ?? base.narrator,
    publisher: cleanOptional(fields.publisher) ?? base.publisher,
    isbn: normalizeIdentifier(fields.isbn) ?? base.isbn,
    asin: normalizeIdentifier(fields.asin) ?? base.asin,
    language: cleanOptional(fields.language) ?? base.language,
    description: cleanOptional(fields.description) ?? base.description,
    confidence,
    needsReview,
    reviewReason: needsReview
      ? (!author ? 'Author could not be identified confidently.' : importantConflict ? 'Conflicting metadata needs review.' : base.reviewReason || 'Metadata needs review.')
      : '',
    metadataSource,
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
  let author = xmlValue(text, ['dc:creator', 'creator', 'author', 'writer', 'Writer']);

  let series = xmlValue(text, ['series', 'Series']);
  const comicIssueNumber = cleanOptional(xmlValue(text, ['number', 'Number']));
  const comicVolume = numberValue(xmlValue(text, ['volume', 'Volume']));
  let seriesNumber = numberValue(xmlValue(text, ['seriesindex', 'series_index'])) ?? numberValue(comicIssueNumber);
  const genre = xmlValue(text, ['dc:subject', 'subject', 'genre', 'Genre']);
  const narrator = xmlValue(text, ['narrator', 'Narrator']);
  const publisher = xmlValue(text, ['dc:publisher', 'publisher', 'Publisher']);
  let isbn = xmlValue(text, ['isbn', 'ISBN']);
  let asin = xmlValue(text, ['asin', 'ASIN']);
  const identifiers = xmlValues(text, ['dc:identifier','identifier']);
  for (const identifier of identifiers) {
    const clean = identifier.trim();
    if (!isbn) {
      const isbnMatch = clean.match(/(?:urn:isbn:|isbn(?:-1[03])?[:#\s-]*)?([0-9Xx][0-9Xx\s-]{8,20})$/i);
      if (isbnMatch) {
        const candidate = normalizeIdentifier(isbnMatch[1])?.replace(/-/g,'');
        if (candidate && /^(?:\d{9}[\dXx]|\d{13})$/.test(candidate)) isbn = candidate;
      }
    }
    if (!asin) {
      const asinMatch = clean.match(/(?:urn:asin:|asin[:#\s-]*)([A-Z0-9]{10})/i);
      if (asinMatch) asin = asinMatch[1];
    }
  }
  const language = xmlValue(text, ['dc:language', 'language', 'Language']);
  const description = xmlValue(text, ['dc:description', 'description', 'Description', 'summary', 'Summary', 'comments', 'Comments']);
  const comicCreators = comicCreatorsFromXml(text);
  const comicSeriesAliases = splitMetadataList(xmlValue(text,['alternateseries','AlternateSeries']));
  if(/<ComicInfo\b/i.test(text)){
    const writers=comicCreators.filter(creator=>creator.roles.some(role=>/writer/i.test(role))).map(creator=>creator.name);
    if(writers.length)author=writers.join(' & ');
  }
  const comicStoryArcs = splitMetadataList(xmlValue(text,['storyarc','StoryArc']));
  const comicCharacters = splitMetadataList(xmlValue(text,['characters','Characters']));
  const comicTeams = splitMetadataList(xmlValue(text,['teams','Teams']));
  const comicUniverses = splitMetadataList(xmlValue(text,['universes','Universes','universe','Universe']));
  const comicUpc = cleanOptional(xmlValue(text,['upc','UPC','gtin','GTIN']));
  const comicSku = cleanOptional(xmlValue(text,['sku','SKU']));
  const comicPageCount = numberValue(xmlValue(text,['pagecount','PageCount']));
  const comicVineId = numberValue(xmlValue(text,['comicvineid','ComicVineId','cv_id']));
  const comicGcdId = numberValue(xmlValue(text,['gcdid','GCDId','gcd_id']));
  const comicStoreDate = cleanOptional(xmlValue(text,['storedate','StoreDate']));
  const comicCoverDate = comicDateFromXml(text);
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
    if (seriesNumber === undefined) {
      const groupPosition = text.match(/<meta\b[^>]*property\s*=\s*["'][^"']*(?:group-position|series-number)["'][^>]*>([\s\S]*?)<\/meta>/i)
        || text.match(/<meta\b[^>]*(?:name|property)\s*=\s*["'][^"']*(?:series[_-]?index|series[_-]?number|group-position)["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i);
      if (groupPosition) seriesNumber = numberValue(stripXml(groupPosition[1]));
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
    comicIssueNumber,
    comicVolume,
    comicSeriesAliases: comicSeriesAliases.length ? comicSeriesAliases : undefined,
    comicCreators: comicCreators.length ? comicCreators : undefined,
    comicStoryArcs: comicStoryArcs.length ? comicStoryArcs : undefined,
    comicCharacters: comicCharacters.length ? comicCharacters : undefined,
    comicTeams: comicTeams.length ? comicTeams : undefined,
    comicUniverses: comicUniverses.length ? comicUniverses : undefined,
    comicUpc,
    comicSku,
    comicVineId,
    comicGcdId,
    comicStoreDate,
    comicCoverDate,
    comicPageCount,
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

function xmlValues(text: string, tags: string[]) {
  const values:string[]=[];
  for (const tag of tags) {
    const pattern=new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'>','gi');
    for (const match of text.matchAll(pattern)) {
      const value=stripXml(match[1]);
      if(value)values.push(value);
    }
  }
  return values;
}

function xmlValue(text: string, tags: string[]) {
  for (const tag of tags) {
    const match = text.match(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i'));
    if (match) return stripXml(match[1]);
  }
  return '';
}
function splitMetadataList(value: unknown): string[] {
  return String(value ?? '')
    .split(/\s*[,;|]\s*/)
    .map(item => cleanLabel(item))
    .filter((item,index,all) => !!item && all.indexOf(item)===index);
}

function comicCreatorsFromXml(text:string):Array<{name:string;roles:string[]}> {
  const roleTags:Array<[string,string[]]> = [
    ['Writer',['writer','Writer']],
    ['Penciller',['penciller','Penciller']],
    ['Inker',['inker','Inker']],
    ['Colorist',['colorist','Colorist','colourist','Colourist']],
    ['Letterer',['letterer','Letterer']],
    ['Cover Artist',['coverartist','CoverArtist']],
    ['Editor',['editor','Editor']],
    ['Translator',['translator','Translator']],
  ];
  const byName=new Map<string,{name:string;roles:string[]}>();
  for(const [role,tags] of roleTags){
    const names=splitMetadataList(xmlValue(text,tags));
    for(const name of names){
      const key=name.toLowerCase();
      const current=byName.get(key)||{name,roles:[]};
      if(!current.roles.includes(role))current.roles.push(role);
      byName.set(key,current);
    }
  }
  return [...byName.values()];
}

function comicDateFromXml(text:string){
  const year=numberValue(xmlValue(text,['year','Year']));
  const month=numberValue(xmlValue(text,['month','Month']));
  const day=numberValue(xmlValue(text,['day','Day']));
  if(!year||year<1000||year>9999)return undefined;
  return String(year)+'-'+String(month||1).padStart(2,'0')+'-'+String(day||1).padStart(2,'0');
}

function jsonStringList(value:unknown):string[]|undefined {
  const values=Array.isArray(value)?value:String(value??'').split(/\s*[,;|]\s*/);
  const clean=values.map(item=>cleanLabel(String(item??''))).filter((item,index,all)=>!!item&&all.indexOf(item)===index);
  return clean.length?clean:undefined;
}

function jsonComicCreators(metadata:any):Array<{name:string;roles:string[]}>|undefined {
  const direct=metadata?.comicCreators ?? metadata?.creators;
  if(Array.isArray(direct)){
    const values=direct.flatMap((entry:any)=>{
      if(typeof entry==='string')return splitMetadataList(entry).map(name=>({name,roles:[]}));
      const name=cleanLabel(String(entry?.name??entry?.creator?.name??''));
      if(!name)return [];
      const rawRoles=entry?.roles??entry?.role??[];
      const roles=(Array.isArray(rawRoles)?rawRoles:[rawRoles]).map((role:any)=>cleanLabel(String(role?.name??role??''))).filter(Boolean);
      return [{name,roles}];
    });
    return values.length?values:undefined;
  }
  const writer=String(metadata?.writer??metadata?.Writer??'');
  const values=splitMetadataList(writer).map(name=>({name,roles:['Writer']}));
  return values.length?values:undefined;
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
      comicIssueNumber: pick('comicIssueNumber','issueNumber','issue','number') || undefined,
      comicVolume: numberValue(pick('comicVolume','volume')),
      comicSeriesAliases: jsonStringList(metadata?.comicSeriesAliases ?? metadata?.alternateSeries ?? metadata?.seriesAliases),
      comicCreators: jsonComicCreators(metadata),
      comicStoryArcs: jsonStringList(metadata?.comicStoryArcs ?? metadata?.storyArcs ?? metadata?.storyArc),
      comicCharacters: jsonStringList(metadata?.comicCharacters ?? metadata?.characters),
      comicTeams: jsonStringList(metadata?.comicTeams ?? metadata?.teams),
      comicUniverses: jsonStringList(metadata?.comicUniverses ?? metadata?.universes),
      comicUpc: pick('comicUpc','upc','gtin') || undefined,
      comicSku: pick('comicSku','sku') || undefined,
      comicVineId: numberValue(pick('comicVineId','cv_id')),
      comicGcdId: numberValue(pick('comicGcdId','gcd_id')),
      comicStoreDate: pick('comicStoreDate','storeDate') || undefined,
      comicCoverDate: pick('comicCoverDate','coverDate') || undefined,
      comicPageCount: numberValue(pick('comicPageCount','pageCount')),
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
  return !isLibraryRootLabel(value);
}

export function isLibraryRootLabel(value: string) {
  return /^(books?|ebooks?|audiobooks?|audio|music|recordings?|comics?|pdfs?|downloads?|documents?|media|library|libraries)$/i.test(cleanLabel(value));
}

function looksIndex(value: string) {
  return /^#?\d+(?:\.\d+)?$/.test(value.trim());
}

function genericAudioTrackTitle(value: string) {
  const clean = cleanLabel(value);
  return /^(?:(?:part|pt|track|chapter|ch|disc|disk|cd)\s*[-_.:#]?\s*)?\d{1,4}(?:\s*(?:of|\/|-)\s*\d{1,4})?$/i.test(clean)
    || /^(?:part|pt|track|chapter|ch|disc|disk|cd)\s*[-_.:#]?\s*\d{1,4}(?:\s*(?:of|\/|-)\s*\d{1,4})?(?:\s*[-_.:]\s*(?:part|track|chapter)?\s*\d{0,4})?$/i.test(clean);
}

function numberedAudioTrackTitle(value: string) {
  return /^\s*\d{1,4}\s*[-._:]\s*\S.+$/.test(cleanLabel(value));
}

function indexedFolderLabel(value: string) {
  const clean = cleanLabel(value);
  const match = clean.match(/^(?:(?:book|bk|vol(?:ume)?)\s*)?#?\s*(\d+(?:\.\d+)?)\s*[-._:]\s*(.+)$/i);
  if (!match) return undefined;
  const index = numericIndex(match[1]);
  const title = cleanLabel(match[2]);
  return index === undefined || !title ? undefined : {index,title};
}

const genreAliases: Record<string,string> = {
  'fiction':'Fiction','literary fiction':'Literary Fiction','science fiction':'Science Fiction','sci fi':'Science Fiction','scifi':'Science Fiction',
  'fantasy':'Fantasy','romance':'Romance','mystery':'Mystery','crime':'Crime','thriller':'Thriller','horror':'Horror','adventure':'Adventure',
  'historical fiction':'Historical Fiction','classics':'Classics','young adult':'Young Adult','ya':'Young Adult','children':'Children','childrens':'Children',
  'non fiction':'Non-fiction','nonfiction':'Non-fiction','biography':'Biography','autobiography':'Autobiography','memoir':'Memoir','history':'History',
  'business':'Business','economics':'Economics','finance':'Finance','self help':'Self-help','selfhelp':'Self-help','psychology':'Psychology',
  'philosophy':'Philosophy','science':'Science','technology':'Technology','travel':'Travel','humor':'Humour','humour':'Humour','poetry':'Poetry',
  'comics':'Comics','graphic novels':'Graphic Novels','graphic novel':'Graphic Novels'
};

function canonicalGenre(value: unknown) {
  const key = cleanLabel(String(value ?? '')).toLowerCase().replace(/[&_\/-]+/g,' ').replace(/\s+/g,' ').trim();
  return genreAliases[key];
}

function inferGenreFromDirectories(dirs: string[]) {
  for (let index=0; index<dirs.length; index+=1) {
    const genre = canonicalGenre(dirs[index]);
    if (!genre) continue;
    if (index === dirs.length - 1 && index > 0 && looksAuthorLike(dirs[index - 1])) continue;
    return genre;
  }
  return '';
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
