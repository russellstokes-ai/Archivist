const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspectELF,inspectDir}=require('../scripts/check-16kb-native-libs.cjs');
function elf(align){
  const bytes=Buffer.alloc(128);
  bytes.write('\x7fELF',0,'binary');bytes[4]=2;bytes[5]=1;
  bytes.writeBigUInt64LE(64n,32);
  bytes.writeUInt16LE(56,54);
  bytes.writeUInt16LE(1,56);
  bytes.writeUInt32LE(1,64);
  bytes.writeBigUInt64LE(0n,64+8);
  bytes.writeBigUInt64LE(0n,64+16);
  bytes.writeBigUInt64LE(BigInt(align),64+48);
  return bytes;
}
const valid=elf(16384);
assert.deepEqual(inspectELF(valid,'libsafe.so'),[]);
assert.match(inspectELF(elf(4096),'libold.so').join('|'),/needs 16384/);
assert.match(inspectELF(Buffer.from('not an elf'),'broken.so').join('|'),/not a valid ELF/);
const truncated=elf(16384);
truncated.writeBigUInt64LE(4096n,32);
assert.match(inspectELF(truncated,'truncated.so').join('|'),/truncated ELF/);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'archivist-16k-'));
try{
  fs.writeFileSync(path.join(temp,'libsafe.so'),valid);
  assert.equal(inspectDir(temp).problems.length,0);
  fs.writeFileSync(path.join(temp,'libold.so'),elf(4096));
  assert.equal(inspectDir(temp).problems.length,1);
}finally{fs.rmSync(temp,{force:true,recursive:true});}
console.log('PASS: 16 KB native ELF validation rejects 4 KB load segments and truncated/corrupt binaries');
