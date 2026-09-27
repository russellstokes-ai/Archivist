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
  '/api/me','/api/books','/api/works','/api/continue','/api/profile-stats','/api/sources',
  '/api/file-moves','/api/assets/','/api/queue','/session','/logout','/setup/status'
]) {
  assert.ok(clientSource.includes(route), 'Expected wired mobile route missing from client: ' + route);
}

console.log('PASS: no placeholder UI markers and every visible mobile button/tab is wired');

assert.ok(source.includes("{id: 'profile', label: 'Profile'}"), 'Profile tab is not wired');
assert.ok(source.includes("function Profile()"), 'Profile screen is not implemented');
