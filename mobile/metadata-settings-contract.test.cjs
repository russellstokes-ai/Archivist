const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');
const settings=fs.readFileSync(__dirname+'/metadataSettings.ts','utf8');
const books=fs.readFileSync(__dirname+'/onlineBookMetadata.ts','utf8');
const library=fs.readFileSync(__dirname+'/localLibrary.ts','utf8');

assert.ok(source.includes("metadataSettingsKey = 'archivist.metadata.settings.v1'"),'metadata preferences need a dedicated persisted settings key');
assert.ok(source.includes("googleBooksApiKeyKey = 'archivist.metadata.googleBooks.apiKey.v1'"),'Google Books key must have a secure-store key');
assert.ok(source.includes("metronTokenKey = 'archivist.metadata.metron.token.v1'"),'Metron token secure-store key is missing');
assert.ok(source.includes('SecureStore.getItemAsync(googleBooksApiKeyKey)')&&source.includes('SecureStore.setItemAsync(googleBooksApiKeyKey'), 'Google Books credentials must be read/written through SecureStore');
assert.ok(source.includes('SecureStore.getItemAsync(metronTokenKey)')&&source.includes('SecureStore.setItemAsync(metronTokenKey'), 'Metron credentials must be read/written through SecureStore');
assert.equal(source.includes("Constants.expoConfig?.extra as any)?.googleBooksApiKey"),false,'Google Books credentials must not remain build-time app config');

for(const label of ['Online metadata','Automatic metadata enrichment','Apply high confidence metadata matches','Book metadata providers','Open Library','Google Books','Comic metadata providers','Metron']){
  assert.ok(source.includes('label="'+label+'"'),label+' setting is missing');
}
assert.ok(source.includes('accessibilityLabel="Google Books API key"')&&source.includes('accessibilityLabel="Metron API token"'),'provider credential editors are missing');
assert.ok(source.includes('secureTextEntry'),'provider credentials must be obscured in the UI');
assert.ok(source.includes("googleBooksConfigured?'Configured':'Optional fallback'"),'Google Books must expose honest configuration status');
assert.ok(source.includes("metronConfigured?'Configured':'Token required'"),'Metron must expose honest configuration status');

assert.ok(source.includes('async function clearMetadataCaches')&&source.includes('onlineBookMetadataCacheKey')&&source.includes('onlineComicMetadataCacheKey'),'both provider caches must be clearable');
assert.ok(source.includes('metadataSettings,')&&source.includes("raw.metadataSettings&&typeof raw.metadataSettings==='object'"),'non-secret metadata provider preferences must participate in backup/restore');
assert.equal(source.includes('googleBooksKeyDraft,\n      smartShelves'),false,'Google Books credential material must never be added to backup snapshots');
assert.equal(source.includes('metronTokenDraft,\n      smartShelves'),false,'Metron credential material must never be added to backup snapshots');
assert.ok(source.includes('async function refreshAllMetadataAndCovers')&&source.includes('rescanLocalFolders(localMetadataOverrides,true)')&&source.includes('ignoreCache:forceRefresh'),'explicit refresh must bypass provider caches without destroying the last working cache before replacement results exist');
assert.equal(source.includes('await clearMetadataCaches(false)'),false,'explicit refresh must retain the previous cache until fresh provider results are available');
assert.ok(source.includes('metadataSettingsReady')&&source.includes('!metadataSettingsReady'),'initial auto scan must wait for metadata settings hydration');
assert.ok(source.includes('metadataSettingsRef.current=next')&&source.includes('mutator(metadataSettingsRef.current)'),'rapid settings changes must serialize from the latest in-memory preferences rather than stale render state');
assert.ok(source.includes('forceOnline=false')&&source.includes('metadataSettings.automaticEnrichment||forceOnline'),'manual refresh must be able to run online enrichment while background enrichment is off');
assert.ok(source.includes('metadataSettings.books.openLibrary')&&source.includes('metadataSettings.books.googleBooks')&&source.includes('metadataSettings.comics.metron'),'provider choices must control the enrichment pipeline');

assert.ok(settings.includes('onlineEnabled:true')&&settings.includes('automaticEnrichment:true')&&settings.includes('applyHighConfidence:true'),'commercial defaults must enable safe metadata enrichment');
assert.ok(books.includes('openLibraryEnabled?:boolean')&&books.includes('const openLibraryEnabled=options.openLibraryEnabled!==false'),'Open Library must be independently configurable');
assert.ok(library.includes("result.autoApply&&options.applyHighConfidence!==false"),'high confidence auto-apply setting must affect both enrichment paths');
assert.ok((library.match(/result\.autoApply&&options\.applyHighConfidence!==false/g)||[]).length>=2,'books and comics must both respect the auto-apply setting');

console.log('PASS: holistic metadata settings control books/comics, secure credentials, caches and explicit refresh');

assert.ok(source.includes("import {cacheOnlineCoverUris} from './onlineCoverCache'"),'provider covers must have a durable app-private cache');
assert.ok((source.match(/cacheOnlineCoverUris\(enriched\.books/g)||[]).length>=2,'book and comic enrichment must both persist provider covers for offline use');
