const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {possibleLocalDuplicateGroups}=require('./duplicates.ts');
const base={author:'Frank Herbert',series:'Dune',format:'EPUB',space:'Books',available:true};
const groups=possibleLocalDuplicateGroups([
  {id:1,uri:'content://one',title:'Dune',...base},
  {id:2,uri:'content://two',title:'Dune ',...base},
  {id:3,uri:'content://three',title:'Dune Messiah',...base},
  {id:4,uri:'content://four',title:'Dune',...base,format:'Audio'},
]);
assert.equal(groups.length,1);
assert.equal(groups[0].items.length,2);
assert.match(groups[0].reason,/not byte-verified/);

const unknown=possibleLocalDuplicateGroups([
  {id:1,uri:'a',title:'Untitled',...base},
  {id:2,uri:'b',title:'Untitled',...base},
]);
assert.equal(unknown.length,0);

console.log('PASS: local duplicate candidates are conservative and explicitly unverified');
