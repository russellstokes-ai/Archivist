const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const canvas=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const embedded=fs.readFileSync(__dirname+'/embeddedMetadata.ts','utf8');
const audio=fs.readFileSync(__dirname+'/audioMetadata.ts','utf8');
const covers=fs.readFileSync(__dirname+'/coverDiscovery.ts','utf8');
const nativeArchive=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistArchiveModule.kt','utf8');

assert.ok(nativeArchive.includes('fun readArchiveMetadata('),'Android must expose bounded archive metadata inspection');
assert.ok(nativeArchive.includes('BoundedArchiveInput')&&nativeArchive.includes('32L * 1024 * 1024'),'archive metadata reads must have a hard byte budget');
assert.ok(nativeArchive.includes('2_000_000_000L'),'archive metadata reads must have a native deadline rather than relying only on JS Promise.race');
assert.ok(nativeArchive.includes('fun readRarMetadata(')&&embedded.includes('native.readRarMetadata(uri)'),'Android CBR metadata must use a bounded single-pass native reader');
assert.ok(nativeArchive.includes('CancellationSignal')&&nativeArchive.includes('withMetadataInput'),'Android metadata timeouts must cancel the underlying provider/file descriptor, not only abandon a JS promise');
assert.ok(nativeArchive.includes('fun readMetadataRange(')&&audio.includes('nativeMetadataReader.readMetadataRange'),'audiobook tag reads must use cancellable bounded Android byte ranges');
assert.ok(embedded.includes("Platform.OS==='android'")&&embedded.includes('native.readArchiveMetadata(uri,ext)'),'Android EPUB/CBZ metadata must avoid whole-archive foreground copies');
assert.ok(audio.includes('const maxMP4MetadataBytes=768*1024'),'M4B foreground parsing must stay bounded enough to avoid multi-megabyte JS decode bursts');
assert.ok(app.includes('concurrency:2'),'foreground embedded metadata scanning must use bounded concurrency');
assert.ok(covers.includes('maxForegroundAndroidSafArchiveCoverBytes=24*1024*1024')&&covers.includes("uri.startsWith('content://')"),'large Android SAF archives must not be recopied merely to find a fallback cover');

assert.ok(app.includes('const lastPlaybackVisibleRef=useRef(false)'),'Living Book must track player re-entry');
assert.ok(app.includes("if(playbackVisible&&!wasVisible)")&&app.includes("transitionLivingBook({type:'restore',playing:playerMotionPlaying})"),'re-entering an active player must immediately restore a stable visible book');
assert.ok(canvas.includes("else if(next==='closing'){if(activeTurn){if(turn>=.5)commitTurn();else{activeTurn=false;turn=0;rebuildStable();}}"),'Pause must settle/remove an in-flight sheet before closing the cover');
assert.ok(canvas.includes("setPhase(data.phase||phase,data);paint();"),'Living Book state injection must repaint immediately');
assert.ok(app.includes("groupLocalWorks(local).filter(localWorkPublicationReady)"),'normal device Library/Shelf must only receive explicitly published local works');
assert.ok(app.includes("publicationState!=='attention'")&&app.includes('resumeStagedLocalPreparation()'),'interrupted staged metadata must resume after restart while attention items remain backstage');

console.log('PASS: Test 13 real-device metadata and Living Book blockers are locked');
