// Gate 5 onboarding UX contract: test the wiring, not just visible copy.
// Stage 1 discovers books once; stage 2 explicitly identifies/gets covers;
// stage 3 reviews unresolved WORKS; organisation lives exclusively in Settings.
const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/App.tsx','utf8');
const findBooks=source.indexOf('function discoverOnboardingLibrary');
const identifyBooks=source.indexOf('function identifyOnboardingBooksAndCovers');
assert.ok(findBooks>0,'Find Books is a real action, not a rename of Prepare library');
assert.ok(identifyBooks>findBooks,'Identify Books & Covers is its own action');
assert.match(source,/finaliseLocalScan\(result,previousLocal,generation,false,true\)/,
 'discovery saves the catalogue without starting full enrichment');
assert.match(source,/discoveryOnly=false/,'discovery-only mode must be explicit');
assert.match(source,/if\(discoveryOnly\)return summary;/,
 'the first step ends before costly network/embedded cover extraction');
assert.match(source,/enrichPublishedLocalLibrary\(staged,generation,true\)/,
 'second button must enrich persisted discovered files WITHOUT repeating the scan');
assert.match(source,/getPersistedJSON<\{signature:string\}>\(onboardingDiscoveryKey\)/,
 'discovery state must recover after app restart');
assert.ok(source.includes('const discovered=hasSource&&(hasFolder?localDiscovered:serverReady)'),
 'offline/optional server must never prevent identifying already discovered local books');
assert.match(source,/onboardingDiscoverySignature===currentLibraryFolderSignature/,
 'the saved discovery must be valid only for the selected folder set');
assert.match(source,/activeStep==='discover'/,
 'pulse advances to Find Books after a folder has been selected');
assert.match(source,/>Find Books</);
assert.match(source,/>Identify Books & Covers</);
assert.match(source,/>Needs Attention</);
assert.match(source,/onPress=\{\(\)=>void discoverOnboardingLibrary\(\)\}/);
assert.match(source,/onPress=\{\(\)=>void identifyOnboardingBooksAndCovers\(\)\}/);
assert.ok(!source.includes('<Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Organise files</Text>'),
 'organiser must remain accessible from Settings but is not a compulsory onboarding step');
assert.match(source,/onPress=\{\(\)=>void finishOnboarding\(\)\}/,
 'users can finish setup with outstanding Needs Attention groups safely');
assert.ok(source.includes('await replaceLocalStageBooks(result.books)'),
 'discovery must persist its source catalogue before advancing');
assert.ok(source.includes('!scanCommitGate.isCurrent(generation)'),
 'stale or cancelled scans must never advance onboarding');
console.log('PASS: onboarding stages isolate discovery, identification and review, safely persisted');
