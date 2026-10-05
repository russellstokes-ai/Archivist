const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert.ok(app.includes("const librarySetupPreparedKey = 'archivist.librarySetupPrepared.v1'"),'initial library preparation state must persist');
assert.ok(app.includes('localFolderSetSignature(localFolders)'),'preparation readiness must be tied to the current folder set');
assert.ok(app.includes("setLibraryPreparedSignature('')")&&app.includes("completedAt:''"),'starting any scan must invalidate organisation readiness');
assert.ok(app.includes("setPersistedJSON(librarySetupPreparedKey,{signature,completedAt:new Date().toISOString()})"),'only a completed metadata pipeline may unlock organisation');

assert.ok(app.includes('LIBRARY SETUP'),'Shelf onboarding must be a dedicated Library Setup journey');
assert.ok(app.includes('>Add folders<'),'step 1 must be Add folders');
assert.ok(app.includes('>Prepare library<'),'step 2 must be Prepare library');
assert.ok(app.includes('>Organise files<'),'step 3 must be Organise files');
assert.ok(app.includes("Available when preparation finishes."),'Step 3 must stay quiet and unavailable while preparation is incomplete');
assert.ok(app.includes('disabled={busy||localBooks.length===0||!libraryPreparationReady}'),'sorting preview must be gated by completed preparation');
assert.ok(app.includes('disabled={busy||selectedReady.length===0||!libraryPreparationReady}'),'sorting apply must be gated by completed preparation');

assert.ok(app.includes("if (session || recoverableSession || onboardingDone) return null;"),'completed onboarding must never remain on Shelf');
assert.ok(app.includes("await SecureStore.setItemAsync(onboardingDoneKey, '1')"),'onboarding completion must survive relaunch');
assert.ok(app.includes('label="Keep current layout"'),'users must be able to complete setup without reorganising files');
assert.ok(app.includes("if(!onboardingDone&&refreshed&&result.failed.length===0)"),'successful organisation and refresh must complete onboarding automatically');

assert.ok(app.includes('>Library management<'),'ongoing library maintenance must live in Settings');
assert.ok(app.includes('Folders, metadata, scanning and file organisation.'),'Settings must clearly own post-onboarding library maintenance');
assert.equal(app.includes('accessibilityLabel="Manage Library scanning metadata and organisation"'),false,'Library catalogue header must no longer carry the permanent management shortcut');

console.log('PASS: Test 10.1 Library Setup is a disposable three-step onboarding flow with Settings owning ongoing maintenance');
