# Archivist recovery snapshot — server/final polish — 2026-10-04

This branch is a **do-not-edit recovery snapshot** of the later server/final-polish line before final integration.

Source branch: `polish/final-release-sweep-20261004`
Snapshot source commit: `e0eacc566502076a088d7b38a06cce52d54b2fef`

Recovery branch: `recovery/server-polish-20261004`

## What this snapshot protects

This snapshot preserves the server-side finishing work including:

- Archivist server candidate version `0.9.4`.
- Advanced server scanning, metadata parsing/population and conflict handling.
- Server organisation workflow and metadata-aware filtering.
- Server metadata/organisation tests and Home Assistant package parity.
- 16:9 and QHD server web UI refinement and browser acceptance.
- Home Assistant packaged web/server copies kept in sync.
- Server-side final-polish/readiness documentation.

## Important integration warning

This branch diverged from the universal-mobile line at the earlier Fold/reference checkpoint. It **does not contain all later mobile work** such as the locked Live Player, later Comic Focus work, Android Auto, iOS local-library work and other chat polish.

Do not use this branch as the final mobile source and do not wholesale replace `mobile/App.tsx` from the universal-mobile branch.

Integrate the server-specific changes into the final candidate deliberately.

## Current downloadable server

The Home Assistant add-on on repository `main` is currently `0.9.3`.

This snapshot contains the later `0.9.4` server polish but is **not yet the default main-branch add-on**.

## Recovery rule

Do not merge future experimental work into this recovery branch. If final integration loses server metadata, organisation or 16:9 UI work, recover those changes from this branch.
