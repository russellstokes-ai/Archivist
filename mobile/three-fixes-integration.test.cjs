'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {test}=require('node:test');
const {effectiveSource,manifests,isPatched,cacheKey}=require('./threeFixes/source.cjs');
test('effective sources are exact reversible changes on the accepted application and scanner only',()=>{
 const entries=manifests();assert.equal(entries.length,2);
 for(const item of entries){
  let original=item.code;
  for(const {before,after}of [...item.edits].reverse())original=original.replace(after,()=>before);
  assert.equal(original,fs.readFileSync(item.file,'utf8').replace(/\r\n/g,'\n'));
  assert.notEqual(item.baseGitBlob,item.effectiveGitBlob);
  assert.throws(()=>effectiveSource(item.file,original+'\n// unreviewed change'));
 }
 for(const file of ['LivingBookCanvas.tsx','localReader.ts','scannerVNext/publication.ts','scannerVNext/metadataWrites.ts']){
  const filename=path.join(__dirname,file),source=fs.readFileSync(filename,'utf8');
  assert.equal(isPatched(filename),false);assert.equal(effectiveSource(filename,source),source);
 }
});
test('Metro and full-program TypeScript checks consume the same explicit effective source',()=>{
 const config=require('./metro.config.js');
 assert.equal(config.transformer.babelTransformerPath,require.resolve('./threeFixes/metroTransformer.cjs'));
 assert.ok(config.cacheVersion.includes(cacheKey));
 const transformer=fs.readFileSync(path.join(__dirname,'threeFixes/metroTransformer.cjs'),'utf8');
 assert.ok(transformer.includes('effectiveSource(args.filename,args.src)'));
 const pkg=require('./package.json');assert.ok(pkg.scripts.typecheck.includes('tsc --noEmit'));assert.ok(pkg.scripts.typecheck.includes('threeFixes/typecheck.cjs'));
 const checker=fs.readFileSync(path.join(__dirname,'threeFixes/typecheck.cjs'),'utf8');assert.ok(checker.includes('effectiveSource(file,fs.readFileSync'));
});
