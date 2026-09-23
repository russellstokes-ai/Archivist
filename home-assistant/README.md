# Home Assistant packaging

`archivist/` contains the initial add-on wrapper for the Archivist server.

Use `scripts/package-ha-addon.sh` from the repository root to create a self-contained add-on directory/archive. Home Assistant builds from the add-on directory, so the script stages the Go/web source under `archivist/app/` before zipping.
