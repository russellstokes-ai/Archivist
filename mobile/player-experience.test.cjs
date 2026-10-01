const fs=require('fs');const vm=require('vm');const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};const req=(id)=>id==='./playback'?{}:require(id);vm.runInNewContext(`(function(require,module,exports){${out}\n})(req,module,module.exports)`,{req,require:req,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/playerExperience.ts');const assert=(v,m)=>{if(!v)throw Error(m)};
assert(x.playerMotionState({playing:true,visible:true,reduceMotion:false})==='turning','playing motion');
assert(x.playerMotionState({playing:true,visible:true,reduceMotion:true})==='open','reduced motion');
assert(x.playerMotionState({playing:true,visible:false,reduceMotion:false})==='closed','offscreen motion suspended');
let marks=x.addBookmark([],{workKey:'server-work:x:1',seconds:12.34,label:'Clue',now:'2026-10-01T12:00:00Z'});assert(marks.length===1&&marks[0].seconds===12.3,'bookmark add');marks=x.addBookmark(marks,{workKey:'server-work:x:1',seconds:12.4});assert(marks.length===1,'near duplicate bookmark');
const tracks=[{id:1},{id:2},{id:3}];assert(x.applyTrackOrder(tracks,['3','1'],t=>String(t.id)).map(t=>t.id).join(',')==='3,1,2','saved track order');assert(x.moveTrackOrder(tracks,1,-1,t=>String(t.id)).join(',')==='2,1,3','move order');
let chapters=[{title:'One',start:0,end:100},{title:'Two',start:100,end:200}];chapters=x.splitChapter(chapters,0,40);assert(chapters.length===3&&chapters[1].start===40,'split chapter');chapters=x.mergeChapter(chapters,0);assert(chapters.length===2&&chapters[0].end===100,'merge chapter');chapters=x.setChapterBoundary(chapters,1,120);assert(chapters[0].end===120&&chapters[1].start===120,'boundary edit');chapters=x.renameChapter(chapters,1,'Ending');assert(chapters[1].title==='Ending','rename');
console.log('player-experience.test.cjs passed');
