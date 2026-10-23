import type {ScannerDatabase} from '../scannerVNext/store';
import type {MetadataWork} from '../scannerVNext/fieldEvidence';

export type RelationMember = {
  assetId: string;
  container: string;
  size: number;
  modified?: number;
};

export type RelationRecord = {
  work: Pick<MetadataWork, 'workId' | 'revision' | 'fields' | 'identityConfirmed' | 'identification'>;
  editionId: string;
  members: RelationMember[];
};

export type ContentFingerprint = {
  assetId: string;
  sha256: string;
  size: number;
  container: string;
  modified?: number;
};

export type LibraryRelation = {
  key: string;
  kind: 'work' | 'duplicate';
  leftWorkId: string;
  rightWorkId: string;
  leftEditionId: string;
  rightEditionId: string;
  leftAssetId?: string;
  rightAssetId?: string;
  evidence: string[];
};

type CataloguePayload = {
  entry?: {
    editionId?: string;
    assets?: {
      assetId: string;
      size?: number;
      modified?: number;
      name?: string;
      disposition?: {container?: string};
    }[];
  };
};

const hashPattern = /^[a-f0-9]{64}$/;
const cleanIdentifier = (value: string) =>
  value.normalize('NFKC').replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
const orderedPair = (a: string, b: string) =>
  a.localeCompare(b) <= 0 ? [a, b] as const : [b, a] as const;

function eligible(record: RelationRecord): boolean {
  const work = record.work;
  return !!work.identityConfirmed
    && ['R1', 'R2'].includes(work.identification?.rung || '')
    && work.identification?.conflicts.length === 0;
}

function strongWorkKeys(record: RelationRecord): string[] {
  const work = record.work;
  const keys: string[] = [];
  // Open Library candidate IDs use /works/ for work records in this provider.
  if (work.identification?.provider === 'open-library'
      && /^\/works\/OL\d+W$/.test(work.identification.candidateId)) {
    keys.push('work:open-library:' + work.identification.candidateId.toUpperCase());
  }
  // R1 means the selected record matched an exact ISBN or ASIN.
  if (work.identification?.rung === 'R1') {
    for (const field of ['isbn', 'asin'] as const) {
      const identifier = work.fields[field];
      if (identifier?.trim()) keys.push('id:' + field + ':' + cleanIdentifier(identifier));
    }
  }
  return [...new Set(keys)];
}

function validateRecord(record: RelationRecord): void {
  if (!record.work?.workId || !record.editionId || !Array.isArray(record.members)
      || record.members.length > 100000) throw Error('Invalid library relation record');
  for (const member of record.members) {
    if (!member.assetId || !member.container || !Number.isSafeInteger(member.size) || member.size < 0) {
      throw Error('Invalid library relation member');
    }
  }
}

