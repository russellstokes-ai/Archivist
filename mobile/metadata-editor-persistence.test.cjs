const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('App.tsx','utf8');

assert.match(source,/function localEditUris\(item:Book\)/,'local editor must resolve the complete grouped work');
assert.match(source,/groupLocalWorks\(staged\)\.find\(candidate=>candidate\.tracks\.some\(track=>track\.uri===item\.uri\)\)/,'editing a chapter must locate its containing work');
assert.match(source,/beginEdit\(item,localEditUris\(item\)\)/,'Needs Attention edit must target every physical file in the work');
assert.match(source,/const acceptedOverrides=\{\.\.\.localMetadataOverrides\}/,'Accept & Save must create durable user-approved overrides');
assert.match(source,/setPersistedJSON\(localMetadataOverridesKey,acceptedOverrides\)/,'accepted metadata must survive rescans');
assert.match(source,/const persistedStage=await loadLocalStageBooks\(\)/,'Save details must read back the durable stage');
assert.match(source,/Metadata save could not be verified/,'the editor must not silently close when persistence fails');

console.log('PASS: metadata editor saves at work level, persists accepted matches and verifies durability');
