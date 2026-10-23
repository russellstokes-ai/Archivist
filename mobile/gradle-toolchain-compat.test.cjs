const assert=require('node:assert/strict'),patch=require('./patch-gradle-toolchain.cjs');
const old='plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }';
const updated=patch(old);assert.ok(updated.includes('version("1.0.0")'));assert.equal(patch(updated),updated);
assert.throws(()=>patch(old+old),/changed/);assert.throws(()=>patch(old.replace('0.5.0','0.9.0')),/changed/);
console.log('PASS: pinned Gradle 9 resolver patch is idempotent and rejects unexpected dependency changes');
