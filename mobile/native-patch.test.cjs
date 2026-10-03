const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(pkg.scripts?.postinstall,undefined,'Do not patch expo-audio during install; keep startup on the upstream native module.');
const gradle=fs.readFileSync(path.join(__dirname,'android','gradle.properties'),'utf8');
assert.equal(gradle.includes('newArchEnabled=true'),true,'Archivist native builds use React Native New Architecture.');
assert.equal(gradle.includes('hermesEnabled=true'),true,'Expo production builds should use Hermes.');
assert.equal(gradle.includes('expo.useLegacyPackaging=false'),true,'Expo production builds should use modern native-library packaging.');
assert.equal(gradle.includes('edgeToEdgeEnabled=true'),true,'Expo production builds should use the current edge-to-edge default.');
console.log('PASS: Android startup configuration matches current Expo production defaults');

const appPkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
assert.equal(appPkg.dependencies?.['expo-asset'],'~55.0.20','Expo SDK 55 standalone audio builds require the matching expo-asset dependency.');
assert.equal(appPkg.dependencies?.['expo-file-system'],'~55.0.26','Use the Expo SDK 55 file-system native module.');
const manifest=fs.readFileSync(path.join(__dirname,'android','app','src','main','AndroidManifest.xml'),'utf8');
assert.equal(manifest.includes('android.permission.RECORD_AUDIO'),false,'Archivist playback does not request microphone access.');
assert.equal(manifest.includes('android.permission.POST_NOTIFICATIONS'),true,'Background media controls require Android 13+ notification permission declaration.');
assert.equal(manifest.includes('android:usesCleartextTraffic="true"'),true,'Android must permit HTTP transport after Archivist validates that the server is a private LAN or Tailscale address.');
const appConfig=JSON.parse(fs.readFileSync(path.join(__dirname,'app.json'),'utf8'));
const appGradle=fs.readFileSync(path.join(__dirname,'android','app','build.gradle'),'utf8');
const nativeVersion=(appGradle.match(/versionName\s+"([^"]+)"/)||[])[1];
assert.equal(appConfig.expo?.version,pkg.version,'Expo app version must match package.json.');
assert.equal(nativeVersion,pkg.version,'Android versionName must match Expo/package metadata.');
const nativeCode=Number((appGradle.match(/versionCode\s+(\d+)/)||[])[1]);
assert.equal(appConfig.expo?.android?.versionCode,nativeCode,'Expo Android versionCode must match the native Gradle versionCode.');

assert.equal(appConfig.expo?.android?.permissions?.includes('android.permission.POST_NOTIFICATIONS'),true,'Expo config must preserve the media notification permission on native regeneration.');
assert.equal(appConfig.expo?.plugins?.includes('./plugins/withCleartextTraffic'),true,'Expo config must register the private-server transport plugin.');
const cleartextPlugin=fs.readFileSync(path.join(__dirname,'plugins','withCleartextTraffic.js'),'utf8');
assert.equal(cleartextPlugin.includes("android:usesCleartextTraffic"),true,'The Expo plugin must preserve private-server HTTP support on future native regeneration.');
