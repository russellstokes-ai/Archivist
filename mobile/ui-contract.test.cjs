const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('App.tsx','utf8');
const clientSource = ['App.tsx','connection.ts','queue.ts','playback.ts'].map(file => fs.readFileSync(file,'utf8')).join('\n');
const livingBookSource = fs.readFileSync('LivingBookArtwork.tsx','utf8');
const coverManagementSource = fs.readFileSync('coverManagement.ts','utf8');
const lockedFoldStyles = fs.readFileSync('locked-fold-ui.styles.snapshot.txt','utf8');

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
assert.ok(source.includes("liveMode==='player'?Player({embedded:true}):Reader({embedded:true})"), 'Live Player must render directly so routine parent updates do not remount and reset its scroll/panel state');
assert.equal(source.includes("liveMode==='player'?<Player embedded/>"),false,'Live Player must not use a remounting nested component boundary');
assert.ok(source.includes('playerSeekPreview') && source.includes('visualPosition') && source.includes('setPlayerSeekPreview({key,seconds:target})'), 'Live Player seeks must hold an optimistic visual position until the native seek settles');
assert.ok(source.includes('function LiveMediaEmpty(') && source.includes('if(embedded&&!current)return <LiveMediaEmpty mode="player"') && source.includes('if(!reading)return <LiveMediaEmpty mode="reader"') && source.includes("liveMediaEmpty: {flex:1"), 'Embedded Player and Reader empty states must use the identical shared layout');
assert.ok(source.includes("(['player','reader'] as const)") && source.includes("setLiveMode(mode)"), 'Player/Reader live toggle is not functional');
assert.ok(source.includes("setActiveTab('now')") && source.includes("setLiveMode('player')") && source.includes("setLiveMode('reader')"), 'Player and Reader launches must route through the live hub');
assert.ok(source.includes("const lastReadingKey = 'archivist.lastReading.v1'") && source.includes("const lastPlayingKey = 'archivist.lastPlaying.v1'"), 'Recent Player/Reader targets must persist for fast resume');
assert.ok(source.includes("!playing && (reading||lastReading)") && source.includes("playing && !(activeTab==='now'&&liveMode==='player')"), 'Persistent activity bar must prioritise audio and fall back to reading');
assert.ok(source.includes('tabCenterOrb') && source.includes('liveHubSegment'), 'Center live-tab visual treatment is missing');
for(const label of ['Back 30 seconds','Back 15 seconds','Forward 15 seconds','Forward 30 seconds'])assert.ok(source.includes('accessibilityLabel="'+label+'"'),'Missing timed skip '+label);
assert.ok(source.includes("skipAudio('large',-1)") && source.includes("skipAudio('large',1)") && source.includes("skipAudio('small',-1)") && source.includes("skipAudio('small',1)"),'Both skip sizes must work in both directions');
assert.ok(livingBookSource.includes('Math.min(6,Math.round(skipPages))'),'Living Book must allow six leaves for large skips');
assert.ok(source.includes('title={current.title}') && source.includes('cover={(current.coverUri||current.source===\'server\')?Cover({book:current,fill:true}):null}'), 'Living book must use the current title and metadata cover');
assert.ok(livingBookSource.includes('skipPages=3') && livingBookSource.includes('leafCount') && livingBookSource.includes('internalClip') && livingBookSource.includes('coverAngle'), 'Living book must support clean clipped closure and multi-page skip animation');
assert.ok(livingBookSource.includes('const coverAngle=open.interpolate') && livingBookSource.includes('{rotateY:coverAngle}') && livingBookSource.includes('internalOpacity=open.interpolate'), 'Living book open/close transition must use a physical cover hinge with clipped internal reveal');
assert.ok(source.includes('playerVisualPlaying') && source.includes('PLAYER_MOTION_TIMING.pauseGraceMs'), 'Living Book must absorb transient seek/buffer playback flicker before changing motion state');
assert.ok(source.includes('PLAYER_MOTION_TIMING.firstTurnDelayMs') && source.includes('PLAYER_MOTION_TIMING.pageTurnMs') && source.includes('PLAYER_MOTION_TIMING.pageRestMs'), 'Living Book must use the deliberate slow page-turn cadence');
assert.ok(livingBookSource.includes('scaleX:turn.interpolate') && livingBookSource.includes('translateX:turn.interpolate') && livingBookSource.includes("outputRange:['0deg','-78deg','-102deg','-180deg']"), 'Living Book ambient page turn must include a physical curl rather than a flat card flip');
assert.ok(source.includes("const ambientHaloColor=darkMode?'#2F8B86':'#C99A43'") && source.includes("const ambientHaloStrength=darkMode?.95:.48") && source.includes("backgroundColor:darkMode?'#07151C':'#FBFAF7'") && source.includes("color={ambientHaloColor}") && source.includes("strength={ambientHaloStrength}"), 'Every app page must use the theme-aware ambient halo standard');
assert.ok(source.includes("paper: dark ? '#000000' : '#FBFAF7'") && source.includes("highContrast?'#C6B9A5':'#E3DDD2'") && source.includes("gold: dark ? '#B99A68' : '#A67A2F'"), 'Light mode must use the warm ivory and champagne palette while preserving increased contrast');
assert.ok(source.includes("glowColor={ambientHaloColor}") && source.includes("glowStrength={darkMode?.72:.46}") && livingBookSource.includes("glowColor='#2F8B86'"), 'Living Player artwork must inherit the theme-aware halo');
assert.ok(source.includes("<AmbientGlow color={ambientHaloColor} size={Math.max(680,ringSize*1.35)} strength={darkMode?.72:.52}/>"), 'Atlas atmosphere must switch from teal in dark mode to champagne in light mode');

assert.ok(source.includes("(activeTab==='player'||(activeTab==='now'&&liveMode==='player'))"), 'Player motion visibility must include the live hub');
assert.ok(source.includes("(activeTab==='reader'||(activeTab==='now'&&liveMode==='reader'))"), 'Reader activity tracking must include the live hub');

