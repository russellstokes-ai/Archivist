export type MetadataGapFilter = '' | 'author' | 'series' | 'genre' | 'cover';

export type MaintenanceWork = {
  author?: string | null;
  series?: string | null;
  genre?: string | null;
  coverUri?: string | null;
  source?: string | null;
};

const present = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

export function matchesMetadataGap(work: MaintenanceWork, gap: MetadataGapFilter): boolean {
  if (!gap) return true;
  if (gap === 'author') return !present(work.author);
  if (gap === 'series') return !present(work.series);
  if (gap === 'genre') return !present(work.genre);
  // Remote server works have a server-side cover route even when coverUri is not populated
  // on the unified client model, so only device-held works can be safely classified here.
  if (gap === 'cover') return work.source !== 'server' && !present(work.coverUri);
  return true;
}

export function metadataGapCounts(works: MaintenanceWork[]) {
  return {
    author: works.filter(work => matchesMetadataGap(work, 'author')).length,
    series: works.filter(work => matchesMetadataGap(work, 'series')).length,
    genre: works.filter(work => matchesMetadataGap(work, 'genre')).length,
    cover: works.filter(work => matchesMetadataGap(work, 'cover')).length,
  };
}

export function metadataCompleteness(work: MaintenanceWork) {
  const missing: Array<'author' | 'series' | 'genre' | 'cover'> = [];
  if (matchesMetadataGap(work, 'author')) missing.push('author');
  if (matchesMetadataGap(work, 'series')) missing.push('series');
  if (matchesMetadataGap(work, 'genre')) missing.push('genre');
  if (matchesMetadataGap(work, 'cover')) missing.push('cover');
  return {complete: missing.length === 0, missing};
}


export type AdvancedMaintenanceWork = MaintenanceWork & {
  title?: string | null;
  seriesNumber?: number | null;
  publishedYear?: number | null;
  narrator?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  asin?: string | null;
  language?: string | null;
  description?: string | null;
  format?: string | null;
  metadataConflicts?: Array<{field?: string}> | null;
};

export type AdvancedMetadataField =
  | 'title' | 'author' | 'series' | 'seriesNumber' | 'genre' | 'cover'
  | 'publishedYear' | 'narrator' | 'publisher' | 'identifier' | 'language' | 'description';

export function advancedMetadataCompleteness(work: AdvancedMaintenanceWork) {
  const missing: AdvancedMetadataField[] = [];
  if (!present(work.title)) missing.push('title');
  if (!present(work.author)) missing.push('author');
  if (!present(work.series)) missing.push('series');
  if (present(work.series) && (work.seriesNumber === undefined || work.seriesNumber === null)) missing.push('seriesNumber');
  if (!present(work.genre)) missing.push('genre');
  if (work.source !== 'server' && !present(work.coverUri)) missing.push('cover');
  if (work.publishedYear === undefined || work.publishedYear === null) missing.push('publishedYear');
  if (String(work.format || '').toLowerCase() === 'audio' && !present(work.narrator)) missing.push('narrator');
  if (!present(work.publisher)) missing.push('publisher');
  if (!present(work.isbn) && !present(work.asin)) missing.push('identifier');
  if (!present(work.language)) missing.push('language');
  if (!present(work.description)) missing.push('description');
  return {
    complete: missing.length === 0 && !(work.metadataConflicts?.length),
    missing,
    conflicts: work.metadataConflicts?.map(item=>item.field).filter(Boolean) || [],
  };
}

export function advancedMetadataGapCounts(works: AdvancedMaintenanceWork[]) {
  const fields: AdvancedMetadataField[] = ['title','author','series','seriesNumber','genre','cover','publishedYear','narrator','publisher','identifier','language','description'];
  return Object.fromEntries(fields.map(field=>[
    field,
    works.filter(work=>advancedMetadataCompleteness(work).missing.includes(field)).length,
  ])) as Record<AdvancedMetadataField,number>;
}
