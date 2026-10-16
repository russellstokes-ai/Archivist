const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const service=fs.readFileSync(path.join(__dirname,'android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt'),'utf8');
// Media3 Player callbacks provide oldPosition / newPosition. Once the new
// item is active, player.currentMediaItem/currentPosition no longer identify
// the outgoing chapter, so saving current state *during transition* is wrong.
assert.match(service,/override fun onPositionDiscontinuity\(\s*oldPosition:\s*Player\.PositionInfo,\s*newPosition:\s*Player\.PositionInfo,\s*reason:\s*Int\s*\)/,
  'Android Auto must capture old position from Media3 discontinuity');
assert.match(service,/oldPosition\.mediaItem\?\.mediaId/,
  'The outgoing media ID must come from oldPosition, not player.currentMediaItem');
assert.match(service,/persistProgressFor\(oldMediaId,\s*oldPosition\.positionMs,\s*false,\s*true\)/,
  'Persist the outgoing chapter/position, never the new chapter identity');
assert.match(service,/private fun persistProgressFor\(mediaId:\s*String,\s*positionMs:\s*Long,\s*complete:\s*Boolean\)/,
  'Progress writer must accept an explicit track identity and timestamp');
assert(!/override fun onMediaItemTransition\([\s\S]{0,140}?persistProgress\(false\)/.test(service),
  'Do not persist newly active chapter position in onMediaItemTransition');
assert.match(service,/AtomicFile\(File\(dir, "progress.json"\)\)/,
  'Preserve the existing crash-safe writer, not an ad-hoc file replacement');
console.log('PASS: car audio transitions persist outgoing chapter/media position, with existing atomic-file and UI contracts intact');
