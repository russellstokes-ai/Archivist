# Sprint 7 — Server, Resilience & Ecosystem

Durable checkpoint on `dev/archivist-work`.

## Implemented

- Opt-in watched source folders with bounded 15-minute to 7-day scan intervals.
- Durable restart-safe scan jobs.
- Server dashboard status that does not stat or browse media roots.
- Existing disconnected-source catalogue retention preserved and tested.
- SQLite backup creation using a consistent database snapshot.
- Restore upload validation and restart-time atomic application with the prior database retained.
- OPDS Atom acquisition feed using existing Archivist credentials.
- HTTP Basic authentication for OPDS clients without creating a parallel user system.
- OPDS results obey Admin/User space/profile access.
- Web controls for watched folders, database backup/restore and OPDS guidance.
- Low-space/copy-failure regression proving originals and catalogue paths remain unchanged.
- Linux ARM64 compile gate for the Raspberry Pi 4/aarch64 target.
- Root, standalone package and Home Assistant package remain byte-synchronized where required.

## Validation

Server checks passed on commit `8e13649ec590`, workflow run `36907874679`.

That run includes:
- root Go tests;
- standalone and HA package Go tests;
- JavaScript syntax checks;
- browser UI contract;
- shell launcher syntax;
- package parity checks;
- Linux ARM64 compilation;
- HA Docker build/start smoke;
- HTTP and HTTPS health checks.

## Acceptance still requiring hardware

The code is ready for the final device sweep, but these remain physical acceptance rather than simulated claims:
- Home Assistant install/update/restart on the Raspberry Pi 4B;
- confirming the chosen HDD enclosure/OS standby policy on the actual drives;
- DuckDNS/Tailscale access from outside the home network.

Optional third-party ecosystems such as Kobo, Hardcover and OIDC are deliberately deferred; none are dependencies of the core product.
