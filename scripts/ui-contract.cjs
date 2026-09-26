const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('web/index.html','utf8');
const jsFiles = ['web/app.js','web/catalogue.js','web/filemoves.js','web/organise.js','web/household.js','web/playback.js','web/reader.js'];
const source = jsFiles.map(file => fs.readFileSync(file,'utf8')).join('\n');

for (const banned of ['Coming soon','Not implemented','TODO','FIXME','cover-initials','function initials(']) {
  assert.equal((html + '\n' + source).includes(banned), false, 'Banned placeholder/dead-state marker found: ' + banned);
}

const ids = [...html.matchAll(/<button\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
assert.ok(ids.length > 0, 'No static browser buttons found');
for (const id of ids) {
  const quotedSingle = "'" + id + "'";
  const quotedDouble = '"' + id + '"';
  assert.ok(source.includes(quotedSingle) || source.includes(quotedDouble), 'Static browser button is never referenced by JavaScript: ' + id);
}

for (const route of [
  './api/works','./api/sources','./api/library-summary','./api/folders',
  './api/file-moves','./api/profiles','./api/editions/','./api/assets/'
]) {
  assert.ok(source.includes(route), 'Expected wired browser route missing: ' + route);
}

console.log('PASS: browser controls are referenced, core routes are wired, and placeholder UI markers are absent');
