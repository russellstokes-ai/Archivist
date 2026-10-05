const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.match(source,/if \(restoring\|\|!localFoldersReady\|\|!localCatalogReady\|\|!localOverridesReady\)/,'startup must wait for local catalogue hydration');
assert.match(source,/showStandaloneEmpty=!base\.length&&!shelfLoading&&!localScanning/,'Shelf must not present an empty final state during a scan');
assert.match(source,/ListEmptyComponent=\{!shelfLoading&&!localScanning\?<LibraryEmptyState\/>:null\}/,'Library must not present an empty final state during a scan');
assert.ok(source.includes('const scanCommitGate=useRef(new ScanCommitGate()).current'),'scan generation gate must be retained');
assert.ok(source.includes('if(!scanCommitGate.isCurrent(generation))return null'),'stale scan results must not commit');
const finalise=source.slice(source.indexOf('async function finaliseLocalScan'),source.indexOf('function scanNotice'));
assert.ok(finalise.indexOf('setPersistedJSON(localCatalogKey,result.books)')<finalise.indexOf('setLocalBooks(nextBooks)'),'complete catalogue must persist before it is published to the UI');
assert.ok(source.includes("status:'Scanning…'")&&source.includes('setLocalFolders(folders)'),'new folder must appear immediately in the source list');
assert.ok(source.includes("status:'Scan failed · tap Refresh'")&&source.includes('scanFailureCopy(localBooks.length>0)'),'scan failures must preserve recoverable source state and explain that existing content remains safe');
assert.ok(source.includes('{LocalScanStatus()}'),'Shelf/Library must expose a stable scan state rather than silently changing underneath the user');
assert.ok(source.includes("setSpaces([...new Set([...result.books.map(book=>book.space),...sources.map(source=>source.space)].filter(Boolean))])"),'local scan must not erase server-space choices');
assert.ok(source.includes('const autoLocalScanAttempted=useRef(false)'),'startup scan recovery must be one-shot');
assert.ok(source.includes("folder.status==='Scanning…'||folder.status==='Ready to scan'"),'interrupted pending folders must be recoverable after restart');
assert.ok(source.includes('if(!needsInitialCatalogue&&!pendingFolder)return'),'existing catalogues should only auto-rescan for genuinely pending folders');
assert.ok(source.includes("setTimeout(()=>setLocalFolderNotice(''),8000)"),'scan completion notice should be visible but not become stale chrome');
assert.ok(source.includes('deferEmbeddedCovers:true')&&source.includes('deferEmbeddedMetadata:true'),'app scans must publish identity before expensive embedded metadata and cover recovery');
assert.ok(source.includes('const enrichment=enrichPublishedLocalLibrary(result.books,generation,forceOnline)'),'successful catalogue publication must start the staged enrichment pipeline');
assert.ok(source.includes('void enrichment.catch')&&!source.includes('if(forceOnline)await enrichment'),'explicit and automatic enrichment must release the scan UI and report background failures');
assert.ok(source.includes('await enrichPublishedLocalEmbeddedMetadata(baseBooks,generation,forceOnline)'),'background enrichment must move embedded archive/audio parsing out of the foreground scan');
assert.ok(source.includes('await enrichPublishedLocalCovers(embeddedBooks,generation)'),'background library enrichment must recover covers after embedded metadata');
assert.ok(source.includes('await enrichPublishedLocalBookMetadata(latest,generation)'),'background library enrichment must continue into online book metadata after the latest persisted cover state');
assert.ok(source.includes('await enrichPublishedLocalComicMetadata(Array.isArray(afterBooks)?afterBooks:latest,generation)'),'comic enrichment must run after books against the latest persisted catalogue');
assert.ok(source.includes('SecureStore.getItemAsync(metronTokenKey)'),'Metron credentials must come from secure storage rather than app source or persisted catalogue files');
assert.ok(source.includes('shouldContinue:()=>scanCommitGate.isCurrent(generation)'),'stale enrichment must stop when a newer scan begins');
assert.ok(source.includes('setLocalBooks(current=>applyCoverEnrichment(current,batch))'),'background enrichment must patch the current catalogue rather than replace it');
assert.ok(source.includes('const stored=await getPersistedJSON<LocalBook[]>(localCatalogKey)'),'final enrichment persistence must merge with the latest persisted catalogue so user edits are not rolled back');

console.log('PASS: Sprint 5/7 scan/catalogue integration contracts');

assert.ok(source.includes('const [enrichmentProgress,setEnrichmentProgress]'),'background scan phases must have independent non-blocking progress state');
assert.ok(source.includes('scanProgressPercent(activeProgress)')&&source.includes("phase:'covers'")&&source.includes("phase:'online-books'")&&source.includes("phase:'online-comics'"),'progress bar must remain live through metadata, covers and provider enrichment');
