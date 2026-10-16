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
assert.equal(app.expo.android.versionCode,102);
assert.match(gradle,/versionCode\s+102/);
assert.match(gradle,/versionName\s+"0\.9\.4"/);
assert.match(apkWorkflow,/TEST_BUILD:\s*'13'/);
assert.ok(apkWorkflow.includes('workflow_dispatch:')&&apkWorkflow.includes('qa_confirmation'),'Test 13 QA APK must remain buildable through an explicitly confirmed manual workflow');
assert.ok(!apkWorkflow.includes('gh release create')&&!/^  push:/m.test(apkWorkflow),'A test APK must never be automatically published or replace the production app');
assert.ok(apkWorkflow.includes("app.archivist.reader.qa"),'Device acceptance APK must have a separate QA application ID');
assert.ok(apkWorkflow.includes('Android test-release lint'),'release APK gate must lint the optimized release variant');
assert.ok(apkWorkflow.includes('Verify test APK package, signature and alignment'),'release gate must verify package, signature and zip alignment');
assert.ok(apkWorkflow.includes('Launch test APK in Android emulator'),'release gate must install and cold-launch the APK');
assert.ok(androidWorkflow.includes('Compile Android Kotlin')&&androidWorkflow.includes('Merge Android manifest'),'native Kotlin and manifest gates must remain active');
assert.ok(source.includes('const brandedLaunchHoldMs=1600')&&source.includes('const brandedLaunchFadeMs=380'),'Build 6 must retain the deliberate branded cold launch');
assert.ok(source.includes("import {cacheOnlineCoverUris} from './onlineCoverCache'"),'Build 6 must retain durable provider-cover caching');
assert.ok(source.includes('await scanFreshFolders(localFolders')&&source.includes('signal:controller.signal')&&source.includes('libraryRefreshRunningRef'),'fresh refresh must retain one cancellable lifetime without the historical deep sweep');

console.log('PASS: Build 6 release metadata, APK verification, native gates and commercial refinements are locked');
