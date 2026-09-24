const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync: exec} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'archivist-package-'));
const run = (cmd, args, cwd = temp) => exec(cmd, args, {cwd, stdio: 'pipe'});
try {
  // Rebuilding must discard obsolete entries, including for relative output paths.
  fs.writeFileSync(path.join(temp, 'obsolete.txt'), 'stale');
  run('zip', ['-q', 'repository.zip', 'obsolete.txt']);
  run('sh', [path.join(root, 'scripts/package-ha-repository.sh'), 'repository.zip']);
  run('unzip', ['-tq', 'repository.zip']);
  run('unzip', ['-q', 'repository.zip', '-d', 'extracted']);
  const extracted = path.join(temp, 'extracted');
  assert(!fs.existsSync(path.join(extracted, 'obsolete.txt')));
  for (const file of ['README.md', 'LICENSE.md', 'VALIDATION.md', 'TESTING-READINESS.md',
    'PRIVACY-AND-MONETISATION.md', 'COMIC-SPEECH-FOCUS.md', 'repository.yaml',
    'archivist/config.yaml', 'archivist/Dockerfile', 'archivist/run.sh',
    'archivist/README.md', 'archivist/LICENSE.md', 'archivist/icon.png', 'archivist/logo.png']) {
    assert(fs.statSync(path.join(extracted, file)).size > 0, file);
  }
  const same = (source, target) => assert.deepEqual(
    fs.readFileSync(path.join(root, source)), fs.readFileSync(path.join(extracted, target)), source);
  for (const file of fs.readdirSync(root).filter(f => f.endsWith('.go') || ['go.mod', 'go.sum'].includes(f))) {
    same(file, 'archivist/app/' + file);
  }
  function checkWeb(dir) {
    for (const entry of fs.readdirSync(path.join(root, dir), {withFileTypes: true})) {
      const file = dir + '/' + entry.name;
      if (entry.isDirectory()) checkWeb(file);
      else same(file, 'archivist/app/' + file);
    }
  }
  checkWeb('web');
  same('web/assets/archivist-app-icon.png', 'archivist/icon.png');
  same('web/assets/archivist-primary-logo.png', 'archivist/logo.png');
  const docker = fs.readFileSync(path.join(extracted, 'archivist/Dockerfile'), 'utf8');
  assert.match(docker, /COPY app\/ \./);
  assert.match(docker, /COPY run\.sh \/run\.sh/);
  assert(!docker.includes('COPY home-assistant/'));
  assert(!fs.readFileSync(path.join(extracted, 'repository.yaml'), 'utf8').includes('example.invalid'));
  run('sh', ['-n', path.join(extracted, 'archivist/run.sh')]);
  console.log('PASS: clean rebuild, relative output, root docs, branding, complete source/web bytes and Docker context paths');
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}
