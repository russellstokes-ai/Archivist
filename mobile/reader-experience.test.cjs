const fs=require('fs'),vm=require('vm'),ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};vm.runInNewContext(`(function(require,module,exports){${out}\n})(require,module,module.exports)`,{require,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/readerExperience.ts');const a=(v,m)=>{if(!v)throw Error(m)};
let b=x.toggleReaderBookmark([], 'server-work:https://home:42', 7);a(b.length===1&&b[0].page===7,'bookmark add');b=x.toggleReaderBookmark(b,'server-work:https://home:42',7);a(b.length===0,'bookmark toggle');
let notes=x.addReaderAnnotation([],{workKey:'w',page:3,kind:'highlight',text:'  hello  '});a(notes[0].text==='hello','trim annotation');
notes=x.addReaderAnnotation(notes,{workKey:'w',page:4,kind:'note',text:'quote',note:' thought '});a(notes[0].note==='thought','trim note');
a(x.sanitizeReaderAppearance({scale:9,theme:'sepia'}).scale===1.5,'appearance clamp');
a(x.sanitizeReaderBookmarks([{workKey:'w',page:2,id:'x'}]).length===1,'bookmark sanitize');
console.log('reader-experience.test.cjs passed');
