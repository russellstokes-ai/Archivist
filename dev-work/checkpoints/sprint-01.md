# Sprint 1 — One Library, Multiple Sources

Durable reconstruction checkpoint.

Implemented:
- Local, Server and Downloaded coexist in one catalogue model.
- Stable source-aware identity and downloaded/server deduplication.
- Source-aware covers, open/read/play routes and progress.
- Mixed-source persistent queue.
- Source-aware Space filtering.
- Local organisation remains available while connected.
- Server sign-out preserves local/downloaded content.

Validation:
- TypeScript typecheck passed in GitHub Actions.
- Full mobile behavioural/contract suite passed in GitHub Actions.

Status: durable on dev/archivist-work.