export function deriveLibraryRelations(
  records: RelationRecord[],
  fingerprints: ContentFingerprint[] = [],
): LibraryRelation[] {
  if (records.length > 100000) throw Error('Library relation record budget exceeded');
  const workIds = new Set<string>();
  for (const record of records) {
    validateRecord(record);
    if (workIds.has(record.work.workId)) throw Error('Duplicate work relation record');
    workIds.add(record.work.workId);
  }

  const accepted = records.filter(eligible);
  const relations = new Map<string, LibraryRelation>();
  const parent = new Map<string, string>();
  const identity = new Map<string, {
    workKeys: Set<string>;
    isbn: Set<string>;
    asin: Set<string>;
  }>();
  const rootOf = (id: string): string => {
    const prior = parent.get(id);
    if (!prior) { parent.set(id, id); return id; }
    if (prior === id) return id;
    const root = rootOf(prior); parent.set(id, root); return root;
  };
  const summary = (record: RelationRecord) => {
    const work = record.work;
    const workKey = work.identification?.provider === 'open-library'
      && /^\/works\/OL\d+W$/.test(work.identification.candidateId)
      ? work.identification.candidateId.toUpperCase() : undefined;
    return {
      workKeys: new Set(workKey ? [workKey] : []),
      isbn: new Set(work.fields.isbn?.trim() ? [cleanIdentifier(work.fields.isbn)] : []),
      asin: new Set(work.fields.asin?.trim() ? [cleanIdentifier(work.fields.asin)] : []),
    };
  };
  const intersects = (a: Set<string>, b: Set<string>) => [...a].some(value => b.has(value));
  const canMerge = (a: ReturnType<typeof summary>, b: ReturnType<typeof summary>) => {
    const sameWork = intersects(a.workKeys, b.workKeys);
    if (a.workKeys.size && b.workKeys.size && !sameWork) return false;
    if (sameWork) return true;
    return (!a.isbn.size || !b.isbn.size || intersects(a.isbn, b.isbn))
      && (!a.asin.size || !b.asin.size || intersects(a.asin, b.asin));
  };
  const merge = (aId: string, bId: string): boolean => {
    const aRoot = rootOf(aId), bRoot = rootOf(bId);
    if (aRoot === bRoot) return true;
    const a = identity.get(aRoot)!, b = identity.get(bRoot)!;
    if (!canMerge(a, b)) return false;
    parent.set(bRoot, aRoot);
    for (const key of ['workKeys', 'isbn', 'asin'] as const) for (const value of b[key]) a[key].add(value);
    identity.delete(bRoot);
    return true;
  };
  for (const record of accepted) {
    parent.set(record.work.workId, record.work.workId);
    identity.set(record.work.workId, summary(record));
  }

  const byStrongKey = new Map<string, RelationRecord[]>();
  for (const record of accepted) for (const key of strongWorkKeys(record)) {
    const group = byStrongKey.get(key) ?? [];
    group.push(record); byStrongKey.set(key, group);
  }
  const addWorkEdge = (a: RelationRecord, b: RelationRecord, evidence: string) => {
    const leftRoot = rootOf(a.work.workId), rightRoot = rootOf(b.work.workId);
    if (leftRoot !== rightRoot && !merge(a.work.workId, b.work.workId)) return;
    const [left, right] = orderedPair(a.work.workId, b.work.workId);
    const key = 'work:' + left + ':' + right;
    const edge = relations.get(key) ?? {
      key, kind: 'work' as const, leftWorkId: left, rightWorkId: right,
      leftEditionId: left === a.work.workId ? a.editionId : b.editionId,
      rightEditionId: right === a.work.workId ? a.editionId : b.editionId, evidence: [],
    };
    if (!edge.evidence.includes(evidence)) edge.evidence.push(evidence);
    relations.set(key, edge);
  };

  for (const [evidence, group] of [...byStrongKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const partitions = new Map<string, RelationRecord[]>();
    for (const record of group) {
      const workKey = [...summary(record).workKeys][0];
      const signature = workKey || JSON.stringify([
        cleanIdentifier(record.work.fields.isbn || ''), cleanIdentifier(record.work.fields.asin || ''),
      ]);
      const partition = partitions.get(signature) ?? [];
      partition.push(record); partitions.set(signature, partition);
    }
    for (const partition of partitions.values()) {
      partition.sort((a, b) => a.work.workId.localeCompare(b.work.workId));
      const representative = partition[0];
      for (let i = 1; i < partition.length; i++) addWorkEdge(representative, partition[i], evidence);
    }
  }

  const fingerprintsByAsset = new Map<string, ContentFingerprint>();
  for (const fingerprint of fingerprints) {
    if (fingerprint.assetId && hashPattern.test(fingerprint.sha256)
        && Number.isSafeInteger(fingerprint.size) && fingerprint.size >= 0 && fingerprint.container) {
      fingerprintsByAsset.set(fingerprint.assetId, fingerprint);
    }
  }
  const duplicateBuckets = new Map<string, Map<string, {
    record: RelationRecord; member: RelationMember; fingerprint: ContentFingerprint;
  }>>();
  for (const record of accepted) for (const member of record.members) {
    const fingerprint = fingerprintsByAsset.get(member.assetId);
    // Modification time ties a durable hash to the current discovered source revision.
    if (!Number.isSafeInteger(member.modified) || !fingerprint
        || !Number.isSafeInteger(fingerprint.modified)
        || fingerprint.size !== member.size
        || fingerprint.container.toLowerCase() !== member.container.toLowerCase()
        || fingerprint.modified !== member.modified) continue;
    const bucketKey = [fingerprint.sha256, fingerprint.size, fingerprint.container.toLowerCase()].join(':');
    const bucket = duplicateBuckets.get(bucketKey) ?? new Map();
    if (!bucket.has(record.work.workId)) bucket.set(record.work.workId, {record, member, fingerprint});
    duplicateBuckets.set(bucketKey, bucket);
  }
  for (const bucket of duplicateBuckets.values()) {
    const members = [...bucket.values()].sort((a, b) => a.record.work.workId.localeCompare(b.record.work.workId));
    if (members.length < 2) continue;
    const representative = members[0];
    for (let i = 1; i < members.length; i++) {
      const other = members[i];
      const [leftAssetId, rightAssetId] = orderedPair(representative.member.assetId, other.member.assetId);
      const left = leftAssetId === representative.member.assetId ? representative : other;
      const right = rightAssetId === representative.member.assetId ? other : representative;
      const key = 'duplicate:' + leftAssetId + ':' + rightAssetId;
      relations.set(key, {
        key, kind: 'duplicate', leftWorkId: left.record.work.workId,
        rightWorkId: right.record.work.workId, leftEditionId: left.record.editionId,
        rightEditionId: right.record.editionId, leftAssetId, rightAssetId,
        evidence: [
          'sha256:' + representative.fingerprint.sha256,
          'size:' + representative.fingerprint.size,
          'container:' + representative.fingerprint.container.toLowerCase(),
        ],
      });
    }
  }
  return [...relations.values()]
    .map(relation => ({...relation, evidence: relation.evidence.sort()}))
    .sort((a, b) => a.key.localeCompare(b.key));
}
function decodeRows<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length > 100000) throw Error('Invalid library relation rows');
  return parsed as T[];
}