assert.ok(source.includes("function Profile()"), 'Profile screen is not implemented');
assert.ok(source.includes('function Rewards()'), 'Rewards screen is not implemented');
assert.ok(source.includes('function ProfileAvatarButton(') && source.includes('function ProfileMenu()'), 'Persistent profile avatar/menu is missing');
assert.ok(source.includes('profileMenuMounted') && source.includes('profileMenuAnim') && source.includes('openProfileMenu()') && source.includes('closeProfileMenu(') && source.includes('animationType="none"'), 'Profile overlay must expand and contract from the persistent top-right avatar');
assert.ok(source.includes("tone:'#54C6B8'") && source.includes("tone:'#E3BC67'") && source.includes("tone:'#7AA7E8'"), 'Profile, Rewards and Settings overlay actions must have distinct restrained accent colours');
assert.ok(source.includes('profileAvatarHalo') && source.includes('interfacePulse.interpolate'), 'Active profile overlay must use the shared outward fade halo');
assert.ok(source.includes("const profileAvatarKey = 'archivist.profileAvatar.v1'"), 'Custom avatar persistence is missing');
assert.ok(source.includes('async function chooseProfilePhoto()') && source.includes('persistPickedProfilePhoto') && source.includes("label={profileAvatar.photoUri?'Change photo':'Choose photo'}") && source.includes('label="Remove photo"'), 'Profile must support native photo selection and removal');
assert.ok(source.includes("profileAvatar:{initials:profileAvatar.initials,color:profileAvatar.color}") && !source.includes("profileAvatar,\n      insightGoal"), 'Portable backup must not include a device-local avatar photo URI');
assert.ok(source.includes("disabled={busy || !server.trim() || !key.trim()}"), 'Server Connect must require both server address and access key');
assert.ok(source.includes('function PageHeader('), 'Shared standard page header is missing');
assert.ok(source.includes('styles.globalProfileCorner') && source.includes('<ProfileAvatarButton size={42}/>'), 'A single global top-right avatar must persist across app pages');
const stateStoreSource = fs.readFileSync('stateStore.ts','utf8');
assert.ok(stateStoreSource.includes('browserStorageAvailable') && stateStoreSource.includes('writeBrowserValue'), 'Draftbit persistence fallback must avoid unavailable native SecureStore bridges');
assert.ok(source.includes("backgroundColor:'transparent',borderRightColor:p.line") && source.includes("libraryTwoPane: {flex:1,flexDirection:'row',backgroundColor:'transparent'}"), 'Library wide layout must not paint an opaque margin over the global halo');
assert.ok(source.includes("const libraryFolderRailWidth=layoutTier==='fold'?136:160") && source.includes("minWidth:libraryFolderRailWidth,maxWidth:libraryFolderRailWidth,flexBasis:libraryFolderRailWidth,flexGrow:0,flexShrink:0") && source.includes("libraryRail: {width:160,minWidth:160,maxWidth:160,flexBasis:160") && source.includes("libraryRailFold: {width:136,minWidth:136,maxWidth:136,flexBasis:136") && source.includes("libraryMainFold: {paddingLeft:10,paddingRight:24") && source.includes("libraryMainWide: {paddingLeft:12,paddingRight:28"), 'Library folder/source column must be physically constrained and must not stretch from folder content');

assert.ok(source.includes("errorBanner: {position:'absolute'") && source.includes('globalProfileCorner'), 'Error banners must overlay without moving the persistent profile avatar');
assert.ok(source.includes('const LibraryEmptyState=()=>') && source.includes("title='Archivist Server is offline'") && source.includes("title='Your Library is waiting'") && source.includes("title='This folder is empty'") && source.includes("title='No offline downloads'"), 'Library must distinguish empty, offline and filtered states');
assert.ok(source.includes('Clear filters & search') && source.includes('Choose source or folder') && source.includes('Connect Archivist Server'), 'Library empty states must expose useful recovery actions');

assert.equal(source.includes('function PageHeader({title,subtitle,action}'),false,'PageHeader must not place page actions beside the profile avatar');
assert.equal(source.includes('action={<Pressable'),false,'Primary page actions must not sit beside the profile avatar');
assert.ok(source.includes('function PageToolbar('), 'Secondary page controls must move into the standard toolbar below the header');
assert.ok(source.includes("pageHeaderToolbar: {minHeight:44,marginTop:-4,flexDirection:'row',alignItems:'center',justifyContent:'flex-end'}"), 'Page actions must align to the same right content edge rather than float inward beneath the avatar');
assert.ok(source.includes('title="Reader Stats"') && source.includes("(['Day','Week','Month'] as const)") && source.includes("accessibilityLabel={'Show '+label.toLowerCase()+' reading data'}"), 'Stats Day / Week / Month controls must remain compact and separate from the avatar');
assert.ok(source.includes('title="Atlas"') && source.includes("accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'}"), 'Atlas view control must remain available below the title');
assert.ok(source.includes('<UiIcon name="settings" color={p.sage} size={17}/><Text style={[styles.headerActionText,{color:p.sage}]}>Arrange</Text>'), 'Shelf Arrange must use the shared icon + label page-action treatment');
assert.ok(source.includes("<UiIcon name={atlasListMode?'atlas':'list'} color={p.sage} size={17}/><Text style={[styles.headerActionText,{color:p.sage}]}>{atlasListMode?'Universe':'List'}</Text>"), 'Atlas view control must use the same icon + label page-action treatment');

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
assert.ok(statsSource.includes('readerStatsPeriod') && statsSource.includes("(['Day','Week','Month'] as const)") && statsSource.includes('setReaderStatsPeriod(label)'), 'Reader Stats Day / Week / Month controls are not wired');
assert.ok(statsSource.includes('statsPeriodStart') && statsSource.includes("readerStatsPeriod==='Week'") && statsSource.includes("readerStatsPeriod==='Month'") && statsSource.includes('inStatsPeriod(new Date(item.updatedAt*1000))'), 'Reader Stats range filtering is not functional');
assert.ok(statsSource.includes('{timeRhythm}') && !statsSource.includes("readerStatsRhythmMode==='Time'"), 'Reader Stats range controls must change data without changing the approved chart');
assert.equal(statsSource.includes('>{periodLabel}</Text>'),false,'Stats should not display a redundant All time label');
assert.ok(statsSource.includes('statsRhythmDial') && statsSource.includes('statsHeatCell'), 'Reader Stats rhythm ring or heatmap is missing');
assert.ok(statsSource.includes('Reading Progress') && statsSource.includes('Format Breakdown') && statsSource.includes('Genre Reading Time') && statsSource.includes('Reading Pace') && statsSource.includes('Where You Read') && statsSource.includes('Reading Streaks'), 'Reader Stats content is incomplete');
assert.ok(source.includes("activeTab!=='reader'&&activeTab!=='player'?<View style={[styles.tabBar"), 'Reader Stats must retain the standard bottom navigation');
assert.ok(source.includes("'#2F8B86'") && source.includes('AmbientGlow'), 'Reader Stats teal ambient glow is missing');
assert.ok(source.includes("statsDashboardCard: {width:'100%',borderTopWidth"), 'Reader Stats should use open edge-to-edge sections instead of boxed dashboard cards');
assert.ok(statsSource.includes("label:'Longest read'") && statsSource.indexOf("label:'Longest read'")>statsSource.indexOf("label:'Minutes read'"), 'Reader Stats top strip must place Longest read after Minutes read');
assert.ok(statsSource.includes('Average session') && statsSource.includes('Longest session') && statsSource.includes('Most active day') && statsSource.includes('Most active month'), 'Reader Stats reading-habit metrics are incomplete');
assert.ok(statsSource.includes('Completion rate') && statsSource.includes('Series completed') && statsSource.includes('Finishes by month'), 'Reader Stats completion metrics are incomplete');
assert.ok(statsSource.includes('Completion by format') && statsSource.includes('Completion by genre'), 'Reader Stats completion splits are missing');
assert.ok(statsSource.includes('Avg finished rating') && statsSource.includes('Favourites') && statsSource.includes('Annotations') && statsSource.includes('Highlights'), 'Reader Stats taste and notes metrics are incomplete');
assert.ok(statsSource.includes('Reading consistency'), 'Reader Stats consistency metric is missing');
const rhythmIndex=statsSource.indexOf('{rhythmCard}');
const breakdownIndex=statsSource.indexOf('>Reading Breakdown</Text>');
const moreInsightsIndex=statsSource.indexOf('>More Insights</Text>');
assert.ok(rhythmIndex>=0 && breakdownIndex>rhythmIndex && moreInsightsIndex>breakdownIndex, 'Reader Stats chart hierarchy must place doughnut sections below Reading Rhythm and supporting insights below them');
assert.ok(statsSource.includes('const primaryReadingCards=<View style={styles.statsPrimaryReadingStack}>') && statsSource.indexOf('{readingProgressCard}')<statsSource.indexOf('{paceCard}') && source.includes("statsPrimaryReadingStack: {gap:22,alignItems:'stretch'}"), 'Reading Pace must stack directly below Reading Progress with the same left alignment');
assert.ok(statsSource.includes('const breakdownCards=') && statsSource.includes('{formatCard}') && statsSource.includes('{genreCard}') && statsSource.includes('{placesCard}'), 'Reader Stats breakdown grouping is incomplete');
assert.ok(statsSource.includes('const supportingCards=') && statsSource.includes('{streakCard}') && statsSource.includes('{tasteCard}'), 'Reader Stats non-doughnut insight grouping is incomplete');

