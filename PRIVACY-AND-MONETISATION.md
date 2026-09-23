# Privacy requirements and Obsidian monetisation review

23 September 2026. This addendum supersedes any ambiguous recommendation wording in the planning baseline.

## Confirmed recommendation policy

Recommend only books the active profile can access in its own catalogue. Candidate filtering happens before ranking, and permissions are checked again when opening a result. No external recommendation API, internet discovery feed, purchase suggestions or transmission of reading history. Internet connectivity must not be necessary to generate suggestions.

Rank locally using explicit preferences, existing metadata, unread titles, series order and the profile's own reading history. Display a simple reason such as “Next in your series” or “Already on your shelf.” Do not use another household member's private history. Allow disabling personalisation and clearing the derived recommendation state. Do not invent missing genre/author metadata or compensate by quietly contacting a provider.

An inaccessible space, revoked grant, missing file or unavailable source excludes a digital title from playable/readable suggestions. Physical records can appear only when explicitly represented as accessible physical copies, labelled accordingly. When offline, offer an available-on-device filter and do not imply undownloaded files can open. No eligible candidates means an honest empty state, not an online fallback.

Optional future metadata lookup remains separate from recommendations. It requires a visible user action or explicit opt-in, never uploads reading behaviour, and is disabled in private/offline operation. Plugins must not bypass this policy invisibly: network permission and data access require an explicit capability grant. Privacy, lack of telemetry, data export and ownership apply to every pricing tier.

Release tests: intercept outbound traffic while recommending and reading; require zero external requests. Add inaccessible-profile and unavailable-source fixtures. Verify that revoked titles vanish from candidate sets, explanations and cached recommendations. Serve fonts, reader libraries and artwork from the user's server or device, not third-party CDNs.

## What Obsidian sells today

Official pages checked 23 September 2026; prices below are advertised USD prices, not a UK tax-inclusive quotation.

| Offering | Advertised price | Paid value |
|---|---|---|
| Core app | Free, including work use | Local application; optional services are separate |
| Sync Standard | $4/month annually or $5 monthly, per user | 1 vault, 1GB, 5MB file cap, one-month history |
| Sync Plus | $8/month annually or $10 monthly, per user | 10 vaults, 10GB, 200MB file cap, twelve-month history; upgradeable storage |
| Publish | $8/month annually or $10 monthly, per site | Hosted publishing, customisation, domains and support |
| Catalyst | $25/$50/$100 once | Supporter tiers, early access and community benefits |
| Commercial | Optional $50/user/year | Support development and organisational recognition |

Sync advertises end-to-end encryption, selective synchronisation, configuration sync and recovery. Publish packages hosting with connected-note navigation. Catalyst's early-release benefits do not fit Archivist's no-public-beta decision. Commercial payment has been optional since February 2025. The cited public pages describe offers, not revenue mix, margins or conversion rates; those cannot be inferred as facts.

Sources:

- https://obsidian.md/pricing
- https://obsidian.md/sync
- https://obsidian.md/publish
- https://obsidian.md/help/catalyst
- https://obsidian.md/blog/free-for-work/

## Implications for Archivist — recommendations, not new approved pricing

The useful principle is to charge for extra value while keeping users' data usable independently. Obsidian's optional hosted services differ from a self-hosted media product: audiobooks and comics can create substantial storage and bandwidth costs. Do not copy its storage prices or assume the same economics.

Retain the agreed household perpetual Plus direction. Define a concrete paid value proposition around advanced local organisation/automation, deeper personalisation and reporting only after reviewing the free/Plus feature boundary; none of these assignments is silently approved by this document. Essential playback/reading, privacy, access to owned files and basic self-hosted synchronisation should not depend on a recurring cloud payment.

An optional supporter purchase could provide tasteful cosmetic recognition without selling beta access or influencing recommendations. It is supplementary revenue, not a proven primary business model. Avoid unlimited lifetime personal support promises.

Keep Connect as coming soon. A future subscription is defensible only if it provides an actual ongoing hosted service and remains optional. First specify the threat model, key ownership, recovery, bandwidth limits and operating costs; do not advertise end-to-end encryption until that implementation exists and is verified. A remote-access relay is not automatically encrypted storage or encrypted backup.

Do not add a Publish equivalent merely because Obsidian offers one: public library/reading-history publication conflicts with the current private-household scope. Do not add affiliate ranking, sponsored titles, third-party tracking or a paid privacy tier.

Commercial decisions still outstanding: exact Plus entitlement list, price, major-upgrade policy details, payment/store purchase mechanics and support commitments. Measure costs using explicit inputs (processor/store fees, refunds, support workload and any hosting), not guessed Obsidian revenue figures. No change to the full-release platform scope follows from this study.
