export type WorkSource = 'local' | 'server' | 'downloaded';
export type LibrarySource = 'all' | WorkSource;

export type SourceIdentityInput = {
  source: WorkSource;
  localKey?: string;
  server?: string;
  serverWorkId?: number;
  space?: string;
  title?: string;
};

export type SourceIdentity = {
  source: WorkSource;
  key: string;
  canonicalKey: string;
  server?: string;
  serverWorkId?: number;
};

type SourceLike = {
  source: WorkSource;
  key: string;
  canonicalKey: string;
  server?: string;
  serverWorkId?: number;
  space?: string;
};

function stableServer(server?: string) {
  return String(server || '').trim().replace(/\/+$/, '').toLowerCase();
}

function stableText(value?: string) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function sourceIdentity(input: SourceIdentityInput): SourceIdentity {
  if (input.source === 'local') {
    const local = input.localKey || [stableText(input.space), stableText(input.title)].filter(Boolean).join(':') || 'unknown';
    return {source: 'local', key: 'local:' + local, canonicalKey: 'local:' + local};
  }
  const server = stableServer(input.server);
  const id = Number(input.serverWorkId) || 0;
  const fallback = [server, stableText(input.space), stableText(input.title)].filter(Boolean).join(':') || 'unknown';
  const canonicalKey = id > 0 ? `server-work:${server}:${id}` : `server-work:${fallback}`;
  return {
    source: input.source,
    key: `${input.source}:${canonicalKey}`,
    canonicalKey,
    server: input.server,
    serverWorkId: input.serverWorkId,
  };
}

export function matchesSource(source: WorkSource, filter: LibrarySource) {
  return filter === 'all' || source === filter;
}

export function sourceLabel(source: WorkSource) {
  if (source === 'local') return 'On this device';
  if (source === 'downloaded') return 'Downloaded';
  return 'Server';
}

export function dedupeForAll<T extends SourceLike>(items: T[]): T[] {
  const selected = new Map<string, T>();
  const order: string[] = [];
  const priority: Record<WorkSource, number> = {local: 1, downloaded: 2, server: 3};
  for (const item of items) {
    const key = item.canonicalKey || item.key;
    const current = selected.get(key);
    if (!current) {
      selected.set(key, item);
      order.push(key);
      continue;
    }
    if (priority[item.source] > priority[current.source]) selected.set(key, item);
  }
  return order.map(key => selected.get(key)!).filter(Boolean);
}

export function spacesForSource<T extends SourceLike>(items: T[], filter: LibrarySource) {
  const visible = filter === 'all' ? dedupeForAll(items) : items.filter(item => matchesSource(item.source, filter));
  return [...new Set(visible.map(item => String(item.space || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function normalizeSpaceSelection<T extends SourceLike>(items: T[], filter: LibrarySource, current: string) {
  if (!current) return '';
  return spacesForSource(items, filter).includes(current) ? current : '';
}
