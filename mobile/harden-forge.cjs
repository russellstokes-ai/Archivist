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

/*
 * Temporary mitigation for GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 in braces 3.0.3.
 * Upstream has no patched release as of this candidate. Metro is build tooling, but
 * fail closed anyway: bound parse nesting and the public AST walkers before Gradle.
 */
assert.equal(require('braces/package.json').version,'3.0.3','Review braces mitigation when braces changes');
const BRACE_DEPTH_LIMIT=128;
const braceGuard="if (depth > "+BRACE_DEPTH_LIMIT+") throw new RangeError('brace nesting exceeds safe limit');";

const patchFile=(target,patches)=>{
  let text=fs.readFileSync(target,'utf8');
  let changed=false;
  for(const [before,after] of patches){
    if(text.includes(after))continue;
    assert.equal(text.split(before).length,2,'Unexpected braces implementation in '+target+'; fail closed');
    text=text.replace(before,after);
    changed=true;
  }
  if(changed)fs.writeFileSync(target,text);
};

const compileFile=require.resolve('braces/lib/compile');
patchFile(compileFile,[
  ["const walk = (node, parent = {}) => {","const walk = (node, parent = {}, depth = 0) => {\n    "+braceGuard],
  ["output += walk(child, node);","output += walk(child, node, depth + 1);"],
]);

const expandFile=require.resolve('braces/lib/expand');
patchFile(expandFile,[
  ["const walk = (node, parent = {}) => {","const walk = (node, parent = {}, depth = 0) => {\n    "+braceGuard],
  ["walk(child, node);","walk(child, node, depth + 1);"],
]);

const parseFile=require.resolve('braces/lib/parse');
patchFile(parseFile,[
  ["block = push({ type: 'paren', nodes: [] });\n      stack.push(block);","block = push({ type: 'paren', nodes: [] });\n      stack.push(block);\n      if (stack.length > "+(BRACE_DEPTH_LIMIT+1)+") throw new RangeError('brace nesting exceeds safe limit');"],
  ["block = push(brace);\n      stack.push(block);","block = push(brace);\n      stack.push(block);\n      if (stack.length > "+(BRACE_DEPTH_LIMIT+1)+") throw new RangeError('brace nesting exceeds safe limit');"],
]);

for(const file of [compileFile,expandFile,parseFile]){
  delete require.cache[file];
}
const braces=require('braces');
assert.deepEqual(braces.expand('asset-{1..3}-{a,b}'),['asset-1-a','asset-1-b','asset-2-a','asset-2-b','asset-3-a','asset-3-b']);
const deeplyNested='{'.repeat(BRACE_DEPTH_LIMIT+8)+'x'+'}'.repeat(BRACE_DEPTH_LIMIT+8);
assert.throws(()=>braces.compile(deeplyNested),/brace nesting exceeds safe limit/);

const deepAst={type:'root',nodes:[]};
let cursor=deepAst;
for(let i=0;i<BRACE_DEPTH_LIMIT+8;i++){
  const child={type:'node',nodes:[]};
  cursor.nodes=[child];
  cursor=child;
}
cursor.nodes=[{type:'text',value:'x'}];
assert.throws(()=>braces.compile(deepAst),/brace nesting exceeds safe limit/);
assert.throws(()=>require('braces/lib/expand')(deepAst),/brace nesting exceeds safe limit/);
console.log('PASS: braces nesting is bounded for parsing and public AST walkers');

