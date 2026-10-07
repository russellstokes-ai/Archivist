# Test 18 — Android editor rendering

The supplied 4.8-second Fold recording shows editor movement/scrolling and window resizing before a metadata lookup. Test 17 already had a single editor outside animated tab content. This correction targets the native rendering surface and viewport instead of changing search behavior.

- Enable hardware acceleration on both metadata modal windows (React Native defaults to false).
- Give the single-book editor a real, non-flattened native clipping viewport around its scroll content, with opaque background layers and fixed header/footer stacking.
- Disable scroll subview detachment for this small form.
- Size the editor from its actual modal parent using flex layout, eliminating the separate activity-window height calculation during Fold/taskbar/keyboard resize.

Build: Test 18, Android versionCode 107. No broad UI redesign or metadata matching changes. TypeScript and mobile regression checks run before push; CI retains native lint, APK verification and emulator launch. The exact Samsung compositor artifact cannot be certified fixed without repeating the supplied scroll/resize scenario on the phone.
