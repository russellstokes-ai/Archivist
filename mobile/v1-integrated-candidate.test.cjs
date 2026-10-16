// PR #55: This is a *source assembly* gate, NOT a device or security acceptance.
// It makes the otherwise parallel #52/#53/#54 branches auditable together,
// requiring the exact reviewed server-cover artifacts and the two independent
// risk queues. Go unit tests (run by Server CI) are responsible for behavior.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');

function bytes(filename){return fs.readFileSync(path.join(root,filename));}
function blobHash(file){
  const data=bytes(file);
  return crypto.createHash('sha1')
    .update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
}
for(const [pathA,pathB,expected] of [
  ['covers.go','archivist/app/covers.go','9d082c9468b927e58dd8644d8b42aa1ce94d52ce'],
  ['cover_candidate_fallback_test.go','archivist/app/cover_candidate_fallback_test.go','43ee302da3ea6893c33260305f879079814172fa'],
]){
  assert.equal(blobHash(pathA),expected,'PR #52 reviewed source changed: '+pathA);
  assert.equal(blobHash(pathB),expected,'PR #52 reviewed packaged mirror changed: '+pathB);
  assert(bytes(pathA).equals(bytes(pathB)),'Server root and packaged files differ: '+pathA);
}
assert.equal(blobHash('docs/v1/ASTRA_REVIEW_QUEUE.md'),
  '71cccaf3ae0487711f9bc84e5537409f03e62b2c',
  'PR #52 original Astra queue must remain untouched');
assert(bytes('docs/v1/ASTRA_ROBUSTNESS_REVIEW_QUEUE.md').length>1000,
  'PR #53 independent Astra queue is missing');
const reconciliation=bytes('docs/v1/PR52_PR53_RECONCILIATION_2026-10-16.md').toString('utf8');
assert(reconciliation.includes('PR #52')&&reconciliation.includes('PR #53'),
  'Sibling history and approval-gated integration must be recorded');
assert(fs.existsSync(path.join(root,'mobile/offline-checkpoint-data-loss.repro.cjs')),
  'P0 destructive-recovery reproducer must be retained for Astra');
assert(fs.existsSync(path.join(root,'mobile/offline-library.test.cjs')),
  'Offline guard regression is required for the integrated candidate');
assert(fs.existsSync(path.join(root,'mobile/progress-reconciliation.test.cjs')),
  'Progress duplicate-identity regression is required for the integrated candidate');
console.log('PASS: reviewed sibling server fixes and both Astra risk queues are assembled verbatim; no device acceptance claimed');
