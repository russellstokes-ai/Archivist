# Sprint 6 — Insights, Family & Organisation

Implementation checkpoint.

Implemented:
- Profile activity history with 30-minute aggregation, listening-time deltas and independent reading events.
- Activity remains profile-isolated and library-grant aware.
- Insights is a dedicated primary screen rather than an alias of Profile.
- Personal metrics, editable goals, recent activity, ratings, achievement preview and a library-wide annotation hub.
- Insight goals persist locally with bounded sanitization.
- Smart Shelves now support recursive nested ALL / ANY rule groups with bounded depth and child counts.
- Advanced rule editing supports field/operator/value changes plus nested groups and removal.
- Legacy saved-filter shelves remain compatible.
- Existing Admin/User isolation, revocation/key rotation and Admin-only management remain intact.
- Collections continue to use canonical work identity and remain compatible with Local / Server / Downloaded deduplication.

Release-safe scope:
- Existing metadata provenance/manual override behaviour is retained.
- Existing edition/format separation and safe cross-root organisation are retained from prior sprints.
- M4B conversion/writeback is not silently enabled because destructive media conversion requires a separately proven preview/recovery workflow.
- External metadata providers remain optional rather than required for a privacy-first release.

Validation:
- Added mobile tests for nested Smart Shelf semantics and Insights aggregation.
- Added server activity tests in the preceding Sprint 6 server commit.
- CI must pass before this sprint is closed.
