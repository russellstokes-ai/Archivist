const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('App.tsx','utf8');
const clientSource = ['App.tsx','connection.ts','queue.ts','playback.ts'].map(file => fs.readFileSync(file,'utf8')).join('\n');

for (const banned of ['Coming soon','Not implemented','TODO','FIXME','Genre is currently represented by media format','coverInitials(']) {
  assert.equal(source.includes(banned), false, 'Banned placeholder/dead-state marker found: ' + banned);
}

for (const match of source.matchAll(/<Button\b[\s\S]*?\/>/g)) {
  assert.match(match[0], /\bonPress\s*=/, 'Button without onPress handler: ' + match[0].slice(0,180));
}

for (const match of source.matchAll(/<Pressable\b[\s\S]*?<\/Pressable>/g)) {
  const block = match[0];
  if (!/accessibilityRole\s*=\s*["'](?:button|tab)["']/.test(block)) continue;
  assert.match(block, /\bonPress\s*=/, 'Interactive Pressable without onPress handler: ' + block.slice(0,220));
}

for (const route of [
  '/api/me','/api/books','/api/works','/api/continue','/api/profile-stats','/api/preferences','/api/atlas-relationships','/api/duplicate-candidates','/api/sources',
  '/api/file-moves','/api/assets/','/api/queue','/session','/logout','/setup/status'
]) {
  assert.ok(clientSource.includes(route), 'Expected wired mobile route missing from client: ' + route);
}

console.log('PASS: no placeholder UI markers and every visible mobile button/tab is wired');

assert.ok(source.includes("{id: 'profile', label: 'Profile'}"), 'Profile tab is not wired');
assert.ok(source.includes("function Profile()"), 'Profile screen is not implemented');

assert.ok(source.includes("function AtlasRelationshipView()"), 'Atlas relationship view is not implemented');

assert.ok(source.includes("function DuplicateReviewPanel()"), 'Duplicate review UI is not implemented');

assert.ok(source.includes("serverSummary.genres || []"), 'Atlas must tolerate servers from before genre summaries were added');
assert.ok(source.includes("relation.genres || []"), 'Atlas relationship view must tolerate servers from before genre links were added');
assert.ok(source.includes("relation.availability || []"), 'Atlas relationship view must tolerate servers from before availability links were added');

assert.ok(source.includes("const localCatalogKey = 'archivist.localCatalog.v1'"), 'Local catalogue cache key is missing');
assert.ok(source.includes("getPersistedJSON<Book[]>(localCatalogKey)"), 'Cold start must restore the cached local catalogue');
assert.ok(source.includes("setPersistedJSON(localCatalogKey, result.books)"), 'Successful scans must refresh the cached local catalogue');
assert.ok(source.includes("!localCatalogReady"), 'Automatic rescan must wait for catalogue restoration before deciding the cache is absent');

assert.ok(source.includes('function LocalSortingPanel()'), 'Local organisation controls should live in a dedicated Settings panel');
assert.ok(source.includes('<LocalSortingPanel />'), 'Settings must render the local organisation panel');
const shelfStart=source.indexOf('function Shelf()');
const playerStart=source.indexOf('function Player()');
assert.ok(shelfStart>=0 && playerStart>shelfStart, 'Shelf function bounds are missing');
const shelfSource=source.slice(shelfStart,playerStart);
assert.equal(shelfSource.includes('>Local sorting</Text>'),false,'Technical local sorting controls must not live on the Shelf');

assert.ok(source.includes('function PersonalControls('), 'Personal star/favourite controls are missing');
assert.ok(source.includes("kind=\"reading\""), 'Atlas reading-state relationship is missing');
assert.ok(source.includes("kind=\"rating\""), 'Atlas rating relationship is missing');
assert.ok(source.includes("kind=\"favourite\""), 'Atlas favourite relationship is missing');
assert.ok(source.includes('>Family users</Text>'), 'Admin family-user management is missing');
assert.ok(source.includes('User · whole library'), 'Family user UI must use simple whole-library User semantics');
assert.equal(source.includes('Change library access'),false,'Mobile UI must not expose per-library User permissions');
assert.ok(source.includes("profile.admin ?? profile.owner"), 'Mobile must understand new Admin role while remaining compatible with older servers');

assert.ok(source.includes('How was it?'), 'Completion rating prompt is missing');
assert.ok(source.includes('archivist-reader-complete'), 'Server reader completion must bridge back to the mobile rating prompt');
assert.ok(source.includes('serverWorkId?: number'), 'Server work identity must survive into reader/player completion flows');
