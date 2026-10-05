const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');

const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(pkg.dependencies?.['expo-sqlite'],'~57.0.3','Local catalogue must use the SDK 57 SQLite package.');

const store=fs.readFileSync(path.join(__dirname,'localStageStore.ts'),'utf8');
assert(store.includes('PRAGMA journal_mode = WAL'),'Local catalogue SQLite must use WAL mode.');
assert(store.includes('uri TEXT PRIMARY KEY NOT NULL'),'Local assets must be keyed by stable URI.');
assert(store.includes('fingerprint TEXT PRIMARY KEY NOT NULL'),'Enrichment must be keyed by work fingerprint.');
assert(store.includes('withExclusiveTransactionAsync'),'Catalogue writes must be transactional.');
assert(store.includes('scan_generation'),'Full scans must use a generation marker rather than per-row deletion churn.');
assert(store.includes('CREATE TABLE IF NOT EXISTS local_scan_assets'),'Streaming scans must use an isolated staging table.');
assert(store.includes('beginLocalStageScan'),'Streaming scans must have an explicit generation start.');
assert(store.includes('commitLocalStageScan'),'Streaming scans must commit atomically.');
assert(store.includes('abandonLocalStageScan'),'Interrupted scans must discard only their staging generation.');

const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');
assert.equal(app.includes('setPersistedJSON(localCatalogKey'),false,'Do not rewrite the whole local catalogue JSON during scan/enrichment.');
assert.equal(app.includes('setPersistedJSON(localEnrichmentKey'),false,'Do not rewrite the whole enrichment cache JSON during progress.');
assert(app.includes('beginLocalStageScan()'),'A scan must start an isolated SQLite generation.');
assert(app.includes('stageLocalScanBooks(generation,batch,ordinal)'),'Discovery batches must be persisted incrementally.');
assert(app.includes('commitLocalStageScan(generation)'),'Only a complete scan may replace the committed catalogue.');
assert(app.includes('abandonLocalStageScan(generation)'),'Failed scans must discard their partial generation.');
assert(app.includes('upsertLocalStageBooks(books)'),'Enrichment must checkpoint only changed asset rows.');
assert(app.includes('upsertLocalEnrichmentEntries(entries)'),'Enrichment must checkpoint only changed work rows.');
assert.equal(app.includes('const streamed:LocalBook[]=[]'),false,'Progressive scan UI must not keep a second full-library accumulator.');
assert.equal(app.includes('const snapshot=streamed.map'),false,'Progressive scan UI must not remap the full discovered catalogue repeatedly.');
assert(app.includes('uiPending.length<192||now-lastUiPublish<900'),'Progressive scan UI updates must be batched and throttled.');

const enrichment=fs.readFileSync(path.join(__dirname,'localEnrichment.ts'),'utf8');
assert.equal(
  enrichment.includes('books.filter(book=>originalWork.tracks.some'),
  false,
  'Enrichment must not scan the full catalogue again for every work.',
);
assert(enrichment.includes('indexByUri=new Map<string,number>()'),'Enrichment must index assets once.');
assert(enrichment.includes('applyEntryIndexed'),'Enrichment must update only the current work tracks.');

console.log('PASS: local catalogue persistence and enrichment remain keyed/delta-based');
