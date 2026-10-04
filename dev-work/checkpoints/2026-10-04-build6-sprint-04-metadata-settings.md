# Build 6 Sprint 4 — metadata settings

Date: 4 October 2026  
Branch: `build/0.9.4-test6-20261004`  
Combined Sprint 4+5 executable/tested head: `a9bcf1ae0ef5061412d39ce5241fc8e1e64ffdcd`

## Goal

Expose the book and comic metadata engines through one coherent commercial Settings experience instead of separate technical controls.

## Settings model

Archivist now persists one metadata settings model with safe defaults:
- online metadata: on
- automatic enrichment: on
- apply high-confidence matches: on
- books: on
- Open Library: on
- Google Books: optional/off until configured
- comics: on
- Metron: available when configured

Saved settings are hydrated before the first automatic library scan so startup cannot ignore a user's provider choices.

## Providers and credentials

Settings > Library & Metadata > Metadata now controls:
- Open Library — ready with no setup
- Google Books — optional fallback with secure API-key configuration
- Metron — comic provider with secure token configuration

Google Books keys and Metron tokens are stored only in native SecureStore. Stored credentials are never echoed back into input fields. The UI reports only Configured / Optional fallback / Token required and provides replace/remove flows.

Non-secret provider preferences participate in Archivist backup/restore. Provider credentials do not.

## Behaviour

- A master Online metadata switch controls internet enrichment.
- Automatic enrichment can be disabled while retaining explicit manual refresh.
- Apply confident matches can be disabled; candidates still reach Needs Attention rather than being lost.
- Book and comic provider groups can be enabled independently.
- Open Library can be disabled independently.
- Google Books can operate as a book provider when Open Library is disabled.
- Metron only runs when enabled and securely configured.
- Explicit Refresh metadata & covers clears both provider caches before rescanning, so the action genuinely bypasses stale positive or negative results.
- Background scan enrichment still runs generation-guarded so stale work cannot overwrite a newer scan.
- Rapid setting changes are based on the latest in-memory settings ref rather than stale render state.

## UX

The metadata provider UI reuses the existing Settings hierarchy and row language rather than adding another card-heavy settings page. It exposes one canonical refresh action and one cache-clear action.

## Automated evidence

The combined Sprint 4+5 final head `a9bcf1ae0ef5061412d39ce5241fc8e1e64ffdcd` validates Sprint 4 after all subsequent Sprint 5 changes:

- **PASS Mobile:** run `37240206121`
  - dependency install
  - Expo Doctor
  - TypeScript
  - **47/47 maintained mobile suites**
  - version consistency
  - production web bundle
- **PASS iOS:** run `37240206154`
  - dependency install
  - Expo Doctor
  - TypeScript
  - iOS project generation
  - CocoaPods
  - complete iOS Simulator compile

The Sprint 4-only mobile gate also passed on run `37239888111`.

## Acceptance boundary

Settings/provider behaviour is automated-test GREEN. Live Google Books and Metron credential entry and provider lookup against a representative physical-device library remain runtime acceptance. No credentials are committed to source.
