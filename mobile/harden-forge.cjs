// Temporary mitigation for GHSA-86w9-cpqp-85rv in Expo's build tooling.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const file=require.resolve('node-forge/lib/rsa');
let source=fs.readFileSync(file,'utf8');
const original='obj.value.length !== 2) {';
const hardened='obj.value.length !== 2 ||\n            obj.value[0].value.length < 1 || obj.value[0].value.length > 2) {';
assert.equal(require('node-forge/package.json').version,'1.4.0','Review mitigation when node-forge changes');
if(!source.includes(hardened)){
  assert.equal(source.split(original).length,2,'Unexpected RSA implementation; fail closed');
  fs.writeFileSync(file,source.replace(original,hardened));
}
const forge=require('node-forge');
const key=forge.pki.rsa.generateKeyPair({bits:1024,e:65537});
const digest=forge.md.sha256.create().update('Archivist build dependency regression');
assert.equal(key.publicKey.verify(digest.digest().getBytes(),key.privateKey.sign(digest)),true);
const a=forge.asn1;
const algorithm=a.create(a.Class.UNIVERSAL,a.Type.SEQUENCE,true,[
  a.create(a.Class.UNIVERSAL,a.Type.OID,false,a.oidToDer(forge.oids.sha256).getBytes()),
  a.create(a.Class.UNIVERSAL,a.Type.NULL,false,''),
  a.create(a.Class.UNIVERSAL,a.Type.NULL,false,''),
]);
const malformed=a.create(a.Class.UNIVERSAL,a.Type.SEQUENCE,true,[algorithm,a.create(a.Class.UNIVERSAL,a.Type.OCTETSTRING,false,digest.digest().getBytes())]);
const signature=key.privateKey.sign(a.toDer(malformed).getBytes(),'NONE');
assert.throws(()=>key.publicKey.verify(digest.digest().getBytes(),signature),/DigestInfo/);
console.log('PASS: valid RSA signature accepted; nested extra DigestAlgorithm element rejected');

