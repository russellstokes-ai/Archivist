const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(pkg.scripts?.postinstall,undefined,'Do not patch expo-audio during install; keep startup on the upstream native module.');
const gradle=fs.readFileSync(path.join(__dirname,'android','gradle.properties'),'utf8');
assert.equal(gradle.includes('newArchEnabled=true'),true,'React Native 0.86 requires New Architecture.');
assert.equal(gradle.includes('hermesEnabled=true'),true,'Expo production builds should use Hermes.');
assert.equal(gradle.includes('expo.useLegacyPackaging=false'),true,'Expo production builds should use modern native-library packaging.');
assert.equal(gradle.includes('edgeToEdgeEnabled=true'),true,'Expo production builds should use the current edge-to-edge default.');
console.log('PASS: Android startup configuration matches current Expo production defaults');

const appPkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(appPkg.dependencies?.['expo-asset'],'~57.0.18','expo-audio needs expo-asset installed directly in standalone builds.');
assert.equal(appPkg.dependencies?.['expo-file-system'],'~57.0.7','Use the Expo SDK 57 file-system native module.');
const manifest=fs.readFileSync(path.join(__dirname,'android','app','src','main','AndroidManifest.xml'),'utf8');
assert.equal(manifest.includes('android.permission.RECORD_AUDIO'),false,'Archivist playback does not request microphone access.');
