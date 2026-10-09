const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=JSON.parse(fs.readFileSync(__dirname+'/app.json','utf8'));
const gradle=fs.readFileSync(__dirname+'/android/app/build.gradle','utf8');
const stamp=JSON.parse(fs.readFileSync(__dirname+'/buildStamp.json','utf8'));
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');
const workflow=fs.readFileSync(__dirname+'/../.github/workflows/android-apk.yml','utf8');
assert.equal(app.expo.android.package,'app.archivist.reader','upgrades MUST keep package identity');
assert.equal(app.expo.android.versionCode,109,'Test24 must supersede Test23 code108');
assert.match(gradle,/versionCode\s+109/);
assert.match(gradle,/versionName\s+"0\.9\.4-test24"/);
assert.equal(stamp.candidate,'Test 24 SAF work-grouping candidate');
assert.ok(source.includes("import buildStamp from './buildStamp.json'"));
assert.ok(source.includes("buildStamp.sourceCommit.slice(0,9)"),'Settings About must show exact source fingerprint');
assert.ok(source.includes('Export scanner trace'),'real device must be able to export stage timing evidence');
assert.match(workflow,/TEST_BUILD:\s*'23-scanner-device-truth'/);
assert.ok(workflow.includes('feature/test23-scanner-device-truth-20261008'));
assert.ok(workflow.includes('Stamp and verify Test 23 source identity'));
assert.ok(workflow.includes('Verify exact SHA provenance inside the signed APK'));
assert.ok(workflow.includes('archivist-provenance.json'));
assert.ok(workflow.includes('sourceCommit:sha'),'source fingerprint must come from checked-out GitHub SHA, not a label');
const upgraded=fs.readFileSync(__dirname+'/../.github/workflows/android-test24-gate.yml','utf8');
assert.ok(upgraded.includes('342-file library')&&upgraded.includes('Publish direct APK only after native acceptance passes'),
  'Test24 release MUST be gated on a real 342-MP3 Android scan, never code tests alone');
assert.ok(upgraded.includes('Archivist-Test-24.apk')&&upgraded.includes('versionCode')===false,
  'Test24 candidate must be distinguishable by direct APK filename');
const installedName=fs.readFileSync(__dirname+'/android/app/src/main/res/values/strings.xml','utf8');
assert.ok(installedName.includes('Archivist Test 24'),'installed launcher label must identify the Test24 build');
console.log('PASS: Test23 provenance gate preserved; Test24 unique code, installed name and native 342-file release gate verified');
