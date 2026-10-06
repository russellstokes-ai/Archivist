const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const library=fs.readFileSync(__dirname+'/localLibrary.ts','utf8');
const feedback=fs.readFileSync(__dirname+'/scanFeedback.ts','utf8');
const books=fs.readFileSync(__dirname+'/onlineBookMetadata.ts','utf8');
const comics=fs.readFileSync(__dirname+'/onlineComicMetadata.ts','utf8');

// Sorting: explicit user choice, Copy stays non-destructive, Move is copy-verify-checkpoint-delete.
assert.ok(app.includes("const [localSortMode,setLocalSortMode]=useState<LocalSortMode>('copy')"),'Copy must remain the safe default');
assert.ok(app.includes('Copy · keep originals')&&app.includes('Move · remove originals'),'UI must expose explicit Copy vs Move choice');
assert.ok(app.includes("applyLocalSort(ready,localSortMode,checkpoint)"),'selected sort mode must reach the engine');
assert.ok(library.includes("export type LocalSortMode = 'copy' | 'move'"),'sort engine must model both modes');
assert.ok(library.includes('await verifyLocalCopy(preview.sourceUri,target);'),'Move must verify the destination before deletion');
const workCheckpoint=library.indexOf('copied.push(...staged);');
const durableCheckpoint=library.indexOf('await onCheckpoint?.({copied:copied.map(item=>({...item})),failed:failed.slice()});',workCheckpoint);
const firstSourceDelete=library.indexOf('await deleteLocalUri(item.sourceUri);',workCheckpoint);
assert.ok(workCheckpoint>=0&&durableCheckpoint>workCheckpoint&&firstSourceDelete>durableCheckpoint,'every verified destination in a work must be durably checkpointed before any source deletion');
assert.ok(library.includes("if(sourceAfter?.exists!==false)throw Error('Source deletion could not be verified')"),'Move must verify every source deletion');
assert.ok(library.includes('for(const item of removed)')&&library.includes('await verifyLocalCopy(item.uri,restored);'),'whole-work Move must restore already-removed originals if a later part cannot be removed safely');
assert.ok(library.includes('sourceRootUri')&&library.includes('sourceRelativePath'),'cross-storage recovery must retain the original root and path');
assert.ok(library.includes('recoverLocalSortOperation'),'copy/move transactions must have a recovery path');
assert.equal(app.includes("item.complete===false?{...item,complete:true}:item"),false,'a rescan must not silently mark interrupted sort transactions complete');

// Metadata: normal Prepare/Refresh must not bulk deep-read local media.
const normalEnrichment=app.slice(app.indexOf('async function enrichPublishedLocalLibrary'),app.indexOf('async function enrichPublishedLocalEmbeddedMetadata'));
assert.equal(normalEnrichment.includes('enrichPublishedLocalEmbeddedMetadata('),false,'normal refresh must not contain the historical bulk embedded-read stage');
assert.ok(feedback.includes("'reading-metadata':[40,44]"),'reading-metadata is reserved as a narrow explicit deep-search phase, not the old 28% mandatory stage');
assert.ok(library.includes('withOperationTimeout'),'explicit local forensic reads must still have an operation watchdog');
const deepSearch=app.slice(app.indexOf('const runMetadataSearch=async'),app.indexOf('const acceptProposal=async'));
assert.ok(deepSearch.includes('concurrency:1')&&deepSearch.includes('maxConsecutiveTimeouts:1'),'Deep Search local inspection must be serial and stop launching reads after the first timeout');
assert.ok(deepSearch.includes('workBooks[Math.floor(workBooks.length/2)]')&&deepSearch.includes('workBooks.slice(0,1)'),'Deep Search must inspect only a tiny selected-work sample');
assert.ok(library.includes("'Embedded metadata read'")&&library.includes("'Embedded cover read'"),'explicit metadata and cover extraction must remain watchdog-protected');
assert.ok(library.includes("current:'Skipped remaining cover reads after repeated timeouts'"),'cover recovery must fail forward rather than become a new freeze');
assert.ok(app.includes("recordLibraryRefreshWarning('Local cover recovery'"),'cover timeouts/skips must remain visible in completed refresh warnings');

// Provider network work was already bounded; lock those deadlines too.
assert.ok(
  (books.includes("options.timeoutMs||(options.deep?15000:8000)")||books.includes('options.timeoutMs||8000'))
  && books.includes('AbortController'),
  'book provider requests must retain bounded Smart/Deep network deadlines'
);
assert.ok(comics.includes('options.timeoutMs||8000')&&comics.includes('AbortController'),'comic provider requests must retain their network deadline');

console.log('PASS: Test 10.1 release blockers lock verified Move sorting and fail-forward metadata scanning');
