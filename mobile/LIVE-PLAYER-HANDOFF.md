# Archivist Live Player / Now — Locked Handoff

**Status:** Product/UI work considered complete for the current finishing phase.

**Active source branch:** `design/draftbit-universal-phone`

**Player checkpoint:** `43a1e40a079cc36841d09f470f95a120727a49ad`

This file is the durable handoff for the approved Live Player / Now experience. Future work should not redesign or continue the Player unless Russell explicitly reopens scope or another change causes a proven regression.

## Product role

Now is the central contextual Player / Reader destination in the five-item primary navigation:

Shelf · Library · Now · Atlas · Stats

The Now page itself does not need a normal page title. It is a live-context hub, not another catalogue screen.

## Approved Live Player character

The Player is a signature Archivist experience and must not regress into a generic media player.

Approved:
- physical Living Book hero rather than a plain album-art card;
- actual work cover used as the book/front-cover identity when available;
- editorial title/byline/series/chapter hierarchy;
- ambient Archivist teal atmosphere;
- progress/timeline and primary transport visible in the first viewport;
- deliberate phone composition;
- deliberate Fold/open composition rather than stretched phone layout;
- persistent top-right profile identity;
- accessibility semantics and enlarged invisible hit areas where needed;
- Reduced Motion support.

## Current transport / motion checkpoint

The current source checkpoint implements:
- timed seek controls around the central play/pause control;
- durable/coalesced seeking and persistence;
- page/leaf skip animation;
- smooth open/close book state;
- narrator-aware byline where metadata exists;
- stale seek completion protection;
- failed seek protection;
- accessible decorative artwork treatment.

Exact current behaviour and automated evidence are recorded at the top of `TESTING-READINESS.md`.

## Living Book rules

- Play opens the book.
- Pause closes/settles the book.
- Page movement must feel physical and restrained rather than constantly fluttering.
- Skip actions may use multi-leaf movement to communicate direction/scale.
- Audio seeking must not depend on the animation completing.
- Reduced Motion removes decorative turning while preserving clear state change.
- Missing cover falls back gracefully without turning into a large text card.

## Responsive rules

- normal phone: book, identity, timeline and transport must fit the first viewport as far as practical;
- Fold/open: use deliberate two-column artwork/control composition;
- wide: preserve comfortable scale and hierarchy rather than simply enlarging everything;
- fold/unfold must not lose playback state or hide primary transport.

## Lock rule

Do not change:
- overall Player composition;
- visual hierarchy;
- Living Book identity;
- current control language;
- approved palette;
- approved motion language;
- Player/Reader Now relationship;

unless Russell explicitly requests a change.

Allowed without reopening the design:
- bug fixes;
- accessibility fixes that preserve appearance;
- release/build compatibility fixes;
- persistence correctness;
- platform integration;
- fixes required by iOS/Android native behaviour;
- regressions caused by unrelated work.

## Release QA still allowed

Calling the Player locked does **not** mean all physical acceptance is complete.

Release QA may still verify:
- background playback;
- lock-screen/system controls;
- Bluetooth;
- interruptions/calls;
- offline playback;
- resume after relaunch;
- end-of-track behaviour;
- fold/unfold;
- long titles;
- missing artwork;
- light/dark;
- Reduced Motion;
- iOS safe areas;
- Android safe areas;
- Android Auto where supported.

A QA failure may trigger a bug fix, but should not be used as an excuse to redesign the approved Player.

## Related files

- `CURRENT-UI-HANDOFF.md`
- `DESIGN-STANDARD.md`
- `TESTING-READINESS.md`
- `mobile/UI-QA-LOCK.md`

