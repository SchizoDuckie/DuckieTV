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
| network-preflight | PASS (scoped) | Old and target runtimes matched on nine deterministic loopback HTTP cases: cross-origin GET, Basic challenge, binary bytes, trusted JSONP, redirect auth, credentialed cookies, multipart, cancellation and timeout. The target rejected an untrusted local HTTPS chain, then accepted the same synthetic CA-signed localhost/127.0.0.1 certificate only when a fixture manifest supplied `additional_trust_anchors`. No host trust or certificate bypass was used. LAN remains pending. |
| feature-workflows | PASS (scoped) | A hidden full-app journey added library entities, deduplicated calendar work, persisted watched/downloaded state and settings, exported a backup, restored it through `BackupCtrl` with real `FavoritesService`/CRUD while retaining protected destination tokens, selected the daily backup schedule, and reopened exact state. The actual Trakt service parsed deterministic metadata, posted history, renewed OAuth tokens and handled failure/cancellation. ShowRSS normalization, magnet/torrent-byte/torrent-URL handoff, complete AutoDownloadService selection and persistence, window state, zoom, directory cancel and hidden scheduler deduplication passed. |
| client-protocols | PASS (scoped) | All twelve client families registered on macOS exercised their actual APIs against a local fixture: Transmission, BiglyBT, Vuze, Deluge, Aria2, qBittorrent 4.1+, qBittorrent 5.2+, uTorrent Web UI, tTorrent, Ktorrent, Tixati and rTorrent. They validated connection/version and supported authentication, parsed torrent lists, submitted magnets with supported paths, and issued start/pause/remove controls. Real daemons and the Windows-only client remain pending. |
| notifications | PASS (scoped) | Actual `chrome.notifications.create`/clear passed with a packaged icon and the application NotificationService option/callback contract passed. Visible OS delivery and action presentation remain pending. |
| orderly-shutdown | PASS | An accepted write immediately followed by close drained and survived reopen. The foreground transport drained 100 queued writes before shutdown, rejected later writes, and reopened with exact count/sum. An independent packaged-app check invoked the production window-close handler with 100 queued writes; it exited normally and reopened with the exact count and sum. |
| failure-controls | PASS | First-run choice and corrupt-library errors exposed working close/minimize/maximize/restore controls before Angular. An injected background shutdown failure closed the connection to new writes, left the app open when force quit was declined, re-offered the explicit force-quit choice on the next Exit, and never retried the terminal storage shutdown. |
| packaged-upgrade | PASS (local unsigned arm64) | The allowlisted app archive launched from an unrelated working directory, reported the pinned runtime, retained a synthetic library across quit/reopen, and retained it after rebuilding the package. Framework symlinks stayed relative. The recorded package SHA-256 identifies this final local build; ZIP staging timestamps mean rebuilds are behaviorally repeatable but not bit-for-bit identical. |
| unit-tests | PASS | `npm test`: 94 tests. `npm run locales:check`: 25 descriptors. |

The target uses a separate stable internal profile namespace. Upgrade migration will export from an offline copy using NW.js 0.87.0 and import into the new namespace; NW.js 0.116.0 must never open the legacy source or its copy.

## Pending release gates

The complete feature matrix, notification presentation, LAN and real-daemon behavior, installer identity/signing, and native Windows x64, Linux x64, macOS x64 and macOS arm64 presentation checks are pending. The package is an unsigned local artifact, the release is not complete, and `nw:verify-evidence` intentionally exits nonzero while these named records remain pending.

The strict verifier also requires three explicit release gates to pass: actual runtime verification at the approved macOS 13 floor, installer upgrade identity, and distribution signing/notarization. Local unsigned packaging remains useful test evidence but does not satisfy those distribution gates.

The remaining acceptance gaps are concrete:

- Trakt/metadata: live-service behavior remains beyond the passing metadata, history, OAuth-refresh, failure and cancellation fixture.
- Search/downloads: both torrent-dialog presentation paths remain beyond the passing provider, magnet, torrent-byte upload, torrent-URL and persisted auto-download workflow.
- Settings/backup: picker selection and actual scheduled dialog presentation remain beyond the passing protected-token, schedule-selection and exact export/restore/reopen workflow.
- Scheduled/background work: timed favorites refresh remains beyond the passing hidden timer deduplication, complete auto-download and ordered shutdown journeys.
- Torrent clients: the Windows-only client still needs a protocol fixture and all clients need real-daemon validation on supported native hosts.
- Native shell/notifications: tray/menu actions, external links, dialogs and visible notification delivery/action behavior need native presentation checks.
- Networking: LAN still needs a suitable test environment; both default HTTPS rejection and fixture-manifest trust succeed without weakening Chromium security or changing host trust.

Those fixtures can be implemented on suitable hosts and are distinct from the unavailable host matrix, installer signing/notarization, and human presentation checks.
