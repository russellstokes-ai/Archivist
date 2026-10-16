// Release-state documentation is a checked contract, not just prose.
// This suite auto-runs in the existing mobile unit-test discovery in CI.
// It does not modify scanners, Archivist Assist, canonical UI or source locks.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('docs/v1/DEVELOPMENT_STATUS.json'));
const status=read('docs/v1/DEVELOPMENT_STATUS.md');
const log=read('docs/v1/DEVELOPMENT_LOG.md');
const scope=read('docs/v1/ORIGINAL_BUG_BACKLOG_2026-10-14.md');
const locks=JSON.parse(read('docs/v1/PROTECTED_BLOB_LOCKS.json'));
const repo='russellstokes-ai/Archivist';

assert.equal(manifest.schema_version,1);
assert.equal(manifest.repo,repo);
assert.match(manifest.as_of,/^20\d{2}-\d{2}-\d{2}$/);
assert.equal(manifest.source_references.original_canonical.sha,
  'df4c39b44394d8c512ca0298bffa7f19da356490');
assert.equal(manifest.source_references.protected_development.sha,
  '72bbf177aecc92f31724b48c6cf11a7eddd7a216');
assert.equal(manifest.source_references.installed_apk_source,'unverified',
  'Do not invent the source SHA of the owner\'s installed APK');
assert.notEqual(manifest.current_unmerged_stack.head_sha,manifest.source_references.original_canonical.sha,
  'Developed branch and canonical app must remain distinct');
assert.equal(manifest.current_unmerged_stack.merged,false);
assert.equal(manifest.current_unmerged_stack.deployed,false);
assert.equal(manifest.current_unmerged_stack.release_built,false);
assert.equal(manifest.current_unmerged_stack.comparison.protected_paths_net_changed,0);
assert.equal(manifest.current_unmerged_stack.comparison.scanner_assist_paths_net_changed,0);
assert.equal(manifest.current_unmerged_stack.comparison.canonical_mobile_ui_paths_net_changed,0);
assert.equal(manifest.current_unmerged_stack.comparison.protected_paths_checked,locks.locks.length);
assert.equal(locks.locks.length,46);
assert.equal(locks.source_commit,manifest.source_references.lock_snapshot_source);

// Exact Git blob hash checks cover both binary assets and UTF-8 sources.
// A changed locked file fails even if a PR forgot to declare that change.
for(const {path:lockedPath,git_blob_sha} of locks.locks){
  const source=fs.readFileSync(path.join(root,lockedPath));
  const actual=crypto.createHash('sha1')
    .update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
  assert.equal(actual,git_blob_sha,'Canonical protected source changed: '+lockedPath);
}

const actual=[...manifest.bugs.active.map(x=>x.issue)].sort((a,b)=>a-b);
assert.deepEqual(actual,[16,17,19,20,23,25,31,32]);
assert.deepEqual(manifest.bugs.excluded.map(x=>x.issue),[15],
  'Scanner reliability must not enter the user-approved active bug list');
const allowed=new Set(manifest.acceptance_contract.statuses);
assert.equal(new Set(actual).size,8,'Bug ledger must not silently duplicate/reopen issues');
for(const bug of manifest.bugs.active){
  assert(allowed.has(bug.status),'Unknown acceptance status: '+bug.issue);
  assert.equal(bug.device_accepted,false,
    'Do not mark on-device acceptance without recorded owner evidence');
  assert(bug.required_acceptance?.length>35,
    'Keep an actionable device-acceptance gate for '+bug.issue);
  assert(bug.url.endsWith('/issues/'+bug.issue));
  assert(status.includes('#'+bug.issue),'Missing bug from human status document: '+bug.issue);
}
assert.equal(manifest.bugs.active.find(x=>x.issue===31).status,'code_verified_ci_unmerged');
assert.equal(manifest.bugs.active.find(x=>x.issue===32).status,'code_verified_ci_unmerged');
for(const n of [16,19,17,20,23,25]){
  assert.notEqual(manifest.bugs.active.find(x=>x.issue===n).status,'device_accepted');
}
assert(/scanner.*excluded/i.test(status)||/#15.*excluded/i.test(status));
assert(/scanner/i.test(scope)&&/excluded/i.test(scope));
assert(/Archivist Assist/i.test(status)&&/canonical/i.test(status));

// Independently trace the draft chain and ensure the current head is the
// exact final development PR, not a markdown-only/docs branch.
const prs=manifest.draft_pull_requests;
assert.deepEqual(prs.map(x=>x.number),[40,41,42,43,44,45,46,47,48,49,50,51,52]);
assert.equal(prs.at(-1).head_sha,manifest.current_unmerged_stack.head_sha);
assert.equal(manifest.current_unmerged_stack.last_pr,52);
for(const item of prs){
  assert.equal(item.status,'draft_unmerged','Do not record an unapproved merge: '+item.number);
  assert.equal(item.device_accepted,false);
  assert.match(item.head_sha,/^[a-f0-9]{40}$/);
  assert(item.url.endsWith('/pull/'+item.number));
  assert(status.includes('pull/'+item.number),'Status omitted draft PR '+item.number);
  assert(log.includes('pull/'+item.number),'Append-only log omitted draft PR '+item.number);
}
assert(status.includes(manifest.current_unmerged_stack.head_sha));
assert(log.includes(manifest.current_unmerged_stack.head_sha));
assert(log.includes(manifest.source_references.original_canonical.sha));
assert(status.includes(manifest.source_references.protected_development.sha));
assert(status.includes('DEVELOPMENT_LOG.md'));
assert(status.includes('DEVELOPMENT_STATUS.json'));
const astra=read('docs/v1/ASTRA_REVIEW_QUEUE.md');
assert.equal(manifest.audit_review_queue.count,13);
assert.equal(manifest.audit_review_queue.file,'docs/v1/ASTRA_REVIEW_QUEUE.md');
assert(status.includes('ASTRA_REVIEW_QUEUE.md'));
assert(log.includes('ASTRA_REVIEW_QUEUE.md'));
for(let i=1;i<=13;i++)assert(astra.includes('ASTRA-'+String(i).padStart(2,'0')),
  'Astra item not documented: '+i);
assert(/\b[Aa]ssist\b/.test(astra)&&/scanner/i.test(astra),
  'Astra review must preserve scanners and Assist');
assert(manifest.commercial_work.some(x=>x.id==='server_cover_recovery'&&x.prs.includes(52)));
assert.strictEqual(manifest.current_unmerged_stack.comparison.protected_paths_net_changed,0);
for(const run of Object.values(manifest.ci_latest_head)){
  if(typeof run!=='object'||!run||!('run_id'in run))continue;
  assert.equal(run.status,'passed');
  assert(status.includes(String(run.run_id))||log.includes(String(run.run_id)),
    'Every CI claim needs an exact run link');
}
assert(manifest.commercial_work.length>=5,'Separate commercial Work from original user bugs');
assert(manifest.commercial_work.some(w=>w.id==='cross_device_progress'&&w.status==='foundation_only'));
assert(/append/i.test(log)&&/release/i.test(log));
console.log('PASS: 46 immutable blob hashes + canonical/draft split + eight bug gates + PR chain + CI provenance + commercial Work ledger');
