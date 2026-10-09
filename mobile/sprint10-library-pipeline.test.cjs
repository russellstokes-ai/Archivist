const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const library=fs.readFileSync(__dirname+'/localLibrary.ts','utf8');
const sync=fs.readFileSync(__dirname+'/metadataSync.ts','utf8');
const stateStore=fs.readFileSync(__dirname+'/stateStore.ts','utf8');
const localStageStoreNative=fs.readFileSync(__dirname+'/localStageStore.native.ts','utf8');

assert.ok(app.includes('const activeLibraryProgress=scanProgress||enrichmentProgress'),'refresh progress must have one shared source');
assert.ok(app.includes('const libraryRefreshRunningRef=useRef(false)'),'refresh must have a synchronous re-entry guard');
assert.ok(app.includes('await scanFreshFolders(localFolders')&&app.includes('signal:controller.signal'),'fresh work stages must remain inside the same cancellable refresh lifetime');
assert.ok(app.includes('{LocalScanStatus()}'),'shared progress surface must be reusable');
assert.ok((app.match(/\{LocalScanStatus\(\)\}/g)||[]).length>=3,'Settings, Shelf and Library must all render the shared refresh status');
assert.ok(app.includes('accessibilityLabel="Cancel library refresh"'),'refresh must expose cancellation');
assert.ok(app.includes('scanCommitGate.invalidate()'),'cancel must invalidate stale work');
assert.equal(app.includes('setLocalBooks(current=>applyCoverEnrichment(current,batch))'),false,'cover progress batches must not republish the full catalogue');
assert.equal(/onBatch:[\s\S]{0,600}setPersistedJSON\(localCatalogKey/.test(app),false,'metadata progress batches must not persist the full catalogue');
assert.ok(app.includes('replaceLocalStageBooks(result.books)')&&app.includes('return replaceLocalStageBooks(books)')&&app.includes('replaceLocalStageBooks(currentBooks)'),'large catalogue persistence must use SQLite for discovery, stage checkpoints and the final enriched commit');
assert.ok((app.match(/checkpointLocalEnrichment\(currentBooks,generation\)/g)||[]).length>=3,'completed enrichment stages must checkpoint so interrupted preparation resumes without throwing away finished work');
assert.ok(app.includes('loadLocalStageBooks()'),'catalogue hydration must come from SQLite while enrichment passes the catalogue in memory');

assert.ok(library.includes('cooperativeYieldFactory'),'scanner must enforce a cooperative UI frame budget');
assert.ok(library.includes('shouldContinue?:()=>boolean'),'foreground discovery must support cancellation');
assert.ok(library.includes('if(!shouldContinue())return;'),'directory traversal must stop for cancelled jobs');
assert.equal(library.includes('review=next.reduce'),false,'embedded metadata must not rescan the whole catalogue after each file');
assert.equal(library.includes('JSON.stringify(patch)'),false,'metadata enrichment must not deep-stringify full records in hot loops');
assert.equal(sync.includes('JSON.stringify(after)'),false,'canonical metadata sync must avoid deep stringify comparisons');
assert.ok(sync.includes('synchronizeLocalMetadataCooperative'),'large canonical metadata synchronization must yield cooperatively');
assert.ok(localStageStoreNative.includes('PRAGMA journal_mode = WAL')&&localStageStoreNative.includes('withExclusiveTransactionAsync')&&localStageStoreNative.includes('local_assets'),'Android/iOS large catalogue persistence must use transactional WAL-backed SQLite rather than one giant JSON payload');

assert.ok(app.includes('ignoreCache:forceRefresh'),'manual refresh must re-query providers without destructively clearing working caches first');
assert.ok(app.includes('concurrency:2'),'online cover caching must remain bounded during an interactive refresh');
assert.equal(app.includes('await clearMetadataCaches(false)'),false,'manual refresh must not erase usable provider caches before a replacement result exists');

console.log('PASS: Test 10 Sprint 1 library refresh is single-job, cancellable, throttled and stage-persistent');
