## Verified checkpoint — 23 October, CB7 closure checks

- Complete mobile run: **202/202 suites passed** (`cb7-full-tests-verified.log`, exit 0). TypeScript passed. Android release Java/Kotlin compilation passed after CB7 integration. No APK has been assembled or dispatched.
- Real generated audio tests passed for MP3, M4A, M4B, AAC, FLAC, OGG, OPUS, WAV and WMA; decoded audio hashes were unchanged. MP3/M4B chapter names/times survived repeated writes. Independent RAR extraction/write tests passed, including the retained RAR5 solid fixture; this does not establish the legacy app reader's handling of every RAR5 archive.
- CB7 has bounded Android selected-page reading (256 MiB stage, 500 pages, 16 MiB selected page), scanner ComicInfo/cover extraction and bounded R4 first-page evidence (64 MiB scanner stage). No CB7 writer or file conversion is claimed.
- Added real generated LZMA2 fixtures and an Android JNI harness in `mobile/test-support/sevenzip`; `.github/scripts/cb7-native-check.sh` runs production extraction on Android without creating an APK. The local Windows emulator cannot start because hardware acceleration is unavailable. Positive JNI execution is **pending GitHub native checks**, not passed.
- Generic ZIP automatic metadata writes are disabled; ambiguous `.zip` files remain DB-only. This closes an unsafe extension-only eligibility gap.
- Protected baselines remain unchanged. Exact reversible CB7 dispatch deltas preserve the existing comic HTML/zoom; cover exceptions have explicit owner approval. New `repair-original-source` reconstruction also reverses that CB7 delta.
- Windows release lint remains unverified because dependency CMake/Ninja fails on long paths. GitHub native checks now run full release lint and the CB7 Android harness **before any APK dispatch**. Do not bypass either gate or publish an interim APK.
- Original owner-library/OCR accuracy and device UI acceptance remain unverified. The diagnostic export exists to collect actual failed cases; generated corpus tests are not evidence of universal identification or universal embedded writes.

# Recognition follow-up — 23 October 2026

## Closure work, 23 October (not released)

The owner requires complete implementation and passing final checks before any APK. No APK dispatch, commit or push has occurred for this closure work. Audio transcription remains excluded.

Additional implementation now present:
- Bounded on-device Latin OCR for first PDF pages; EPUB first-three-spine text and CBZ first-two-page evidence. Text/cover hashes stay private. Only extracted bibliographic clues are sent to existing providers. R4 decisions reject contradictions and ambiguity, persist against an item revision plus source identity/size/time, and cannot trigger automatic file writes.
- Before reusing or saving R4 evidence, bounded native document-stat queries verify the file against the catalogue; changed or unavailable stats leave the item for a rescan/review. Source-stat changes invalidate saved proof even when metadata revision is unchanged.
- Junrar-backed compressed CBR ComicInfo and first safe image extraction, with cancellation and explicit size/engine limits. CB7 remains an explicitly unsupported reader until a verified engine exists; it is not silently treated as CBZ.
- Real cached thumbnails, embedded-cover precedence, conservative folder companions, placeholder URL rejection, bounded cache eviction and exact-edition-only online supplementation. Work-level ISBN lists are not proof of an edition. Manual covers survive identity changes; other cached covers are tied to identity. The player keeps its full-resolution cover; small cards receive a separate thumbnail URI.
- Known audiobook lookups use audiobook edition context and retain it across pagination; print-only results cannot silently establish audiobook edition identity.
- Additional bibliographic fields persist in the library (subtitle, publication date, page count, duration). Writers retain explicit per-format/per-field limits and report partial embedding. PDF custom fields are read back and checked.
- Conservative durable work/duplicate relations preserve independent editions, item IDs and progress. Duplicate links reuse post-write hashes only while current size/time match the receipt; this is cached evidence, not a new full content verification.
- A format/fixture manifest records actual test coverage and unsupported cases. It is not proof of the owner's unavailable media or every device decoder.
- Android compilation requires `node patch-gradle-toolchain.cjs` after dependency installation. The active Android check/APK workflows run it explicitly. It pins the bundled RN 0.83.10 Foojay resolver to 1.0.0 for Gradle 9 compatibility, fails on unexpected dependency changes, and does not patch Expo audio or use a postinstall hook.

The owner explicitly approved exact cover-thumbnail source exceptions in chat after the protection review requested permission. Original baseline hashes remain intact. Physical library acceptance, true interrupted SAF-provider recovery and OCR/device visual acceptance remain unverified; do not claim a hang-free or universally supported product.

Current checks: the first full run was 195/201. All six failed suites passed targeted reruns after fixture/mock/protection corrections. A new complete 201-suite run with the positive compressed CBR fixture is running after source-freshness fixes. TypeScript is being rechecked. Native Java/Kotlin compilation reached app code, caught a cover-cache StringBuilder/String mismatch, and is being rerun with that fix plus release lint. No APK or release-ready claim.

Historical repair-set record follows; its earlier validation counts and missing-R4 statements apply to that earlier snapshot only.

Scope: repair grouping and comic search inputs, expand bounded local clues and add conservative neighbour identification. Retains the existing Scan library / Identify & populate / Complete missing details workflow and Settings diagnostic export. Audiobook transcription is excluded.

Implemented in this follow-up:
- Album/album-artist evidence can group tracks without embedded track numbers. CD directories fold into one book scope; different rendition directories and complete M4B files remain separate. Named chapter prefixes split mixed dump folders. Ambiguous path grouping remains provisional.
- Comic filenames expose series, issue and labelled publication year to providers. Annual cover years are not fabricated as publication dates. Repeated numeric issue filenames can use a meaningful parent directory as low-confidence series evidence.
- Comic R2 matches compare series, issue (including zero padding), publisher and year; writer and exact story title are not mandatory.
- R3 requires unique R1/R2 anchors immediately before AND after an issue in the same source/folder, agreeing series/publisher, and a plausible year interval. Candidate must come from a provider and match those clues. Multiple qualifying records remain review items. R3 is recorded and cannot write files or serve as another R3 anchor.
- Newly accepted strong anchors requeue unresolved series peers. Rescans can add independent embedded clues and promote an R3 item after a fresh R1/R2 decision. Manual fields and established R1/R2 identities are protected.
- ID3 album artist, narrator and selected custom bibliographic frames; MP4 binary disc/track atoms; bounded seeking to metadata beyond large audio sample tables; multiple XML subjects/creators and EPUB ISBN URIs.
- Search detail hydration runs when genre is missing. Existing providers remain complementary.

Validation: 192/192 mobile suites passed, including Java archive fixtures. Final independent-clue promotion and diagnostic input retention changes passed the affected SQLite, scanner pipeline, diagnostic, canonical-lock and TypeScript checks. Protected-source gate passed. Low-power read-only review reported no confirmed significant issue. Native release lint, APK compilation and emulator startup remain GitHub build gates; physical-library acceptance remains pending.

Limits: these fixtures demonstrate concrete repaired cases, not acceptance of the owner's unavailable files. Compressed CBR metadata extraction, R4 OCR/cover similarity, universal writer support, full cover-selection/thumbnail work and a comprehensive real-file corpus are not completed by this patch. No audio is transcribed. Existing safe writer capability limits remain. Diagnostics retain relative library filenames and exclude credentials/media content; the user chooses whether to share.

No new APK is authorised as a completed combined candidate until relevant tests and review pass. Previous export-only run 40025810868 is not this follow-up.
