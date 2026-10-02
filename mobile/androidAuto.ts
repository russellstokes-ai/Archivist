export type AndroidAutoCatalogueSource = {
  key: string;
  title: string;
  author?: string;
  series?: string;
  genre?: string;
  format: string;
  available: boolean;
  readingState?: 'not-started'|'in-progress'|'finished';
  favourite?: boolean;
  source?: string;
};

export type AndroidAutoCatalogueItem = {
  id: string;
  title: string;
  author: string;
  series: string;
  genre: string;
  readingState: 'not-started'|'in-progress'|'finished';
  favourite: boolean;
  source: string;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildAndroidAutoCatalogue(works: AndroidAutoCatalogueSource[]): AndroidAutoCatalogueItem[] {
  const seen = new Set<string>();
  const result: AndroidAutoCatalogueItem[] = [];
  for (const work of works) {
    if (work.format !== 'Audio' || !work.available) continue;
    const id = clean(work.key);
    const title = clean(work.title);
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    const state = work.readingState === 'in-progress' || work.readingState === 'finished'
      ? work.readingState
      : 'not-started';
    result.push({
      id,
      title,
      author: clean(work.author),
      series: clean(work.series),
      genre: clean(work.genre),
      readingState: state,
      favourite: !!work.favourite,
      source: clean(work.source) || 'unknown',
    });
  }
  return result;
}
