const assert=require('node:assert/strict');
const fs=require('node:fs');

const here=__dirname;
const read=name=>fs.readFileSync(here+'/'+name,'utf8');
const app=JSON.parse(read('app.json'));
const pkg=JSON.parse(read('package.json'));
const gradle=read('android/app/build.gradle');
const manifest=read('android/app/src/main/AndroidManifest.xml');
const apkWorkflow=fs.readFileSync(here+'/../.github/workflows/android-apk.yml','utf8');
const androidWorkflow=fs.readFileSync(here+'/../.github/workflows/android-check.yml','utf8');

const requiredGates=[
  'sprint10-library-pipeline.test.cjs',
  'sprint10-living-book-engine.test.cjs',
  'sprint10-comic-reader.test.cjs',
  'sprint10-now-persistence.test.cjs',
  'sprint10-reward-idempotency.test.cjs',
  'sprint10-android-auto.test.cjs',
];
for(const file of requiredGates)assert.ok(fs.existsSync(here+'/'+file),'missing Test 10 regression gate: '+file);

assert.equal(pkg.version,'0.9.4');
assert.equal(app.expo.version,'0.9.4');
assert.equal(app.expo.android.versionCode,100,'Test 10 must install as Android versionCode 100');
assert.match(gradle,/versionCode\s+100/);
assert.match(gradle,/versionName\s+"0\.9\.4"/);
assert.match(apkWorkflow,/TEST_BUILD:\s*'10'/);
assert.ok(apkWorkflow.includes('build/0.9.4-test10-20261005'),'final Test 10 branch must trigger the APK workflow');
assert.ok(apkWorkflow.includes('Android test-release lint'),'final APK must pass release lint');
assert.ok(apkWorkflow.includes('Verify test APK package, signature and alignment'),'final APK must verify package/version/signature/alignment');
assert.ok(apkWorkflow.includes('Launch test APK in Android emulator'),'final APK must cold-launch in the emulator');
assert.ok(androidWorkflow.includes('mobile/sprint10-final-release-gate.test.cjs'),'final Test 10 commit must also trigger Android native Kotlin/manifest validation on the same SHA');
assert.ok(manifest.includes('android:name=".ArchivistAutoService"')&&manifest.includes('androidx.media3.session.MediaButtonReceiver'),'final APK must retain Android Auto browse and resumption services');

assert.ok(read('sprint10-library-pipeline.test.cjs').includes('single-job'),'Sprint 1 scanner closure gate must remain present');
assert.ok(read('sprint10-living-book-engine.test.cjs').includes('single-hinge'),'Sprint 2 Living Book closure gate must remain present');
assert.ok(read('sprint10-comic-reader.test.cjs').includes('gesture arbitration'),'Sprint 3 comic closure gate must remain present');
assert.ok(read('sprint10-now-persistence.test.cjs').includes('durable Now'),'Sprint 4 persistence closure gate must remain present');
assert.ok(read('sprint10-reward-idempotency.test.cjs').includes('idempotency'),'Sprint 5 reward closure gate must remain present');
assert.ok(read('sprint10-android-auto.test.cjs').includes('Android Auto commercial'),'Sprint 6 car closure gate must remain present');

console.log('PASS: Test 10 Sprint 7 final release gate locks Sprints 1-6, versionCode 100 and verified APK packaging');
