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
assert.ok(library.indexOf('await onCheckpoint?.({copied:copied.map(item=>({...item})),failed:failed.slice()});') < library.indexOf("if(mode==='move')"),'verified copy must be durably checkpointed before entering destructive Move logic');
assert.ok(library.includes('await deleteLocalUri(preview.sourceUri);')&&library.includes("if(!removed)throw Error('Source deletion could not be verified')"),'Move must delete and verify the source');
assert.ok(library.includes('sourceRootUri')&&library.includes('sourceRelativePath'),'cross-storage recovery must retain the original root and path');
assert.ok(library.includes('recoverLocalSortOperation'),'copy/move transactions must have a recovery path');
assert.equal(app.includes("item.complete===false?{...item,complete:true}:item"),false,'a rescan must not silently mark interrupted sort transactions complete');

// Metadata: the 28% stage is local embedded extraction, so every expensive local read needs a watchdog.
assert.ok(feedback.includes("'reading-metadata':[28,46]"),'28% must remain identified as the embedded metadata stage');
assert.ok(library.includes('withOperationTimeout'),'heavy local reads must have an operation watchdog');
assert.ok(app.includes('itemTimeoutMs:refreshMetadata?4000:2200')&&app.includes('concurrency:2'),'production refresh must bound each local read while processing a small parallel batch');
assert.ok(library.includes("'Embedded metadata read'")&&library.includes("'Embedded cover read'"),'both metadata and cover extraction must be watchdog-protected');
assert.ok(library.includes('Promise.all(batch.map')&&library.includes('processed+=1'),'embedded stage must keep advancing across individually bounded files instead of abandoning the remaining library');
assert.ok(library.includes("current:'Skipped remaining cover reads after repeated timeouts'"),'cover stage must fail forward rather than become the next freeze');
assert.ok(app.includes("currentFolder:progress.current||''"),'the shared refresh UI must show the current item during heavy local work');
assert.ok(app.includes("recordLibraryRefreshWarning('Embedded metadata'")&&app.includes("recordLibraryRefreshWarning('Local cover recovery'"),'timeouts/skips must be visible in the completed refresh warning');

// Provider network work was already bounded; lock those deadlines too.
assert.ok(books.includes('options.timeoutMs||8000')&&books.includes('AbortController'),'book provider requests must retain their network deadline');
assert.ok(comics.includes('options.timeoutMs||8000')&&comics.includes('AbortController'),'comic provider requests must retain their network deadline');

console.log('PASS: Test 10.1 release blockers lock verified Move sorting and fail-forward metadata scanning');
