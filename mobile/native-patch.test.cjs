const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(pkg.scripts?.postinstall,undefined,'Do not patch expo-audio during install; keep startup on the upstream native module.');
const gradle=fs.readFileSync(path.join(__dirname,'android','gradle.properties'),'utf8');
assert.equal(gradle.includes('newArchEnabled=true'),true,'React Native 0.86 requires New Architecture.');
assert.equal(gradle.includes('hermesEnabled=false'),true,'Compatibility build should use JSC.');
assert.equal(gradle.includes('expo.useLegacyPackaging=true'),true,'Compatibility build should use legacy native-library packaging.');
console.log('PASS: Android startup configuration uses upstream expo-audio, required New Architecture, JSC, and legacy packaging');
