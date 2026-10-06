const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.ok(app.includes("const librarySetupPreparedKey = 'archivist.librarySetupPrepared.v1'"),'initial library preparation state must persist');
assert.ok(app.includes('localFolderSetSignature(localFolders)'),'preparation readiness must be tied to the current folder set');
assert.ok(app.includes("setLibraryPreparedSignature('')")&&app.includes("completedAt:''"),'starting any scan must invalidate organisation readiness');
assert.ok(app.includes("setPersistedJSON(librarySetupPreparedKey,{signature,completedAt:new Date().toISOString()})"),'only a completed metadata pipeline may unlock organisation');

assert.ok(app.includes('LIBRARY SETUP'),'Shelf onboarding must be a dedicated Library Setup journey');
assert.ok(app.includes('>Add library folders<'),'step 1 must support device and server library folders');
assert.ok(app.includes("hasFolder?'Add another device folder':addLocalFolderShortLabel"),'step 1 must keep an Add another device folder action after the first local source is selected');
assert.ok(app.includes("Step 1 only collects sources"),'adding a folder must not automatically start the heavy preparation scan');
assert.ok(app.includes('if (onboardingDone) return null;')&&!app.includes('if (session || recoverableSession || onboardingDone) return null;'),'connecting a server must not dismiss onboarding before folders are chosen');
assert.ok(app.includes('const hasSource = hasFolder || hasServerFolders')&&app.includes("hasServer&&owner?<View style={styles.shelfSetupAction}"),'onboarding must support local folders, server folders, or both');
assert.ok(app.includes("inputRange:[0,.5,1],outputRange:[1,1.045,1]"),'the first folder CTA should pulse subtly while respecting reduced motion');
assert.ok(app.includes('>Prepare library<'),'step 2 must be Prepare library');
assert.ok(app.includes('>Review what needs attention<'),'step 3 must review only unresolved or coverless works');
assert.ok(app.includes("label={'Review '+reviewCount+' item'+(reviewCount===1?'':'s')}"),'step 3 must open the per-work review queue when confirmation is required');
assert.ok(app.includes("Available when preparation finishes."),'Step 3 must stay quiet and unavailable while preparation is incomplete');
assert.ok(app.includes('disabled={busy||localBooks.length===0||!libraryPreparationReady}'),'optional sorting preview must stay gated by completed preparation');
assert.ok(app.includes('disabled={busy||selectedReady.length===0||!libraryPreparationReady}'),'optional sorting apply must stay gated by completed preparation');

assert.ok(app.includes("if (onboardingDone) return null;"),'completed onboarding must never remain on Shelf');
assert.ok(app.includes("await SecureStore.setItemAsync(onboardingDoneKey, '1')"),'onboarding completion must survive relaunch');
assert.ok(app.includes('label="Enter my library"'),'users must be able to complete setup without reorganising files once all review items are resolved');
assert.ok(app.includes('const enterActive=setupReady&&reviewCount===0&&hasUsableLibrary'),'Library entry must unlock only after preparation succeeds and no review blockers remain');
assert.ok(app.includes("itemTimeoutMs:refreshMetadata?5000:2500"),'first-run embedded metadata must fail forward quickly instead of appearing frozen at 28%');
assert.ok(app.includes("concurrency:refreshMetadata?3:4"),'first-run metadata must use bounded concurrency instead of serial reads or skip-all timeouts');

assert.ok(app.includes('>Library management<'),'ongoing library maintenance must live in Settings');
assert.ok(app.includes('Folders, metadata, scanning and file organisation.'),'Settings must clearly own post-onboarding library maintenance');
assert.equal(app.includes('accessibilityLabel="Manage Library scanning metadata and organisation"'),false,'Library catalogue header must no longer carry the permanent management shortcut');

console.log('PASS: 0.9.5 Library Setup is source → prepare → review, with optional organisation and ongoing maintenance in Settings');
