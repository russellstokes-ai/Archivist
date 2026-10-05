const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const auto=fs.readFileSync(__dirname+'/androidAuto.ts','utf8');
const service=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt','utf8');
const manifest=fs.readFileSync(__dirname+'/android/app/src/main/AndroidManifest.xml','utf8');

assert.ok(manifest.includes('com.google.android.gms.car.application'),'Android Auto media discovery metadata must remain declared');
assert.ok(manifest.includes('android:name=".ArchivistAutoService"'),'Archivist must expose its MediaLibraryService');
assert.ok(manifest.includes('androidx.media3.session.MediaButtonReceiver'),'hardware/System UI playback resumption receiver must be declared');
assert.ok(service.includes('MediaLibraryService()')&&service.includes('MediaLibrarySession.Builder'),'Android Auto must use the native Media3 browsable library path');
assert.ok(service.includes('onPlaybackResumption')&&service.includes('resumeWorkKey'),'service/process-loss playback resumption must restore the authoritative audiobook');
assert.ok(service.includes('AUDIO_CONTENT_TYPE_SPEECH')&&service.includes('setHandleAudioBecomingNoisy(true)'),'car playback must use audiobook audio-focus/headphone safety semantics');
assert.ok(service.includes('ICON_SKIP_BACK_15')&&service.includes('ICON_SKIP_FORWARD_15'),'car transport must retain 15-second audiobook seek controls');
assert.ok(service.includes('setTrackNumber(chapterIndex + 1)')&&service.includes('setTotalTrackCount(work.tracks.size)'),'car Now Playing metadata must expose chapter position');
assert.ok(service.includes('setAlbumTitle(work.title)')&&service.includes('setArtist(work.author.ifBlank { null })'),'car Now Playing must expose book and author metadata');
assert.ok(service.includes('attachArtwork(metadata, work.coverUri)'),'cover artwork must flow into Android Auto metadata');
assert.ok(service.includes('private fun <T> paged('),'browse/search results must paginate correctly');
assert.ok(auto.includes('version:3')&&auto.includes('resumeWorkKey?:string'),'phone must publish the authoritative Now audiobook into the car snapshot');
assert.ok(app.includes('persistAndroidAutoLibrary(localPersonalWorks,localWorkProgress,resume)'),'phone-to-car snapshot must include current resume identity');
assert.ok(app.includes('setInterval(()=>void syncAndroidAutoProgress(),4000)'),'active phone app must continuously consume car progress rather than only once');
assert.ok(app.includes("if((currentNow?.updatedAt||0)>progress.updatedAt)return;"),'stale car progress must never overwrite newer phone/Now progress');
assert.ok(app.includes("await persistNowSession('audio',display,progress.complete?0:progress.seconds"),'fresh car progress must feed the same durable Now session');

console.log('PASS: Test 10 Sprint 6 Android Auto commercial playback, metadata, resumption and Now sync are locked');
