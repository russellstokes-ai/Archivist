const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);
const {reconcileScan,scanPhaseLabel,scanPhaseStep,scanProgressPercent}=require('./scanFeedback.ts');
const base={author:'A',series:'',genre:'',format:'EPUB',space:'Books',available:true};
const before=[
  {id:1,uri:'one',title:'One',fileSize:10,modificationTime:1,...base},
  {id:2,uri:'two',title:'Two',fileSize:20,modificationTime:1,...base},
  {id:3,uri:'gone',title:'Gone',fileSize:30,modificationTime:1,...base},
];
const after=[
  {id:1,uri:'one',title:'One',fileSize:10,modificationTime:1,...base},
  {id:2,uri:'two',title:'Two revised',fileSize:20,modificationTime:2,...base},
  {id:4,uri:'new',title:'New',fileSize:40,modificationTime:1,...base},
];
assert.deepEqual(reconcileScan(before,after),{added:1,updated:1,removed:1,unchanged:1});
assert.equal(scanPhaseLabel('reading-metadata'),'Reading metadata');
assert.equal(scanPhaseLabel('checking-duplicates'),'Checking duplicates');
assert.equal(scanPhaseStep('preparing'),4);
assert.equal(scanPhaseLabel('covers'),'Finding covers');
assert.equal(scanProgressPercent({phase:'reading-metadata',currentFolder:'',entriesVisited:50,found:100,review:3,processed:50,total:100}),37);
assert.equal(scanProgressPercent({phase:'complete',currentFolder:'',entriesVisited:100,found:100,review:3,processed:100,total:100}),100);
console.log('PASS: scan feedback reports phases and reconciled changes');
