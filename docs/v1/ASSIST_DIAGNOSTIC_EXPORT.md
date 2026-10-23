# Temporary Assist diagnostic export

Settings > bottom of page > Export Assist diagnostics (Android).
Saves JSON through the device share menu; no automatic upload. Includes stored
catalogue membership, grouping reasons, resolved fields, retained observations,
identification decisions, queue states and file-write states. Explicitly excludes
credentials, full storage URIs, covers and book contents. Relative library names
and filenames remain in the report so failures can be reproduced.

Read-only collection does not start runtime workers, scanning, lookups or writes.
Limits: latest 500 rows per section, 1000 array entries and 1024 characters per
string; section truncation is reported. Queues may change during collection.
Provider candidate responses not already retained in evidence are not captured.
This temporary diagnostic feature is not a full event trace or a backup.

Validation: SQLite export tests (empty database, grouping clues, redaction,
write status, truncation); TypeScript; UI contract and protected source checks.
No new APK requested or built for this addition. Physical share-menu acceptance
is pending. Audiobook transcription remains excluded from the repair plan.
