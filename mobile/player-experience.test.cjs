const fs=require('fs');const vm=require('vm');const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};const req=(id)=>id==='./playback'?{}:require(id);vm.runInNewContext(`(function(require,module,exports){${out}\n})(req,module,module.exports)`,{req,require:req,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/playerExperience.ts');const assert=(v,m)=>{if(!v)throw Error(m)};
assert(x.playerMotionState({playing:true,visible:true,reduceMotion:false})==='turning','playing motion');
assert(x.playerMotionState({playing:true,visible:true,reduceMotion:true})==='open','reduced motion');
assert(x.playerMotionState({playing:true,visible:false,reduceMotion:false})==='closed','offscreen motion suspended');
assert(x.playerMotionState({playing:false,visible:true,reduceMotion:false})==='closed','paused player closes');
assert(x.playerMotionState({playing:false,visible:true,reduceMotion:true})==='closed','paused reduced-motion player closes without animation');
assert(x.PLAYER_MOTION_TIMING.pauseGraceMs>=300&&x.PLAYER_MOTION_TIMING.pauseGraceMs<=600,'seek/buffer flicker grace must be short and intentional');
assert(x.PLAYER_MOTION_TIMING.openMs>=750,'book opening should feel deliberate rather than snap open');
assert(x.PLAYER_MOTION_TIMING.firstTurnDelayMs<700,'first page motion should begin promptly after Play');
assert(x.PLAYER_MOTION_TIMING.pageTurnMs>=1200,'page turn should be slow enough to read as a physical page');
assert(x.PLAYER_MOTION_TIMING.pageRestMs>=200,'ambient page turns should remain restrained rather than distracting');
let marks=x.addBookmark([],{workKey:'server-work:x:1',seconds:12.34,label:'Clue',now:'2026-10-01T12:00:00Z'});assert(marks.length===1&&marks[0].seconds===12.3,'bookmark add');marks=x.addBookmark(marks,{workKey:'server-work:x:1',seconds:12.4});assert(marks.length===1,'near duplicate bookmark');
const tracks=[{id:1},{id:2},{id:3}];assert(x.applyTrackOrder(tracks,['3','1'],t=>String(t.id)).map(t=>t.id).join(',')==='3,1,2','saved track order');assert(x.moveTrackOrder(tracks,1,-1,t=>String(t.id)).join(',')==='2,1,3','move order');
let chapters=[{title:'One',start:0,end:100},{title:'Two',start:100,end:200}];chapters=x.splitChapter(chapters,0,40);assert(chapters.length===3&&chapters[1].start===40,'split chapter');chapters=x.mergeChapter(chapters,0);assert(chapters.length===2&&chapters[0].end===100,'merge chapter');chapters=x.setChapterBoundary(chapters,1,120);assert(chapters[0].end===120&&chapters[1].start===120,'boundary edit');chapters=x.renameChapter(chapters,1,'Ending');assert(chapters[1].title==='Ending','rename');
console.log('player-experience.test.cjs passed');

assert(x.PLAYER_MOTION_TIMING.pageTurnMs+x.PLAYER_MOTION_TIMING.pageRestMs<=2000,'user requested a complete turn every one to two seconds');
assert(x.livingBookHingeDuration(0,1,900,false)===900,'full open must use the full opening duration');
assert(x.livingBookHingeDuration(.5,1,900,false)===450,'half-open reversal must use only remaining hinge travel');
assert(x.livingBookHingeDuration(.75,0,700,false)===525,'closing duration must scale from current hinge position');
assert(x.livingBookHingeDuration(.5,1,900,true)===0,'reduced motion must remove hinge animation');
assert(x.livingBookHingeDuration(1,1,900,false)===0,'settled hinge must not restart an animation');