assert.ok(source.includes("statsScreen: {paddingHorizontal:18") && source.includes('statsScreenFold') && source.includes('statsScreenWide'), 'Reader Stats spacing must align with the app responsive gutters');
assert.ok(source.includes("statsMetricCardWide: {width:'19%'") && source.includes('rowGap:22') && source.includes('minHeight:118'), 'Reader Stats five-metric layout and chart alignment spacing are not locked');
assert.ok(source.includes("shelfContent: {paddingHorizontal:18,paddingTop:10") && source.includes("libraryMain: {flex:1,paddingHorizontal:18,paddingTop:10") && source.includes("atlasScreen: {paddingHorizontal:18,paddingTop:10") && source.includes("settingsScreen: {paddingHorizontal:18,paddingTop:10"), 'Primary page gutters must match the Reader Stats header standard');
assert.ok(source.includes("profileHubScreen: {paddingHorizontal:18,paddingTop:10,paddingBottom:126,gap:20,width:'100%',maxWidth:980") && source.includes("settingsScreen: {paddingHorizontal:18,paddingTop:10,paddingBottom:126,gap:20,maxWidth:980"), 'Profile, Rewards and Settings must share the same responsive page width and vertical rhythm');
const shelfStart=source.indexOf('function Shelf(){');
const shelfEnd=source.indexOf('function Library(){',shelfStart);
assert.ok(shelfStart>=0 && shelfEnd>shelfStart,'Shelf function bounds are missing');
const shelfSource=source.slice(shelfStart,shelfEnd);
assert.equal(source.includes("title:'Browse by format'"),false,'Shelf must not contain the old catalogue-style Browse by format section');
assert.equal(source.includes("title:'From your library'"),false,'Shelf must not duplicate the full Library catalogue');
assert.equal(shelfSource.includes('<SourceSwitcher'),false,'Shelf Browse must not directly filter Shelf by storage source');
assert.equal(shelfSource.includes('<LibrarySwitcher'),false,'Shelf must not expose Library folder/space organisation');
assert.ok(source.includes('const shelfUnifiedWorks=useMemo<UnifiedWork[]>(()=>groupShelfFormats(allUnifiedWorks),[allUnifiedWorks])') && shelfSource.includes('const base:UnifiedWork[]=shelfUnifiedWorks') && source.includes("{id:'favourites',title:'Favourites',visible:true}") && source.includes("{id:'smart',title:'Smart Shelves',visible:true}") && source.includes("{id:'collections',title:'Collections',visible:true}") && source.includes("{id:'series',title:'Series',visible:true}"), 'Shelf must be built from the full personal catalogue, grouping only alternate formats before curated personal sections');
assert.ok(shelfSource.includes('const toggleSeries=(name:string)=>') && shelfSource.includes('accessibilityState={{expanded:false}}') && shelfSource.includes('accessibilityState={{expanded:true}}'), 'Approved Shelf series stacks must expand and collapse in place');
assert.ok(source.includes('function FormatPickerPanel()') && source.includes('obviousShelfFormatChoice(choices,remembered)') && source.includes('label="Choose format"'), 'Approved grouped works must resume an obvious format or expose an explicit format chooser');
assert.ok(shelfSource.includes('Automatic shelves that update from your rules.') && shelfSource.includes("item.id==='collections'") && shelfSource.includes("const relevance=works.reduce"), 'Shelf must retain explained Smart Shelves, Collections and relevance-ranked Series');
assert.ok(shelfSource.includes('>BROWSE LIBRARY</Text>') && shelfSource.includes("label:'Books'") && shelfSource.includes("label:'Comics'") && shelfSource.includes("label:'Audiobooks'") && shelfSource.includes("label:'PDFs'"), 'Shelf Browse must route to Library by content type');
assert.ok(shelfSource.includes('>On this device</Text>') && shelfSource.includes('>On Archivist Server</Text>') && shelfSource.includes('{session?<View style={styles.shelfStorageShortcuts}'), 'Shelf storage shortcuts must appear only for a connected Archivist Server');
assert.ok(source.includes("const shelfServerPromptKey = 'archivist.shelfServerPrompt.v1'") && source.includes('>Use Archivist locally only</Text>') && source.includes('label="Connect to Archivist Server"') && source.includes("const addLocalFolderShortLabel=Platform.OS==='ios'?'Import folder':'Add a folder'") && source.includes("label={libraryRefreshActive?'Refreshing…':addLocalFolderShortLabel}"), 'Fresh Shelf setup must support local folders, server connection and a persistent locally-only choice');
assert.ok(source.includes("type LibraryFormatFamily = ''|'books'|'comics'|'audio'|'pdf'") && source.includes('libraryFormatFamilyMatches'), 'Shelf content shortcuts must use a non-destructive Library content-family filter');
assert.ok(source.includes("import {shelfRecommendations} from './shelfRecommendations'") && shelfSource.includes("title:'Books for you'") && shelfSource.includes("title:'Comics for you'") && shelfSource.includes("title:'Audiobooks for you'"), 'Shelf must expose the three owned-content recommendation rows');
assert.ok(shelfSource.includes('const recommendationLimit=foldLayout?5:3') && shelfSource.includes('From your collection while Archivist learns your taste.') && shelfSource.includes('Based on your reading, ratings and favourites.'), 'Shelf recommendation rows must be capped and distinguish cold-start from personalised ranking');

