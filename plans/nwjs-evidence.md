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
| network-preflight | PASS (scoped) | Old and target runtimes matched on nine deterministic loopback cases: cross-origin GET, Basic challenge, binary bytes, trusted JSONP, redirect auth, credentialed cookies, multipart, cancellation and timeout. HTTPS, LAN and client-specific cases remain pending. |
| unit-tests | PASS | `npm test`: 94 tests. `npm run locales:check`: 25 descriptors. |

The target uses a separate stable internal profile namespace. Upgrade migration will export from an offline copy using NW.js 0.87.0 and import into the new namespace; NW.js 0.116.0 must never open the legacy source or its copy.

## Pending release gates

Lossless legacy export/import, interrupted migration recovery, complete feature matrix, packaging, installer identity/signing, and native Windows x64, Linux x64, macOS x64 and macOS arm64 presentation checks are pending. The migration is not release-complete and `nw:verify-evidence` must not pass yet.
