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

assert.ok(html.includes('id="picker" hidden class="picker-overlay" role="dialog" aria-modal="true"'), 'Folder picker must be a modal dialog');
assert.ok(html.includes('id="work-detail" hidden class="work-overlay" role="dialog" aria-modal="true"'), 'Work detail must be a modal dialog');
assert.ok(html.includes('role="tablist" aria-label="Settings sections"'), 'Settings tabs need tablist semantics');
assert.ok(html.includes('role="tab" data-settings="library" aria-selected="true"'), 'Settings tabs need selected state');
assert.ok(source.includes("if(event.key==='Escape')"), 'Browser overlays must close with Escape');
assert.ok(source.includes("overlayFocus=new Map()"), 'Browser overlays must restore focus');
assert.ok(source.includes("event.key!=='Tab'"), 'Browser overlays must contain keyboard focus');
assert.ok(source.includes("'./api/file-moves/preview-template-batch'"), 'Organisation UI must use structured batch previews');
assert.ok(source.includes("'./api/file-moves/apply-batch'"), 'Organisation UI must apply explicit selected move IDs');
assert.ok(source.includes("'Select all Ready'"), 'Organisation UI must expose Select all Ready');
assert.ok(source.includes("'Clear selection'"), 'Organisation UI must expose Clear selection');
assert.ok(source.includes("'Apply selected'"), 'Organisation UI must label the explicit apply action');
for (const label of ['Ready','Review recommended','Conflict','Already organised']) {
  assert.ok(source.includes(label), 'Organisation preview status missing: '+label);
}
assert.ok(source.includes('selectedIds=new Set'), 'Organisation preview must maintain explicit selection state');

const css=fs.readFileSync('web/style.css','utf8');
assert.ok(css.includes('focus-visible'), 'Browser controls need visible keyboard focus');
assert.ok(css.includes('prefers-reduced-motion'), 'Browser UI must respect reduced-motion preference');
