const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),lock=JSON.parse(fs.readFileSync(path.join(root,'docs/scanner-vnext/CANONICAL_SCANNER_LOCK.json'),'utf8'));
for(const [file,expected] of Object.entries(lock.sha256))assert.equal(crypto.createHash('sha256').update(require('../scripts/discovery-original-source.cjs')(file,fs.readFileSync(path.join(root,file),'utf8'))).digest('hex'),expected,'Canonical scanner changed outside recorded Discovery delta: '+file);
console.log('PASS: canonical scanner baseline retained beneath explicit Discovery deltas; device acceptance pending');
