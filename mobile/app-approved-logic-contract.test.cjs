// Approved logic-only App.tsx exception: order and durability contract.
// UI/screens/scanners remain unchanged and cryptographic App blob exception is
// checked independently by both the protection gate and development ledger.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');
const helper=fs.readFileSync(path.join(__dirname,'offlineLibrary.ts'),'utf8');
const exceptions=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json'),'utf8'));
const data=Buffer.from(app,'utf8');
const sha=crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
assert.ok(require('../scripts/test14-app-exception.cjs')(root,sha),
  'App must equal the exact reversible Test 14 scope added to the prior approved logic SHA');
assert.match(app,/function saveOfflineCheckpoint\(key:string,checkpoint:OfflineDownloadCheckpoint\|null\):Promise<void>/);
assert.match(app,/await setPersistedJSON\(offlineCheckpointsKey,next\);\s*setOfflineCheckpoints\(next\);/,
  'Checkpoint must commit durably BEFORE its in-memory state is acknowledged');
assert.match(app,/onPublished:async completedWork=>\{[\s\S]{0,400}await setPersistedJSON\(offlineWorksKey,next\);\s*setOfflineWorks\(next\);/,
  'Manifest must be durably saved BEFORE publishing into the UI');
const publish=helper.indexOf('await options?.onPublished?.(published)');
const clear=helper.indexOf('await options?.onCheckpoint?.(null)');
assert(publish>=0&&clear>publish,'The completed manifest must commit before recovery checkpoint can be cleared');
assert(!/void setPersistedJSON\(offlineWorksKey,next\)/.test(app),
  'Do not accidentally retain a fire-and-forget offline manifest commit');
assert(!/void setPersistedJSON\(offlineCheckpointsKey,next\)/.test(app),
  'Do not acknowledge persisted checkpoint writes before they complete');
console.log('PASS: approved App persistence exception is byte-pinned; manifest commit must precede checkpoint clearing');
