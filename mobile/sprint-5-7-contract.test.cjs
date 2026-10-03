const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('App.tsx','utf8');
const localLibrary=fs.readFileSync('localLibrary.ts','utf8');
const localWorks=fs.readFileSync('localWorks.ts','utf8');
const config=JSON.parse(fs.readFileSync('app.json','utf8'));

assert.ok(source.includes('function WorkDetailsPanel()'),'Sprint 5 work-details sheet is missing');
assert.ok(source.includes('>WORK DETAILS</Text>') && source.includes('Edit metadata & cover') && source.includes('Refresh metadata & cover'),'Sprint 5 work-details actions are incomplete');
assert.ok(source.includes('local.tracks.map(track=>track.uri)'),'Grouped local work edits must target every track');
assert.ok(source.includes('Cover image URI (optional)') && source.includes('Use scanned metadata & cover') && source.includes('Publication year'),'Sprint 5 metadata/cover editor is incomplete');
assert.ok(source.includes('Manual override') && source.includes('Sidecar metadata') && source.includes('Filename / folder scan'),'Work details must expose metadata provenance');
assert.ok(localLibrary.includes('coverUri?: string;') && localLibrary.includes('override?.coverUri?.trim() || discoveredCoverUri'),'Manual local cover overrides must survive rescans');
assert.ok(localWorks.includes("first.metadataSource!=='manual'"),'Manual audiobook titles must override folder-derived work titles');

assert.ok(source.includes('function ArchivistLogo(') && source.includes("require('./assets/icon.png')"),'Canonical in-app Archivist logo component is missing');
assert.equal(/styles\.emptyMark[\s\S]{0,80}>A<\/Text>/.test(source),false,'Generic A empty-state branding remains');
assert.equal(/styles\.coverFallbackMark[\s\S]{0,80}>A<\/Text>/.test(source),false,'Generic A fallback-cover branding remains');
assert.equal(config.expo.icon,'./assets/icon.png','App icon must use the canonical logo');
const splashPlugin=(config.expo.plugins||[]).find(item=>Array.isArray(item)&&item[0]==='expo-splash-screen');
assert.ok(splashPlugin,'Expo splash-screen config plugin is missing');
assert.equal(splashPlugin[1]?.image,'./assets/icon.png','Splash must use the canonical logo');
assert.equal(splashPlugin[1]?.resizeMode,'contain','Splash must preserve logo proportions');
assert.equal(splashPlugin[1]?.dark?.image,'./assets/icon.png','Dark splash must use the canonical logo');
assert.equal(config.expo.android?.adaptiveIcon?.foregroundImage,'./assets/icon.png','Android adaptive icon must use the canonical logo');
assert.ok(fs.existsSync('assets/icon.png'),'Canonical icon asset is missing');
assert.ok(source.includes("import * as SplashScreen from 'expo-splash-screen'"),'Native splash handoff controller is missing');
assert.ok(source.includes("SplashScreen.preventAutoHideAsync()") && source.includes("SplashScreen.setOptions({duration:350,fade:true})"),'Native splash must remain visible until Archivist is ready and fade into the app');
assert.ok(source.includes("SplashScreen.hideAsync()") && source.includes("nativeSplashEnabled?null"),'Native launch must avoid showing the fallback wordmark before fonts are ready');


for(const page of ['Shelf','Library','LiveHub','Atlas','Insights','Profile','Rewards','Settings']){
  assert.match(source,new RegExp('function\\s+'+page+'\\s*\\(.*?\\)\\s*\\{'),'Integrated QA page missing: '+page);
}
assert.ok(source.includes("const foldLayout=width>=600") || source.includes("const foldLayout = width>=600") || source.includes("const foldLayout = width >= 600"),'Fold responsive breakpoint is missing');
assert.ok(source.includes('shelfContentFold') && source.includes('libraryMainFold') && source.includes('playerScreenFold') && source.includes('atlasScreenFold'),'Core Fold responsive styles are incomplete');
assert.ok(source.includes("useColorScheme()") && (source.includes("theme === 'dark'") || source.includes("mode === 'dark'")),'Theme handling is missing');
assert.ok(source.includes('reduceMotion') && source.includes('AccessibilityInfo.isReduceMotionEnabled()'),'Reduced-motion support is missing');
assert.ok(source.includes('function LibraryManagementPanel()') && source.includes('SCAN & REPAIR') && source.includes('ADVANCED ORGANISATION'),'Sprint 4 Library management must remain intact through Sprint 7');
assert.ok(source.includes("<WorkDetailsPanel/>"),'Global work-details panel mount is missing');

console.log('PASS: Sprints 5-7 work details, branding, responsive integration and QA contracts are locked');