assert.ok(source.includes('async function removeLocalFolder(folder:LocalFolder)') && source.includes('confirmRemoveLocalFolder(folder)') && source.includes("accessibilityLabel={'Remove local folder '+folder.name}") && source.includes("The original Files/iCloud folder was not changed."), 'Local folder removal must be explicit, accessible and non-destructive');
assert.ok(source.includes('function confirmRemoveSource(source:') && source.includes('The media files on the server are not deleted.') && source.includes("accessibilityLabel={'Remove server folder '+source.space}"), 'Server source removal must be confirmed and explicitly non-destructive');
assert.ok(source.includes('function confirmRemoveServerDownload(downloaded:OfflineServerWork)') && source.includes('The original files on your Archivist Server are not changed.') && source.includes('function confirmDiscardPartialDownload(checkpoint:OfflineDownloadCheckpoint)'), 'Offline removal must be confirmed and explicitly local-only');
assert.ok(source.includes('accessibilityLabel="Search this book"') && source.includes('accessibilityLabel="Note for selected text"'), 'Reader search and note inputs must have explicit spoken labels');
assert.ok(source.includes("{serverNotice?<Text accessibilityLiveRegion=\"polite\"") && source.includes("{localFolderNotice?<Text accessibilityLiveRegion=\"polite\""), 'Server and local-library status updates must be announced politely');
const libraryStart=source.indexOf('function Library(){');
const libraryEnd=source.indexOf('function Player(',libraryStart);
assert.ok(libraryStart>=0 && libraryEnd>libraryStart,'Library function bounds are missing');
const librarySource=source.slice(libraryStart,libraryEnd);
assert.ok(source.includes('function LibrarySourceNavigator(') && source.includes('localFolders.map(folder=>') && source.includes('sources.map(source=>') && source.includes('>OFFLINE DOWNLOADS</Text>')===false, 'Library source navigator must be driven by the configured local and server folder models');
assert.ok(source.includes('label="Offline downloads"') && source.includes('label="On Archivist Server"') && source.includes('label="On this device"'), 'Library source navigator must expose physical storage locations');
assert.ok(source.includes('libraryFolderExact?item.source===sourceFilter:matchesSource(item.source,sourceFilter)') && source.includes('setLibraryFolderExact(exact)'), 'Specific Library folders must use exact source filtering without changing broad On this device semantics');
assert.ok(librarySource.includes('setLibrarySourcesOpen(true)') && librarySource.includes('>SOURCES & FOLDERS</Text>') && librarySource.includes('<LibrarySourceNavigator compact/>'), 'Phone Library must open the shared Sources & folders navigator');
assert.ok(librarySource.includes('style={[styles.libraryFormatScroll,phoneLayout&&styles.libraryFormatScrollPhone]}') && librarySource.includes('contentContainerStyle={[styles.libraryFormatTabs,phoneLayout&&styles.libraryFormatTabsPhone]}'), 'Phone Library format tabs must use the dedicated non-clipping rail');
assert.ok(source.includes("libraryFormatScrollPhone: {height:50,minHeight:50,maxHeight:50,flexShrink:0}") && source.includes("libraryFormatTabsPhone: {height:50,minHeight:50,paddingVertical:3,alignItems:'stretch'}"), 'Phone Library format rail must reserve enough height for 44px tabs and text');
assert.ok(source.includes("const phoneLayout = width < 600") && source.includes("const foldLayout = width >= 600"), 'Phone-only Library tab fix must not apply to Fold layout');
assert.ok(source.includes('return wide?<View style={styles.libraryTwoPane}') && source.includes('<LibrarySourceNavigator/></ScrollView>{main}</View>:main;'), 'Fold/wide Library must use the persistent source/folder rail');
assert.equal(librarySource.includes('<SourceSwitcher/>'),false,'Library must not fall back to the old horizontal source switcher');
assert.equal(librarySource.includes('<LibrarySwitcher/>'),false,'Library must not fall back to the old horizontal space switcher');
assert.ok(source.includes('>LIBRARY & METADATA</Text>') && source.includes('>OFFLINE & STORAGE</Text>') && source.includes('>DATA</Text>') && source.includes('>SERVER & FAMILY</Text>') && source.includes('>ACCESSIBILITY</Text>') && source.includes('>ABOUT ARCHIVIST</Text>'), 'Settings must use exactly the six approved top-level areas');
assert.equal(source.includes('>APPEARANCE</Text>'),false,'Appearance must not return as a seventh Settings area');
assert.ok(source.includes('accessibilityPreferencesKey') && source.includes('saveAccessibilityPreferences') && source.includes('systemReduceMotion||accessibilityPrefs.reduceMotion') && source.includes('highContrast') && source.includes('largeText'), 'Accessibility settings must persist and Reduced Motion must remain the master motion control');
assert.ok(source.includes('createPrivacyBackup()') && source.includes('restorePrivacyBackup()') && source.includes('savePrivacyBackupFile()') && source.includes('restorePrivacyBackupFile()') && source.includes('label="Save backup file"') && source.includes('label="Restore from file"') && source.includes("privacyManualBackupOpen?'Hide manual JSON backup':'Manual JSON backup'") && source.includes('Credentials are never included.'), 'Data must provide native file backup/restore with a manual JSON fallback');
assert.equal(source.includes('>Local-first · private by default</Text>'),false,'Settings must not restore the removed privacy warning card');
assert.equal(source.includes('>External metadata network access</Text>'),false,'Settings must not restore the obsolete metadata-network OFF warning');
assert.equal(source.includes('>Local-first metadata</Text>'),false,'Settings must not restore the redundant local-first metadata explainer');
assert.ok(source.includes('progressionFor') && source.includes('profileProgression') && source.includes('profileAvatarLevelRing') && source.includes('profileAvatarLevelBadge'), 'Persistent profile control must expose Archivist level progression');
assert.ok(source.includes('profileAvatar.photoUri?<Image') && source.includes('profileIdentityAvatarImage') && source.includes('profileMenuAvatarImage'), 'Profile avatar rendering must support a photo URI while retaining initials fallback');
assert.ok(source.includes('>PERSONAL BESTS</Text>') && source.includes('>CURRENT GOALS</Text>') && source.includes("recentAchievementId?'RECENT MILESTONES':'MILESTONE HIGHLIGHTS'") && source.includes('profileTraitRow'), 'Profile must include reading identity traits, personal bests, goals and milestone highlights');
assert.ok(source.includes('>Your progression</Text>') && source.includes("id:'Reading' as const") && source.includes("id:'Listening' as const") && source.includes("id:'Library' as const") && source.includes("id:'Ritual' as const"), 'Rewards must expose the four long-term progression paths');
assert.ok(source.includes('>Milestones</Text>') && source.includes("{level:5,title:'Explorer'") && source.includes("{level:60,title:'Master'"), 'Rewards must retain the long-horizon level milestone journey');
assert.ok(source.includes('>Next up</Text>') && source.includes('>Trophy cabinet</Text>') && source.includes('rewardTrophyGrid') && source.includes('rewardMedal') && source.includes('rewardIcon(item)'), 'Rewards must use the graphical trophy cabinet and next-up hierarchy');
assert.ok(source.includes('recentAchievementId') && source.includes('rewardPulseHalo') && source.includes('>RECENT</Text>') && source.includes('>Recently earned</Text>'), 'Recent rewards must receive a theme-aware outward halo and recent marker');


