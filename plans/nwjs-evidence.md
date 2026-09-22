# NW.js 0.116.0 upgrade evidence

Recorded at source baseline `3d491511` on 2026-09-22. Test profiles and databases were synthetic and isolated under ignored `_nwjs/` or `dist/` paths. No normal DuckieTV user profile was opened.

## Runtime and support decision

- Official `versions.json` identified stable NW.js 0.116.0 with Chromium 153.0.8010.12 and Node 26.7.0.
- The macOS arm64 SDK archive matched SHA-256 `5522a5848f509daff487847c0163b613d2cb5d6a43737df0759980908af941ff`.
- `Info.plist` declares `LSMinimumSystemVersion` 13.0 and the main Mach-O `LC_BUILD_VERSION` declares `minos 13.0`. The user approved raising DuckieTV's macOS floor to 13+; runtime behavior on macOS 13.0 itself remains pending native verification.
- Node 26.7.0 upstream support minima are useful constraints, but are not treated as proof of NW.js platform support. Windows, Linux, macOS x64 and macOS 13 native checks remain pending.

## Local macOS arm64 results

| ID | Result | Evidence |
|---|---|---|
| fetch-sdk | PASS | Official archive checksum verified before extraction. |
| runtime-identity | PASS | Running SDK reported NW 0.116.0, Chromium 153.0.8010.12 and Node 26.7.0. |
| websql | FAIL / expected Path B | `openDatabase` is unavailable in the real target runtime. |
| node-sqlite | PASS | `node:sqlite` DatabaseSync created, bound, queried and reopened a file database. Worker execution, rollback, Date/boolean/null bindings and insert metadata passed. |
| background-transport | PASS | Background DOM, `getBackgroundPage`, runtime port roundtrip and ordered storage readiness passed. |
| native-api-presence | PASS (capability only) | Window, Tray, Menu, Clipboard and Shell constructors/APIs exist. This is not presentation or full behavior parity. |
| fresh-bootstrap | PASS | Separate `DuckieTV-Standalone-SQLite` synthetic profile created all six entity tables plus native schema metadata; foreground insert/select succeeded. |
| legacy-migration | PASS (synthetic current schema) | NW.js 0.87.0 exported all six populated tables and every localStorage string from an offline profile copy. NW.js 0.116.0 imported exact row counts/checksums into the separate profile, passed integrity/relationship checks and reopened through the app. The original profile tree hash stayed unchanged; a completed rerun was idempotent. Corrupt checksum, unknown schema, interrupted-stage recovery and evidence-write failure cases passed. Independent all-process SIGKILL tests recovered at all six journal boundaries, including activation verification after a real runtime restart. |
| network-preflight | PASS (scoped) | Old and target runtimes matched on nine deterministic loopback cases: cross-origin GET, Basic challenge, binary bytes, trusted JSONP, redirect auth, credentialed cookies, multipart, cancellation and timeout. HTTPS, LAN and client-specific cases remain pending. |
| orderly-shutdown | PASS | An accepted write immediately followed by close drained and survived reopen. The foreground transport drained 100 queued writes before shutdown, rejected later writes, and reopened with exact count/sum. An independent packaged-app check invoked the production window-close handler with 100 queued writes; it exited normally and reopened with the exact count and sum. |
| packaged-upgrade | PASS (local unsigned arm64) | The allowlisted app archive launched from an unrelated working directory, reported the pinned runtime, retained a synthetic library across quit/reopen, and retained it after rebuilding the package. Framework symlinks stayed relative. |
| unit-tests | PASS | `npm test`: 94 tests. `npm run locales:check`: 25 descriptors. |

The target uses a separate stable internal profile namespace. Upgrade migration will export from an offline copy using NW.js 0.87.0 and import into the new namespace; NW.js 0.116.0 must never open the legacy source or its copy.

## Pending release gates

The complete feature matrix, notification presentation, HTTPS/LAN and real-client behavior, installer identity/signing, and native Windows x64, Linux x64, macOS x64 and macOS arm64 presentation checks are pending. The package is an unsigned local artifact, the release is not complete, and `nw:verify-evidence` intentionally exits nonzero while these named records remain pending.

The remaining automatable feature fixtures are concrete:

- Library/calendar: add and remove a series, mutate watched/downloaded state, rebuild derived calendar groups, restart, and compare the full library state in the real app.
- Trakt/metadata: deterministic OAuth refresh, sync/import, image and metadata responses through the complete application services, including failure and cancellation.
- Search/downloads: deterministic provider results through both torrent dialogs, magnet and `.torrent` submission, path propagation, duplicate suppression and restart state.
- Settings/backup: path-picker cancel/select, exact backup export/import across the native store, redaction, scheduled backup and restart.
- Scheduled/background work: hidden-window timers, favorites refresh, auto-download writes, tray restore and quit while work is queued.
- Torrent clients: the registered client matrix against protocol fixtures for authentication, cookies/CSRF, JSONP, binary/multipart requests and control lifecycle.
- Native shell/notifications: window state, tray/menu actions, external links, dialogs, directory picker and notification delivery/action behavior. API presence and orderly shutdown alone do not complete this row.
- Networking: deterministic HTTPS and LAN destinations plus the client-specific cases above; the passing nine-case suite covers loopback HTTP only.

Those fixtures can be implemented on suitable hosts and are distinct from the unavailable host matrix, installer signing/notarization, and human presentation checks.
