export type ShelfFormatChoiceLike = {
  key: string;
  source: string;
  logicalWorkKey?: string;
  title: string;
  author: string;
  series: string;
  seriesNumber?: number;
  format: string;
  available: boolean;
  readingState: 'not-started' | 'in-progress' | 'finished';
  favourite?: boolean;
  rating?: number;
  coverUri?: string;
};

export type ShelfGroupedWork<T extends ShelfFormatChoiceLike> = T & {
  formatChoices?: T[];
};

function formatKey(value: string) {
  return String(value || '').trim().toLowerCase();
}

function formatPriority(value: string) {
  const key = formatKey(value);
  if (key === 'epub' || key === 'ebook' || key === 'book') return 0;
  if (key === 'pdf') return 1;
  if (key === 'comic' || key === 'cbz' || key === 'cbr' || key === 'cbt') return 2;
  if (key === 'audio' || key === 'audiobook') return 3;
  return 4;
}

function chooseFormatRepresentative<T extends ShelfFormatChoiceLike>(items: T[]) {
  const active = items.find(item => item.readingState === 'in-progress' && item.available);
  if (active) return active;
  const withCover = items.find(item => !!item.coverUri && item.available);
  if (withCover) return withCover;
  return items.find(item => item.available) || items[0];
}

export function groupShelfFormats<T extends ShelfFormatChoiceLike>(items: T[]): Array<ShelfGroupedWork<T>> {
  const groups = new Map<string, T[]>();
  const order: string[] = [];

  for (const item of items) {
    const groupable = item.source === 'local' && !!item.logicalWorkKey;
    const key = groupable ? 'local-work:' + item.logicalWorkKey : 'single:' + item.key;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(item);
  }

  const output: Array<ShelfGroupedWork<T>> = [];
  for (const key of order) {
    const members = groups.get(key)!;
    const formatGroups = new Map<string, T[]>();
    for (const member of members) {
      const f = formatKey(member.format) || member.key;
      const group = formatGroups.get(f) || [];
      group.push(member);
      formatGroups.set(f, group);
    }

    // Multiple files/editions of one format remain separate. Sprint 2 only collapses
    // genuinely different formats of the same logical work.
    if (formatGroups.size <= 1) {
      output.push(...members);
      continue;
    }

    const choices = [...formatGroups.values()]
      .map(chooseFormatRepresentative)
      .sort((a, b) => formatPriority(a.format) - formatPriority(b.format) || a.key.localeCompare(b.key));

    const representative = chooseFormatRepresentative(choices);
    const readingState = choices.some(item => item.readingState === 'in-progress')
      ? 'in-progress'
      : choices.some(item => item.readingState === 'finished')
        ? 'finished'
        : 'not-started';
    output.push({
      ...representative,
      available: choices.some(item => item.available),
      readingState,
      favourite: choices.some(item => !!item.favourite),
      rating: Math.max(0, ...choices.map(item => Number(item.rating) || 0)),
      formatChoices: choices,
    });
  }
  return output;
}

export function obviousShelfFormatChoice<T extends ShelfFormatChoiceLike>(choices: T[], rememberedKey?: string) {
  const available = choices.filter(item => item.available);
  if (!available.length) return null;
  if (rememberedKey) {
    const remembered = available.find(item => item.key === rememberedKey);
    if (remembered) return remembered;
  }
  const active = available.filter(item => item.readingState === 'in-progress');
  if (active.length === 1) return active[0];
  if (available.length === 1) return available[0];
  return null;
}

export function sortSeriesWorks<T extends {title: string; seriesNumber?: number}>(works: T[]) {
  return works.slice().sort((a, b) =>
    (a.seriesNumber ?? Number.MAX_SAFE_INTEGER) - (b.seriesNumber ?? Number.MAX_SAFE_INTEGER)
    || a.title.localeCompare(b.title, undefined, {numeric: true, sensitivity: 'base'})
  );
}
