// PR #55: This is a *source assembly* gate, NOT a device or security acceptance.
// It makes the otherwise parallel #52/#53/#54 branches auditable together,
// requiring exact reviewed server-cover artifacts and the two independent
// The initial PR #52 covers.go blob was 9d082c9468b927e58dd8644d8b42aa1ce94d52ce.
// PR #60 adds only the independently audited WebP header preflight, so the
// covers.go lock is explicitly advanced to f6381164... on THIS draft.
// Existing cover_candidate_fallback_test.go remains byte-for-byte PR #52.
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
  ['covers.go','archivist/app/covers.go','f6381164fb432eb6e50d53199ea1de141b6e7667'],
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
const finalAudit=bytes('docs/v1/FINAL_COMMERCIAL_SOURCE_SWEEP_2026-10-16.md').toString('utf8');
for(const required of ['PR #60','PR #61','PR #62','PR #63','RED #38899466348','df4c39b44394d8c512ca0298bffa7f19da356490']){
  assert(finalAudit.includes(required),'commercial sweep must document '+required);
}
const manifest=JSON.parse(bytes('docs/v1/DEVELOPMENT_STATUS.json').toString('utf8'));
const sweep=manifest.full_commercial_source_sweep_20261016;
assert(sweep?.new_red_only_integrity_audit?.merge_allowed===false,
  'unsafe shared state-store regression must remain quarantined');
assert.equal(sweep?.source_lock_audit?.locked_changed,0,
  'commercial sweep must preserve all 46 protected source locks');
assert.equal(sweep?.mobile_original_bugs_device_accepted,0,
  'CI cannot imply original eight issues have been device accepted');
console.log('PASS: source-level commercial sweep and quarantined-state evidence are complete; device acceptance remains outstanding');
