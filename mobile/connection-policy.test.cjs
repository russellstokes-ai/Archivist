// Connection validation contract: only reserved LAN namespaces may use HTTP.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');

const source=fs.readFileSync(path.join(__dirname,'connection.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exports={};
vm.runInNewContext(js,{exports,module:{exports},URL},{filename:'connection.ts'});
const {validateServer}=exports;
assert.equal(typeof validateServer,'function');

for(const [input,expected] of [
  ['http://nas.local','http://nas.local'],
  ['HTTP://SYNOLOGY.LOCAL:5056/','http://synology.local:5056'],
  ['http://archivist.home.arpa:5056/','http://archivist.home.arpa:5056'],
  ['http://library.nas.home.arpa','http://library.nas.home.arpa'],
  ['http://192.168.1.12:5056/','http://192.168.1.12:5056'],
  ['http://100.100.10.5:5056','http://100.100.10.5:5056'],
  ['https://books.example.com/','https://books.example.com'],
]) {
  assert.equal(validateServer(input),expected,'Expected accepted host: '+input);
}
for(const input of [
  'http://books.example.com',
  'http://nas.local.evil.example',
  'http://bad-.local',
  'http://-bad.local',
  'http://.local',
  'http://foo.home.arpa.evil.example',
  'http://8.8.8.8:5056',
  'https://user:pass@books.example.com',
  'https://books.example.com/path',
  'https://books.example.com/?key=secret',
  'javascript:alert(1)'
]) assert.throws(()=>validateServer(input),undefined,'Expected rejected host: '+input);
console.log('PASS: mobile server allows reserved LAN names but requires HTTPS for public origins');
