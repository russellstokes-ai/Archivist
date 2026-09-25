const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(pkg.scripts?.postinstall,undefined,'Do not patch expo-audio during install; keep startup on the upstream native module.');
assert.equal(fs.readFileSync(path.join(__dirname,'android','gradle.properties'),'utf8').includes('newArchEnabled=false'),true);
console.log('PASS: Android compatibility startup mode uses upstream expo-audio and legacy React Native architecture');
