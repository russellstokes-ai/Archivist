# Archivist Motion Lab — offline, isolated
This lab is **not production UI**. It previews 10 authored vector-only Lottie JSON animations for the approved 7 October 2026 motion plan. It does not introduce a runtime dependency or modify the scanner, Living Book, navigation, onboarding or release APK.
- From repository root, run a local HTTP server, e.g. `python3 -m http.server 8000`.
- Open `http://localhost:8000/motion-lab/`; all 10 JSON files are loaded locally.
- Review dark/light, pause/restart, speed and Reduced Motion.
- The lightweight browser preview deliberately draws only the shape/keyframe subset used by these assets. **Native Lottie compatibility and visual fidelity still require Expo SDK 55 + React Native 0.83 test builds.**
- Do NOT render the rejected 'Open Book' loading asset. Book Loader and Books Stack and Headphones use the agreed work-type differentiation.
- No native package was installed, so canonical build dependencies remain unchanged.
