const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const model=fs.readFileSync(__dirname+'/nowSession.ts','utf8');

assert.ok(app.includes("const nowSessionKey = 'archivist.nowSession.v1'"),'one durable Now key must own restart state');
assert.ok(app.includes('sanitizeNowSession(value)')&&app.includes('setNowSessionReady(true)'),'durable Now session must restore at launch');
assert.ok(app.includes('checkpointNowRef.current=checkpointCurrentNow'),'lifecycle saves must use current React state rather than a stale effect closure');
assert.ok(app.includes("if(state!=='active'){void pauseActiveOfflineDownload();void checkpointNowRef.current();}"),'backgrounding must checkpoint Now immediately');
assert.ok(app.includes('void checkpointNowRef.current(); void controller.stop();'),'unmount/termination path must checkpoint before stopping playback');
assert.ok(app.includes('Math.floor(seconds/5)')&&app.includes('persistLocalPlaybackPosition(seconds)'),'local audio must checkpoint while playing, not only on Pause');
assert.ok(app.includes('Math.floor(seconds/10)')&&app.includes("persistNowSession('audio',playing,seconds"),'server audio must mirror progress into durable Now state');
assert.ok(app.includes("persistNowSession('reader',reading,readerPage"),'reader page changes must update the same durable Now state');
assert.ok(app.includes("async function playBook(book: Book, resumeSeconds?:number)")&&app.includes('savedSeconds=Math.max(0,resumeSeconds??localProgress[book.uri]??0)'),'local playback must support exact durable resume seconds');
assert.ok(app.includes("function openBook(book: Book, resumePage?:number)")&&app.includes('const initialPage=Math.max(0,Math.floor(resumePage??'), 'reader must support exact durable resume page');
assert.ok(app.includes('async function resumeNowSession(snapshot:DurableNowSession)'),'Now must have one direct resume engine');
assert.ok(app.includes("serverWorks.find(item=>item.id===media.serverWorkId)")&&app.includes("localWorks.find(item=>item.key===media.localWorkKey)"),'resume must resolve current metadata by stable server/local identity');
assert.ok(app.includes("Object.values(offlineWorks).find(item=>item.server===media.originServer&&item.workId===media.serverWorkId)"),'server Now session must fall back to downloaded content offline');
assert.ok(app.includes("persistNowSession('audio',display,progress.complete?0:progress.seconds"),'Android Auto progress must feed the same authoritative Now session');
assert.ok(app.includes("if(centre){void openNowTab()}"),'tapping Now must reopen the durable session directly without a Resume button step');
assert.ok(model.includes('sameNowMedia')&&model.includes('serverWorkId')&&model.includes('localWorkKey')&&model.includes('uri'),'Now identity must survive metadata renames and asset refreshes');

console.log('PASS: Test 10 Sprint 4 durable Now/player persistence contract is locked');
