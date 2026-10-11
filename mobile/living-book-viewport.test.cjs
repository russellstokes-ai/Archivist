const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,path)=>mod._compile(ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,path);
const {calculateLivingBookViewport:size}=require('./livingBookViewport.ts');
const cases=[
  [320,640,false],[360,740,false],[430,900,false],
  [600,740,true],[720,860,true],[820,900,true],[1100,900,true],
];
for(const [w,h,fold] of cases){
  const actual=size(w,h,fold);
  assert.ok(actual.width>0&&actual.height>0,'stage positive');
  assert.ok(actual.width<= (fold?480:430),'stage capped');
  assert.ok(actual.width<=w-(fold?48+32+250:w<360?28:32),'stage respects width');
  assert.ok(Math.abs(actual.height/actual.width-290/340)<.004,'stage retains original canvas proportions');
}
assert.ok(size(430,900,false).width>340,'large/tall phone must allow enlargement');
assert.ok(size(820,900,true).width>340,'open Fold with room must allow enlargement');
const canvas=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
assert.ok(canvas.includes('style={[styles.stage,responsiveStage]}'),'only outer canvas stage is resized');
assert.ok(canvas.includes("const W=174,H=256,N=64,PI=Math.PI"),'original physical geometry exists');
assert.ok(canvas.includes("const progress=reduced?1:Math.min(1,(now-transitionStart)/1500)"),'opening speed protected');
assert.ok(canvas.includes("const duration=skipping?780:1900"),'page-turn speed protected');
assert.ok(app.includes('stageWidth={livingBookViewport.width}'),'Now player uses responsive stage');
console.log('Living Book outer sizing and motion-contract tests passed');
