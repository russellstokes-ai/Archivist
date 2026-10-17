const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync('web/onboarding.js','utf8'),context);
const state=(sources=[],jobs=[],summary={})=>context.importGuidance(true,sources,jobs,summary);
assert.equal(context.importGuidance(false,[],[],{}),null);
assert.equal(state().action,'folder');
assert.equal(state([{id:1}]).action,'scan');
assert.equal(state([{id:1}],[{source_id:1,state:'running',progress:30}]).action,'wait');
assert.equal(state([{id:1}],[{source_id:1,state:'failed',message:'Unavailable'}]).action,'retry');
assert.equal(state([{id:1}],[{source_id:1,state:'complete'}],{reviewWorks:12}).action,'review');
assert.equal(state([{id:1}],[{source_id:1,state:'complete'}],{total:12,reviewWorks:0}),null);
assert.equal(state([{id:1}],[{source_id:1,state:'complete'}],{}).action,'empty');
// Removed sources and historical failures must not send users down a dead end.
assert.equal(state([{id:2}],[{source_id:1,state:'failed'}]).action,'scan');
assert.equal(state([{id:1}],[{source_id:1,state:'complete'},{source_id:1,state:'failed'}],{total:1}),null);
console.log('PASS onboarding decisions: new user, family, active, failed, empty, review, complete, stale jobs');

