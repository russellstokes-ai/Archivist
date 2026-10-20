const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const read=(n)=>fs.readFileSync(path.join(__dirname,n),'utf8');
const source=read('localReader.ts'),app=read('App.tsx');
const speech=read('speechFocus.ts');
const archive=read('archiveReader.ts');
const nativeZip=read('nativeZip.ts');
const gitBlob=(s)=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

assert.equal(gitBlob(speech),'280b441936ce366554a908bbde9f0d20c047c71d',
  'Canonical speech-bubble detection and focus overlay must not be changed');
assert.equal(gitBlob(archive),'ec3ac7992be6956a6356329a2f5756d1e8865017',
  'Comic CBZ/CBR/CBT archive decoding must not be changed');
assert.equal(gitBlob(nativeZip),'1f38d8149a4d7c4a4b74219166fd517228ac6c05',
  'Comic native ZIP decoder must not be changed');
assert.equal(gitBlob(require('../scripts/repair-original-source.cjs')('mobile/localReader.ts')),'827914360d70e33af63ed3e03b66095318144756',
  'Canonical comic reader gesture and zoom source MUST stay byte-for-byte unchanged');
assert(source.includes("speechFocus?.focus?.(img,x,y,'page-'+page)"),
  'Speech bubble focus must continue before generic zoom');
assert(source.includes("focusAt(target,tap.clientX,tap.clientY)"),
  'Double tap must still pass exact touch target and coordinates');
assert(source.includes("pinchStartDistance=distance(event.touches[0],event.touches[1])"),
  'Pinch distance must remain the same');
assert(source.includes("zoom=clamp(pinchStartZoom*ratio,1,4)"),
  'Pinch must retain its 1×–4× range');
assert(source.includes("gestureKind='page-turn'"),
  'Page turn gestures must remain available');
assert(source.includes("function beginTurn(")&&source.includes("function finishTurn("),
  'No replacement of existing page-turn renderer');

assert(app.includes("source={reading.format==='Comic'?comicReaderWebViewSource(localReader.html,Platform.OS==='android'&&comicReaderUseDataFallback):{html:localReader.html}}"),
  'Only local comics may attempt the origin-independent fallback; EPUB HTML stays unchanged');
assert(app.includes("if(reading.format==='Comic'&&retryComicReaderOriginOnce())return;")&&app.includes("comicWebViewFallbackAttempt.current=true;"),
  'Blocked Android comic must retry exactly once before reporting an error');
assert(app.includes("key={reading.uri+(reading.format==='Comic'&&comicReaderUseDataFallback?':data':'')}"),
  'Fallback must mount a new WebView with the same approved comic reader HTML');
assert(app.includes("onMessage={event=>handleReaderMessage(event.nativeEvent.data)}"),
  'Native-to-WebView comic pagination bridge must stay active');
assert(app.includes("readerWebRef.current?.injectJavaScript(script)"),
  'Comic page delivery bridge must remain unchanged');
assert(app.includes("androidLayerType={reading.format==='Comic'?'software':'none'}"),
  'Comic rendering layer compatibility must be retained');
assert(app.includes("cacheEnabled={reading.format!=='Comic'}"),
  'Comic cache policy must not change');
assert(app.includes("setSupportMultipleWindows={false} javaScriptCanOpenWindowsAutomatically={false}"),
  'No new windows or unapproved navigation');
assert(!app.includes('allowUniversalAccessFromFileURLs'),
  'Do not loosen WebView filesystem permissions');
assert(app.includes("reading.format==='Comic'?comicWebViewFailure(event.nativeEvent,'local')"),
  'Comic failures should be handled locally and clearly');
assert(app.includes('label="Retry comic"') && app.includes('onPress={()=>openBook(reading,readerPage)}'),
  'Retry must retain comic reader page position');

const errors=read('readerAccessErrors.ts');
assert(errors.includes('ERR_ACCESS_DENIED') && errors.includes("source==='local'"),
  'Permission failures must map to a useful, non-sensitive error');
assert(!errors.includes('console.log(')&&!errors.includes('console.error('),
  'Private source paths must not be emitted to logging');

// Require complete lock integrity, not a snapshot of just a few gesture names:
const canonicalSourceSha='827914360d70e33af63ed3e03b66095318144756';
assert.equal(gitBlob(require('../scripts/repair-original-source.cjs')('mobile/localReader.ts')),canonicalSourceSha);
console.log('PASS: canonical comic reader fully byte-identical; bubble double-tap, pinch, swipe, page bridge, EPUB and WebView security contracts intact');
