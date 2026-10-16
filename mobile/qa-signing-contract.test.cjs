// A QA APK must be installable without production signing but MUST have a
// different application ID and may never bypass Play upload-key requirements.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),mobile=__dirname;
const gradle=fs.readFileSync(path.join(mobile,'android/app/build.gradle'),'utf8');
const workflow=fs.readFileSync(path.join(repo,'.github/workflows/android-apk.yml'),'utf8');
const check=fs.readFileSync(path.join(repo,'.github/workflows/android-check.yml'),'utf8');
const app=JSON.parse(fs.readFileSync(path.join(mobile,'app.json'),'utf8'));
assert.equal(app.expo.android.package,'app.archivist.reader');
assert.match(gradle,/def archivistQATest = .*findProperty\('archivistQATest'\)/,
  'QA variant must require an explicit Gradle opt-in');
assert.match(gradle,/if \(archivistQATest\) applicationIdSuffix '\.qa'/,
  'QA APK must NEVER share the production app identifier');
assert.match(gradle,/if \(archivistQATest\) signingConfig signingConfigs\.debug/,
  'only an explicitly opted-in QA APK may use debug signing');
assert.match(gradle,/bundleRelease/,'bundle release must be guarded');
assert.match(gradle,/if \(archivistQATest &&.*bundleRelease/,
  'production Play bundle may NEVER be produced under QA/debug signing flag');
assert.match(gradle,/ARCHIVIST_UPLOAD_KEY_ALIAS/,'production signing remains user-supplied');
assert.match(workflow,/-ParchivistQATest=true/);
assert.match(workflow,/package: name='app\.archivist\.reader\.qa'/,
  'QA workflow must reject production app ID');
assert(!/^  push:/m.test(workflow),
  'QA APK must not automatically upload from arbitrary main/development push');
assert(!workflow.includes('gh release create')&&!workflow.includes('gh release upload'),
  'QA workflow must never automatically publish a public download');
assert.match(workflow,/check-16kb-native-libs\.cjs/,
  'QA build must check actual ELF program header alignment, not just zipalign');
assert.match(check,/qa-signing-contract\.test\.cjs/,
  'native checks must rerun when signing contracts change');
console.log('PASS: QA Android package ID and test signing are isolated; production AAB and public release remain strictly opt-in');
