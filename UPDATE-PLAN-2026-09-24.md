# Archivist sectioned update plan

Date: 2026-09-24

## Section 1 - Product Positioning

- Present Archivist as a finished local-first library product.
- Keep the main README professional and user-facing.
- Use Google Play as the Android distribution direction.
- Treat server setup as optional, not required for first use.
- Avoid internal checkpoint wording in public product copy.

## Section 2 - First Launch App Flow

- Open directly into the local library setup.
- Let the user add one or more folders from the phone.
- Scan the chosen folders immediately.
- Show library content as soon as items are found.
- Make reading, listening and sorting available from the start.

## Section 3 - App Settings And Server Connection

- Move server connection into Settings.
- Add a clear Add Server screen.
- Ask for server address and user-created access key.
- Validate connection and explain errors in plain language.
- Keep local library features available when no server is connected.

## Section 4 - Server Onboarding

- Let the server UI open without a startup key.
- On first launch, ask the owner to create their own access key.
- Persist the credential securely.
- Provide change/reset controls for the owner.
- Show server address, folders, scan status, sort status and connected devices on a clear configuration page.

## Section 5 - Folder Management

- Support multiple folders on phone and server.
- Make add-another-folder obvious.
- Provide folder browsing where the platform allows it.
- Show folder health, permissions and unavailable-source states.
- Allow folders to be kept separate as spaces or combined into one library view.

## Section 6 - Sorting

- Provide local sorting in the app.
- Provide server-side sorting for server folders.
- Use the same flow on both sides: preview, review, exclude, apply, history and recovery.
- Show exact source and destination paths before changes are applied.
- Define clear rules for cross-folder and cross-source moves.

## Section 7 - Atlas

- Build Atlas around real library relationships.
- Include genre as a first-class dimension.
- Also include author, series, folder, tags, reading status and related editions.
- Use Atlas to help users browse, rediscover and understand large libraries.
- Avoid placeholder graph content.

## Section 8 - Speech Bubble Focus

- Implement a non-generative first version for comics.
- Detect likely panels and speech areas from page layout.
- Support double-tap focus and tap-to-advance reading.
- Keep manual pinch, zoom and fit controls available.
- Add OCR or vision-assisted detection later only where it improves reliability.

## Section 9 - UI Polish

- Review the Android app on a real phone for smooth transitions, navigation and touch response.
- Polish empty, loading, scan, connection and error states.
- Keep the interface clean, calm and app-store ready.
- Ensure Settings, folder setup, sorting and server connection are understandable without instructions.

## Section 10 - README And Branding

- Keep the logo at the top of the README.
- Describe Archivist as local-first with an optional private server.
- Highlight Google Play direction for Android.
- Describe Docker server support without making any single deployment path the main story.
- Keep language professional and product-ready.
