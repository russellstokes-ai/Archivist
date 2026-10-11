# Archivist Motion Lab — isolated technical preview

This is an isolated Expo SDK 55 / React Native 0.83 / Lottie 7.3.8 preview, **not the production Archivist app**. It does not touch scanner, onboarding, Reader, or the locked Living Book renderer.

Run `npm install` and `npm run android` or `npm run ios` in this folder. Inspect all locally bundled vector JSON assets under `mobile/assets/motion`, dark/light, paused/playing, Reduced Motion, device screen sizes and Fold closed/open. Actual physical acceptance remains outstanding until tested. After native verification, reuse assets in the main app through a separately reviewed dependency integration; do not blindly upgrade to Lottie 7.4+ (requires RN 0.84+).

The approved Open Book loader was rejected, so Books Stack and Headphones represent discovery. Play/Pause is a reversible controlled transition. Rewards are played only for real awards; this lab simulates them.

No Lottie runtime dependency has been introduced to the production `mobile/package.json` in this commit.
