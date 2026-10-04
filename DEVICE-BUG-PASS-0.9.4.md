# Archivist 0.9.4 — Real-device bug pass

Baseline frozen at `backup/0.9.4-real-device-baseline-20261004`.

## Rules
- The tested 0.9.4 UI is locked. Fix only the reported defect or a directly-caused regression.
- Preserve final Atlas, Live Player, Comic Focus and overall visual design.
- Do not mark a bug fixed until covered by a test or verified build/runtime evidence.
- Keep mobile and server changes separate unless the defect genuinely crosses both.

## Reported defects
1. **Profile / system-status collision** — user profile control interferes with Wi-Fi/battery status area.
2. **Live Player flicker + Living Book motion** — flicker; pages do not slowly turn/open when playback starts.
3. **Rewards tuning** — Level 5 reached too quickly on a small library; expand/tune rewards.
4. **Metadata / cover quality** — missing covers, unclassified works, false titles such as “Part 1 / Part 36”; improve detection/resolution.
5. **Needs-attention mobile layout** — metadata review screen does not fit on phone.
6. **Shelf/library population race** — Shelf initially mostly coverless and Library appeared dominated by review items, later populating after background work.
7. **Splash duration** — splash disappears almost immediately.
8. **Library Manage blank overlay** — Manage opens a blank panel/window.
9. **Atlas breakdown chart quality** — outer chart/ring shows evenly spaced marks rather than meaningful metadata distribution when metadata is poor.
10. **Shelf Arrange/filter motion** — lonely Arrange action; popup jumps vertically when changing filters.
11. **Live Player chapter/seek reset + More** — chapter selection/fast-forward appears to reset page; More does nothing.
12. **General modal/menu jumping + Smart Shelf clarity** — multiple menus/submenus mount/unmount with visible jumps; Smart Shelf creation is confusing.
13. **Dismiss gestures** — some sheets cannot close via swipe down or tapping scrim.
14. **Atlas deselection** — tapping empty graph space should clear selection and restore other nodes.
15. **Second folder / comic / WebView / sidebar** — newly added folder may not appear until restart; comic open can crash with Android WebView error; Library folder sidebar too narrow for long labels.

## Initial priorities
- P0: #15 comic/WebView crash, #8 blank Manage, #11 player reset/More, #6 library population race.
- P1: #1 status-area collision, #2 player flicker/motion, #5 mobile review layout, #13 dismiss gestures, #14 Atlas deselection.
- P2: #3 rewards balance, #4 metadata/cover quality, #7 splash duration, #9 Atlas breakdown quality, #10/#12 menu stability and Smart Shelf clarity.