const atlasStart=source.indexOf('function Atlas()');
const atlasEnd=source.indexOf('async function saveInsightGoals()',atlasStart);
assert.ok(atlasStart>=0 && atlasEnd>atlasStart, 'Atlas function bounds are missing');
const atlasSource=source.slice(atlasStart,atlasEnd);
assert.ok(atlasSource.includes('<AtlasChartRing') && source.includes('atlasChartGroups'), 'Atlas must use three fixed data-backed chart sectors');
assert.ok(atlasSource.includes("selectAtlasBreakdown('Genre')") && atlasSource.includes("selectAtlasBreakdown('Format')") && atlasSource.includes("selectAtlasBreakdown('Published year')"), 'Atlas ring controls must switch the breakdown');
assert.ok(atlasSource.includes('atlasBreakdownAnim') && atlasSource.includes('Animated.View') && atlasSource.includes('translateY'), 'Atlas breakdown transition is missing');
assert.ok(source.includes("useState<'Genre'|'Format'|'Published year'|null>(null)"), 'Atlas breakdown must be hidden on initial open');
assert.ok(atlasSource.includes('{(atlasBreakdown||atlasNodeId)?<Animated.View') && atlasSource.includes('Choose Genre, Format or Year to reveal the library breakdown'), 'Shared Atlas details window must remain hidden until a chart or node is selected');
assert.ok(source.includes('const atlasPulse=useRef(new Animated.Value(0)).current') && source.includes('const atlasPulseLoop=Animated.loop'), 'Atlas selected-state pulse animation is missing');
assert.ok(source.includes('atlasRingControlPulse') && source.includes('atlasSelectedRingPulse'), 'Atlas ring controls and ring chart need selected pulse feedback');
assert.ok(source.includes("outputRange:[.48,0]") && source.includes("outputRange:[1,1.26]") && source.includes("borderColor:'#FF9A92'") && source.includes("borderColor:'#88D7E8'") && source.includes("borderColor:'#C7A6EE'"), 'Atlas selected controls must radiate a brighter colour-matched halo that expands and fades out');
assert.ok(atlasSource.includes('color="#E2736B"') && atlasSource.includes('color="#62AFC1"') && atlasSource.includes('color="#A78BC7"'), 'Atlas Genre, Format and Year controls must retain distinct colours even when not selected');
assert.ok(atlasSource.includes('>Universe Stats</Text>') && atlasSource.includes("label:'Nodes'") && atlasSource.includes("label:'Connections'") && atlasSource.includes("label:'Constellations'") && atlasSource.includes("label:'Bridges'") && atlasSource.includes("label:'Series'") && atlasSource.includes("label:'Collections'") && atlasSource.includes("label:'Authors'") && atlasSource.includes("label:'Genres'"), 'Atlas Universe Stats must expose all eight approved metrics');
assert.ok(source.includes("atlasUniverseStat: {width:'50%',minHeight:92") && source.includes("atlasUniverseStatWide: {width:'25%',minHeight:94") && source.includes("atlasUniverseStatCopy: {fontSize:9,lineHeight:13,marginTop:1,minHeight:26}"), 'Atlas Universe Stats must use the aligned 2-column phone / 4-column wide grid');
assert.ok(atlasSource.includes('Most connected') && atlasSource.includes('Largest constellation') && atlasSource.includes('Deepest series'), 'Atlas Universe Highlights are incomplete');
assert.ok(source.includes('showAtlasPanel(') && atlasSource.includes('atlasNodeId?AtlasInspector():') && source.includes('atlasPanelGeneration'), 'Node details must use the shared rounded panel and reject stale transition callbacks');
assert.ok(source.includes('function atlasSelectNearestNodeAt(') && source.includes('atlasNearest(atlasUniverse.nodes') && source.includes('onResponderRelease={atlasGestureEnd}'), 'Atlas taps must resolve to the nearest visible node instead of overlapping node Pressables');
assert.equal(atlasSource.includes('onPress={()=>selectAtlasNode(node.id)}'),false,'Atlas graph nodes must not own competing overlapping Pressables');
assert.ok(source.includes('atlasInspectorAccent') && source.includes('atlasInspectorMetaChip') && atlasSource.includes('styles.atlasBreakdownSheet'), 'Atlas inspector must retain the approved rounded shared detail-window treatment');
assert.ok(source.includes('atlasBreakdownReveal') && source.includes('maxHeight:atlasBreakdownAnim.interpolate'), 'Atlas breakdown must expand in and push Universe Stats down');
assert.ok(atlasSource.includes('focusAtlasNode(item.node.id)'), 'Atlas Universe Highlights must navigate back into the graph');
assert.ok(atlasSource.includes('bridgeNodeIds') && atlasSource.includes("genres.size>1"), 'Atlas Bridges must represent real cross-genre connectors');

assert.ok(source.includes('opacity:atlasPulse.interpolate') && source.includes('node.id===atlasNodeId') && source.includes("outputRange:[.34,0]") && source.includes("outputRange:[1,1.38]"), 'Atlas selected nodes need an outward fading halo rather than a breathing node animation');

assert.ok(atlasSource.includes('Breakdown of your library') && atlasSource.includes('atlasBreakdownTrack') && atlasSource.includes('atlasBreakdownPercent'), 'Atlas breakdown sheet must match the approved concept');
assert.ok(atlasSource.includes('atlasConstellationStage') && atlasSource.includes('atlasRingControlGenre') && atlasSource.includes('atlasRingControlFormat') && atlasSource.includes('atlasRingControlYear'), 'Atlas ring controls must sit around the constellation');
assert.ok(source.includes("node.kind==='genre'?18") && source.includes("boxShadow:selected?'0px 0px 22px '"), 'Atlas genre hubs must be visually prominent and luminous');
assert.ok(source.includes('<AtlasChartRing') && source.includes('groups={atlasChartGroups}'), 'Atlas ring must use real library distributions');
assert.ok(source.includes("genreColours=[") || fs.readFileSync('LibraryCharts.tsx','utf8').includes("genreColours=["), 'Atlas genre palette is missing');

