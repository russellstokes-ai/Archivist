#!/usr/bin/env node
'use strict';
// Reproduces the Git blob SHA-1 used in PROTECTED_BLOB_LOCKS.json.
// Fails closed if any approved Archivist experience or art asset changes.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/PROTECTED_BLOB_LOCKS.json'),'utf8'));
let failures=0;
for(const item of manifest.locks){
  const absolute=path.resolve(root,item.path);
  if(!absolute.startsWith(root+path.sep))throw Error('Invalid lock path: '+item.path);
  if(!fs.existsSync(absolute)){console.error('PROTECTED FILE MISSING:',item.path);failures++;continue}
  const bytes=fs.readFileSync(absolute);
  const actual=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  if(actual!==item.git_blob_sha){
    console.error('PROTECTED FILE CHANGED:',item.path,'expected',item.git_blob_sha,'actual',actual);
    failures++;
  }
}
if(failures){
  console.error('BLOCKED:',failures,'locked file(s) changed. Obtain separate user approval before changing the protection manifest.');
  process.exit(1);
}
console.log('PASS:',manifest.locks.length,'protected Archivist source/art blobs match the approved development baseline.');
