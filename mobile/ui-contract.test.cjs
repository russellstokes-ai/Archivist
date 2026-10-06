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

assert.ok(source.includes("Archivist will not scan device folders until you press Scan."), 'Onboarding must keep source selection separate from scanning');
assert.ok(source.includes("Add another folder") && source.includes("Connect server"), 'Onboarding must allow multiple folders and optional server connection before scanning');
assert.ok(source.includes("Existing server metadata will be used") && source.includes("The server catalogue is already indexed"), 'Onboarding must keep the connected server catalogue authoritative instead of rescanning it locally');
assert.ok(source.includes("removeUnscannedLocalFolder") && source.includes("Ready to scan"), 'Unscanned source selections must be removable before the scan begins');
assert.ok(source.includes("const pendingFolders=localFolders.filter(folder=>!folder.scannedAt)") && source.includes("const allLocalSourcesScanned=hasFolder&&pendingFolders.length===0"), 'Adding a new folder after an earlier scan must return onboarding to the local scan stage');
assert.ok(source.includes("function RawAssetCard") && source.includes("label={canEdit?'Review':'Open'}"), 'Metadata review must use a clear compact Review action');
assert.ok(source.includes("const work=item.source==='server'?undefined:localWorkForBook(item)"), 'Metadata review must resolve grouped local-work identity instead of showing a raw chapter asset');
assert.ok(source.includes("setEditTitle(work?.title || item.title)"), 'Metadata editing must start from the grouped work title when one is available');
assert.ok(source.includes("const displayTitle=work?.title||item.title||'Unidentified item'") && source.includes("work.files+' files'"), 'Review rows must show grouped work title and multi-file count');
assert.ok(source.includes("setError('');setReviewOnly(true)"), 'Opening metadata review must clear stale transient errors before rendering the review queue');
assert.ok(source.includes("const localReviewBooks=useMemo<Book[]>(()=>allPhoneWorks") && source.includes(".filter(work=>work.needsReview&&work.tracks.length)"), 'Local metadata review must contain grouped works, never raw chapter-file counts');
assert.ok(source.includes('const ReviewList=()=>reviewOnly?<FlatList'), 'Metadata Review must be a vertically scrollable list');
assert.ok(
  source.includes("const stageOneActive=!hasFolder&&!session") &&
  source.includes("const stageTwoActive=hasFolder&&!allLocalSourcesScanned&&!scanBusy") &&
  source.includes("const stageThreeActive=allLocalSourcesScanned&&!scanBusy&&reviewCount>0") &&
  source.includes("const stageFourActive=hasUsableLibrary&&!scanBusy&&!stageTwoActive&&reviewCount===0"),
  'Onboarding must highlight Sources → Scan → Review → Enter Library in sequence',
);
assert.ok(source.includes('>04</Text>') && source.includes('>Enter your library</Text>'), 'Onboarding must include an explicit final library-entry stage');
assert.ok(source.includes('tone="gold"') && source.includes('Add another folder') && source.includes('Connect server'), 'Source choices must remain visually prominent during onboarding');
assert.ok(source.includes('pulseStyle(stageTwoActive)') && source.includes('pulseStyle(stageThreeActive)') && source.includes('pulseStyle(stageFourActive)') && source.includes('reduceMotion'), 'Each next onboarding action must pulse in sequence while respecting Reduced Motion');
assert.ok(source.includes("serverSummary!==null") && source.includes("Loading the existing server catalogue"), 'Server-only onboarding must wait for the existing catalogue to load before completion');
assert.ok(source.includes("Multi-file audiobooks appear here once per book, not once per chapter."), 'Review-stage copy must reinforce work-level review rather than raw-file review');
assert.ok(source.includes("behavior={Platform.OS==='ios'?'padding':'height'}"), 'Android metadata editing must resize stably above the keyboard');
assert.ok(source.includes('metadataModalCard') && source.includes('metadataEditorContent'), 'Metadata editor must scroll internally rather than recenter the whole modal while typing');
assert.ok(source.includes("const siblingPool=editing.format==='Audio'") && source.includes('setMetadataTargetUris(evidenceWork.tracks.map'), 'Deep Scan must regroup likely companion audio files and retain the resolved work membership');
assert.ok(source.includes("deepEvidenceText=`Deep Scan:") && source.includes('deepScanEvidenceSummary'), 'Deep Scan must report concrete evidence instead of silently appearing to succeed');

