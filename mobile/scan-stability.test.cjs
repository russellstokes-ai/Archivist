const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.match(source,/if \(restoring\|\|!localFoldersReady\|\|!localCatalogReady\|\|!localOverridesReady\|\|!offlineWorksReady\|\|!nowSessionReady\)/,'startup must wait for catalogue, offline library and durable Now hydration');
assert.match(source,/showStandaloneEmpty=!base\.length&&!shelfLoading&&!localScanning/,'Shelf must not present an empty final state during a scan');
assert.match(source,/ListEmptyComponent=\{!shelfLoading&&!localScanning\?<LibraryEmptyState\/>:null\}/,'Library must not present an empty final state during a scan');
assert.ok(source.includes('const scanCommitGate=useRef(new ScanCommitGate()).current'),'scan generation gate must be retained');
assert.ok(source.includes('if(!scanCommitGate.isCurrent(generation))return null'),'stale scan results must not commit');
const finalise=source.slice(source.indexOf('async function finaliseLocalScan'),source.indexOf('function scanNotice'));
assert.ok(finalise.indexOf('replaceLocalStageBooks(result.books)')<finalise.indexOf('setStagedLocalBooks(nextBooks)'),'safe discovery baseline must commit to SQLite before it enters the staged UI state');
assert.equal(finalise.includes('setLocalBooks(nextBooks)'),false,'raw discovery results must never publish directly into the Library');
assert.ok(finalise.indexOf('replaceLocalStageBooks(currentBooks)')<finalise.indexOf('publishCompletedLocalStage(currentBooks)'),'fully enriched stage must commit before atomic publication');
assert.ok(source.includes("status:'Ready to prepare'")&&source.includes('setLocalFolders(folders)'),'new folder must appear immediately in setup without starting preparation');
assert.ok(source.includes('setLocalFolderNotice(scanFailureCopy(localBooks.length>0))')&&source.includes("const stagedFolder:LocalFolder={...picked,status:'Ready to prepare'}"),'scan failures must preserve configured sources and explain that existing content remains safe');
assert.ok(source.includes('{LocalScanStatus()}'),'Shelf/Library must expose a stable scan state rather than silently changing underneath the user');
assert.ok(source.includes("setSpaces([...new Set([...result.books.map(book=>book.space),...sources.map(source=>source.space)].filter(Boolean))])"),'local scan must not erase server-space choices');
assert.ok(source.includes('const autoLocalScanAttempted=useRef(false)'),'startup scan recovery must be one-shot');
assert.ok(source.includes("folder.status==='Scanning…'||folder.status==='Ready to scan'"),'interrupted pending folders must be recoverable after restart');
assert.ok(source.includes("autoLocalScanAttempted.current||!pendingFolder")&&source.includes('Only recover an explicitly interrupted legacy scan'),'onboarding folders must never auto-scan; only interrupted legacy scans may resume');
assert.ok(source.includes("setTimeout(()=>setLocalFolderNotice(''),8000)"),'scan completion notice should be visible but not become stale chrome');
assert.ok(source.includes('deferEmbeddedCovers:true')&&source.includes('deferEmbeddedMetadata:true'),'app scans must publish identity before expensive embedded metadata and cover recovery');
assert.ok(source.includes('await enrichPublishedLocalLibrary(result.books,generation,forceOnline)'),'catalogue publication and enrichment must share one cancellable refresh job');
assert.ok(source.includes('setScanProgress(null)')&&source.includes('libraryRefreshRunningRef.current=true'),'foreground discovery must hand off to enrichment without allowing a second refresh to overlap');
assert.ok(source.includes('await enrichPublishedLocalEmbeddedMetadata(currentBooks,generation,forceOnline)'),'enrichment must move embedded archive/audio parsing out of foreground discovery and thread the in-memory catalogue forward');
assert.ok(source.includes('shouldInspect:needsEmbeddedRead')&&source.includes('return true;'),'normal preparation must collect complete embedded details for each new or changed supported file');
assert.ok(source.indexOf('await enrichPublishedLocalBookMetadata(currentBooks,generation,forceOnline)')<source.indexOf('await enrichPublishedLocalCovers(currentBooks,generation)'),'online matching should run before local cover fallback so fast provider matches avoid unnecessary archive reads');
assert.ok(source.includes('await enrichPublishedLocalCovers(currentBooks,generation)'),'library enrichment must recover covers from the latest in-memory metadata state');
assert.ok(source.includes('await enrichPublishedLocalBookMetadata(currentBooks,generation,forceOnline)'),'library enrichment must continue into online book metadata using the latest in-memory state and explicit refresh intent');
assert.ok(source.includes('await enrichPublishedLocalComicMetadata(currentBooks,generation,forceOnline)'),'comic enrichment must run after books against the latest in-memory catalogue and carry explicit refresh intent');
assert.ok(source.includes('SecureStore.getItemAsync(metronTokenKey)'),'Metron credentials must come from secure storage rather than app source or persisted catalogue files');
assert.ok(source.includes('shouldContinue:()=>scanCommitGate.isCurrent(generation)'),'stale enrichment must stop when a newer scan begins');
assert.equal(source.includes('setLocalBooks(current=>applyCoverEnrichment(current,batch))'),false,'cover batch progress must not clone/publish the full catalogue on every batch');
assert.ok(source.includes('reportEnrichmentProgress')&&source.includes('enrichmentProgressClock'),'enrichment progress must be throttled independently of catalogue publication');
assert.ok(source.includes('replaceLocalStageBooks(currentBooks)'),'final enriched catalogue must commit to SQLite after all stages complete');
assert.ok(source.includes('loadLocalStageBooks()')&&source.includes('migrateLegacyLocalStage(legacyBooks)'),'cold start must use SQLite with a one-time legacy catalogue migration');

console.log('PASS: Sprint 5/7 scan/catalogue integration contracts');

assert.ok(source.includes('const [enrichmentProgress,setEnrichmentProgress]'),'background scan phases must have independent non-blocking progress state');
assert.ok(source.includes('scanProgressPercent(activeProgress)')&&source.includes("phase:'covers'")&&source.includes("phase:'online-books'")&&source.includes("phase:'online-comics'"),'progress bar must remain live through metadata, covers and provider enrichment');

assert.ok(source.includes('const activeLibraryProgress=scanProgress||enrichmentProgress'),'Shelf, Library and Settings must share one refresh progress source');
assert.ok(source.includes('accessibilityLabel="Cancel library refresh"')&&source.includes('scanCommitGate.invalidate()'),'library refresh must be cancellable from the shared status surface');
assert.ok(source.includes('disabled={libraryRefreshActive||!localFolders.length}')&&source.includes('{LocalScanStatus()}'),'Settings must show and respect the same active refresh state');
assert.ok(source.includes('shouldContinue:()=>scanCommitGate.isCurrent(generation)'),'foreground discovery and all enrichment stages must stop for a cancelled/stale generation');
assert.equal(source.includes('online enrichment continues in the background.'),false,'manual refresh must not claim completion while unmanaged enrichment is still running');
