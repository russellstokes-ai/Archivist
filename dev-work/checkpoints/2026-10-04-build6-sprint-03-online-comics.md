# Build 6 Sprint 3 — online comic metadata enrichment

Date: 4 October 2026  
Branch: `build/0.9.4-test6-20261004`  
Executable/tested head: `1dcc30fb1b621c4233f1ff54677d1d235ce23bc5`

## Goal

Give Archivist issue-aware comic identification and enrichment that can cope with real-world CBZ/CBR/CBT naming, incomplete ComicInfo data and sparse folder structures without allowing uncertain internet matches to damage a well-organised local library.

## Architecture

Sprint 3 extends the existing staged local pipeline without changing the approved Settings UI:

1. publish the local catalogue immediately;
2. recover local/embedded covers;
3. enrich eligible books/PDF books through the Sprint 2 engine;
4. reload the latest persisted catalogue;
5. enrich eligible comics through Metron when a secure token is configured.

The local library remains usable without internet access or a Metron account. Provider configuration is deliberately deferred to Sprint 4, where books and comics will receive one coherent Settings/Data experience.

## Local ComicInfo improvements

Archivist now retains substantially richer comic-specific local metadata instead of flattening everything into generic book fields.

Supported ComicInfo evidence includes:
- series and issue number;
- distinct comic volume;
- writer, penciller, inker, colourist, letterer, cover artist, editor and translator credits;
- story arcs;
- characters;
- teams;
- universes;
- UPC / GTIN and SKU;
- Comic Vine and GCD identifiers when present;
- store date and cover date;
- page count;
- alternate-series/series-alias data where present.

A correctness defect was also removed: ComicInfo `<Volume>` can no longer overwrite `<Number>` as the issue order. For example, Volume 2 / Issue 1 remains issue 1.

## Recognition and matching

The comic matcher builds evidence from both catalogue metadata and decoded filename/folder structure. Covered naming patterns include:
- `Series - 001 - Story Title.cbz`;
- `Series #001.cbz`;
- `001 - Story Title.cbz` inside a series folder;
- bare `001.cbz` inside a series folder;
- year-qualified series folders such as `Amazing Spider-Man (2018)`;
- volume markers such as `v5` / `Vol. 5`;
- non-trivial issue identifiers including suffixes, annual forms, fractions and negative issue numbers;
- direct Metron IDs plus Comic Vine/GCD IDs;
- UPC and SKU evidence.

Leading zeroes are normalised for ordinary numeric issues while significant issue forms are retained.

Matching weights exact external IDs / UPC / SKU most strongly, then exact issue number + strong series identity, followed by volume, year and publisher evidence. A wrong issue number is heavily penalised even when the series matches.

## Provider

Metron is the Sprint 3 online comic provider.

- Authentication uses a bearer token read from native SecureStore key `archivist.metadata.metron.token.v1`.
- No credential is embedded in source or written to the local catalogue/state JSON.
- Requests identify Archivist with an application User-Agent.
- Direct provider-ID lookup is used where an existing Metron ID is known.
- Search can use external IDs, UPC/SKU, series, issue, volume, year and publisher evidence.
- Top candidates are hydrated through issue detail when richer fields such as creators or description are missing.
- Provider rate limiting stops the current comic enrichment pass rather than repeatedly retrying.
- Positive results are cached for 30 days; misses for 24 hours.

## Fields enriched

Where a high-confidence match is accepted and local precedence permits it:
- display title;
- writer/primary creator;
- series and issue order;
- genre;
- publication year;
- publisher;
- ISBN;
- language;
- description;
- issue number and volume;
- complete creator credits/roles;
- story arcs;
- characters, teams and universes;
- UPC / SKU;
- Metron / Comic Vine / GCD IDs;
- store / cover dates;
- page count;
- cover artwork.

Work and edition identities are recalculated after accepted enrichment.

## Safety and review

- Manual, embedded and sidecar metadata remain protected from weaker online values.
- Existing selected/local covers are retained; online covers fill missing artwork and remain available as candidates.
- High-confidence exact-ID or exact-issue + strong-series matches can auto-apply.
- Close or ambiguous candidates are retained for review instead of silently changing the catalogue.
- Wrong-issue candidates are rejected aggressively.
- A newer scan generation cancels stale enrichment work.
- Provider cache and catalogue changes persist incrementally.
- Missing Metron configuration simply skips online comic enrichment; local ComicInfo/path scanning continues normally.

## Regression coverage

New and expanded tests cover:
- rich ComicInfo extraction and creator roles;
- Number vs Volume correctness;
- sparse issue filenames and parent-folder reconstruction;
- numeric, suffixed, annual, fraction-like and negative issue identifiers;
- strong same-series/same-issue matching;
- wrong-issue rejection;
- external provider IDs and direct Metron issue lookup;
- UPC prefix lookup for common scanned codes;
- rich detail mapping for publisher, creator roles, arcs, characters, teams, universes and page count;
- preservation of protected local fields;
- secure bearer-token authentication and application User-Agent;
- unconfigured-provider behaviour;
- staged scan -> covers -> books -> comics enrichment ordering.

## Final automated evidence

All evidence below targets exactly `1dcc30fb1b621c4233f1ff54677d1d235ce23bc5`.

- **PASS Mobile:** run `37238680951`
  - dependency installation
  - Expo Doctor
  - TypeScript
  - **44/44 maintained mobile suites**
  - version consistency
  - Expo web bundle

- **PASS iOS:** run `37238680942`
  - dependency installation
  - Expo Doctor
  - TypeScript
  - native iOS project generation
  - CocoaPods
  - complete iOS Simulator compile

Sprint 1 Android-native proof remains run `37236065446`.

## Acceptance boundary

Sprint 3 is code/automated-test GREEN. Physical-device testing with real messy comic libraries and live Metron credentials remains required before Build 6 device acceptance.

This sprint does **not** add provider configuration UI and does not redesign Settings. Sprint 4 is the approved holistic metadata-settings pass for books and comics together. Server-side online metadata-provider parity is also not claimed by this checkpoint.