assert.ok(source.includes("Vibration.vibrate(12)"), 'Local cover long-press must provide haptic feedback');
assert.ok(source.includes(">Edit</Text>") && source.includes(">Delete</Text>"), 'Long-press cover actions must expose direct Edit and Delete controls');
assert.ok(source.includes("Find Better Match") && source.includes("Deep Scan"), 'Metadata editor must expose manual match search and per-book Deep Scan');
assert.ok(source.includes("searchBookMetadata") && source.includes("deepScanLocalTracks"), 'Metadata review actions must be wired to the match engine and per-work deep scan');
assert.ok(source.includes("setEditTitle(evidenceWork.title)") && source.includes("setEditPublisher(evidenceWork.publisher)"), 'Deep Scan evidence must populate the editable fields even when no online candidate is selected');
assert.ok(source.includes("Source files were left untouched"), 'Local Delete confirmation must preserve source files');
assert.ok(source.includes("for(const uri of uris)nextOverrides[uri]=override"), 'Manual metadata edits must persist across every file in a grouped work');

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


// Locked main chrome: five-tab navigation with center Now and premium navy dark canvas.
assert.ok(source.includes("{id:'player',label:'Now',icon:'bookOpen'}"), 'Bottom navigation must keep the centre Now tab');
const tabsBlock=source.slice(source.indexOf("const tabs: Array"),source.indexOf("return (",source.indexOf("const tabs: Array")));
assert.deepEqual(
  [...tabsBlock.matchAll(/label:'([^']+)'/g)].map(match=>match[1]),
  ['Shelf','Library','Now','Atlas','Stats'],
  'Locked bottom navigation order must remain Shelf, Library, Now, Atlas, Stats',
);
assert.ok(source.includes("paper: dark ? '#07111D'"), 'Dark mode must use the locked navy canvas, not pure black');
assert.ok(source.includes("ink: dark ? '#F3F0E8'"), 'Locked dark-mode ivory text changed');
assert.ok(source.includes("muted: dark ? '#A9B4C5'"), 'Locked muted text colour changed');
assert.ok(source.includes("line: dark ? '#26364A'"), 'Locked divider colour changed');
assert.ok(source.includes("card: dark ? '#0B1725'"), 'Locked card colour changed');
assert.ok(source.includes("raised: dark ? '#0E1C2C'"), 'Locked raised-surface colour changed');
assert.ok(source.includes("sage: '#47736F'"), 'Locked teal/sage accent changed');
assert.ok(source.includes("gold: dark ? '#E3BC67'"), 'Locked dark-mode gold accent changed');
assert.equal(source.includes("paper: dark ? '#000000'"),false,'Pure black must not replace the locked navy dark canvas');
assert.ok(
  source.includes("activeTab!=='reader'&&activeTab!=='profile'&&activeTab!=='settings'"),
  'Main bottom navigation must remain visible on Player/Now and Stats',
);

console.log('PASS: no placeholder UI markers and every visible mobile button/tab is wired');

