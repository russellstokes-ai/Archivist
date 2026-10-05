# Server Sprint 1 — Online Metadata Foundation

Status: automated green.

Implemented:
- Server-side optional metadata enrichment for ebooks, PDFs and comics.
- Open Library and Google Books providers.
- Confidence-scored matching with weak “Part/Chapter/Track” titles falling back to useful parent-folder names.
- Provider settings persisted in the Archivist database.
- Owner-only API routes for provider settings, preview and bounded batch enrichment.
- Manual/legacy metadata remains protected from automatic replacement.
- Network/provider failure is non-fatal and never breaks local scanning.
- Organisation settings UI for provider selection, confidence level and on-demand enrichment.
- Root server and Home Assistant packaged server kept in source parity.

Validation:
- Root Go tests: passed.
- Packaged Home Assistant Go tests: passed.
- Raspberry Pi ARM64 compile: passed.
- Browser JavaScript syntax: passed.
- UI contract: passed.
- Home Assistant package contract: passed.
- Add-on launcher syntax: passed.
- Root/package source parity: passed.
- Home Assistant Docker smoke test over HTTP/HTTPS: passed.
- GitHub Actions run: 37253253898.

Next server sprint:
- Fold online enrichment into scan/refresh automatically without making scans network-dependent.
- Expand provider results into identifiers, publisher, year, language, description and artwork.
- Add durable online cover cache and richer enrichment status/progress.
