# Scoped family access, catalogue views and public metadata

User-authorised server-only follow-on to draft PR #83, based on verified remote
`577f3b543cf49a908ca61ffc46ce21d54ab90e41`. No APK, protected scanner, reader,
production deployment or canonical merge is part of this change.

## Delivered behaviour

- Owner Family controls explicitly choose each user's library spaces, including
  no access. Existing grants survive restart; adding another library no longer
  silently grants it to every user. The existing `/spaces` API and new `/grants`
  API share the same atomic validation. Existing clients that omit `spaces` on
  creation retain access to the currently configured spaces; this does not grant
  future libraries. Saved personal progress is retained when access is removed.
  In-progress responses cannot be recalled, but subsequent requests use live grants.
- The manager offers Table, Cover grid and List over the same bounded catalogue
  page, filters, server title sorting and selection. Changing presentation never
  fetches the entire library. Cover images load lazily only in grid/list, with a
  format fallback. Each presentation supports explicit page selection and editing.
- Book-level Assist searches Open Library and Apple Books without account setup.
  Apple adds ebook/audiobook text identity and safe source links from the US store;
  no artwork, preview audio or media is imported. Store-release dates cannot be
  selected as first-publication year. Suggestions remain unverified and require
  individual selection, signed preview and explicit Save; locks/provenance remain.
- Google Books remains optional with `GOOGLE_BOOKS_API_KEY` in the server process
  environment. No new HA configuration screen or automatic container environment
  forwarding is claimed. Missing configuration is reported; previous saved Google
  provenance remains supported. Apple requests are spaced by at least three seconds
  per server process; cache hits do not consume an allowance. Partial failure and
  throttling remain visible and are not cached as full success.

## Evidence and limits

Manager regression first failed because view controls were missing, then passed
with shared-page selection and family grant editing. Local manager contracts cover
candidate/editor races, owner-attested safe moves, no implicit publication,
deny-all family creation, explicit grant updates, title-sort queries, audiobook
provider hints, safe source links and refusal to use store date as publication.

Go regressions were written before their implementation, but local Go execution
was unavailable on this Windows host. Tests include restricted authenticated
catalogue/search/OPDS/media/progress, startup/new-source preservation, invalid
atomic updates, sync snapshot grant changes, provider outage/schema handling,
signed Apple provenance/locks and pacing/cache boundaries. They require hosted
root and packaged Go CI; do not describe unexecuted local tests as green.

Protected-source gate passed after restoring unchanged Windows checkout line
endings to exact Git blobs. Root and packaged source remain paired. Local HA
packaging requires `zip`, absent here. A synthetic browser preview was attempted,
but loopback socket access was forbidden; no screenshot or real-browser pass is
claimed. Hosted CI is required on the final pushed SHA.

## Deployment acceptance remains NO-GO

Use disposable data for two users and two spaces; confirm selection survives
restart and adding a third space, removed access fails on the same session and
OPDS client, and regrant restores visibility without deleting progress. Verify
Table/Grid/List at 1920x1080 and narrow widths with keyboard, failed covers and
80+ rows. Exercise audiobook and ebook lookup, provider outage and fast repeated
searches. Then perform the existing Pi4/HAOS/SMB/NFS, backup/restore, concurrent
media and upgrade/rollback matrix. No hardware or commercial acceptance is implied.

Provider policy references: [Open Library APIs](https://openlibrary.org/developers/api),
[Apple Search API](https://performance-partners.apple.com/search-api),
[Google Books API](https://developers.google.com/books/docs/v1/using).
