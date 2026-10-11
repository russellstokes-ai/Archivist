const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');

const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
const app=read('App.tsx');
const morph=read('LivePlayerPlayPauseMorph.tsx');
const reader=read('localReader.ts');
const speech=read('speechFocus.ts');
const body=read('comicReaderWebViewSource.ts');

const loaded=ts.transpileModule(body,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const module={exports:{}};
vm.runInNewContext('(function(module,exports){'+loaded+'\n})(module,module.exports)',{module});
const make=module.exports.comicReaderWebViewSource;
assert.equal(typeof make,'function');

const html='<!doctype html><main><script>window.__archivistSetComicPage=function(){};</script><img src="data:image/jpeg;base64,AQID"></main>';
const primary=make(html,false),fallback=make(html,true);
assert.equal(primary.html,html);
assert.equal(primary.baseUrl,'https://appassets.androidplatform.net/');
assert.equal(fallback.uri.startsWith('data:text/html;charset=utf-8,'),true);
assert.equal(decodeURIComponent(fallback.uri.split(',').slice(1).join(',')),html,
  'No transformations to speech zoom/pinch/turn scripts or content');
assert(!JSON.stringify(fallback).includes('content://'));
assert(!JSON.stringify(fallback).includes('file://'));
assert(!JSON.stringify(primary).includes('file://'));

assert.equal(morph.includes('PLAY_PAUSE_VISIBLE_OFFSET_X=10'),true);
assert.equal(morph.includes('PLAY_PAUSE_VISIBLE_OFFSET_Y=3'),true);
assert.equal(morph.includes('translateX:PLAY_PAUSE_VISIBLE_OFFSET_X'),true);
assert.equal(morph.includes('translateY:PLAY_PAUSE_VISIBLE_OFFSET_Y'),true);
assert(app.includes('playButton: {width:80,height:80,borderRadius:40'),
  'The original 80dp play button geometry may not move or shrink');
assert(app.includes('playing={playerMotionPlaying} active={appActive}'));
assert(app.includes('style={({pressed})=>[styles.playButton'), 'Original touch feedback must remain');

for(const exact of [
  'embedded&&phoneLayout&&!foldLayout&&styles.playerScreenEmbeddedPhoneTight',
  'embedded&&phoneLayout&&!foldLayout&&styles.playerAdaptivePhoneTight',
  'embedded&&phoneLayout&&!foldLayout&&styles.playerControlColumnPhoneTight',
  'embedded&&phoneLayout&&!foldLayout&&styles.transportPhoneTight',
])assert(app.includes(exact),'Phone-only treatment must never apply to unfolded mode: '+exact);
assert(app.includes('playerAdaptivePhoneTight: {marginTop:-18,gap:8}'));
assert(app.includes('transportPhoneTight: {marginVertical:4}'));
assert(app.includes('playerScreenFold: {paddingHorizontal:24,paddingTop:12,gap:14}'));

const source=crypto.createHash('sha1').update('blob '+Buffer.byteLength(reader)+'\0').update(reader).digest('hex');
assert.equal(source,'827914360d70e33af63ed3e03b66095318144756',
  'Canonical double tap, speech-bubble focus, pinch zoom and comic page turns changed');
const speechBlob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(speech)+'\0').update(speech).digest('hex');
assert.equal(speechBlob,'280b441936ce366554a908bbde9f0d20c047c71d',
  'Canonical speech bubble focus script changed');
assert(app.includes('source={reading.format===\'Comic\'?comicReaderWebViewSource(localReader.html,Platform.OS===\'android\'&&comicReaderUseDataFallback):{html:localReader.html}}'));
assert(app.includes('comicWebViewFallbackAttempt.current=true;setComicReaderUseDataFallback(true);return;'));
assert(app.includes("setComicReaderUseDataFallback(false)"));
assert(app.includes('key={reading.uri+(reading.format===\'Comic\'&&comicReaderUseDataFallback?\':data\':\'\')}'));
assert(!app.includes('allowUniversalAccessFromFileURLs'),'Do not loosen WebView file-security boundary');

console.log('PASS: optical glyph centring, only folded portrait scroll tightening, exact comic HTML recovery and unchanged gesture/reader source');
