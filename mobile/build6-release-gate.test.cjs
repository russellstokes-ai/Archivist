const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=JSON.parse(fs.readFileSync(__dirname+'/app.json','utf8'));
const pkg=JSON.parse(fs.readFileSync(__dirname+'/package.json','utf8'));
const gradle=fs.readFileSync(__dirname+'/android/app/build.gradle','utf8');
const apkWorkflow=fs.readFileSync(__dirname+'/../.github/workflows/android-apk.yml','utf8');
const androidWorkflow=fs.readFileSync(__dirname+'/../.github/workflows/android-check.yml','utf8');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.equal(pkg.version,'0.9.4-test24','current candidate must have an independent version name');
assert.equal(app.expo.version,pkg.version,'Expo and package metadata must remain aligned');
assert.equal(app.expo.android.versionCode,109,'Test24 must be a distinguishable upgrade from code108');
assert.match(gradle,/versionCode\s+109/);
assert.match(gradle,/versionName\s+"0\.9\.4-test24"/);
assert.match(apkWorkflow,/TEST_BUILD:\s*'(?:18-editor-render|19-reliability|20-work-grouping|21-scanner-book-loader|22-scanner-quality-gates|23-scanner-device-truth)'/);
assert.ok(apkWorkflow.includes('build/0.9.4-test12-20261005'),'Test 13 branch must produce the verified APK');
assert.ok(apkWorkflow.includes('Android test-release lint'),'release APK gate must lint the optimized release variant');
assert.ok(apkWorkflow.includes('Verify test APK package, signature and alignment'),'release gate must verify package, signature and zip alignment');
assert.ok(apkWorkflow.includes('Launch test APK in Android emulator'),'release gate must install and cold-launch the APK');
assert.ok(androidWorkflow.includes('Compile Android Kotlin')&&androidWorkflow.includes('Merge Android manifest'),'native Kotlin and manifest gates must remain active');
assert.ok(source.includes('const brandedLaunchHoldMs=1600')&&source.includes('const brandedLaunchFadeMs=380'),'Build 6 must retain the deliberate branded cold launch');
assert.ok(source.includes("import {cacheOnlineCoverUris} from './onlineCoverCache'"),'Build 6 must retain durable provider-cover caching');
assert.ok(source.includes('await enrichPublishedLocalLibrary(result.books,generation,forceOnline)')&&source.includes('libraryRefreshRunningRef'),'refresh must keep discovery and enrichment inside one cancellable job');

console.log('PASS: Build 6 release metadata, APK verification, native gates and commercial refinements are locked');
