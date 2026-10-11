# Archivist Motion Lab — isolated approved motion assets
Source: commercial finishing plan, 11 October 2026. **Do not replace the canonical Living Book or Comic Focus.**

This directory is an independent animation preview, not part of the production app. Install lab dependencies here only using `npm install`; then run `npm start` and open the local URL. The local HTTP server exposes `/mobile/assets/motion` to the preview and serves the locally installed `lottie-web` runtime; it never loads cloud animation assets or transmits a library.

All 10 files under `mobile/assets/motion` are authored local Lottie JSON (256x256, 30fps, self-contained vectors, no remote assets). The rejected Open Book loader has not been recreated. Use books-stack for books/comics, headphones for audiobooks. Before embedding in the actual app, independently confirm Android+iOS native compatibility with Expo 55/RN 0.83 using lottie-react-native **7.3.8** (latest 7.3.x supporting versions before RN 0.84), run Expo Doctor, native builds, then review visual performance and accessibility. Do not silently add the library or broken lockfile to production.

A **Motion Gallery** with all animations, play/pause, theme and reduced-motion toggles is available from the local lab. The gallery previews exported JSON, not the live scanner/playback integration. Choose animation integration checkpoints independently of scanner/process/Fold locks.

Assets: book-loader, books-stack, headphones, pause-play, waveform, achievement-badge, crown, trophy, level-up-confetti and firework-burst. Reward event handlers must reuse the existing once-only achievement ledger. Repeat/loop of a reward is prohibited in production. All player and scanner animation must reflect actual media state and never block progress.
