const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
// Exercise the actual PDF move closure: reduced motion must update without starting Animated.
const pdf=fs.readFileSync(__dirname+'/LocalPdfReader.tsx','utf8');const move=pdf.slice(pdf.indexOf('  const move='),pdf.indexOf('  return <View'));
let animations=0,pageSet;const c={count:10,active:{uri:'a',generation:2},uri:'a',page:2,reduceMotion:true,turn:{},latest:{current:{uri:'a',page:2}},setSession:fn=>pageSet=fn({}),pdfSessionReducer:(_s,a)=>a.page,Animated:{sequence:()=>{animations++;return {start(){}}},timing(){}}};vm.createContext(c);vm.runInContext(ts.transpileModule(move+'\nmove(1)',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,c);assert.equal(pageSet,3);assert.equal(animations,0);
// Each reward event must receive a fresh React instance (therefore fresh native Lottie state).
const reward=fs.readFileSync(__dirname+'/AchievementRewardOverlay.tsx','utf8');assert.match(reward,/<RewardInstance key=\{eventKey\|\|'none'\}/);
const living=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');assert.match(living,/onRenderProcessGone=\{recover\}/);assert.match(living,/onContentProcessDidTerminate=\{recover\}/);assert.match(living,/attempts.current>=2/);
console.log('PASS: Reduced Motion immediate page change; keyed reward instance and bounded native WebView recovery');
