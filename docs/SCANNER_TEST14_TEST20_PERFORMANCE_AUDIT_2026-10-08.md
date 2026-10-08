# Archivist scanner: Test 14 vs Test 20 performance and identity audit
Date: 2026-10-08
Status: **audit branch with scoped grouping regression test/fix; production integration branch and canonical UI untouched**
Baseline: build/0.9.4-test14-20261006 @ 2b86358ae73de0d0231df2b52173149b7c38884a
Regression: integration/test18-reliability / Test 20 @ 002fb184d2a64abdeebbe224d7deb81fbf63eb30

## Device evidence and unknowns
- User confirmed earlier Test 14 mapped about 227 physical audiobook/chapter files to 12 logical books.
- Test 19 surfaced 226 items in Needs Attention; Test 20 surfaced 85 "books" on device.
- Test 20 is sluggish and briefly unresponsive while preparing a library of fewer than 20 logical books.
- The directory tree, real file tags, provider implementation, frame traces, and precise scan durations have not been captured. Do **not** claim the 85 items all correspond to distinct grouping keys until instrumented.
- Canonical phone/Fold UI and branding are locked. Keep stages/review/published catalogue separate.

## Confirmed implementation changes

### Test 14
- mobile/localLibrary.ts: Android chooses scanLocalFoldersNativeV2 when ArchivistLibrary.startTreeScan exists.
- ArchivistLibraryModule.kt: background scanner enumerates SAF directories with DocumentsContract, returning media, sidecars, artwork, directory context in batches. Each directory uses **two** ContentResolver child queries (context then media).
- Audio files may be converted to MediaStore URIs and queried for indexed album, artist, title, track, year. This may work well on local ExternalStorageProvider and MediaDocumentsProvider but is not universal.
- mobile/localLibrary.ts: source quickAlbum/quickTitle/quickArtist used immediately. Source workTitleHint and trackTitle distinguish work identity from chapter title.
- Limitations: two queries per folder, potentially one indexed metadata lookup per audio asset, provider-dependent, native scanner fallback behavior and staging differences; DO NOT copy this path wholesale.

### Test 20
- mobile/localLibrary.ts: native tree scanner removed; JS uses StorageAccessFramework.readDirectoryAsync, follows each entry, and calls getInfoAsync on each supported media file. Results cross RN/Expo boundaries per entry. A fast cooperative yield exists but cannot remove bridge/provider latency or synchronous JS data processing.
- App.tsx always calls scanLocalFolders(...,{deferEmbeddedMetadata:true,deferEmbeddedCovers:true}). In this pass album/artist tags are unavailable for NEW files unless cached from unchanged previously indexed media.
- After discovery, App.tsx invokes enrichPublishedLocalEmbeddedMetadata(...fastAudioProperties:true) on unresolved audio. It selects every unresolved audio file, runs concurrency=1, batchSize=8, itemTimeoutMs=1200, maxConsecutiveTimeouts=1. This is still per-file, not per-work.
- BoundedAudioReader.kt performs up to 256 KiB MP3 head (+128 B tail) or 512 KiB head plus 512 KiB tail for M4A/M4B, Base64-encodes and sends them through RN to JavaScript. Worst-case Base64 payload for 227 files: ~79 MB for MP3 or ~317 MB for M4A/M4B, before intermediate allocations. Actual transfer is unknown and depends on file lengths, selected eligible files, and timeouts.
- BoundedAudioReader.kt has a one-second native deadline. On watchdog timeout it sets a process-wide permanent 'tripped' flag that rejects subsequent reads; this is intentionally protective against blocked providers but makes one failure poison later reads for that process. With maxConsecutiveTimeouts=1, a single timed-out fast read may stop the remaining audio enrichment for that scan. The JavaScript Promise.race timeout alone does not cancel provider operations.
- App.tsx resumes through bounded archive probes, online metadata, cover caching, and publication; it repeatedly synchronizes work metadata and persists stages. Online/cover time depends on network and cache. Some user-visible progress ranges are inconsistent with which stages normal preparation actually runs.
- metadataSync.audioWorkGroupKeys partitions ANY directory when >1 distinct embedded workTitle. Tracks with no embedded workTitle become independent audio-file:<uri> identities. Real chapter files with disc-specific or inconsistent album values can therefore fragment a logical work after the enrichment stage. Mixed collections must nevertheless retain distinct works.
- Test 20 contains synthetic 226/12 grouping fixtures but not an actual provider-level end-to-end scan from SAF listing through metadata and publication on representative real library data. No production device trace or end-to-end latency budget has been verified.

## High-confidence performance risks
1. O(files) file-stat / RN-boundary calls during JS discovery, including redundant stat calls during later stages.
2. O(unresolved audio files) serial native window reads and multi-megabyte Base64 traffic crossing to JS; parsed results are tiny relative to payload.
3. Native single-reader circuit can be permanently disabled by one slow provider read; follow-on tags can be absent.
4. Multiple full catalogue regrouping/synchronization and render updates; no recorded budget for JS frames or long tasks.
5. Work-level online enrichment and work-level cover downloads may introduce provider/network latency; instrument separately from local scanning.
6. Metadata ambiguity can generate too many logical works and consequently more work-level online lookups, review cards, and cover tasks.

