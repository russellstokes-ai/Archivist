const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const raw=fs.readFileSync(__dirname+'/livingBookStage.ts','utf8');
const transpiled=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};vm.runInNewContext(transpiled,{module:mod,exports:mod.exports});
const {livingBookStageSize,LIVING_BOOK_STAGE_RATIO}=mod.exports;
const fixtures=[
  {width:320,height:720,fold:false},{width:390,height:844,fold:false},
  {width:480,height:920,fold:false},{width:600,height:720,fold:true},
  {width:720,height:900,fold:true},{width:960,height:1100,fold:true},
  {width:390,height:640,fold:false},
];
for(const viewport of fixtures){
  const size=livingBookStageSize({...viewport,topInset:24,bottomInset:24,embedded:true});
  assert(size.width>0&&size.height>0&&size.width<=viewport.width);
  assert(Math.abs(size.width/size.height-LIVING_BOOK_STAGE_RATIO)<.01,'keep exact display aspect');
  if(viewport.fold)assert(size.width<=Math.max(205,viewport.width-330),'reserve transport column');
  else assert(size.width<=viewport.width-32,'respect phone margins');
}
const standard=livingBookStageSize({width:390,height:844,fold:false,topInset:24,bottomInset:24,embedded:true});
assert(standard.width>340,'standard tall phone must enlarge the original 340dp stage');
const opened=livingBookStageSize({width:960,height:1100,fold:true,topInset:24,bottomInset:24,embedded:true});
assert(opened.width>340,'large Fold must make use of available artwork column');
const renderSource=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
assert(renderSource.includes('stageSize?:{width:number;height:number}'));
assert(renderSource.includes('style={[styles.stage,props.stageSize&&{width:props.stageSize.width,height:props.stageSize.height}]}'));
assert(renderSource.includes('function tick(now){'),'canonical animation loop must remain');
console.log('living-book-stage.test.cjs passed (outer-stage sizing only)');
