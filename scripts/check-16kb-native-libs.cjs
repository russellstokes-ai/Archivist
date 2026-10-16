#!/usr/bin/env node
'use strict';
// Static ELF64 PT_LOAD alignment check for Android native arm64 libraries.
// zipalign -P 16 checks ZIP entry placement, NOT linker segment p_align.
const fs=require('node:fs'),path=require('node:path');
const REQUIRED=16384n;
function inspectELF(bytes,name){
  const failures=[];
  if(bytes.length<64||bytes.toString('ascii',0,4)!=='\x7fELF')return [name+': not a valid ELF binary'];
  if(bytes[4]!==2||bytes[5]!==1)return [name+': expected 64-bit little-endian Android ELF'];
  const phoff=bytes.readBigUInt64LE(32);
  const phentsize=bytes.readUInt16LE(54),phnum=bytes.readUInt16LE(56);
  if(!phnum||phnum>4096||phentsize<56)return [name+': invalid ELF program header table'];
  const tableEnd=phoff+BigInt(phentsize)*BigInt(phnum);
  if(tableEnd>BigInt(bytes.length))return [name+': truncated ELF headers'];
  let loadCount=0;
  for(let i=0;i<phnum;i++){
    const off=Number(phoff)+i*phentsize;
    if(bytes.readUInt32LE(off)!==1)continue;
    loadCount++;
    const offset=bytes.readBigUInt64LE(off+8);
    const virtual=bytes.readBigUInt64LE(off+16);
    const align=bytes.readBigUInt64LE(off+48);
    if(align<REQUIRED)failures.push(name+': PT_LOAD '+i+' has '+align+'-byte alignment (needs 16384)');
    if(align!==0n&&offset%align!==virtual%align)
      failures.push(name+': PT_LOAD '+i+' has inconsistent memory/file alignment');
  }
  if(loadCount===0)failures.push(name+': no loadable ELF segments');
  return failures;
}
function inspectDir(root){
  const problems=[];let count=0;
  const visit=dir=>{
    for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
      const file=path.join(dir,ent.name);
      if(ent.isDirectory()){visit(file);continue}
      if(!ent.isFile()||!ent.name.endsWith('.so'))continue;
      count++;
      problems.push(...inspectELF(fs.readFileSync(file),file));
    }
  };
  visit(root);
  if(!count)problems.push('No arm64 native .so libraries found for validation');
  return {count,problems};
}
if(require.main===module){
  const dir=process.argv[2];
  if(!dir||!fs.existsSync(dir)||!fs.statSync(dir).isDirectory()){
    console.error('Usage: node check-16kb-native-libs.cjs <extracted-arm64-v8a-lib-dir>');
    process.exitCode=2;
  }else{
    const result=inspectDir(dir);
    for(const problem of result.problems)console.error('16KB BLOCKER:',problem);
    if(result.problems.length)process.exitCode=1;
    else console.log('PASS:',result.count,'arm64 native ELF libraries have 16KB PT_LOAD alignment');
  }
}
module.exports={inspectELF,inspectDir};
