const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const reader=fs.readFileSync(__dirname+'/localReader.ts','utf8');

assert.ok(app.includes("'fullscreen'|'fullscreenExit'"),'reader must use dedicated fullscreen icon states');
assert.ok(app.includes("name={readerIsFullscreen?'fullscreenExit':'fullscreen'}"),'fullscreen control must render the standard icon instead of text');
assert.ok(app.includes("if(readerIsFullscreen){setReaderFullscreen(false);setReaderChromeVisible(true);}else{setReaderFullscreen(true);setReaderChromeVisible(false);}"),'fullscreen entry and exit must leave chrome in a predictable state');
assert.ok(app.includes("readerBar: {zIndex:25,minHeight:48"),'reader chrome must participate in layout rather than overlaying the page');
assert.equal(app.includes("readerBar: {position:'absolute'"),false,'reader header must never cover the top of a comic');
assert.ok(app.includes("readerBarSide: {width:88")&&app.includes("readerBarActions: {width:88"),'reader title must remain centered between balanced chrome rails');
assert.ok(app.includes("readerWebView: {flex:1}"),'reader viewport must consume only the remaining safe content area');
assert.ok(app.includes("setReaderFullscreen(false);setReaderChromeVisible(true);return true;"),'Android back from fullscreen must restore visible reader chrome');

assert.ok(reader.includes("gestureKind='idle'")&&reader.includes("lastTouchEndedAt=0"),'touch arbitration needs explicit gesture and synthetic-click state');
assert.ok(reader.includes("function scheduleSingleTap()")&&reader.includes("post({type:'reader-chrome-toggle'})"),'single tap must toggle chrome directly after double-tap arbitration');
assert.ok(reader.includes("now-lastTouchEndedAt<600"),'synthetic click after a touch must not retrigger reader chrome');
assert.ok(reader.includes("gestureKind='page-turn'")&&reader.includes("gestureKind='pinch'")&&reader.includes("gestureKind='pan'"),'page turn, pinch and pan must be mutually explicit gesture states');
assert.ok(reader.includes("drag.velocity=(touch.clientX-drag.lastX)/dt"),'page turn release must account for swipe velocity');
assert.ok(reader.includes("drag.progress>.24||flickForward"),'page turns must commit deterministically from distance or directional flick');
assert.ok(reader.includes("translateX('+(signed*eased*12)+'%) rotateY('+(signed*eased*150)+'deg)"),'comic page geometry must visibly follow the finger during the swipe');
assert.ok(reader.includes("if(delta>0&&delta<=320&&distanceFromLast<=30)")&&reader.includes("focusAt(target,tap.clientX,tap.clientY)"),'double tap must remain reserved for speech/text focus');
assert.ok(reader.includes("scheduleSingleTap();")&&reader.includes("clearTimeout(singleTapTimer)"),'single tap reveal must be cancelled cleanly when a double tap begins');

console.log('PASS: Test 10 Sprint 3 comic reader chrome, fullscreen and gesture arbitration are locked');
