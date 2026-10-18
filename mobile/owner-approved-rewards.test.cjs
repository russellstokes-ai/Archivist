const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),lock=require('../docs/v1/OWNER_APPROVED_REWARDS_2026-10-18.json');
for(const [file,hash]of Object.entries(lock.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,'Owner-approved awards changed: '+file);
console.log('PASS: device-approved award assets and shimmer remain locked');