assert.ok(source.includes("function AtlasRelationshipView()"), 'Atlas relationship view is not implemented');

assert.ok(source.includes("function DuplicateReviewPanel()"), 'Duplicate review UI is not implemented');

assert.ok(source.includes("relation.genres || []"), 'Atlas relationship view must tolerate servers from before genre links were added');
assert.ok(source.includes("relation.availability || []"), 'Atlas relationship view must tolerate servers from before availability links were added');

assert.ok(source.includes("const localCatalogKey = 'archivist.localCatalog.v1'"), 'Local catalogue cache key is missing');
assert.ok(source.includes("getPersistedJSON<Book[]>(localCatalogKey)"), 'Cold start must restore the cached local catalogue');
assert.ok(source.includes("setPersistedJSONArrayCooperative(localCatalogKey,result.books") && source.includes("setPersistedJSONArrayCooperative(localCatalogKey,currentBooks"), 'Successful scans must persist a safe baseline and final enriched local catalogue cooperatively');
assert.ok(source.includes("!localCatalogReady"), 'Automatic rescan must wait for catalogue restoration before deciding the cache is absent');

assert.ok(source.includes('function LibraryManagementPanel()'), 'Library management workspace is missing');
assert.ok(source.includes('Manage Library') && source.includes('SCAN & REPAIR') && source.includes('ADVANCED ORGANISATION'), 'Library management hierarchy is incomplete');
assert.ok(source.includes("const [metadataGapFilter,setMetadataGapFilter]=useState<MetadataGapFilter>('')"), 'Library metadata-gap state is missing');
assert.ok(source.includes('METADATA GAPS') && source.includes('Missing author') && source.includes('Missing series') && source.includes('Missing genre'), 'Library blank-field filters are missing');
assert.ok(source.includes('>NEEDS ATTENTION</Text>') && source.includes("label:'Missing metadata'") && source.includes("label:'Conflicts'") && source.includes("label:'Possible duplicates'") && source.includes("label:'Series order'"), 'Library Needs Attention summary is incomplete');
assert.ok(source.includes("openGap('incomplete')") && source.includes("openGap('conflicts')") && source.includes("openGap('seriesNumber')"), 'Library Needs Attention categories must open actionable maintenance views');
assert.ok(source.includes('accessibilityLabel="Series number"') && source.includes('accessibilityLabel="Narrator"') && source.includes('accessibilityLabel="Publisher"') && source.includes('accessibilityLabel="ISBN"') && source.includes('accessibilityLabel="ASIN"') && source.includes('accessibilityLabel="Language"') && source.includes('accessibilityLabel="Description"'), 'Rich metadata editor fields are incomplete');
assert.ok(source.includes('Manual edits are protected from future rescans.') && source.includes('metadataSource:\'manual\''), 'Metadata editor must expose provenance and preserve manual-edit semantics');
assert.ok(source.includes("import * as ImagePicker from 'expo-image-picker'") && source.includes('Choose image from device'), 'Cover editor must use the system image picker instead of a raw URI-only workflow');
assert.ok(source.includes('Other local artwork') && source.includes('rankLocalCoverCandidates') && source.includes('localCoverCandidates.map'), 'Cover editor must expose ranked local cover alternatives');
assert.ok(source.includes('persistPickedCover(') && coverManagementSource.includes("documentDirectory+'covers/'") && coverManagementSource.includes('persistManualCover('), 'Picked cover artwork must be copied into Archivist app storage before it becomes a manual override');
assert.ok(source.includes('Manual cover · protected from rescans') && source.includes('Use scanned metadata & cover'), 'Manual cover protection and scanned-cover restore controls are missing');
assert.equal(source.includes('requestMediaLibraryPermissionsAsync'),false,'Cover selection must rely on the privacy-preserving system picker and must not request broad photo-library permission');
assert.ok(source.includes("selectionLimit:1") && source.includes('inspectPickedCover(asset.uri,asset.fileSize'), 'Cover picker must remain single-select and verify selected artwork before preview');
assert.ok(coverManagementSource.includes('MAX_MANUAL_COVER_BYTES=25*1024*1024') && coverManagementSource.includes('Saved cover size did not match'), 'Manual-cover persistence must enforce the 25 MB limit and verify the copied file');
assert.ok(source.includes("setEditPickedCover({uri:asset.uri,fileName:asset.fileName,fileSize:inspection.size})") && source.includes("setEditCoverUri(asset.uri)"),'Chosen device artwork must preview immediately before save');
assert.ok(source.includes("const selected=!editPickedCover&&editCoverUri===uri") && source.includes("setEditPickedCover(null);setEditCoverUri(uri)") && coverManagementSource.includes('rankLocalCoverCandidates'), 'Ranked local cover candidates must be selectable without changing the metadata form layout');
assert.ok(source.includes('function BulkMetadataPanel()') && source.includes('>Edit metadata</Text>') && source.includes('accessibilityLabel="Bulk author"') && source.includes('accessibilityLabel="Bulk series"') && source.includes('accessibilityLabel="Bulk genre"'), 'Library selection mode must expose approved bulk metadata editing');
assert.ok(source.includes('Number series sequentially') && source.includes('Numbers follow the works\' current Library order.'), 'Bulk metadata must support sequential series numbering in visible Library order');
assert.ok(source.includes('consolidates selected author-name variants'), 'Bulk author editing must explain author variant consolidation');
assert.ok(source.includes('>POSSIBLE DUPLICATES</Text>') && source.includes('>ALTERNATE FORMATS</Text>') && source.includes('>DIFFERENT EDITIONS</Text>'), 'Duplicate review must distinguish copies, formats and editions');
assert.ok(source.includes('not a deletion candidate') && source.includes('Kept as separate editions under the same logical work.'), 'Format and edition review must not imply destructive duplicate handling');
assert.ok(source.includes('(reviewOnly||!!metadataGapFilter) ? request(session, serverAssetsPath(0,200))'), 'Server raw assets must load only for explicit maintenance views');
assert.ok(source.includes('<MaintenanceList/>') && source.includes('maintenanceMode=reviewOnly||!!metadataGapFilter'), 'Library maintenance results must use editable raw-file rows');
assert.ok(source.includes('Rescan device folders') && source.includes('Add device folder'), 'Library scan controls are missing');
assert.ok(source.includes('scanPhaseLabel(activeProgress.phase)') && source.includes('scanProgressPercent(activeProgress)') && source.includes('>Library updated</Text>'), 'Scan UI must expose phased determinate progress and a compact rescan result summary');
assert.ok(source.includes('Library may be out of date') && source.includes('Some files changed while Archivist was organising your library.') && source.includes('label="Rescan"') && source.includes('label="Not now"'), 'Interrupted local organisation must use the approved simple rescan prompt');
assert.ok(source.includes("setLocalMoveSelection(readyIds)") && source.includes("item.state==='ready'&&selected.has(item.id)") && source.includes('Metadata used · {item.metadataSummary}'), 'Local organisation preview must default-select only Ready items and show current/proposed metadata context');
assert.ok(source.includes("setServerMoveSelection(result.items.flatMap") && source.includes("const ids=serverMoveSelection.slice()"), 'Server organisation Apply must operate only on the explicit preview selection');
assert.ok(source.includes("status=item.state==='ready'?'Ready':item.state==='review'?'Review recommended':item.state==='conflict'?'Conflict':'Already organised'"), 'Organisation preview must use user-facing Ready, Review recommended and Conflict states');
assert.ok(source.includes("label=\"Preview\"") && source.includes("label={'Apply selected'") && source.includes('serverMoveSelection'), 'Library server organisation preview/apply controls are missing');
assert.ok(source.includes('Archivist never removes duplicate candidates automatically.'), 'Duplicate-management safety copy is missing');
assert.ok(source.includes('function LocalSortingPanel()'), 'Local organisation controls should live in a dedicated Settings panel');
assert.match(source,/LocalSortingPanel\(\)/, 'Settings must render the local organisation panel');
assert.equal(shelfSource.includes('>Local sorting</Text>'),false,'Technical local sorting controls must not live on the Shelf');

