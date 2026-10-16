# Approved premium launch animation

Owner supplied Archivist_Premium_Shine.html on 16 October 2026 for the mobile
splash, centred on a solid Archivist teal background (#2F8B86).

The bundled HTML retains the supplied artwork, geometry, font and six-second
animation. Packaging changes remove the preview gradient, vertical offset and
Replay button, prevent autonomous playback until accessibility is known, disable
the shine under Reduced Motion and add a local-only content security policy.
The native bridge waits another 1.45 seconds after animation completion so the
approved final shine can finish. Reduced Motion shows the endpoint instead.

The route wraps the existing app with an isolated launch overlay. Existing app
initialisation proceeds underneath. Native and HTML backgrounds use the same
teal. Timeout, backgrounding, WebView/process failure and asset-read failure
dismiss the overlay; no network or server is needed. The WebView unmounts after
completion, freeing its animation resources. Existing mobile App.tsx, scanner,
Assist and Living Book renderer are unchanged.

Source-level bridge tests, TypeScript and Android JS asset export are required.
This does not establish APK or physical Android/iOS WebGL acceptance. Check cold
launch, reduced motion, Fold open/closed and rotate/background during launch on
the new QA APK before visual acceptance.
