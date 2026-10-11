# Canonical Archivist baseline — read before changing this repository

The user designated the full app version `df4c39b44394d8c512ca0298bffa7f19da356490` as the canonical baseline on 2026-10-11. Read [CANONICAL_BASELINE.md](docs/scanner-vnext/CANONICAL_BASELINE.md) before implementation. This supersedes older baseline recommendations; historical scanner versions are not implementation starting points.

- Preserve the accepted scanner, grouping, performance, onboarding, direct metadata review flow and canonical UI. Do not replace or refactor them as incidental cleanup.
- Start future work from this baseline or its documented descendants, on a separate development branch. Keep the canonical baseline reference at the recorded version.
- Change locked behavior only when the user's current request explicitly authorizes that scope. Keep unrelated accepted features intact.
- Preserve manual metadata. Keep unresolved works visible; never invent identity, genre or publication year to claim completeness.
- Retain and run the existing scanner and process lock checks for relevant changes. Do not update their expectations merely to make a regression pass.
- Do not represent the baseline designation or automated build success as proof of physical Fold acceptance for every feature. Known limitations are recorded in the baseline document.

## Authoritative current development plan

Read [ARCHIVIST_COMMERCIAL_FINISHING_MASTER_PLAN_2026-10-11.md](docs/ARCHIVIST_COMMERCIAL_FINISHING_MASTER_PLAN_2026-10-11.md) and track commercial polish/bugs/sprints there, not in old Test 13/14 issues or stale recovery handoffs. Protect the EXACT Living Book renderer, internal animation timing and visual character. User authorises ONLY RESPONSIVE ENLARGEMENT via its outer display stage/layout within safe screen bounds; the animation itself is frozen. Scanner/process lock hashes and Fold screenshot/StyleSheet contracts remain mandatory. Historical GitHub issues #11 and #12 naming Test 13 canonical are superseded by df4c39b.

More specific directory instructions continue to apply.
