# Test 16: editor and grouped review corrections

Android versionCode 105, build label 16-editor-fix. Development PR only; main unchanged.

- Onboarding and maintenance review counts use the grouped review collection. Review lists group before filtering, retaining all tracks of each work.
- Metadata editor title and author remain above the scrolling results/details; Save and search remain below. Explicit viewport bounds and scroll reset prevent results from leaving the editor at its previous offset.
- Each match offers Use this book. Selecting an Open Library match fetches work details for available description and genre. Missing provider fields preserve existing draft values. Selection remains draft-only until Save; unavailable data is indicated rather than invented.
- Living Book uses a stable WebView source, a first-painted-frame handshake, a native startup fallback, and renderer-process recovery.

Validation: TypeScript clean; 75/75 mobile suites pass, including hydration success/offline retention, author/title search, grouped 227-file/12-work regression and editor layout contracts. Android CI retains lint, APK verification and emulator launch gates. Physical phone/fold layout, keyboard and first-open artwork acceptance remain outstanding; no device visual verification claimed.