assert.ok(source.includes('function PersonalControls('), 'Personal star/favourite controls are missing');
assert.ok(source.includes("kind=\"reading\""), 'Atlas reading-state relationship is missing');
assert.ok(source.includes("kind=\"rating\""), 'Atlas rating relationship is missing');
assert.ok(source.includes("kind=\"favourite\""), 'Atlas favourite relationship is missing');
assert.match(source,/>\s*FAMILY USERS\s*<\/Text>/i, 'Admin family-user management is missing');
assert.ok(source.includes('User · whole library'), 'Family user UI must use simple whole-library User semantics');
assert.ok(source.includes('function confirmRotateFamilyUserKey(user:HouseholdUser)') && source.includes("accessibilityLabel={'Reissue access key for '+user.name}") && source.includes('Their current access key and signed-in sessions will stop working immediately.'), 'Family users must support confirmed access-key reissue');
assert.ok(source.includes('function confirmRevokeFamilyUser(user:HouseholdUser)') && source.includes("accessibilityLabel={'Revoke '+user.name}") && source.includes('Their reading history and profile data remain on the server.'), 'Family-user revocation must be confirmed and explain data retention');
assert.ok(source.includes("newUserKeyOwner?'Access key for '+newUserKeyOwner+' — shown once'"), 'One-time family access keys must identify their user');
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

