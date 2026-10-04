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
assert.ok(source.includes('<LocalScanStatus/>'),'Shelf/Library must expose a stable scan state rather than silently changing underneath the user');
assert.ok(source.includes("setSpaces([...new Set([...result.books.map(book=>book.space),...sources.map(source=>source.space)].filter(Boolean))])"),'local scan must not erase server-space choices');
console.log('PASS: Sprint 5 scan/catalogue integration contracts');
