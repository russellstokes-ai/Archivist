const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {currentReview}=require('./assistMetadata/review.ts');
const w={fields:{genre:'Science Fiction'},manual:{genre:true},identityConfirmed:true};
assert.deepEqual(currentReview(w,['meaningful-genre-required','path-only-grouping-provisional']),[]);
assert.match(currentReview(w,['duplicate-part-number'])[0],/Multiple files share a part number/);
assert.match(currentReview({...w,identityConfirmed:false})[0],/help Assist identify this item/);
assert.deepEqual(currentReview({...w,fields:{genre:'Audio'}}),[],'Missing genre is enrichment, not an identity blocker');
console.log('PASS: current metadata clears stale warnings without hiding source conflicts');
