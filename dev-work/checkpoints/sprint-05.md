# Sprint 5 — Atlas

Durable implementation checkpoint.

Implemented:
- Replaced the stacked-card Atlas as the primary experience with one continuous pannable and zoomable universe.
- Deterministic stable node positions so the same library does not reshuffle between launches.
- Genre constellation hubs, cover/title work nodes, author monograms, series nodes, collection nodes, note nodes and hashtag/tag relationships.
- Combined Local / Server / Downloaded source model with source filtering and Space filtering.
- Search/focus that recentres the universe on matching people, series, works, collections or tags.
- Tap inspector with mobile bottom presentation and Fold/tablet side presentation.
- Fit/reset and explicit zoom controls plus two-finger pinch handling that preserves the focal point.
- Level-of-detail collapse at lower zoom levels and bounded work sampling for large-library responsiveness.
- Accessible List alternative retains the exact relationship browser and Library drill-down.
- Existing relationship inspector remains available without regressing the approved rounded visual direction.

Validation:
- Atlas relationship regression tests retained.
- Added deterministic universe tests for stable positions, cover/person/series/collection/note/tag nodes, relationships and large-library work caps.
- GitHub Mobile checks must pass before Sprint 5 is marked fully closed.
