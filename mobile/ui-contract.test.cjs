const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('App.tsx','utf8');
const clientSource = ['App.tsx','connection.ts','queue.ts','playback.ts'].map(file => fs.readFileSync(file,'utf8')).join('\n');

for (const banned of ['Coming soon','Not implemented','TODO','FIXME','Genre is currently represented by media format','coverInitials(']) {
  assert.equal(source.includes(banned), false, 'Banned placeholder/dead-state marker found: ' + banned);
}

for (const legacyControl of [">•••</Text>",">⋯</Text>","'Ⅱ'","'▶'",">↑</Text>",">↓</Text>",'label="−"','label="+"','label="A−"','label="A+"']) {
  assert.equal(source.includes(legacyControl), false, 'Legacy text-glyph control found: ' + legacyControl);
}
assert.ok(source.includes("function UiIcon("), 'Drawn native icon component is missing');

for (const match of source.matchAll(/<Button\b[\s\S]*?\/>/g)) {
  assert.match(match[0], /\bonPress\s*=/, 'Button without onPress handler: ' + match[0].slice(0,180));
}

for (const match of source.matchAll(/<Pressable\b[\s\S]*?<\/Pressable>/g)) {
  const block = match[0];
  if (!/accessibilityRole\s*=\s*["'](?:button|tab)["']/.test(block)) continue;
  assert.match(block, /\bonPress\s*=/, 'Interactive Pressable without onPress handler: ' + block.slice(0,220));
}

for (const route of [
  '/api/me','/api/books','/api/works','/api/continue','/api/profile-stats','/api/preferences','/api/duplicate-candidates','/api/sources',
  '/api/file-moves','/api/assets/','/api/queue','/session','/logout','/setup/status'
]) {
  assert.ok(clientSource.includes(route), 'Expected wired mobile route missing from client: ' + route);
}

console.log('PASS: no placeholder UI markers and every visible mobile button/tab is wired');

assert.match(source,/\{id:\s*['"]insights['"],\s*label:\s*['"]Insights['"]/, 'Insights tab is not wired');
assert.match(source,/\{id:\s*['"]library['"],\s*label:\s*['"]Library['"]/, 'Library tab is not wired');
assert.ok(source.includes("function Profile()"), 'Profile screen is not implemented');

assert.ok(source.includes("function AtlasRelationshipView()"), 'Atlas relationship view is not implemented');

assert.ok(source.includes("function DuplicateReviewPanel()"), 'Duplicate review UI is not implemented');

assert.ok(source.includes("relation.genres || []"), 'Atlas relationship view must tolerate servers from before genre links were added');
assert.ok(source.includes("relation.availability || []"), 'Atlas relationship view must tolerate servers from before availability links were added');

assert.ok(source.includes("const localCatalogKey = 'archivist.localCatalog.v1'"), 'Local catalogue cache key is missing');
assert.ok(source.includes("getPersistedJSON<Book[]>(localCatalogKey)"), 'Cold start must restore the cached local catalogue');
assert.ok(source.includes("setPersistedJSON(localCatalogKey, result.books)"), 'Successful scans must refresh the cached local catalogue');
assert.ok(source.includes("!localCatalogReady"), 'Automatic rescan must wait for catalogue restoration before deciding the cache is absent');

assert.ok(source.includes('function LocalSortingPanel()'), 'Local organisation controls should live in a dedicated Settings panel');
assert.match(source,/<LocalSortingPanel\s*\/>/, 'Settings must render the local organisation panel');
const shelfStart=source.indexOf('function Shelf()');
const playerStart=source.indexOf('function Player()');
assert.ok(shelfStart>=0 && playerStart>shelfStart, 'Shelf function bounds are missing');
const shelfSource=source.slice(shelfStart,playerStart);
assert.equal(shelfSource.includes('>Local sorting</Text>'),false,'Technical local sorting controls must not live on the Shelf');

assert.ok(source.includes('function PersonalControls('), 'Personal star/favourite controls are missing');
assert.ok(source.includes("kind=\"reading\""), 'Atlas reading-state relationship is missing');
assert.ok(source.includes("kind=\"rating\""), 'Atlas rating relationship is missing');
assert.ok(source.includes("kind=\"favourite\""), 'Atlas favourite relationship is missing');
assert.match(source,/>\s*FAMILY USERS\s*<\/Text>/i, 'Admin family-user management is missing');
assert.ok(source.includes('User · whole library'), 'Family user UI must use simple whole-library User semantics');
assert.equal(source.includes('Change library access'),false,'Mobile UI must not expose per-library User permissions');
assert.ok(source.includes("profile.admin ?? profile.owner"), 'Mobile must understand new Admin role while remaining compatible with older servers');

assert.ok(source.includes('How was it?'), 'Completion rating prompt is missing');
assert.ok(source.includes('archivist-reader-complete'), 'Server reader completion must bridge back to the mobile rating prompt');
assert.ok(source.includes('serverWorkId?: number'), 'Server work identity must survive into reader/player completion flows');

assert.ok(source.includes('>Offline downloads</Text>'), 'Offline download manager is missing from Settings');
assert.ok(source.includes('Resume download'), 'Interrupted downloads must expose a Resume action');
assert.ok(source.includes('Clean up storage'), 'Offline storage cleanup action is missing');
assert.ok(source.includes('pauseActiveOfflineDownload'), 'Active offline downloads must pause safely when the app backgrounds');
assert.ok(source.includes('initialNumToRender={18}'), 'Library list must bound initial rendering for large libraries');
assert.ok(source.includes('maxToRenderPerBatch={18}'), 'Library list must bound render batches');
assert.equal(source.includes("request(session, serverAssetsPath(0,500))"),false,'Normal Shelf refresh must not fetch 500 raw files');

assert.ok(source.includes('accessibilityActions={[{name:\'increment\',label:\'Forward 30 seconds\'}'), 'Playback timeline must expose screen-reader seek actions');
assert.ok(source.includes('onLayout={event=>setPlayerProgressWidth'), 'Playback timeline must seek using its rendered width');
assert.ok(source.includes('Reader needs attention'), 'Server reader retry state is missing');
assert.ok(source.includes('readerReloadKey'), 'Server reader retry must reload the WebView');
assert.ok(source.includes("message?.type==='archivist-reader-ready'"), 'Server reader ready bridge is missing');
assert.ok(source.includes("reading.format"), 'Reader header must expose the active format');

assert.ok(source.includes('Modal transparent animationType="fade" visible onRequestClose={()=>setRatingPrompt(null)}'), 'Completion rating prompt must be a dismissible native modal');
assert.ok(source.includes("accessibilityViewIsModal accessibilityLabel={'Choose edition for '"), 'Edition picker must expose modal accessibility semantics');
assert.ok(source.includes("KeyboardAvoidingView style={styles.modalKeyboard}"), 'Metadata editor must remain usable with the on-screen keyboard');
assert.ok(source.includes("accessibilityLabel={'Open player for '+playing.title}"), 'Mini player must expose a separate open-player action');
assert.match(source,/accessibilityLabel=\{[\s\S]{0,240}['"]Pause ['"]\+playing\.title[\s\S]{0,120}['"]Play ['"]\+playing\.title/, 'Mini player play/pause must be source-aware and separately labelled');
assert.equal(source.includes('<Pressable accessibilityRole="button" onPress={() => setActiveTab(\'player\')} style={[styles.miniPlayer'),false,'Mini player must not nest a button inside another button');
assert.ok(source.includes('accessibilityLabel="Dismiss error"'), 'Global errors need a dismiss action');
assert.ok(source.includes("label={'Remove download · '+formatBytes(downloaded.bytes)}"), 'Downloaded server work action must clearly say it removes the download');
assert.ok(source.includes('accessibilityState={{selected:theme===mode}}'), 'Theme choices must expose selected state');
assert.ok(source.includes('accessibilityState={{selected:sortTemplate===id}}'), 'Sort layout choices must expose selected state');

assert.ok(source.includes('name="zoomIn"') && source.includes('name="zoomOut"'), 'Atlas zoom must use drawn native controls');
