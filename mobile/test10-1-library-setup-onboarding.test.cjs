const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.ok(app.includes("const librarySetupPreparedKey = 'archivist.librarySetupPrepared.v1'"),'initial library preparation state must persist');
assert.ok(app.includes('localFolderSetSignature(localFolders)'),'preparation readiness must be tied to the current folder set');
assert.ok(app.includes("libraryPreparationReady=!!currentLibraryFolderSignature&&libraryPreparationCheckpoint.signature===currentLibraryFolderSignature&&!libraryRefreshActive"),'active preparation must lock organisation without erasing the last completed checkpoint');
assert.ok(app.includes('beginLibraryPreparation(')&&app.includes('completeLibraryPreparation('),'preparation must persist explicit in-progress intent and unlock only after the completed metadata pipeline');

assert.ok(app.includes('LIBRARY SETUP'),'Shelf onboarding must be a dedicated Library Setup journey');
assert.ok(app.includes('>Find Books<'),'step 1 must support device and server library folders');
assert.ok(app.includes("hasFolder?'Add another device folder':addLocalFolderShortLabel"),'step 1 must keep an Add another device folder action after the first local source is selected');
assert.ok(app.includes("Adding a folder does not launch discovery or metadata enrichment"),'adding a folder must not automatically start the heavy preparation scan');
assert.ok(app.includes('if (onboardingDone) return null;')&&!app.includes('if (session || recoverableSession || onboardingDone) return null;'),'connecting a server must not dismiss onboarding before folders are chosen');
assert.ok(app.includes('const hasSource = hasFolder || hasServerFolders')&&app.includes("hasServer&&owner?<View style={styles.shelfSetupAction}"),'onboarding must support local folders, server folders, or both');
assert.ok(app.includes("inputRange:[0,.5,1],outputRange:[1,1.045,1]"),'the first folder CTA should pulse subtly while respecting reduced motion');
assert.ok(app.includes('>Identify Books & Covers<'),'step 2 must explicitly identify metadata and artwork after discovery');
assert.ok(app.includes('>Needs Attention<'),'step 3 must review unresolved works, not trigger file organisation');
assert.ok(app.includes("Available after identification."),'Step 3 must stay quiet while metadata has not been identified');
assert.ok(app.includes('disabled={busy||localBooks.length===0||!libraryPreparationReady}'),'sorting preview must be gated by completed preparation');
assert.ok(app.includes('disabled={busy||selectedReady.length===0||!libraryPreparationReady}'),'sorting apply must be gated by completed preparation');

assert.ok(app.includes("if (onboardingDone) return null;"),'completed onboarding must never remain on Shelf');
assert.ok(app.includes("await SecureStore.setItemAsync(onboardingDoneKey, '1')"),'onboarding completion must survive relaunch');
assert.ok(app.includes('label="Finish setup"'),'users must be able to finish setup without organising files or clearing unresolved works');
assert.ok(app.includes("if(!onboardingDone&&refreshed&&result.failed.length===0)"),'successful organisation and refresh must complete onboarding automatically');
assert.ok(app.includes("itemTimeoutMs:fastAudioProperties?1200:(refreshMetadata?5000:2500)"),'normal audio file-property reads must fail forward quickly instead of appearing frozen at 28%');
assert.ok(app.includes("concurrency:1"),'normal file-property reads must use bounded concurrency');
assert.ok(app.includes("maxConsecutiveTimeouts:3"),'normal file-property reads must circuit-break after repeated slow files');

assert.ok(app.includes('onPress={()=>void discoverOnboardingLibrary()}')&&app.includes('onPress={()=>void identifyOnboardingBooksAndCovers()}'),
  'onboarding has two distinct explicit controls rather than a relabelled combined scan');
assert.ok(app.includes('if(discoveryOnly)return summary;'),
  'source discovery must stop before the metadata/cover phase');
assert.ok(app.includes('onboardingDiscoverySignature===currentLibraryFolderSignature'),
  'a stale discovery checkpoint must not unlock identification after folders change');

assert.ok(app.includes('>Library management<'),'ongoing library maintenance must live in Settings');
assert.ok(app.includes('Folders, metadata, scanning and file organisation.'),'Settings must clearly own post-onboarding library maintenance');
assert.equal(app.includes('accessibilityLabel="Manage Library scanning metadata and organisation"'),false,'Library catalogue header must no longer carry the permanent management shortcut');

console.log('PASS: Test 10.1 Library Setup is a disposable three-step onboarding flow with Settings owning ongoing maintenance');
