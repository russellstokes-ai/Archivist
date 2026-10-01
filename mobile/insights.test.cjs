const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {buildInsights,sanitizeInsightGoal}=require('./insights.ts');
const works=[
 {key:'a',canonicalKey:'a',title:'A',author:'One',format:'Audio',readingState:'finished',rating:10,favourite:true},
 {key:'b',canonicalKey:'b',title:'B',author:'Two',format:'Ebook',readingState:'in-progress',rating:8,favourite:false},
];
const annotations=[
 {id:'1',workKey:'b',page:4,kind:'note',text:'passage',note:'idea',createdAt:'2026-10-01T10:00:00Z'},
 {id:'2',workKey:'a',page:1,kind:'highlight',text:'older',createdAt:'2026-09-30T10:00:00Z'},
];
const activity=[
 {id:1,workId:1,title:'A',author:'One',kind:'Listening',startedAt:1,updatedAt:1790874000,activeSeconds:900,events:3,completed:true},
 {id:2,workId:2,title:'B',author:'Two',kind:'Reading',startedAt:2,updatedAt:1790787600,activeSeconds:0,events:2,completed:false},
];
const out=buildInsights(works,annotations,activity,{completedTarget:4,annotationTarget:4});
assert.equal(out.completed,1);assert.equal(out.inProgress,1);assert.equal(out.listeningSeconds,900);assert.equal(out.annotationCount,2);
assert.equal(out.completedGoal.progress,.25);assert.equal(out.annotationGoal.progress,.5);
assert.equal(out.recentAnnotations[0].work.title,'B');assert.equal(out.recentActivity[0].id,1);
assert.deepEqual(sanitizeInsightGoal({completedTarget:-2,annotationTarget:99999}),{completedTarget:1,annotationTarget:5000});
console.log('PASS: Insights aggregates verified progress, session activity, goals and annotation hub');
