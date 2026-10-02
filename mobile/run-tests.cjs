// Discover maintained suites so local checks and every CI gate stay in sync.
const {readdirSync} = require('node:fs');
const {spawnSync} = require('node:child_process');
const suites = readdirSync(__dirname).filter(name => name.endsWith('.test.cjs')).sort();
if (!suites.length) throw new Error('No mobile test suites found');
const failed = [];
for (const suite of suites) {
  console.log(`\n--- ${suite} ---`);
  const result = spawnSync(process.execPath, [suite], {cwd: __dirname, stdio: 'inherit'});
  if (result.error || result.status !== 0) failed.push(suite);
}
console.log(`\n${suites.length - failed.length}/${suites.length} mobile suites passed.`);
if (failed.length) {
  console.error('Failed suites: ' + failed.join(', '));
  process.exitCode = 1;
}