assert.ok(source.includes("Modal transparent animationType={reduceMotion?'none':'fade'} visible onRequestClose={()=>setRatingPrompt(null)}"), 'Completion rating prompt must be dismissible and respect Reduced Motion');
assert.ok(source.includes("accessibilityViewIsModal={true} accessibilityLabel={'Choose format or edition for '"), 'Format / edition picker must expose modal accessibility semantics');
assert.ok(source.includes("accessibilityViewIsModal={true} accessibilityLabel={'Choose format for '+work.title}"), 'Grouped Shelf format picker must expose modal accessibility semantics');
assert.ok(source.includes("KeyboardAvoidingView style={styles.modalKeyboard}"), 'Metadata editor must remain usable with the on-screen keyboard');
assert.ok(source.includes("accessibilityLabel={'Open player for '+playing.title}"), 'Mini player must expose a separate open-player action');
assert.match(source,/accessibilityLabel=\{[\s\S]{0,240}['"]Pause ['"]\+playing\.title[\s\S]{0,120}['"]Play ['"]\+playing\.title/, 'Mini player play/pause must be source-aware and separately labelled');
assert.equal(source.includes('<Pressable accessibilityRole="button" onPress={() => setActiveTab(\'player\')} style={[styles.miniPlayer'),false,'Mini player must not nest a button inside another button');
assert.ok(source.includes('accessibilityLabel="Dismiss error"'), 'Global errors need a dismiss action');
assert.ok(source.includes("label={'Remove download · '+formatBytes(downloaded.bytes)}"), 'Downloaded server work action must clearly say it removes the download');
assert.ok(source.includes('accessibilityState={{selected:theme===mode}}'), 'Theme choices must expose selected state');
assert.ok(source.includes('accessibilityState={{selected:sortTemplate===id}}'), 'Sort layout choices must expose selected state');

assert.ok(source.includes('name="zoomIn"') && source.includes('name="zoomOut"'), 'Atlas zoom must use drawn native controls');

/* Locked-appearance polish contract: behaviour may improve, approved default geometry/style may not drift. */
assert.equal(source.includes('Android-first'),false,'Production UI must not describe Archivist as Android-first');
assert.equal(source.includes('Expo Go'),false,'Production UI must not expose Expo Go implementation wording');
assert.ok(source.includes('Private media library · iOS and Android'),'About Archivist must present the universal iOS/Android product');
assert.equal(source.includes('animationType="slide"'),false,'Native slide modals must not bypass Reduced Motion');
assert.equal(source.includes('animationType="fade"'),false,'Native fade modals must not bypass Reduced Motion');
assert.ok(source.includes("animationType={reduceMotion?'none':foldLayout?'fade':'slide'}"),'Sheet transitions must respect Reduced Motion and avoid bottom-slide motion on Fold');
assert.ok(source.includes("animationType={reduceMotion?'none':'fade'}"),'Fade overlays must respect Reduced Motion');
assert.ok(source.includes('const liveModeTransition=useRef(new Animated.Value(1)).current') && source.includes('opacity:liveModeTransition'),'Player/Reader switching must use the approved in-place transition');
assert.ok(source.includes('const shelfSkeletonPulse=useRef(new Animated.Value(.45)).current') && source.includes('reduceMotion ? .45 : shelfSkeletonPulse'),'Shelf loading motion must respect Reduced Motion');
assert.ok(source.includes('atlasTransformGeneration') && source.includes('scheduleAtlasTransform('),'Atlas gestures must coalesce updates and cancel superseded transform animations');
assert.ok(source.includes("line:accessibilityPrefs.highContrast?") && source.includes("muted:accessibilityPrefs.highContrast?"),'Reader Stats must respect Increased Contrast without changing the default palette');
assert.ok(source.includes('hitSlop={4} onPress={dismissAtlasNode}') && source.includes("accessibilityLabel={'Resume '+(reading||lastReading)!.title} hitSlop={4}"),'Small visible controls must retain enlarged invisible touch targets');
for(const match of source.matchAll(/<Pressable\b[\s\S]*?>/g)){
  const tag=match[0];
  assert.ok(/accessibilityRole=/.test(tag)||/accessible=\{false\}/.test(tag),'Pressable missing accessibility semantics: '+tag.replace(/\s+/g,' ').slice(0,220));
}
assert.ok(source.includes("top:safeArea.top+(phoneLayout?8:10)") && source.includes("top:safeArea.top+56"),'Profile avatar and menu must respect the device status-bar safe area');
assert.ok(source.includes("else if(atlasNodeId||atlasBreakdown)dismissAtlasNode()"),'Atlas background taps must clear selection and restore the universe');
assert.ok(source.includes("const MaintenanceList=()=>maintenanceMode?<FlatList") && source.includes("initialNumToRender={12}") && source.includes("maintenanceAssetStatusRowPhone"),'Needs-attention must use the compact virtualised mobile maintenance layout');
assert.ok(source.includes("const modalSheetBackdrop=[styles.sheetBackdrop") && source.includes("paddingBottom:Math.max(12,safeArea.bottom+8)"),'Bottom sheets must respect the device bottom safe area');
assert.ok(source.includes("function DismissSheetHandle") && source.includes("shouldCaptureSheetDismiss") && source.includes("shouldDismissSheet"),'Dismissible sheets must use the tested swipe-down interaction contract');
assert.ok(source.includes("actionSheetStable: {height:'76%',minHeight:360,maxHeight:680,overflow:'hidden'}"),'Dynamic mobile sheets must use a stable detent rather than jump as content changes');
assert.ok(source.includes('accessibilityLabel="Close format or edition picker"') && source.includes('accessibilityLabel="Close format picker"'),'Format pickers must dismiss by tapping the scrim as well as Android Back');
assert.ok(source.includes('accessibilityLabel="Player options" style={[styles.actionSheet,styles.actionSheetStable') && source.includes("<DismissSheetHandle onDismiss={()=>setPlayerPanel(null)}"),'Player options must use the standard stable dismissible sheet');
assert.ok(source.includes('>AUDIO FILES</Text>') && source.includes("((serverPlayer?playback?.tracks:activeLocalWork?.tracks)?.length||0)>0"),'More must show useful audiobook structure even for a single-file audiobook');
assert.ok(source.includes("Alert.alert('Discard changes?'") && source.includes("Alert.alert('Discard bulk changes?'"),'Editable metadata modals must protect unsaved work when dismissed');
assert.ok(source.includes("const libraryFolderRailWidth=layoutTier==='fold'?136:160"),'Approved Library folder rail width fix regressed');
assert.ok(source.includes("shelfContent: {paddingHorizontal:18,paddingTop:10") && source.includes("libraryMain: {flex:1,paddingHorizontal:18,paddingTop:10") && source.includes("atlasScreen: {paddingHorizontal:18,paddingTop:10") && source.includes("settingsScreen: {paddingHorizontal:18,paddingTop:10"),'Locked primary-page geometry changed');
const lockedStylesStart=source.indexOf('const styles = StyleSheet.create({');
assert.ok(lockedStylesStart>=0,'StyleSheet block missing');
const lockedFoldStyleNames=[
  'libraryMainFold','shelfContentFold','shelfHeroFold','shelfHeroArtworkFold',
  'playerScreenFold','playerAdaptiveWide','atlasScreenFold','statsScreenFold',
  'profileHubScreenFold','settingsScreenFold','sheetBackdropFold','actionSheetFold','workDetailsHeroFold'
];
const styleEntry=(text,name)=>{
  const line=text.split('\n').find(item=>item.trimStart().startsWith(name+': {'));
  return line?.trim()||'';
};
for(const name of lockedFoldStyleNames){
  assert.equal(styleEntry(source,name),styleEntry(lockedFoldStyles,name),'Universal-phone work changed locked Fold style '+name);
}
assert.ok(source.includes("const phoneLayout = width < 600") && source.includes("const narrowPhone = width < 360"),'Universal-phone breakpoints are missing');
for(const styleName of [
  'shelfContentPhone','shelfHeroPhone','libraryMainPhone','playerScreenPhone','atlasScreenPhone',
  'statsScreenPhone','profileHubScreenPhone','settingsScreenPhone','tabBarPhone','standardPageHeaderPhone'
]){
  assert.ok(source.includes(styleName+': {'),'Universal-phone responsive style missing: '+styleName);
}
assert.ok(source.includes('phoneLayout&&styles.shelfContentPhone') && source.includes('phoneLayout&&styles.libraryMainPhone'),'Shelf and Library phone composition must use the universal-phone overrides');
assert.ok(source.includes('phoneLayout&&styles.playerScreenPhone') && source.includes('phoneLayout&&styles.atlasScreenPhone') && source.includes('phoneLayout&&styles.statsScreenPhone'),'Player, Atlas and Stats must use phone overrides');
assert.ok(source.includes('phoneLayout&&styles.profileHubScreenPhone') && source.includes('phoneLayout&&styles.settingsScreenPhone'),'Profile/Rewards and Settings must use phone overrides');
assert.ok(source.includes('phoneLayout&&styles.tabBarPhone') && source.includes('phoneLayout&&styles.standardPageHeaderPhone'),'Global navigation and headers must adapt below 600dp');
assert.ok(source.includes("settingsColumnPhone: {flexGrow:0,flexShrink:0,flexBasis:'auto',width:'100%'}"),'Stacked phone Settings columns must keep content height');
assert.equal((source.match(/styles.settingsColumn,phoneLayout&&styles.settingsColumnPhone/g)||[]).length,2,'Both Settings columns need the phone-only overlap fix');
for(const name of ['atlasUniverseStatPhone','statsDetailMetricPhone','profileSnapshotItemPhone','profileBestCardPhone'])assert.ok(source.includes('phoneLayout&&styles.'+name),'Missing phone-only centred metrics: '+name);



{
  const organisationSource=source;
  assert.ok(organisationSource.includes('previewLocalSortSafely'),'Local organisation must preflight destinations before selection');
  assert.ok(organisationSource.includes('Select all Ready'),'Local organisation preview must expose Select all Ready');
  assert.ok(organisationSource.includes('Clear selection'),'Organisation preview must expose Clear selection');
  assert.ok(organisationSource.includes('Review recommended'),'Organisation preview must distinguish Review recommended');
  assert.ok(organisationSource.includes('Already organised'),'Organisation preview must distinguish Already organised');
  assert.ok(organisationSource.includes("item.state==='ready'&&selected.has(item.id)"),'Local Apply must filter to explicitly selected Ready items');
  assert.ok(organisationSource.includes("state==='ready'&&!!move"),'Server preview rows must only enable Ready moves');
}
