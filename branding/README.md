# Approved Archivist identity

Russell approved `archivist-emblem-master.png` on 16 October 2026 for both
the mobile app and server, retiring the previous icon everywhere in the active
product. This is the exact supplied Navy and Gold Book-Letter A Emblem PNG.
Do not redraw, recolour or substitute it. Preserve aspect ratio and transparency.

`node scripts/generate-brand-assets.cjs` packages the master using Sharp.
Launcher assets include mask-safe padding; transparent assets serve Home
Assistant, web and splash usage. Expo points to a separate adaptive foreground.
Historical Git commits and previously downloaded binaries retain their original
artwork; rebuild/install the current QA branch to receive this identity.

Latest source: Russell’s 37867.png, supplied 16 October 2026. App and Home Assistant icons use the existing Archivist teal #2F8B86 background. Logo and splash sources retain transparency.
