const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'archivist-runtime-'));
const options = path.join(temp, 'options.json');
const data = '/data/archivist-test-' + path.basename(temp);
function launch(config) {
  fs.writeFileSync(options, typeof config === 'string' ? config : JSON.stringify(config));
  return spawnSync('sh', [path.join(root, 'home-assistant/archivist/run.sh')], {
    encoding: 'utf8', env: {...process.env, ARCHIVIST_OPTIONS: options, ARCHIVIST_BINARY: '/bin/echo'},
  });
}
try {
  let r = launch({data_path: data});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /-listen 0\.0\.0\.0:5056 -allow-lan/);
  fs.writeFileSync(path.join(data, 'sentinel'), 'retain');
  r = launch({data_path: data, listen: '127.0.0.1:5056', allow_lan: false});
  assert.equal(r.status, 0, r.stderr);
  assert(!r.stdout.includes('-allow-lan'));
  assert.equal(fs.readFileSync(path.join(data, 'sentinel'), 'utf8'), 'retain');
  for (const config of ['{broken', {allow_lan: 'false'}, {allow_lan: false},
    {data_path: '/tmp/nonpersistent'}, {data_path: '/data/../tmp'}, {listen: '0.0.0.0:1234'}]) {
    assert.notEqual(launch(config).status, 0, JSON.stringify(config));
  }
  // Prevent new app-origin URLs from bypassing the document's ingress base.
  for (const file of fs.readdirSync(path.join(root, 'web')).filter(f => /\.(html|js)$/.test(f))) {
    const body = fs.readFileSync(path.join(root, 'web', file), 'utf8');
    assert(!/['"]\/(?:api\/|vendor\/|assets\/|reader\.|unlock|logout|session)/.test(body), file);
  }
  for (const base of ['http://localhost:5056/', 'https://ha.example/api/hassio_ingress/token/']) {
    for (const relative of ['./api/books', './api/assets/1', './reader.html?asset=1', './vendor/pdf.worker.mjs']) {
      assert(new URL(relative, base).href.startsWith(base));
    }
  }
  console.log('PASS: startup defaults/false handling, invalid options, data retention and ingress-relative URL checks');
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
  fs.rmSync(data, {recursive: true, force: true});
}
