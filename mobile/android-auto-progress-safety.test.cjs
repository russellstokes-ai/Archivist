const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const service=fs.readFileSync(path.join(__dirname,'android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt'),'utf8');
for(const token of [
  'AtomicFile(File(dir, "progress.json"))',
  'atomic.startWrite()',
  'atomic.finishWrite(output)',
  'atomic.failWrite(it)',
  'output.write(payload.toByteArray(Charsets.UTF_8))'
]) assert(service.includes(token),'Android Auto playback persistence contract missing: '+token);
assert(!service.includes('target.delete()'),'Never delete last good progress before replacement');
assert(!service.includes('tmp.writeText(payload)'),'Avoid non-durable ad-hoc temporary writes');
assert(service.includes('Log.w("ArchivistAuto", "Unable to persist playback progress"'),'Persistence failures must be diagnosable');
console.log('PASS: Android Auto writes progress atomically, preserving last good playback position');
