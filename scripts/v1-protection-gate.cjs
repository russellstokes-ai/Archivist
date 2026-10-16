#!/usr/bin/env node
'use strict';
// Reproduces the Git blob SHA-1 used in PROTECTED_BLOB_LOCKS.json.
// Fails closed if any approved Archivist experience or art asset changes.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/PROTECTED_BLOB_LOCKS.json'),'utf8'));
// Original canonical SHA remains in the immutable lock manifest. The owner
// approved one *exact* new App.tsx blob for narrowly specified logic only.
// Any further byte change requires a new explicitly reviewed approved SHA.
const approved=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json'),'utf8'));
const one=manifest.locks.find(entry=>entry.path==='mobile/App.tsx');
if(approved.schema_version!==1||approved.baseline_path!=='mobile/App.tsx'||
   approved.original_git_blob_sha!==one?.git_blob_sha||
   !/^[0-9a-f]{40}$/.test(approved.approved_git_blob_sha)||
   approved.release_approved!==false)
  throw Error('Invalid or broadened Archivist approved logic exception');
let excepted=0;
let failures=0;
for(const item of manifest.locks){
  const absolute=path.resolve(root,item.path);
  if(!absolute.startsWith(root+path.sep))throw Error('Invalid lock path: '+item.path);
  if(!fs.existsSync(absolute)){console.error('PROTECTED FILE MISSING:',item.path);failures++;continue}
  const bytes=fs.readFileSync(absolute);
  const actual=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  if(actual===item.git_blob_sha)continue;
  if(item.path==='mobile/App.tsx'&&actual===approved.approved_git_blob_sha){
    excepted++;
    continue;
  }
  console.error('PROTECTED FILE CHANGED:',item.path,'expected original',item.git_blob_sha,'actual',actual);
  failures++;
}
if(failures){
  console.error('BLOCKED:',failures,'locked file(s) changed. Obtain separate user approval before changing the protection manifest.');
  process.exit(1);
}
console.log('PASS:',manifest.locks.length-excepted,'original protected blobs and',
  excepted,'exact owner-approved logic-only App.tsx blob; no other locked changes.');
