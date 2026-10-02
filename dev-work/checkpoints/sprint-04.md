# Sprint 4 — Reader & Comic Excellence

Durable implementation checkpoint.

Implemented:
- Reader routing follows the book source, not global server connection state.
- Persistent reader bookmarks, highlights, notes and appearance preferences use stable work identity.
- Reader search/appearance/selection command bridge works for local EPUB/comic and server WebView readers.
- EPUB/CBZ reader retains page-turn motion, pinch/text scaling and deterministic Comic Focus Zoom.
- CBT/TAR comics decode locally with archive/entry/page safety limits before entry allocation.
- Android CBR/RAR reading uses a bounded native Junrar bridge.
- Offline CBR/CBT downloads are no longer artificially blocked.
- Android offline PDF pages render through PdfRenderer with paged navigation and page-turn motion.
- PDF progress feeds the same durable reading-position model.
- Behavioural tests cover reader annotations/bookmarks and CBT archive ordering/safety.

Validation:
- Local syntax sweep passed.
- All locally runnable mobile suites passed.
- GitHub CI must run npm-installed EPUB/CBZ fixture plus full typecheck/regression.
- Android native compilation is rechecked again in the release sweep.
