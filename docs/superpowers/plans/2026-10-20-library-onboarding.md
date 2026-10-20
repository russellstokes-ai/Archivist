# Library discovery and welcoming onboarding implementation plan

> **For agentic workers:** Use superpowers:executing-plans. User approved implementation inline with minimal usage; no further plan approval needed.

**Goal:** Account for the user's files, improve trustworthy local identification, and let a new user start reading without a wall of metadata warnings.

**Architecture:** Keep the existing atomic scanner, authorised catalogue, readers and durable metadata worker. Add bounded discovery evidence and filename parsing; improve the existing UI rather than introduce another application.

**Tech Stack:** Go/SQLite, plain browser JavaScript, Home Assistant repository build.

**Spec:** User-approved ten-stage plan in this conversation, 20 October 2026, and diagnostic report discussed 18 October.

## Global constraints
- Preserve PR83's verified remote head 212dcc3f8c5958ae09b51cff618e556901ef96b6 and later commits through a leased update.
- Root/archivist/app parity; canonical mobile scanner and reader protected.
- Synthetic media only; no merge, production deployment or live media changes.
- Missing metadata never blocks library access; do not invent genre, issue identity or publication dates.
- One final server candidate after local tests. Hardware and external-provider acceptance must be labelled separately.

## Review focus
- Disconnected/empty mount retains prior records.
- Mixed archive packs and damaged archives must not be described as verified readable comics.
- Filename dates, issue ranges and volumes must not become false issue matches.
- User corrections and locks survive rescan/enrichment.
- A completed import with thousands of metadata gaps leads to Library, not a compulsory review queue.

## Tasks
- [ ] 1. Add behavioural onboarding tests for ready/partial/failed/empty states; implement three-step guidance and Library-first completion in web/onboarding.js and app.js; preserve icons. Run scripts/server-onboarding.test.cjs and ui-contract.cjs.
- [ ] 2. Add synthetic discovery and comic filename tests in server_library_onboarding_test.go. Implement bounded archive identification, reason-based discovery accounting, useful filename parsing and independent metadata validation. Verify malformed extension, actual ZIP pages, mixed pack, unsafe ranges and years. Keep reader capabilities truthful.
- [ ] 3. Improve embedded/sidecar schema handling and metadata diagnostics with real ZIP/TAR fixtures. Expose evidence/reasons and grouped remaining decisions without treating missing optional fields as import failures.
- [ ] 4. Profile unchanged rescan, preserve atomic semantics and improve only measured unnecessary work. Run complete Go suites, changed UI tests and protected-source/parity checks.
- [ ] 5. Assess provider work against secure configuration and actual matching evidence; implement tested bounded adapters where reliable, explicitly record anything that cannot pass acceptance. Keep no-key onboarding functional.
- [ ] 6. Review whole change, update version/install/limitations/docs, push lease-protected PR83 candidate, wait for exact-SHA server checks and QA artifact. Report install version and hardware acceptance steps.

## Execution record
- Setup: clean local checkout e4946d1; remote head verified unchanged. Local Go compiler requested to avoid repeated CI builds.

- Implemented and locally tested: onboarding; actual report filename cases; case/invalid-field metadata; ZIP comment metadata; safe malformed-CBZ recovery; skip-reason reports; Metron opt-in matching; unchanged-scan fast path.
- Full-plan gaps explicitly retained in SERVER_LIBRARY_ONBOARDING_QA_2026-10-20.md; candidate is for owner testing, not completion of commercial acceptance.
- Final independent review identified decimal issues and bracketed annual/volume identity loss. Both reproduced in TestLibraryComicQualifiersAndDecimalIssues, then fixed and passed.
- Local measurement: 10020 synthetic files retained; unchanged rescan 84.90s before,4.66s after.
- Windows file-URL correction was necessary to run SQLite tests locally; Linux path handling unchanged. Linux-only tests/packaging await CI.

- Final executable 29a68642528bba1b87f0005002413c2077695f05: exact-SHA Linux root/package suites, ARM64, Docker/HA smoke and QA packaging passed. CI discovered the ambiguous-multiple-edition fast-path regression; original regression test reproduced locally, guard restored, targeted tests and complete hosted suite passed.
