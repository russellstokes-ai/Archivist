const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {lockLivingBookCoverSession}=require('./livingBookCover.ts');
const empty={key:'a',decision:{kind:'placeholder',source:'none',confidence:0}};
const cover={kind:'jacket',uri:'file:///identified.jpg',source:'jacket',confidence:1};
assert.equal(lockLivingBookCoverSession(empty,'a',cover).decision.uri,cover.uri);
assert.equal(lockLivingBookCoverSession({key:'a',decision:cover},'a',empty.decision).decision.uri,cover.uri);
assert.equal(lockLivingBookCoverSession({key:'a',decision:cover},'b',empty.decision).decision.uri,undefined);
console.log('PASS: late identification fills an empty jacket without leaking covers between books');
