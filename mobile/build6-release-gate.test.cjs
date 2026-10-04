const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=JSON.parse(fs.readFileSync(__dirname+'/app.json','utf8'));
const pkg=JSON.parse(fs.readFileSync(__dirname+'/package.json','utf8'));
const gradle=fs.readFileSync(__dirname+'/android/app/build.gradle','utf8');
const apkWorkflow=fs.readFileSync(__dirname+'/../.github/workflows/android-apk.yml','utf8');
const androidWorkflow=fs.readFileSync(__dirname+'/../.github/workflows/android-check.yml','utf8');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.equal(pkg.version,'0.9.4');
assert.equal(app.expo.version,'0.9.4');
assert.equal(app.expo.android.versionCode,96);
assert.match(gradle,/versionCode\s+96/);
assert.match(gradle,/versionName\s+"0\.9\.4"/);
assert.match(apkWorkflow,/TEST_BUILD:\s*'6'/);
assert.ok(apkWorkflow.includes('build/0.9.4-test6-20261004'),'Build 6 branch must produce the verified Test 6 APK');
assert.ok(apkWorkflow.includes('Android test-release lint'),'release APK gate must lint the optimized release variant');
assert.ok(apkWorkflow.includes('Verify test APK package, signature and alignment'),'release gate must verify package, signature and zip alignment');
assert.ok(apkWorkflow.includes('Launch test APK in Android emulator'),'release gate must install and cold-launch the APK');
assert.ok(androidWorkflow.includes('Compile Android Kotlin')&&androidWorkflow.includes('Merge Android manifest'),'native Kotlin and manifest gates must remain active');
assert.ok(source.includes('const brandedLaunchHoldMs=1600')&&source.includes('const brandedLaunchFadeMs=380'),'Build 6 must retain the deliberate branded cold launch');
assert.ok(source.includes("import {cacheOnlineCoverUris} from './onlineCoverCache'"),'Build 6 must retain durable provider-cover caching');
assert.ok(source.includes('if(forceOnline)await enrichment'),'explicit metadata refresh must complete truthfully');

console.log('PASS: Build 6 release metadata, APK verification, native gates and commercial refinements are locked');
