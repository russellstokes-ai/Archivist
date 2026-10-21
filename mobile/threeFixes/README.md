# Owner-authorised three-fix source patches

These are explicit source changes, not new features or a new baseline. The original accepted `App.tsx` and scanner runtime remain byte-pinned. `appSource.cjs` and `runtimeSource.cjs` contain the complete named, reversible edit manifests for the three repairs the owner approved. Every patch first verifies the full baseline Git blob, requires each anchor to be unique, and verifies a complete reverse reconstruction. An upstream source change fails closed and requires rebasing/review.

**The executable source includes these patches. Do not report the unchanged original source locks alone as verification of the repaired application.** Metro delegates the patched source to Expo's normal transformer. `npm run typecheck` checks both baseline and the complete effective TypeScript program, and the three-fix behavioural tests read exactly the same source function. Metro's cache includes the patch digest. No network, source rewriting, git operations, or execution of shell commands occurs in the transformer.

Inspect the full effective source with `node -e "const s=require('./threeFixes/source.cjs');for(const m of s.manifests()) console.log(m.file,m.code)"` from `mobile`. These source changes should be materialised as ordinary reviewed source edits when the next baseline is approved; never merely remove the transformer because the original source still contains the reported defects.

Unchanged protections: no server, Living Book renderer, navigation, reader rendering, publication rules, credentials, workflow, or release changes. The repaired native stage store remains a normal source file with atomic row batching and generation checks. No dependency upgrades were made.

**APK HOLD:** no APK workflow may be started. Finish source verification first, then present only targeted button/UI recommendations to the owner. Additional UI changes and the eventual APK require the later approval described in `docs/v1/THREE_FIXES_ACCEPTANCE_2026-10-21.md`.
