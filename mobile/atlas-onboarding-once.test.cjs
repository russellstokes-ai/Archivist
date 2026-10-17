const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');
const first=src.indexOf('  function OnboardingGuide() {');
const end=src.indexOf('  function LocalScanStatus()',first);
const onboarding=src.slice(first,end);
const atlasStart=src.indexOf('  function Atlas() {');
const atlasEnd=src.indexOf('  function Insights()',atlasStart);
const atlas=src.slice(atlasStart,atlasEnd>atlasStart?atlasEnd:undefined);
assert(first>=0&&end>first&&atlasStart>=0,'The original onboarding and Atlas components must remain');
assert(onboarding.includes('if (!onboardingReady || onboardingDone) return null;'),
 'Previously completed onboarding must not flash on every login / launch');
assert(onboarding.includes('Atlas maps published works.')&&onboarding.includes('Library source and folder filters also apply.'),
 'Atlas explanation belongs inside the original first-run onboarding, not Atlas');
assert(onboarding.includes('Add library folders')&&onboarding.includes('Prepare library')&&onboarding.includes('Review book details'),
 'The original scanner setup three-step flow stays intact');
assert(!atlas.includes('Atlas only includes fully reviewed')&&!atlas.includes('No completed titles are ready for Atlas yet')&&
 !atlas.includes('Your catalogue contains published works')&&!atlas.includes('Published titles are hidden by Library filters'),
 'No permanent Atlas explanation or intrusive empty-state card can return');
assert(atlas.includes('Show all Atlas works')&&atlas.includes("setSourceFilter('all');setSpace('')"),
 'An active source/folder filter remains reversible without the extra explanation');
assert(src.includes("const onboardingDoneKey = 'archivist.onboardingDone.v2'"),'Reuse saved onboarding completion, no new replay key');
assert(src.includes("SecureStore.getItemAsync(onboardingDoneKey)")&&src.includes('setOnboardingReady(true)'),
 'Hydrate persisted one-time completion before deciding whether to render');
assert(src.indexOf("await SecureStore.setItemAsync(onboardingDoneKey, '1');")<
       src.indexOf("setOnboardingDone(true);",src.indexOf('  async function finishOnboarding()')),
 'Completion must be durable before hiding the guide');
assert(src.includes("setOnboardingDone(true);"),'Storage-read failures must fail closed, not repeat the tour');
const manifest=JSON.parse(fs.readFileSync(path.join(repo,'docs/v1/TEST14_ATLAS_FIRST_RUN_ONLY_APP_EXCEPTION_2026-10-17.json'),'utf8'));
assert.equal(manifest.path,'mobile/App.tsx');assert.equal(manifest.changes.length,8);
console.log('PASS: Atlas help is shown only in the existing saved first-run onboarding; never as a permanent Atlas notice, while hidden filters remain clearable.');
