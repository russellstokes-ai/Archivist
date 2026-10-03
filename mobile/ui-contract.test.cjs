const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('App.tsx','utf8');
const clientSource = ['App.tsx','connection.ts','queue.ts','playback.ts'].map(file => fs.readFileSync(file,'utf8')).join('\n');
const livingBookSource = fs.readFileSync('LivingBookArtwork.tsx','utf8');

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

assert.match(source,/\{id:\s*['"]insights['"],\s*label:\s*['"]Stats['"]/, 'Stats tab is not wired');
assert.match(source,/\{id:\s*['"]library['"],\s*label:\s*['"]Library['"]/, 'Library tab is not wired');
assert.match(source,/\{id:\s*['"]now['"],\s*label:\s*['"]Now['"]/, 'Center Player/Reader live tab is not wired');
assert.ok(source.includes('function LiveHub()'), 'Player/Reader live hub is missing');
assert.ok(source.includes("(['player','reader'] as const)") && source.includes("setLiveMode(mode)"), 'Player/Reader live toggle is not functional');
assert.ok(source.includes("setActiveTab('now')") && source.includes("setLiveMode('player')") && source.includes("setLiveMode('reader')"), 'Player and Reader launches must route through the live hub');
assert.ok(source.includes("const lastReadingKey = 'archivist.lastReading.v1'") && source.includes("const lastPlayingKey = 'archivist.lastPlaying.v1'"), 'Recent Player/Reader targets must persist for fast resume');
assert.ok(source.includes("!playing && (reading||lastReading)") && source.includes("playing && !(activeTab==='now'&&liveMode==='player')"), 'Persistent activity bar must prioritise audio and fall back to reading');
assert.ok(source.includes('tabCenterOrb') && source.includes('liveHubSegment'), 'Center live-tab visual treatment is missing');
assert.ok(source.includes('name="trackBack"') && source.includes('name="trackForward"') && source.includes('Back 15 seconds') && source.includes('Forward 30 seconds'), 'Approved Live Player transport must expose chapter/fallback controls around 15s back and 30s forward');
assert.ok(source.includes('function jumpChapter(direction:-1|1)') && source.includes('turnPages(5,direction)'), 'Large Live Player jumps must animate five pages');
assert.ok(source.includes('turnPages(3,-1)') && source.includes('turnPages(3,1)'), 'Short Live Player skips must animate three pages');
assert.ok(source.includes('title={current.title}') && source.includes('cover={(current.coverUri||current.source===\'server\')?<Cover book={current} fill/>:null}'), 'Living book must use the current title and metadata cover');
assert.ok(livingBookSource.includes('skipPages=3') && livingBookSource.includes('leafCount') && livingBookSource.includes('closedCover'), 'Living book must support smooth closed-cover and multi-page skip animation');
assert.ok(livingBookSource.includes('opacity:open.interpolate') && livingBookSource.includes("rotateY:open.interpolate"), 'Living book open/close transition is missing');
assert.ok(source.includes("backgroundColor:p.paper==='#000000'?'#07151C':'#F5F8F7'") && source.includes("color={p.paper==='#000000'?'#2F8B86':'#9BCFCB'}") && source.includes("size={Math.max(1500,width*2.2)}") && source.includes("strength={p.paper==='#000000'?.95:.34}"), 'Every app page must use the Reader Stats teal halo standard');

assert.ok(source.includes("(activeTab==='player'||(activeTab==='now'&&liveMode==='player'))"), 'Player motion visibility must include the live hub');
assert.ok(source.includes("(activeTab==='reader'||(activeTab==='now'&&liveMode==='reader'))"), 'Reader activity tracking must include the live hub');

assert.ok(source.includes("function Profile()"), 'Profile screen is not implemented');
assert.ok(source.includes('function Rewards()'), 'Rewards screen is not implemented');
assert.ok(source.includes('function ProfileAvatarButton(') && source.includes('function ProfileMenu()'), 'Persistent profile avatar/menu is missing');
assert.ok(source.includes("const profileAvatarKey = 'archivist.profileAvatar.v1'"), 'Custom avatar persistence is missing');
assert.ok(source.includes('function PageHeader('), 'Shared standard page header is missing');
assert.ok(source.includes('styles.globalProfileCorner') && source.includes('<ProfileAvatarButton size={42}/>'), 'A single global top-right avatar must persist across app pages');
const stateStoreSource = fs.readFileSync('stateStore.ts','utf8');
assert.ok(stateStoreSource.includes('browserStorageAvailable') && stateStoreSource.includes('writeBrowserValue'), 'Draftbit persistence fallback must avoid unavailable native SecureStore bridges');
assert.ok(source.includes("backgroundColor:'transparent',borderRightColor:p.line") && source.includes("libraryTwoPane: {flex:1,flexDirection:'row',backgroundColor:'transparent'}"), 'Library wide layout must not paint an opaque margin over the global halo');
assert.ok(source.includes("errorBanner: {position:'absolute'") && source.includes('globalProfileCorner'), 'Error banners must overlay without moving the persistent profile avatar');

assert.equal(source.includes('function PageHeader({title,subtitle,action}'),false,'PageHeader must not place page actions beside the profile avatar');
assert.equal(source.includes('action={<Pressable'),false,'Primary page actions must not sit beside the profile avatar');
assert.ok(source.includes('function PageToolbar('), 'Secondary page controls must move into the standard toolbar below the header');
assert.ok(source.includes('title="Reader Stats"') && source.includes('<PageToolbar>') && source.includes('Statistics period '), 'Stats period control must sit below the title, away from the avatar');
assert.ok(source.includes('title="Atlas"') && source.includes("accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'}"), 'Atlas view control must remain available below the title');

for (const title of ['Shelf','Library','Atlas','Reader Stats','Profile','Rewards','Settings']) {
  assert.ok(source.includes('title="'+title+'"'), 'Standard page title missing: '+title);
}
assert.equal(source.includes("style={styles.logoSmall}>Archivist</Text>"),false,'Generic Archivist chrome should not replace page-specific titles');


const statsStart=source.indexOf('function Insights(){');
const statsEnd=source.indexOf('function Profile()',statsStart);
assert.ok(statsStart>=0 && statsEnd>statsStart, 'Reader Stats function bounds are missing');
const statsSource=source.slice(statsStart,statsEnd);
assert.ok(statsSource.includes('title="Reader Stats"') && statsSource.includes('subtitle="Your reading journey."'), 'Reader Stats standard title or subtitle is missing');
assert.equal(statsSource.includes("['Overview','Time','Books','Genres','Formats','Places']"),false,'Reader Stats should not expose redundant top section filters');
assert.ok(statsSource.includes('readerStatsRhythmMode') && statsSource.includes("['Time','Day','Month']"), 'Reader Stats rhythm modes are not wired');
assert.ok(statsSource.includes('cycleStatsPeriod') && statsSource.includes('readerStatsYear'), 'Reader Stats period selector is not functional');
assert.ok(statsSource.includes('statsRhythmDial') && statsSource.includes('statsHeatCell'), 'Reader Stats rhythm ring or heatmap is missing');
assert.ok(statsSource.includes('Reading Progress') && statsSource.includes('Format Breakdown') && statsSource.includes('Genre Reading Time') && statsSource.includes('Reading Pace') && statsSource.includes('Where You Read') && statsSource.includes('Reading Streaks'), 'Reader Stats content is incomplete');
assert.ok(source.includes("activeTab!=='reader'&&activeTab!=='player'?<View style={[styles.tabBar"), 'Reader Stats must retain the standard bottom navigation');
assert.ok(source.includes("'#2F8B86'") && source.includes('AmbientGlow'), 'Reader Stats teal ambient glow is missing');
assert.ok(source.includes("statsDashboardCard: {width:'100%',borderTopWidth"), 'Reader Stats should use open edge-to-edge sections instead of boxed dashboard cards');
assert.ok(statsSource.includes('Average session') && statsSource.includes('Longest session') && statsSource.includes('Most active day') && statsSource.includes('Most active month'), 'Reader Stats reading-habit metrics are incomplete');
assert.ok(statsSource.includes('Completion rate') && statsSource.includes('Series completed') && statsSource.includes('Finishes by month'), 'Reader Stats completion metrics are incomplete');
assert.ok(statsSource.includes('Completion by format') && statsSource.includes('Completion by genre'), 'Reader Stats completion splits are missing');
assert.ok(statsSource.includes('Avg finished rating') && statsSource.includes('Favourites') && statsSource.includes('Annotations') && statsSource.includes('Highlights'), 'Reader Stats taste and notes metrics are incomplete');
assert.ok(statsSource.includes('Reading consistency'), 'Reader Stats consistency metric is missing');
assert.ok(source.includes("statsScreen: {paddingHorizontal:18") && source.includes('statsScreenFold') && source.includes('statsScreenWide'), 'Reader Stats spacing must align with the app responsive gutters');
assert.ok(source.includes("shelfContent: {paddingHorizontal:18,paddingTop:10") && source.includes("libraryMain: {flex:1,paddingHorizontal:18,paddingTop:10") && source.includes("atlasScreen: {paddingHorizontal:18,paddingTop:10") && source.includes("settingsScreen: {paddingHorizontal:18,paddingTop:10"), 'Primary page gutters must match the Reader Stats header standard');


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
const playerStart=source.indexOf('function Player(');
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
