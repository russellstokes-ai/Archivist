const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const mobile=__dirname,repo=path.dirname(mobile),manifest=JSON.parse(fs.readFileSync(path.join(repo,'docs/scanner-vnext/UI_BINDING_EXCEPTIONS.json'),'utf8'));
let app=fs.readFileSync(path.join(mobile,'App.tsx'),'utf8').replaceAll('\r\n','\n');
assert.ok(!/\bscanLocalFolders\(/.test(app),'Fresh app paths must not call historical scanner');
assert.ok(!/await enrichPublishedLocalLibrary\(/.test(app),'Discovery must not start a deep metadata sweep');
assert.ok(app.includes('projectScannerWorks(local,groupLocalWorks)'));assert.ok(app.includes('scannerPublished'));assert.ok(app.includes('runtime.assist.accept'));
// First reverse only the exact, separate Test 14 Atlas and medal change;
// retain the entire original scanner approval and byte restoration below.
const test14=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/TEST14_APP_EXCEPTION_2026-10-17.json'),'utf8'));
const current=Buffer.from(app,'utf8');
const currentBlob=crypto.createHash('sha1').update('blob '+current.length+'\0').update(current).digest('hex');
assert(require('../scripts/test14-app-exception.cjs')(repo,currentBlob),'Test 14 App patch must be exact and reversible');
// Reverse gallery and Atlas improvements before the previous approved App chain.
const gallery=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/TEST14_ATLAS_REWARDS_APP_EXCEPTION_2026-10-17.json'),'utf8'));
assert.equal(gallery.path,'mobile/App.tsx');assert.equal(gallery.changes.length,18);
for(const change of [...gallery.changes].reverse()){
 const next=change.new.replaceAll('\r\n','\n'),prior=change.old.replaceAll('\r\n','\n');
 assert.equal(app.split(next).length-1,1,'Atlas/Rewards exception is not unique');
 app=app.replace(next,prior);
}
// Reverse media-only fixes before the SAF, transport and scanner locks.
const media=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/TEST14_MEDIA_APP_EXCEPTION_2026-10-17.json'),'utf8'));
assert.equal(media.path,'mobile/App.tsx');assert.equal(media.changes.length,2);
for(const change of [...media.changes].reverse()){
  const next=change.new.replaceAll('\r\n','\n'),prior=change.old.replaceAll('\r\n','\n');
  assert.equal(app.split(next).length-1,1,'Media availability/PDF hunk differs or is duplicated');
  app=app.replace(next,prior);
}
// Remove reader-only SAF routing first; the historical scanner source
// comparison then sees only its pre-existing, independently approved changes.
const saf=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/TEST14_SAF_APP_EXCEPTION_2026-10-17.json'),'utf8'));
assert.equal(saf.path,'mobile/App.tsx');assert.equal(saf.changes.length,3);
for(const change of [...saf.changes].reverse()){
  const next=change.new.replaceAll('\r\n','\n'),prior=change.old.replaceAll('\r\n','\n');
  assert.equal(app.split(next).length-1,1,'Reader-only SAF hunk differs or is duplicated');
  app=app.replace(next,prior);
}
// Reverse the separately pinned minimum-width transport exception FIRST,
// otherwise scanner binding restoration sees unrelated layout-only changes.
// Scanner/Assist source and every prior canonical assertion remain unchanged.
const transport=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/TEST14_TRANSPORT_APP_EXCEPTION_2026-10-17.json'),'utf8'));
assert.equal(transport.path,'mobile/App.tsx');
assert.equal(transport.previous_approved_git_blob_sha,test14.approved_git_blob_sha);
assert.equal(transport.changes.length,8);
for(const change of [...transport.changes].reverse()){
  const next=change.new.replaceAll('\r\n','\n'),prior=change.old.replaceAll('\r\n','\n');
  assert.equal(app.split(next).length-1,1,'Responsive transport hunk differs or is duplicated');
  app=app.replace(next,prior);
}
for(const change of [...test14.changes].reverse()){
  const next=change.new.replaceAll('\r\n','\n'),prior=change.old.replaceAll('\r\n','\n');
  assert.equal(app.split(next).length-1,1,'Test 14 scoped patch differs or is duplicated');
  app=app.replace(next,prior);
}
// Reverse ONLY the exactly pinned user-approved logic changes, then execute
// the old scanner-binding byte-for-byte restoration check unchanged. A new
// scanner/Assist/UI edit cannot hide behind this narrow App exception.
const approvedLogic=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json'),'utf8'));
assert.equal(approvedLogic.original_git_blob_sha,'aacfe887ae535242a22bac414eb7cf823f190563');
assert(Array.isArray(approvedLogic.approved_logic_changes)&&approvedLogic.approved_logic_changes.length>=1);
for(const change of [...approvedLogic.approved_logic_changes].reverse()){
  const next=change.new.replaceAll('\r\n','\n'),prior=change.old.replaceAll('\r\n','\n');
  assert.equal(app.split(next).length-1,1,'Approved App logic hunk differs or is duplicated');
  app=app.replace(next,prior);
}
for(const change of [...manifest.changes].reverse()){const value=change.new.replaceAll('\r\n','\n');assert.equal(app.split(value).length-1,1,'Explicit binding differs');app=app.replace(value,change.old.replaceAll('\r\n','\n'));}
assert.equal(crypto.createHash('sha256').update(app.replaceAll('\n','\r\n')).digest('hex'),manifest.baseSha256,'Changes beyond explicitly targeted scanner bindings');
console.log('PASS: byte-equivalent canonical App restored after explicit scanner controller/Assist exceptions; historical scan routes disconnected');
