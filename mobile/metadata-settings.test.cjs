const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {defaultMetadataSettings,sanitizeMetadataSettings,metadataProvidersEnabled}=require('./metadataSettings.ts');

assert.deepEqual(sanitizeMetadataSettings(null),defaultMetadataSettings);
const saved=sanitizeMetadataSettings({
  onlineEnabled:false,
  automaticEnrichment:false,
  applyHighConfidence:false,
  books:{enabled:true,openLibrary:false,googleBooks:true},
  comics:{enabled:false,metron:false},
});
assert.equal(saved.onlineEnabled,false);
assert.equal(saved.automaticEnrichment,false);
assert.equal(saved.applyHighConfidence,false);
assert.equal(saved.books.openLibrary,false);
assert.equal(saved.books.googleBooks,true);
assert.equal(saved.comics.enabled,false);
assert.deepEqual(metadataProvidersEnabled(saved),{books:false,comics:false});

const partial=sanitizeMetadataSettings({books:{googleBooks:true}});
assert.equal(partial.onlineEnabled,true);
assert.equal(partial.books.openLibrary,true);
assert.equal(partial.books.googleBooks,true);
assert.equal(partial.comics.metron,true);

console.log('PASS: metadata provider settings have safe defaults and stable persistence sanitisation');