## Confirmatory investigation required
- Add **opt-in developer diagnostics**, redacting absolute filenames and full URIs by default:
  per-stage wall time, provider authority and type, files/folders visited, SAF query/stat counts & time, metadata files attempted/succeeded/failed/timed out/skipped, bytes returned to JS, bridge response size, work count before/after each stage, group-split reasons including album conflict counts, online lookup/cache counts, React Native JS long tasks / Android frame timing.
- Capture Perfetto/system trace around onboarding on a physical Samsung Fold and compare cold + unchanged warm rescans. Android ANR and frame-timing references below.
- Device regression fixture from anonymised directory/folder identities, extension, file-level title/album/track tags and expected work-group IDs (never need actual audio payload to reproduce grouping).
- Do not clear app data: test Test 19→Test 20 upgrades and stale published/review identities separately from a fresh install.

## Remediation implementation order / gates

### A. First establish identity regression and instrumentation
- Commit a RED grouping fixture for disc-qualified album tags + missing album tags in one numbered chapter folder, along with a negative fixture of two distinctly tagged audiobooks sharing a folder.
- Add stable work-level count, staged/review/publication count and diagnostic group split reasons per stage.
- Match final grouped works to device gold standard (approx. 12 logical books; not 'always 12' for any arbitrary library).

### B. Rework Android discovery, never wholesale revert
- Native background SAF walker with one projected query per directory, returning minimal file attributes, relative directory hierarchy and stable content IDs in bounded batches.
- Provider-aware MediaStore indexed metadata when mapping supported and fast, with fall-forward for unsupported/cloud SAF providers. Must not query MediaStore for every file indiscriminately or copy entire media.
- Do not process 1,000+ item batches on JavaScript without yielding. Limit native queue/backpressure, honour cancellation, protect published snapshots.
- Native scanner errors/cancel must be visible, not silently interpreted as empty folder or successful complete.

### C. Work-first, bounded audio metadata
- First determine safe provisional physical work groups (directory and multipart evidence), then inspect 1–3 representative tracks per work for work-level tags. Escalate only for missing/conflicting evidence; preserve file-level chapter metadata and order.
- Prefer native structured metadata maps rather than Base64 windows. Do not send tens or hundreds of MB of source data across RN.
- Timeouts must be per-source/per-provider and recoverable when the worker actually settles; never restart an uncontrollably blocked worker. Skip and report remaining work safely if the provider is stuck.
- Better-than-FileName evidence priority: manual edits > verified work sidecar / IDs > valid album tags > strong book folder > filename; hold conflicts backstage in ONE work review card.

### D. Grouping/publication lifecycle
- Distinguish chapter name and work name; normalize narrowly provable disc/part album suffixes while preserving genuinely distinct albums in shared folders.
- Avoid changing work identity on every asynchronous enrichment batch. Keep a stable provisional group key; reconcile atomically if credible evidence demands split/merge.
- A review edit applies to the entire work. Review resolution and publication are separate; an accepted work remains in Needs Attention if required artwork not yet cached, never disappears from both Library and review.
- Preserve dual square library / portrait Living Book covers and existing metadata; no UI rearrangements.

### E. Evidence-based performance and acceptance
- Record *observed* baseline and new stage latencies and frame traces on same device/provider/data; target local discovery noticeable faster, no UI stalls; do not fabricate measured time claims.
- Primary acceptance: library previously seen as 227 files / 12 books stays 12; all chapters playable and ordered, 12 logical review objects maximum for those works; legitimate distinct books never merged, root-level multi-part works identified.
- Verify fresh/warm/resume/cancel/slow-provider/unsupported-MediaStore/large-library conditions.
- Preserve published catalogue on failed scan or artwork fetch; no file deletion or reset.
- Entire Node mobile suites, Android native instrumentation/CI, web/Fold Playwright UI contract, signed APK smoke test, then real-device onboarding acceptance before new APK approval.

## Isolated source-control verification (audit branch only)
- Audit branch: audit/test20-scanner-latency-20261008 based on Test 20 commit 002fb184.
- Added mobile/scanner-conflicting-albums-regression.test.cjs with numbered chapters, mixed disc/part tags, missing album tags and a negative two-works-in-one-folder test.
- GitHub Actions Mobile checks, run 37784970961 (commit 0f76cc6), **confirmed RED**: the 18 physical chapter tracks became **8** logical works instead of one (8 != 1). This is a verified design flaw in Test 20; it is NOT proof all 85 on the user's device arise from this same source.
- A first narrowly scoped metadataSync.ts change on this audit branch normalizes only explicit album suffixes such as '(Disc 2)', while preserving the two-distinct-album guard. Added a 227-file / 12-work test (commit 574124a).
- This isolated grouping fix does **not** optimize the underlying SAF/JS metadata data flow; the latency problem remains until a measured native-worker overhaul. No Test 21 APK should be published based only on these tests.
- CI outcome for the latest commit must be checked before merging. Physical Fold acceptance remains mandatory.

## Official technical references
- DocumentsContract: https://developer.android.com/reference/android/provider/DocumentsContract
- MediaStore getMediaUri restrictions: https://developer.android.com/reference/android/provider/MediaStore#getMediaUri(android.content.Context,android.net.Uri)
- Android ANR / blocking main thread: https://developer.android.com/topic/performance/issues/anr
- Android system-trace profiling: https://developer.android.com/topic/performance/tracing/profile-types-overview
- Android on-device system tracing: https://developer.android.com/topic/performance/tracing/on-device
