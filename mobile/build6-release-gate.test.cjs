const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=JSON.parse(fs.readFileSync(__dirname+'/app.json','utf8'));
const pkg=JSON.parse(fs.readFileSync(__dirname+'/package.json','utf8'));
const gradle=fs.readFileSync(__dirname+'/android/app/build.gradle','utf8');
const apkWorkflow=fs.readFileSync(__dirname+'/../.github/workflows/android-apk.yml','utf8');
const androidWorkflow=fs.readFileSync(__dirname+'/../.github/workflows/android-check.yml','utf8');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.equal(pkg.version,'0.9.5');
assert.equal(app.expo.version,'0.9.5');
assert.equal(app.expo.android.versionCode,105);
assert.match(gradle,/versionCode\s+105/);
assert.match(gradle,/versionName\s+"0\.9\.5"/);
assert.match(apkWorkflow,/TEST_BUILD:\s*'14'/);
assert.ok(apkWorkflow.includes('workflow_dispatch:'),'0.9.5 APK workflow must remain explicitly dispatchable after review approval');
assert.ok(apkWorkflow.includes('Android test-release lint'),'release APK gate must lint the optimized release variant');
assert.ok(apkWorkflow.includes('Verify test APK package, signature and alignment'),'release gate must verify package, signature and zip alignment');
assert.ok(apkWorkflow.includes('Launch test APK in Android emulator'),'release gate must install and cold-launch the APK');
assert.ok(androidWorkflow.includes('Compile Android Kotlin')&&androidWorkflow.includes('Merge Android manifest'),'native Kotlin and manifest gates must remain active');
assert.ok(source.includes('const brandedLaunchHoldMs=1600')&&source.includes('const brandedLaunchFadeMs=380'),'Build 6 must retain the deliberate branded cold launch');
assert.ok(source.includes('cacheOnlineCoverUris')&&source.includes('persistOnlineCover'),'0.9.5 must retain durable automatic and user-accepted provider-cover caching');
assert.ok(source.includes('await enrichPublishedLocalLibrary(result.books,generation,forceOnline)')&&source.includes('libraryRefreshRunningRef'),'refresh must keep discovery and enrichment inside one cancellable job');

console.log('PASS: Build 6 release metadata, APK verification, native gates and commercial refinements are locked');
