const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, file);

const {buildAndroidAutoCatalogue} = require('./androidAuto.ts');

const catalogue = buildAndroidAutoCatalogue([
  {key:'audio-1',title:'The Long Way Home',author:'A. Writer',series:'Journeys',genre:'Travel',format:'Audio',available:true,readingState:'in-progress',favourite:true,source:'server'},
  {key:'audio-1',title:'Duplicate',format:'Audio',available:true},
  {key:'book-1',title:'Paper Book',format:'EPUB',available:true},
  {key:'audio-offline',title:'Unavailable Audio',format:'Audio',available:false},
  {key:'audio-2',title:'Second Book',format:'Audio',available:true,readingState:'finished',source:'downloaded'},
  {key:'',title:'Missing ID',format:'Audio',available:true},
]);

assert.deepEqual(catalogue,[
  {id:'audio-1',title:'The Long Way Home',author:'A. Writer',series:'Journeys',genre:'Travel',readingState:'in-progress',favourite:true,source:'server'},
  {id:'audio-2',title:'Second Book',author:'',series:'',genre:'',readingState:'finished',favourite:false,source:'downloaded'},
]);
assert.equal(buildAndroidAutoCatalogue([{key:'a',title:' A ',format:'Audio',available:true}])[0].title,'A');
console.log('PASS: Android Auto catalogue exposes only available, deduplicated audiobooks with safe metadata');
