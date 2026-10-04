# Archivist Atlas — durable handoff

**Status:** Astra owns the final Atlas finishing pass. This file is the durable integration contract so Atlas work does not depend on chat history.

**Active mobile source:** `design/draftbit-universal-phone`

**Locked visual reference:** `design/hig-refresh`

## Committed Atlas baseline already present in Archivist

Do not rebuild Atlas from scratch. The existing product already established:

- a continuous pannable/zoomable Atlas universe rather than a generic node list;
- rounded, premium Archivist graph language;
- genre hubs;
- work/cover nodes;
- author relationships;
- series relationships;
- collections;
- notes/tags relationships;
- search/focus;
- node selection and contextual inspector;
- phone inspector behaviour and Fold/wide side-panel behaviour;
- local and server relationship data paths;
- reduced-motion-aware motion;
- the approved **Universe Stats** area;
- user-reviewed phone metric centring while section headings remain left aligned.

Important earlier visual checkpoints include:
- `d065b02cb44b488d67f69b3f5c5a9ca82d59ad84` — Craft Atlas as a continuous responsive universe.
- `49a2075d76bae99542f4d3f5fb2de711c784d27e` — Craft Atlas canvas and node language.
- `fa716bb0a94e2d254bf18c739455128cda96b550` — Finish Sprint 8 Atlas and reader controls.

The canonical overall visual rules remain in `CURRENT-UI-HANDOFF.md` and `DESIGN-STANDARD.md`.

## Approved Atlas character

Atlas must feel like an Archivist universe, not a generic force-directed graph.

Preserve:
- dark/ivory Archivist canvas and restrained Sage/Gold use;
- rounded clusters/nodes, refined glow and depth;
- stable spatial relationships;
- legible hierarchy between works, genres, authors, series, collections, notes and tags;
- smooth but restrained drift/pulse/expansion;
- clear selected-node focus;
- useful contextual detail rather than decorative graph noise;
- responsive phone/Fold/wide composition;
- Reduced Motion support;
- no redesign of the locked surrounding app chrome.

Phone must remain usable without requiring the Fold side-panel layout. Fold/wide may expose more persistent context.

## Work already reported from later Atlas polishing

The later Atlas refinement stream has included/targeted:
- more accurate node selection;
- floating contextual detail panel;
- animated expansion and stats movement;
- refined glow/pulse treatment;
- stronger Universe Stats presentation;
- interaction and performance refinement;
- phone/Fold verification.

These are continuation items on top of the established Atlas, not permission to replace it.

## Final Astra ownership

Astra should finish:
- interaction polish;
- stable selection/focus transitions;
- clustering/relationship legibility;
- graph performance under realistic library sizes;
- inspector transitions and information density;
- phone/Fold/wide verification;
- light/dark and Reduced Motion acceptance;
- any server relationship endpoint changes genuinely required by the final Atlas.

Astra must not alter:
- Live Player / Now design;
- Comic Focus implementation;
- locked Shelf/Library/Stats/Profile/Settings visual language;
- 600dp+ Fold/open reference outside Atlas-specific approved behaviour.

## Integration gate

Before producing the first complete test app, Astra must update this section with:

- **Final Atlas branch/ref:** _pending Astra_
- **Final Atlas commit SHA:** _pending Astra_
- **Tests/checks run:** _pending Astra_
- **Known runtime/device gaps:** _pending Astra_

Do not call the first complete test app assembled until the final Atlas commit is explicitly identified here or in `FIRST-COMPLETE-TEST-BUILD-HANDOFF.md`.

## Related durable handoffs

- `CURRENT-UI-HANDOFF.md`
- `DESIGN-STANDARD.md`
- `mobile/FOLD-REFERENCE-LOCK.md`
- `mobile/LIVE-PLAYER-HANDOFF.md`
- `COMIC-SPEECH-FOCUS.md`
- `TESTING-READINESS.md`