function relationRecordFromCatalogue(catalogueJson: string, metadataJson: string): RelationRecord | null {
  const catalogue = JSON.parse(catalogueJson) as CataloguePayload;
  const entry = catalogue.entry;
  if (!entry?.editionId || !entry.assets?.length) return null;
  const work = JSON.parse(metadataJson) as RelationRecord['work'];
  const members: RelationMember[] = entry.assets.map(asset => ({
    assetId: asset.assetId,
    container: (asset.disposition?.container || asset.name?.split('.').pop() || 'unknown').toLowerCase(),
    size: asset.size ?? -1,
    ...(asset.modified === undefined ? {} : {modified: asset.modified}),
  }));
  return {work, editionId: entry.editionId, members};
}

export async function createLibraryRelationsStore(db: ScannerDatabase) {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS scanner_vnext_content_fingerprints ('
    + 'asset_id TEXT PRIMARY KEY, sha256 TEXT NOT NULL, size INTEGER NOT NULL, '
    + 'container TEXT NOT NULL, modified INTEGER NOT NULL); '
    + 'CREATE TABLE IF NOT EXISTS scanner_vnext_library_relations ('
    + 'relation_key TEXT PRIMARY KEY, kind TEXT NOT NULL, left_work_id TEXT NOT NULL, '
    + 'right_work_id TEXT NOT NULL, left_edition_id TEXT NOT NULL, right_edition_id TEXT NOT NULL, '
    + 'left_asset_id TEXT, right_asset_id TEXT, evidence TEXT NOT NULL);',
  );

  async function loadFingerprints(): Promise<ContentFingerprint[]> {
    const row = await db.getFirstAsync<{rows: string}>(
      'SELECT json_group_array(json_object(\'assetId\',asset_id,\'sha256\',sha256,'
      + '\'size\',size,\'container\',container,\'modified\',modified)) AS rows '
      + 'FROM scanner_vnext_content_fingerprints',
    );
    return decodeRows<ContentFingerprint>(row?.rows);
  }

  async function refresh(records: RelationRecord[]): Promise<LibraryRelation[]> {
    const relations = deriveLibraryRelations(records, await loadFingerprints());
    await db.withExclusiveTransactionAsync(async transaction => {
      await transaction.runAsync('DELETE FROM scanner_vnext_library_relations');
      for (const relation of relations) {
        await transaction.runAsync(
          'INSERT INTO scanner_vnext_library_relations VALUES(?,?,?,?,?,?,?,?,?)',
          relation.key, relation.kind, relation.leftWorkId, relation.rightWorkId,
          relation.leftEditionId, relation.rightEditionId, relation.leftAssetId ?? null,
          relation.rightAssetId ?? null, JSON.stringify(relation.evidence),
        );
      }
    });
    return relations;
  }

  return {
    async captureFingerprint(value: ContentFingerprint): Promise<void> {
      if (!value.assetId || value.assetId.length > 128 || !hashPattern.test(value.sha256)
          || !Number.isSafeInteger(value.size) || value.size < 0 || !value.container
          || value.container.length > 32 || !Number.isSafeInteger(value.modified)) {
        throw Error('Invalid source content fingerprint');
      }
      await db.runAsync(
        'INSERT INTO scanner_vnext_content_fingerprints VALUES(?,?,?,?,?) '
        + 'ON CONFLICT(asset_id) DO UPDATE SET sha256=excluded.sha256,size=excluded.size,'
        + 'container=excluded.container,modified=excluded.modified',
        value.assetId, value.sha256, value.size, value.container.toLowerCase(), value.modified!,
      );
    },

    refresh,

    async refreshFromCatalogue(): Promise<LibraryRelation[]> {
      const row = await db.getFirstAsync<{rows: string}>(
        'SELECT json_group_array(json_object(\'catalogue\',c.payload,\'metadata\',m.payload)) AS rows '
        + 'FROM scanner_vnext_catalogue c JOIN scanner_vnext_metadata m ON m.work_id=c.work_id',
      );
      const items = decodeRows<{catalogue: string; metadata: string}>(row?.rows);
      const records: RelationRecord[] = [];
      for (const item of items) {
        const record = relationRecordFromCatalogue(item.catalogue, item.metadata);
        if (record) records.push(record);
      }
      return refresh(records);
    },

    async list(): Promise<LibraryRelation[]> {
      const row = await db.getFirstAsync<{rows: string}>(
        'SELECT json_group_array(json_object(\'key\',relation_key,\'kind\',kind,'
        + '\'leftWorkId\',left_work_id,\'rightWorkId\',right_work_id,'
        + '\'leftEditionId\',left_edition_id,\'rightEditionId\',right_edition_id,'
        + '\'leftAssetId\',left_asset_id,\'rightAssetId\',right_asset_id,'
        + '\'evidence\',json(evidence))) AS rows FROM scanner_vnext_library_relations',
      );
      return decodeRows<LibraryRelation>(row?.rows);
    },
  };
}
