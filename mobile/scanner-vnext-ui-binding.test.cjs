const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const mobile=__dirname,repo=path.dirname(mobile),manifest=JSON.parse(fs.readFileSync(path.join(repo,'docs/scanner-vnext/UI_BINDING_EXCEPTIONS.json'),'utf8'));
let app=fs.readFileSync(path.join(mobile,'App.tsx'),'utf8').replaceAll('\r\n','\n');
assert.ok(!/\bscanLocalFolders\(/.test(app),'Fresh app paths must not call historical scanner');
assert.ok(!/await enrichPublishedLocalLibrary\(/.test(app),'Discovery must not start a deep metadata sweep');
assert.ok(app.includes('projectScannerWorks(local,groupLocalWorks)'));assert.ok(app.includes('scannerPublished'));assert.ok(app.includes('runtime.assist.accept'));
// Apply the small USER-AUTHORISED polish reversals before testing the immutable
// original binding manifest and base SHA. Never edit the original base hash.
const approvedPolish=JSON.parse(fs.readFileSync(path.join(repo,'docs/scanner-vnext/COMMERCIAL_POLISH_UI_EXCEPTIONS.json'),'utf8'));
assert.equal(approvedPolish.parentSource,'df4c39b44394d8c512ca0298bffa7f19da356490');
for(const change of [...approvedPolish.changes].reverse()){
  const value=change.new.replaceAll('\\r\\n','\\n');
  assert.equal(app.split(value).length-1,1,'Approved polish difference not found exactly once');
  app=app.replace(value,change.old.replaceAll('\\r\\n','\\n'));
}
for(const change of [...manifest.changes].reverse()){const value=change.new.replaceAll('\r\n','\n');assert.equal(app.split(value).length-1,1,'Explicit binding differs');app=app.replace(value,change.old.replaceAll('\r\n','\n'));}
assert.equal(crypto.createHash('sha256').update(app.replaceAll('\n','\r\n')).digest('hex'),manifest.baseSha256,'Changes beyond explicitly targeted scanner bindings');
console.log('PASS: byte-equivalent canonical App restored after explicit scanner controller/Assist exceptions; historical scan routes disconnected');