assert.match(source,/\{id:\s*['"]insights['"],\s*label:\s*['"]Stats['"]/, 'Stats tab is not wired');
assert.match(source,/\{id:\s*['"]library['"],\s*label:\s*['"]Library['"]/, 'Library tab is not wired');
assert.ok(source.includes("function Profile()"), 'Profile screen is not implemented');

// Reader Stats visual contract: keep the approved stats destination distinct and data-led.
assert.ok(source.includes(">Reader Stats</Text>"), 'Reader Stats title is missing');
assert.ok(source.includes('CardHeader title="Reading Rhythm"') || source.includes('>Reading Rhythm</Text>'), 'Reader Stats rhythm visual is missing');
assert.ok(source.includes("['Overview','Time','Books','Genres','Formats','Places']"), 'Reader Stats section tabs are missing');
assert.ok(source.includes('statsRhythmDial') && source.includes('statsHeatCell'), 'Reader Stats rhythm ring or activity heatmap is missing');
assert.ok(source.includes("{id:'insights',label:'Stats',icon:'insights'}"), 'Bottom navigation must expose Reader Stats as Stats');
assert.ok(source.includes('Reading Progress') && source.includes('Format Breakdown') && source.includes('Genre Reading Time') && source.includes('Reading Pace') && source.includes('Where You Read') && source.includes('Reading Streaks'), 'Approved Reader Stats dashboard cards are incomplete');

assert.ok(source.includes("function AtlasRelationshipView()"), 'Atlas relationship view is not implemented');

assert.ok(source.includes("function DuplicateReviewPanel()"), 'Duplicate review UI is not implemented');

assert.ok(source.includes("relation.genres || []"), 'Atlas relationship view must tolerate servers from before genre links were added');
assert.ok(source.includes("relation.availability || []"), 'Atlas relationship view must tolerate servers from before availability links were added');

assert.ok(source.includes("const localCatalogKey = 'archivist.localCatalog.v1'"), 'Legacy local catalogue migration key is missing');
assert.ok(source.includes("await loadLocalStage()"), 'Cold start must restore the keyed SQLite local catalogue');
assert.ok(source.includes("getPersistedJSON<Book[]>(localCatalogKey)"), 'Cold start must retain one-time migration from the legacy JSON catalogue');
assert.ok(source.includes("const generation=await beginLocalStageScan()"), 'Successful scans must begin an isolated SQLite staging generation');
assert.ok(source.includes("await stageLocalScanBooks(generation,batch,ordinal)"), 'Successful scans must persist discovered batches incrementally');
assert.ok(source.includes("await commitLocalStageScan(generation,options.replaceSources)"), 'Only a complete scan may atomically commit the staged SQLite generation, optionally scoped to one source');
assert.ok(source.includes("await abandonLocalStageScan(generation)"), 'Interrupted scans must abandon their partial SQLite generation');
assert.equal(source.includes("setPersistedJSON(localCatalogKey, result.books)"),false,'Successful scans must not rewrite the legacy whole-catalogue JSON cache');
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

// Living Book physical-state contract: visibility may stop future scheduling but
// must never reset an in-flight/open physical book.
assert.equal(source.includes('Animated.loop(Animated.sequence(['),false,'Living Book turns must not bypass the physical state machine with an independent Animated.loop');
assert.ok(source.includes("transitionLivingBook({type:'turn-request'})"),'Living Book automatic/manual turns must enter the shared turning phase');
assert.ok(source.includes("transitionLivingBook({type:'turn-complete'})"),'Living Book turns must explicitly enter settling after the sheet lands');
assert.ok(source.includes("transitionLivingBook({type:'settle-complete'})"),'Living Book settling must explicitly resolve back to open/closing');
const visibilityBranch=source.slice(source.indexOf("transitionLivingBook({type:'visibility-change'"),source.indexOf('const allPhoneWorks'));
assert.equal(visibilityBranch.includes("transitionLivingBook({type:'restore',playing:playbackIsPlaying})"),false,'Leaving Now Playing must not restore/reset physical Living Book state');
assert.equal(visibilityBranch.includes('pageTurnAnim.setValue(0);\n      transitionLivingBook({type:\'restore\''),false,'Visibility changes must not snap an in-flight page back to zero');
