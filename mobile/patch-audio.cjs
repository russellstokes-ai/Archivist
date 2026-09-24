// Version-pinned native extension. Refuse silent patch drift on dependency updates.
const fs=require('node:fs'),path=require('node:path');
const root=path.dirname(require.resolve('expo-audio/package.json'));
if(JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version!=='57.0.5')throw Error('Review Archivist audio patch before upgrading expo-audio');
function patch(file,anchor,insert){
 const target=path.join(root,file),source=fs.readFileSync(target,'utf8');
 if(source.includes(insert))return;
 if(source.split(anchor).length!==2)throw Error('Native audio patch anchor changed: '+file);
 fs.writeFileSync(target,source.replace(anchor,insert+anchor));
}
patch('android/src/main/java/expo/modules/audio/AudioPlayer.kt','  var preservesPitch = true',`  // Archivist native sleep timer; independent of React Native JS timers.
  private val archivistSleepHandler = android.os.Handler(android.os.Looper.getMainLooper())
  private var archivistSleepTask: Runnable? = null
  fun setSleepTimer(seconds: Double) {
    archivistSleepTask?.let { archivistSleepHandler.removeCallbacks(it) }
    archivistSleepTask = null
    if (seconds <= 0 || !seconds.isFinite()) return
    val weakPlayer = java.lang.ref.WeakReference(this)
    val task = Runnable { weakPlayer.get()?.ref?.pause() }
    archivistSleepTask = task
    archivistSleepHandler.postDelayed(task, (seconds.coerceAtMost(86400.0) * 1000).toLong())
  }

`);
patch('android/src/main/java/expo/modules/audio/AudioPlayer.kt','    mediaSession.release()\n    if (isActiveForLockScreen)',`    setSleepTimer(0.0)
`);
patch('android/src/main/java/expo/modules/audio/AudioModule.kt','      Function("pause") { player: AudioPlayer ->',`      Function("setSleepTimer") { player: AudioPlayer, seconds: Double ->
        runOnMain { player.setSleepTimer(seconds) }
      }

`);
patch('ios/AudioPlayer.swift','  var shouldCorrectPitch = true',`  // Archivist native sleep timer; active audio keeps the native process running.
  private var archivistSleepTask: DispatchWorkItem?
  private var archivistSleepGeneration = 0
  func setSleepTimer(_ seconds: Double) {
    archivistSleepTask?.cancel()
    archivistSleepTask = nil
    archivistSleepGeneration += 1
    guard seconds.isFinite, seconds > 0 else { return }
    let generation = archivistSleepGeneration
    let task = DispatchWorkItem { [weak self] in
      guard let self, self.archivistSleepGeneration == generation else { return }
      self.pause()
    }
    archivistSleepTask = task
    DispatchQueue.main.asyncAfter(deadline: .now() + min(seconds, 86400), execute: task)
  }

`);
patch('ios/AudioPlayer.swift','    ref.currentItem?.cancelPendingSeeks()',`    archivistSleepTask?.cancel()
    archivistSleepGeneration += 1
`);
patch('ios/AudioModule.swift','      Function("pause") { player in',`      Function("setSleepTimer") { (player: AudioPlayer, seconds: Double) in
        DispatchQueue.main.async { player.setSleepTimer(seconds) }
      }

`);
console.log('Archivist native audio sleep extension applied (expo-audio 57.0.5)');
