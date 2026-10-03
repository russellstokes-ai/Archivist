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
