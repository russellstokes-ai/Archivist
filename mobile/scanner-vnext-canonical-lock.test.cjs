const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),lock=JSON.parse(fs.readFileSync(path.join(root,'docs/scanner-vnext/CANONICAL_SCANNER_LOCK.json'),'utf8'));
for(const [file,expected] of Object.entries(lock.sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n')).digest('hex'),expected,'Canonical scanner changed: '+file);
console.log('PASS: '+Object.keys(lock.sha256).length+' canonical scanner files match the physically accepted Fold build');
