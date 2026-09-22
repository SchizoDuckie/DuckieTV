# Plan 002: Upgrade NW.js while preserving DuckieTV functionality and data

> **Executor instructions:** Read this entire plan before editing. Complete the gates in order; preserve concurrent work. This is a NW.js upgrade, not an Electron migration. Record evidence in `plans/nwjs-evidence.md`. Update the index only when all required platform gates pass.
>
> **Drift check:** Run `git status --short` and `git diff --stat 3d491511..HEAD -- package.json package-lock.json tab.html standalone-background.js manifest.json js tests scripts .github README.md HACKING.md .gitignore karma.conf.js .travis.yml`. Also inspect the uncommitted diff for those paths. Compare the excerpts below with current files before editing. Reconcile unrelated additions; stop if database/bootstrap/runtime ownership has changed incompatibly.

## Status

- **Priority:** P1
- **Effort:** L; smaller if the target retains all exercised APIs, substantially larger if storage migration is required
- **Risk:** HIGH: existing libraries, credentials/settings, runtime profile upgrades, background operations
- **Depends on:** none; do not execute plan 001 alongside this plan
- **Category:** migration
- **Planned at:** commit `3d491511`, 2026-09-22 (execution drift refresh from `68ac7577`)
- **Status:** BLOCKED — implementation and local automated verification pass; remaining full feature/platform/distribution gates are listed below
- **Target:** NW.js **0.116.0**, latest stable identified in official release notes on the planning date; Chromium 153 and Node.js 26.7.0 per the upstream repository. Reverify downloadable binaries and exact component versions before implementation.

## Why this matters

The documented/local development runtime is NW.js 0.87.0. Upgrading the embedded browser and Node runtime must preserve DuckieTV's database, local settings, authenticated network operations and native desktop behavior. A successful launch or a green browser test suite alone cannot establish compatibility. Keep AngularJS, the ORM, existing UI and supported client protocols; change runtime boundaries only where evidence requires it.

“All current functionality” means the standalone application's features listed in the matrix below. It does not silently authorize dropping clients, clearing a profile, re-fetching a user's library to recreate it, or losing settings. Legacy operating-system support is a separate compatibility constraint: README advertises Windows 7/8.1 and macOS 10.15, which must not be assumed compatible with the latest runtime. Identify the actual minimums before promising a release; report any conflict rather than retaining an old runtime and calling it latest.

## Current state and evidence

These are source observations, not target-runtime results:

| Evidence | Current behavior and consequence |
|---|---|
| `README.md:1-8,29-37` and changelog | Upstream declares EOL/NativePHP direction; this request explicitly chooses an NW upgrade for this checkout. README mentions NW 0.87.0. Preserve that distinction in documentation. |
| `_nwjs/nwjs-sdk-v0.87.0-osx-arm64/` (ignored local directory) | A matching legacy SDK exists locally; not a reproducible project dependency or proof of what every user runs. Do not package this directory. |
| `package.json` | NW manifest and npm metadata share a file. `main: tab.html`, `bg-script: standalone-background.js`, `name: DuckieTV-Standalone`, custom user agent, frameless hidden window and idle-related Chromium arguments. No runtime version pin/build script at initial inspection. |
| `standalone-background.js:3-14`, `manifest.json:26-34` | Reads a relative manifest and dynamically injects five ordered background scripts. Script execution order and working-directory assumptions require explicit tests. |
| `js/CRUD.bootstrap.js:17-26`, `js/CRUD.background.bootstrap.js:13-15` | Foreground chooses background messaging when Chrome APIs exist, otherwise a direct SQLiteAdapter; background also creates an adapter for `seriesguide_chrome`. A method-existence check is not proof that the background endpoint works. |
| `js/vendor/CRUD.SqliteAdapter.js:17-24,52-166,284-375` | Database creation and migrations depend on WebSQL and localStorage schema-version keys; query results are plain row arrays with write metadata. Initialization failure can leave polling pending. |
| `js/vendor/CRUD.BackgroundPageAdapter.js:73-89`, `js/background.js:15-38` | Chrome runtime connection and lifecycle APIs are used. Retain a single authoritative DB owner and reliable Promise settlement. |
| `js/services/BackupService.js:170-200`, `js/controllers/settings/BackupCtrl.js:137-139` | Current format-v2 backup selects preferences/watched/downloaded records, omits schema keys and restores metadata through Trakt. It is not a lossless runtime migration format. |
| `js/app.authHttpBackend.js:18-79`, `js/app.requestinterceptors.js:61-65` | Custom XHR Basic/challenge credentials, JSONP and privileged desktop networking. User agent/origin determine whether an old CORS proxy is used. |
| `js/app.standalone.windowdressing.js:13-43`, `js/app.standalone.systray.js:135-210`, `js/app.standalone.zoom.js:11-47` | NW window/tray/menu lifecycle, saved position, hidden startup, zoom and DevTools shortcuts. |
| `js/services/NotificationService.js:10-34`, `js/app.js:173-183` | Chrome notifications and NW directory inputs; absent APIs can disable a saved notification preference. |
| `js/controllers/sidepanel/AboutCtrl.js:136-153`, `js/controllers/sidepanel/SidepanelSerieCtrl.js:141-143`, `js/directives/targetBlank.js:17` | Runtime metadata, Chrome app metadata fallback, native clipboard and external URI opening. |
| `karma.conf.js`, `.travis.yml`, `tests/CRUDEntities.test.js`, `tests/test-main.js:38-40` | Jasmine/Karma/ChromeHeadless; CI uses Node 20 and `npm ci`, `npm test`. Tests exclude both DB bootstraps/background.js and clear Angular run blocks, so standalone startup is not exercised. No checked-in working desktop packaging pipeline found. |
| `HACKING.md:44-95` | Manual extraction and legacy Gulp/build instructions refer to tooling absent from this checkout. Do not prescribe `gulp deploy` as a working verification command. |

Load-bearing excerpts to compare during drift check:

```js
// standalone-background.js:3-5
var fs = require('fs'),
    output = '',
    manifest = JSON.parse(fs.readFileSync('manifest.json'));

// js/vendor/CRUD.SqliteAdapter.js:17-21
this.Init = function() {
    this.db = db = new CRUD.Database(self.databaseName);
    return db.connect().then(function() {
        CRUD.log("SQLITE connection created to ", self.databaseName);
        return verifyTables().then(function() {

// js/vendor/CRUD.SqliteAdapter.js:360-363
this.connect = function() {
    return new Promise(function(resolve, fail) {
        try {
            db = openDatabase(dbName, options.version, '', options.estimatedSize);
```

Match each file's existing style. App services generally use array-annotated Angular injection, two-space indentation and single quotes without semicolons, e.g. `DuckieTV.factory('BackupCodec', [function() { ... }])` in BackupService. Vendored CRUD files use four spaces/semicolons; keep changes surgical. Jasmine asynchronous tests use `function(done)` and explicitly assert pending writes before resolving, as in `tests/CRUDEntities.test.js:13-39`. Do not reformat vendor files or upgrade Angular as part of this work.

Planning validation: `npm test` exited 0 with **78 tests** in ChromeHeadless 152 on this host. It did not launch NW.js or read a user profile. No desktop build, runtime probe, real-service test or cross-platform test was performed. Concurrent favorites changes landed in `68ac7577`; locale/tooling edits were underway afterward, including package.json, tab.html and scripts/. Reconcile those rather than overwriting them.

## Scope and boundaries

Allowed changes, only as required by a gate:

- Runtime/build: `package.json`, `package-lock.json`, `.gitignore`, `scripts/nwjs/**` (new), `.github/workflows/nwjs.yml` (new), `.travis.yml`, `karma.conf.js`, `README.md`, `HACKING.md`.
- Bootstrap/storage: `standalone-background.js`, `manifest.json` (background list only), `tab.html` (startup/script wiring only), `js/CRUD.bootstrap.js`, `js/CRUD.background.bootstrap.js`, `js/background.js`, `js/vendor/CRUD.SqliteAdapter.js`, `js/vendor/CRUD.BackgroundPageAdapter.js`, `js/nwjs/**` (new), `nwjs-bootstrap.html` (new if needed).
- Compatibility: the four `js/app.standalone.*.js` files, `js/app.authHttpBackend.js`, `js/app.requestinterceptors.js`, `js/app.js` (directory input/bootstrap only), `js/services/SettingsService.js`, `js/services/StandaloneWindowRuntime.js`, `js/services/NotificationService.js`, `js/services/SceneNameResolver.js`, `js/directives/targetBlank.js`, `js/controllers/settings/SerieSettingsCtrl.js` (downloadpath directive at lines 129-140), `js/controllers/settings/DisplayCtrl.js` (capability detection only), `js/controllers/sidepanel/AboutCtrl.js`, `js/controllers/sidepanel/SidepanelSerieCtrl.js`.
- Tests: `tests/nwjs/**`, `tests/fixtures/nwjs/**`, `tests/NWCompatibility.test.js` (new). Keep NW integration scripts out of Karma's `tests/**/*.test.js` discovery: use `.spec.cjs` for native/integration suites. Existing tests may receive narrowly required setup adjustments, not weakened assertions.
- Planning/evidence: this plan, `plans/README.md`, `plans/nwjs-evidence.md` and `plans/nwjs-evidence.json`.

Read but do not rewrite `js/CRUD.entities.js`, torrent-client/search/provider business logic, backup format or application state ownership. Any necessary change outside the allowlist requires an evidence-backed scope amendment. Do not implement Electron/NativePHP, restore browser extensions/Cordova, replace the frontend, publish releases, introduce automatic updating, or use real credentials/profiles as fixtures. Product name, app identity, origin and profile location are compatibility contracts, not cosmetic cleanup.

## Commands and proposed tooling

Existing commands: `npm ci` installs the lockfile (implementation only); `npm test` runs the suite; `git diff --check` checks whitespace. No established desktop build/typecheck command exists. ESLint configuration exists but no npm lint script was present at initial inspection; retain any concurrent tooling improvements. Do not claim a lint baseline without running it.

Create these **new** commands in step 1; these are specifications, not commands claimed to exist today:

| Command | Required behavior / success result |
|---|---|
| `npm run nw:fetch -- --version=0.116.0 --flavor=sdk` | Fetch pinned host architecture archive into `_nwjs/`, verify upstream SHA-256 before extraction; fail on unavailable artifact or mismatch. |
| `npm run nw:probe -- --version=0.116.0` | Probe only isolated synthetic profiles and write redacted JSON under `dist/nwjs-evidence/`; exit 0 means probes completed, with explicit capability results. |
| `npm run test:nw -- --suite=bootstrap` | Real NW foreground/background readiness, messaging and failure tests pass. |
| `npm run test:nw -- --suite=storage` | Real selected backend and ORM contract, persistence and schema tests pass. |
| `npm run test:nw -- --suite=migration` | Legacy-runtime synthetic profile upgrade/export roundtrip and failure/rollback cases pass. |
| `npm run test:nw -- --suite=network` | Real target-runtime requests to deterministic fixture servers pass. |
| `npm run test:nw -- --suite=shell` | Native window lifecycle plus application behavior tests pass; human-only presentation checks remain separately recorded. |
| `npm run nw:package -- --platform=<platform> --arch=<arch>` | Assemble locally distributable app using a pinned runtime and explicit asset allowlist under `dist/`. |
| `npm run test:nw -- --suite=packaged --artifact=<path>` | Launch actual artifact with synthetic profile, verify runtime identity, restart persistence and second-build upgrade. |
| `npm run verify:nw` | Run unit and required local NW suites; fail empty discovery, unknown suite, skipped required case, timeout or runtime mismatch. |
| `npm run nw:verify-evidence` | Validate evidence JSON has all required platform/feature cases with result PASS and artifact/version provenance; pending native/manual checks prevent full completion. |

Suite runner accepts `NW_LEGACY_BINARY` and `NW_TARGET_BINARY` as absolute paths, or resolves them from the pinned download catalog. Never discover/use the normal user profile. Use the target SDK's matching ChromeDriver if automation requires it, or a local NW test page with explicit process completion; use timeouts and propagate nonzero status. Maintain SDK/normal flavor parity. If DevTools remains a shipped feature, package SDK or provide an explicit equivalent; normal builds cannot silently drop the existing F12/tray DevTools actions.

## Git workflow

Use an isolated branch `codex/upgrade-nwjs` from the agreed current baseline. Preserve local work, including untracked plans. Commit logical milestones with a concise subject and a body describing what changed and why, plus validation limits. Do not push/publish without authorization. Plan 001 is an alternative architecture, not a dependency.

## Implementation steps

### 1. Pin the runtime and establish real compatibility evidence

Recheck official release notes/repository and archive/checksum availability. Latest stable identified during planning is 0.116.0; the web tool returned 404 for its directory listing even though official release notes link binaries. Therefore artifact availability is **unverified**, not an assumed success. Resolve this discrepancy before pinning a release. If a newer stable appears, record and explicitly revise the exact target and checksums; never use floating `latest`, beta or live-build in packaging.

Add a single runtime catalog at `scripts/nwjs/runtime.json` with exact version, per-platform archives/checksums, flavors and claimed OS minimums. Implement the command contracts above incrementally; missing suites fail, never green stubs. Probe both 0.87.0 and the target on synthetic data: runtime versions, `openDatabase` create/insert/read/reopen, Node module support (including `node:sqlite`), background DOM and `chrome.runtime` ports/getBackgroundPage/onInstalled, Chrome notifications/app metadata, nw.Window/Tray/Menu/Clipboard/Shell, directory input and actual local origin. Do not assume Chrome's WebSQL removal proves whether NW's fork retains it.

Create an evidence matrix for Windows x64, Linux x64, macOS x64 and arm64; inventory any shipped Windows/Linux ia32 or other packages before claiming full distribution parity. Compare upstream requirements with README's old OS claims. Unavailable architectures/OS versions are unresolved release decisions, not silent removals. Record CPU/OS, exact runtime, artifact flavor, app commit, test IDs and PASS/FAIL/PENDING with reason.

**Verify:** `npm ci`, `npm test` → exit 0; baseline test inventory remains present. `npm run nw:fetch -- --version=0.116.0 --flavor=sdk` and `npm run nw:probe -- --version=0.116.0` → verified runtime plus complete capability report. Proceed only after a documented storage decision and support matrix exist.

### 2. Preserve deterministic bootstrap and database ownership

Resolve background script paths from the application location rather than process cwd; load scripts in declared order and surface errors. Test packaged launch from an unrelated working directory. Define explicit storage readiness/failure before application background services run. If initialization becomes asynchronous, replace NW auto-bootstrap (`tab.html` currently has `ng-app`) with a controlled path that bootstraps Angular exactly once after readiness. Preserve non-NW behavior without double bootstrap.

Retain Chrome background transport if exercised target-runtime tests pass. If it is missing/broken, add a narrow NW transport in `js/nwjs/` that owns one DB connection, correlates requests, rejects pending calls on disconnect and never silently opens a second database. Keep the existing CRUD public surface and foreground behavior. Preserve hidden-window background work; do not replace it with an extension service worker without proving equivalent lifecycle.

**Verify:** `npm run test:nw -- --suite=bootstrap` → ordered script execution, fresh/populated launch, endpoint readiness, rejected initialization, disconnected requests, reload and arbitrary-cwd launch all pass. No blank window or endless initialization loop; no torrent/update activity before storage is ready.

### 3. Implement the smallest proven storage compatibility path

**Path A — retained WebSQL:** If the target passes real create/write/reopen and copied legacy-profile tests, retain the existing DB backend. No speculative database rewrite. Characterize ORM behavior and apply only target-required fixes. Steps 4 and 7 still require profile backup/recovery and upgrade tests because Chromium profile changes can prevent downgrade.

**Path B — WebSQL absent or incompatible:** Preserve SQLite semantics beneath the ORM by adding a connection-factory hook to SQLiteAdapter, retaining `CRUD.Database.SQLBuilder`. Implement `js/nwjs/database.cjs` and `js/nwjs/database-worker.cjs` with one serialized file-backed SQLite owner. First probe bundled `node:sqlite` inside the actual NW runtime; upstream Node documentation alone is not proof it is enabled. If available and contract tests pass, use DatabaseSync in a worker to keep the UI responsive. If unavailable, stop this milestone and amend the plan with a pinned native driver and verified NW ABI/build matrix; do not install a host-Node binary and assume NW compatibility.

Preserve `execute(sql, bindings)` Promise results: `rows` array, `rowsAffected`, `insertId`, adapter `Action`/`ID`, null/number/date serialization, joins, raw queries and CRUD stats. Audit actual `getDB`/`lastInsertId` consumers. Writes resolve after commit, errors reject, and worker exit rejects all pending calls. Include atomic batch support for migration; do not simulate transactions with unrelated asynchronous statements. Bind values, disallow extension loading, and use a fixed app-owned database path.

Schema versions must move transactionally with the native DB. Derive a trusted schema catalog from repository `js/CRUD.entities.js`, keeping current tables, fixtures, indexes and ordered migrations. Run numeric migrations in order with rollback; do not copy the existing parallel migration scheduling. Treat legacy localStorage version strings as import inputs/mirrors, not a second native authority. Do not run historical ALTER statements on tables just created at the current schema. Preserve existing non-NW/WebSQL behavior behind the connection seam.

**Verify:** `npm run test:nw -- --suite=storage` and `npm test` → all pass: real read/write/delete, uniqueness error, bindings, relations, dates, reopen, concurrent writes, rollback, initialization failure and committed-write restart. Path B additionally verifies worker shutdown, schema transaction rollback and catalog/entity drift. Path A records native replacement cases as explicitly inapplicable, never silently skipped.

### 4. Make profile upgrade reversible and lossless

Before a new runtime ever opens an existing profile, create an offline copy with the old application fully closed. Do not launch the target over a real source profile during implementation. Use synthetic profiles populated through the legacy runtime to prove the entire path. Preserve application name, origin, profile selection and storage namespaces. Resolve the source explicitly; an absent/ambiguous source is not consent to create an empty library.

For Path A, verify a copied profile opens with identical table contents/schema keys/localStorage values, can be edited, closed and reopened. Preserve the untouched source copy for rollback; never downgrade the target-mutated profile. Implement/document the backup-before-launch step in the distribution/launcher path, not merely an action after app initialization.

For Path B, add a minimal legacy export mode under `scripts/nwjs/legacy-export/` that runs with the old NW runtime on a profile copy and exports all application rows/columns/IDs, supported schema versions and application localStorage strings. Prove its origin/identity reads the same synthetic profile as the old app; do not accidentally export a newly created namespace. Do not run normal update services or upgrade schema during export. Use a versioned bundle with table/column inventory, counts and checksums. Never log credentials or commit a real bundle. Current-schema sources are supported first; unknown/older schemas must be reported with an explicit copy-upgrade path, not guessed.

Import offline before Angular/background tasks start. Validate schema fingerprint, versions, allowlists, limits, values and checksums; generate SQL only from trusted schema, never imported DDL. Stage the database transactionally. Restore exact required localStorage strings in the correct app origin. Journal database validation, storage restoration and completion so crashes at each boundary resume safely. Activate only after integrity, counts and key relationships match. Reject conflicting existing destinations; no automatic overwrite. Include explicit fresh-start and recoverable error paths. Cookies/session-dependent integrations must reconnect successfully; preserve user configuration and saved credentials, and document any runtime-imposed reauthentication without pretending cookies were losslessly migrated.

Keep normal format-v2/historical backup import/export working separately. It is not the migration substitute because it omits data and depends on Trakt. Rollback reopens the untouched old profile; new writes made after upgrade are not automatically back-synced.

**Verify:** `npm run test:nw -- --suite=migration` → old-runtime fixture → selected upgrade path → target app equality, source hashes unchanged, edit/restart, repeated migration, unknown schema, corrupt bundle/profile, interrupted import, read-only/full-disk failure and recovery all pass. No external service calls permitted in the data migration test.

### 5. Preserve network and native feature contracts

Use the matrix below as the acceptance inventory. Keep current NW networking if real target-runtime tests pass. Compare old and target runtime with the same deterministic HTTP/HTTPS fixture servers: authentication challenges, cookies, CSRF/session retries, redirect credentials, XHR response types, multipart upload, binary responses, JSONP, timeout/cancellation and loopback/LAN destinations. Include plain HTTP configured local clients; modern browser policy changes must not silently break them. Do not add global certificate-ignore or web-security-disable flags.

If Chromium networking needs a compatibility transport, keep it beneath the existing `$httpBackend` contract in `js/nwjs/http.cjs`; preserve Angular transforms/interceptors, outstanding-request accounting, cookie/session behavior and exactly-once completion. Use Node HTTP(S) only with an explicit cookie/auth/redirect implementation and the same test matrix; raw fetch is not a drop-in XHR replacement. Preserve uTorrent discovery/pairing/JSONP and every registered client. Parse a validated JSONP envelope as data if a transport replacement requires it; no new eval or remote Node access.

Repair NW API callsites only for observed regressions. Test tray creation failure recovery, close-to-tray versus actual Quit, listener cleanup/reload, persisted bounds/maximized state, zoom/shortcuts, directory dialog cancellation and remote path entry. Verify notifications visibly as well as through mocks. About must use the target runtime/app metadata rather than fall back to misleading web branding. Preserve external HTTP(S), magnet, and other intentionally supported schemes with explicit validation; do not broaden privileged navigation. Keep update-check behavior, but prevent an old release channel from recommending a runtime downgrade; channel changes require an explicit configured destination and test, not invented publishing infrastructure.

Specific caller details: `SerieSettingsCtrl.js:129-140` owns the directory directive and reads `files[0].path`; test empty selection before indexing. `DisplayCtrl.js:8-9` separately gates notification/top-sites settings, so keep UI capability reporting aligned with runtime delivery. Do not mistake commented-out Shell calls in `fastSearch.js:323-327` and `TorrentClients/None.js:112-116` for active routing: both use an iframe fallback after a historical regression. Test the actual magnet handoff path and exactly-once behavior before changing it. Top-sites is disabled by default in standalone; characterize any still-accessible behavior rather than restoring the retired browser extension.

**Verify:** `npm run test:nw -- --suite=network`, `npm run test:nw -- --suite=shell`, `npm test` → exit 0. Fixture failure cases settle correctly, no target-only network regressions, and hidden scheduling writes survive restore/restart. Record native visual checks per platform separately.

### 6. Complete the functionality matrix

Each row needs named tests and evidence. Exercise UI through the real runtime; use deterministic metadata/provider fixtures rather than relying on public service uptime. Treat known baseline service failures separately from runtime regressions, with an explicit explanation rather than deleting a feature.

| Feature | Required acceptance cases |
|---|---|
| Library/calendar | Fresh and migrated libraries; add/remove shows; favorites filters/sort/fast search; day/month navigation; multiple episodes; seasons/details; bulk and individual watched/downloaded flags with timestamps; restart persistence. |
| Data/settings | All entity tables, primary/foreign IDs, custom per-series preferences, Jackett definitions, global preferences, saved credentials/schema versions; locale/timezone/date handling and image/background assets; offline startup. |
| Trakt/metadata | Authentication/reconnect, trending/search/import, queued updates, watched/collection sync, error/rate-limit handling; TMDB/fanart and scene-name lookup fixtures. |
| Search/downloads | Each registered engine's representative response; mirror fallback; Jackett/custom endpoints; quality/size/seed/include/exclude policies; magnet and .torrent handoff exactly once; subtitles and Synology integration. |
| Torrent clients | None, uTorrent/BitTorrent pairing, uTorrent WebUI, Aria2, BiglyBT, Deluge, Ktorrent, qBittorrent 4.1+ and 5.2+ API-key paths, rTorrent, Tixati, Transmission, tTorrent, Vuze. Connect/auth/retry/list, add magnet/file, configured path, start/stop/remove and progress/completion per supported capabilities. Include shared qBittorrent code from the current baseline. |
| Scheduling | Auto-download eligibility/delay, monitor, auto-stop, metadata refresh and scheduled backup while minimized/hidden; resume after sleep without duplicate downloads or lost writes. |
| Desktop | Frameless drag/resize/maximize/minimize, bounds restore and removed display, startup-minimized, all tray preferences/menu routes, reload cleanup, Quit, clipboard, external links/magnet, directory picker, zoom/F12 and tray DevTools. |
| Notifications/backups | Basic/list notification content and permission handling; manual/scheduled backup download, historical and v2 restore with mocked metadata, cancellation/failure and completion after persistence. |
| Release/UI | About app/runtime versions, update check/dismiss/open behavior, all bundled locales available, asset paths on case-sensitive filesystems, arbitrary-cwd packaged launch and second-build upgrade. |

**Verify:** `npm run verify:nw` → all automated feature IDs pass. `npm run nw:verify-evidence` → lists exactly the outstanding host/native checks until each is completed; exit 0 only when all required matrix entries pass.

### 7. Package and prove platform upgrades

Add a reproducible application asset allowlist and runtime download cache. Package app assets plus required runtime modules; exclude `_nwjs`, source profiles, exports, `.git`, tests, plans, audit reports and development node_modules. Include licenses and all referenced local assets. Verify macOS bundle identity/helper layout, executable permissions and native architecture; use per-host packaging tests instead of claiming a cross-built archive has run. If native modules were selected, validate load/rebuild in each actual packaged NW ABI, not only system Node.

Create CI jobs for the confirmed OS/architecture matrix. Pin host Node separately from NW's embedded Node, run locked installs, unit plus runtime suites and packaging. Linux needs a graphical environment; Xvfb does not establish native tray integration. If a host is unavailable, leave its gate pending and do not mark the complete migration DONE. Signing/notarization and legacy installer replacement need the existing distribution identities/credentials; record them as release blockers if required for delivery, without publishing during implementation.

Document exact commands, artifact paths, verified OS minimums, profile discovery/backup, migration, recovery and rollback. Replace obsolete Gulp instructions for this checkout without implying upstream EOL has ended. Do not promise automatic updates. Confirm an installed second build preserves the same profile and that uninstall/reinstall procedures do not remove user data unexpectedly.

**Verify per claimed target:** `npm ci`, `npm run verify:nw`, `npm run nw:package -- --platform=<platform> --arch=<arch>`, `npm run test:nw -- --suite=packaged --artifact=<path>` → exit 0 and expected artifact. `npm run nw:verify-evidence` → exit 0 across the full claimed matrix. `git diff --check` → exit 0, and scoped diff review shows unrelated work preserved.

## Done criteria

- [x] Exact latest-stable target, artifacts and SHA-256 checksums are pinned and runtime versions verified from the running app.
- [x] Existing unit tests pass with no removed/weakened cases; real NW suites fail on zero discovery and exercise the selected backend.
- [ ] Every feature matrix row has passing evidence; every claimed platform has packaged launch/restart/upgrade results and native presentation checks.
- [x] Synthetic populated legacy profile upgrades losslessly for supported schema/settings; original remains unchanged, and interrupted migration/rollback is proven.
- [x] Foreground/background startup has one DB owner, explicit readiness and bounded failure; hidden operations continue and shutdown preserves writes.
- [ ] All registered torrent clients and backup formats remain supported; no blanket browser-security bypass was added.
- [x] Packaging excludes profiles/secrets/development files; data identity and support minimums are documented.
- [ ] Index status changes to DONE only after `npm run nw:verify-evidence` passes; unavailable platforms remain pending/blocking.

## STOP conditions

- Target binaries/checksums cannot be verified, or upstream sources disagree on latest stable. Report exact discrepancy; do not silently substitute.
- Required legacy OS/architecture cannot run the latest NW.js. Explain the support conflict before removing it from the release contract.
- Runtime/bootstrap/storage ownership changed concurrently; a real profile would be touched without a verified copy; source identity/schema is uncertain.
- Target WebSQL is absent and bundled SQLite is unavailable: amend the driver/ABI portion with evidence before proceeding.
- Any feature seems to require dropping a client, disabling TLS/web security, deleting data or an unrelated application rewrite.
- A required gate fails twice after reasonable scoped fixes; report the evidence and remaining cause rather than weaken the test.
- Installer/profile/signing identity is unavailable for a claimed distribution upgrade. Local artifact testing is not equivalent to a verified installer upgrade.

## Maintenance notes and official references

Keep runtime pin, checksums, test driver and packaging flavor synchronized. New clients/providers must join the fixture matrix. Database/catalog changes must preserve old profile import tests. Do not carry target-runtime workaround flags forward without a regression test and a reason. Re-run the profile-copy, hidden scheduling, networking and packaged tests for future Chromium jumps.

- [NW.js 0.116.0 release](https://nwjs.io/blog/v0.116.0/) and [official repository/version summary](https://github.com/nwjs/nw.js/): target identification; archive availability still needs verification.
- [NW manifest reference](https://docs.nwjs.io/References/Manifest%20Format/): manifest identity/background configuration.
- [NW command-line reference](https://docs.nwjs.io/References/Command%20Line%20Options/): launch/test options; use isolated user-data directories after checking target support.
- [NW native modules](https://docs.nwjs.io/For%20Users/Advanced/Use%20Native%20Node%20Modules/): version-specific build guidance if a native addon is needed.
- [Node SQLite](https://nodejs.org/api/sqlite.html): possible backend API, conditional on a real NW probe and version-specific verification.

This is focused upgrade planning, not a whole-codebase audit. Third-party live service availability, installer/signing infrastructure, private profiles and target runtime capabilities have not been validated during planning. Runtime dependencies and OS support must be verified before implementation claims are made.

## Execution preflight refresh (2026-09-22)

Current baseline is `3d491511`. Locale descriptors, scoped Formly mappings, semantic metadata translation and StandaloneWindowRuntime landed after initial planning. Preserve their tests, `locales:check`, and script ordering. Window modules now inject `StandaloneWindowRuntime`, whose `getWindow/getState/show/minimize/maximize/restore` methods own shared window state; apply compatibility fixes through that service rather than recreating separate state. Its source is explicitly in scope. Database/bootstrap excerpts remain unchanged. The direct HTTPS request to the SDK osx-arm64 archive returned 200 after the official CDN redirect, and `https://nwjs.io/versions.json` reports stable `v0.116.0`, Chromium `153.0.8010.12`, Node `26.7.0`. Archive checksum verification and actual-runtime probing remain to be completed.

### Verified runtime gate and approved support decision

The downloaded NW.js 0.116.0 SDK macOS ARM64 archive passed the pinned SHA-256 check. Its `nwjs.app/Contents/Info.plist` declares `LSMinimumSystemVersion = 13.0`, independently confirmed by main Mach-O `LC_BUILD_VERSION minos 13.0` (SDK 26.0). This conflicts with README macOS 10.15+. The user explicitly approved "Upgrade to macos 13+" on 2026-09-22. Raise the macOS minimum to 13.0 and continue implementation; this resolves the macOS support STOP condition. Feature and user-data requirements remain unchanged. All 14 catalog hashes were independently compared with the official checksum list. The refreshed baseline passes 94 Karma tests and 25 locale descriptors.

### Path B profile safety amendment

The real target probe proves WebSQL absent and worker-owned `node:sqlite` available. An application-page guard runs too late to ensure a newer Chromium never opens the legacy profile. Therefore the NW116 application may use a **new, stable internal profile namespace** (`DuckieTV-Standalone-SQLite`, not a per-runtime-version name) while retaining DuckieTV product branding, window title and user-facing app identity. This is an intentional one-time storage migration, superseding the earlier requirement to keep the destination's exact internal name/profile namespace. Future runtime updates must retain the new namespace.

The exporter must keep the legacy internal identity/origin on a stopped-source profile copy and run only in NW0.87. The new runtime never receives the legacy source or its copy as its own user-data directory. Explicit import creates a staged destination database and restores localStorage before completion. Even an empty destination requires an explicit Import or Start Fresh choice; never silently present an empty library as a successful upgrade. Completed imports remain idempotent and crash-recoverable. The user approved macOS13+; this profile amendment is a routine implementation safety decision within the authorized lossless-migration scope, not a change to application features.

### Narrow ORM delete-contract amendment

Real foreground/background ORM verification found that `CRUD.BackgroundPageAdapter.Delete` omits `Action: 'deleted'`, preventing entity-cache cleanup. The existing `CRUD.Entity.Delete` then assigns `.ID` on the numeric primary-key value instead of clearing that value. These are baseline defects exposed by the required native-backend contract checks. Allow a narrowly scoped correction to `js/vendor/CRUD.js` for the entity delete/cache/primary-key reset only, plus the already allowed background adapter result metadata. Verify insert/update/find/delete/reinsert through the real foreground/background path; do not refactor other ORM behavior or entity business logic.

### Independent reviewer checks during implementation

All fixtures used synthetic profiles under the isolated executor worktree's ignored `dist/` directory. The refreshed source passes real NW116 foreground/background table creation, insert/select, disconnect rejection and corrupt-database readiness rejection. Actual ORM insert/update/find/delete result metadata and primary-key reset pass after the narrow delete correction. Full source/assets boot Angular and `SettingsService.isStandalone()` on NW116; fresh-profile legacy WatchList cleanup emits two rejections also observed on the old runtime, so this is recorded as baseline behavior rather than a passing full feature matrix.

The unchanged Angular HTTP backend passes nine matching loopback cases on NW0.87 and NW0.116: cross-origin GET, Basic challenge credentials, binary byte fidelity, trusted JSONP, redirect Authorization, credentialed cookie continuity, multipart fields/file bytes, promise cancellation exactly once and numeric timeout. These scoped checks do not establish HTTPS/LAN or every client/provider behavior. Durable release evidence must still be produced by the checked-in runners.

### Export catalog correction after real legacy probes

Two distinct exporter assumptions failed under NW0.87: WebSQL authorizes neither `PRAGMA table_info` nor arbitrary schema introspection, and selected column names retain physical casing (`TMDBFanart.tmdb_id`) although the ORM field catalog uses `TMDB_ID`. A direct lookup by ORM spelling therefore exported that ID as null. The migration gate remains blocked until exact all-column/all-row equality passes. Revise the exporter approach to obtain/validate actual column inventory with WebSQL-supported SELECTs, match trusted names case-insensitively while preserving every value, and reject unexpected columns. Explicit SQL aliases may normalize known field names, but must not hide extra columns. This evidence-backed plan correction authorizes another implementation attempt without weakening the strict equality gate or accepting null substitution.

Independent migration review now passes the real NW0.87 exporter -> NW0.116 importer -> application foreground/background reopen sequence for six populated tables and exact localStorage strings. The source file hashes remain unchanged. The checked-in `nw:migrate` command also passes fresh and repeated imports; a post-import edit survives repeat import. Corrupt bundles fail before database/journal creation, dangling Chromium locks are rejected, and source/destination symlink aliases are rejected. Remaining first-run integration: a window-only reload retained rejected background readiness, and the ordinary choice screen creates Chromium housekeeping that must not prevent later import into the otherwise empty destination. These must be covered by real UI/startup tests before approval.

The real first-run button gate now passes with `chrome.runtime.reload()` and narrowly allowed installation housekeeping (`runtime.event`, `install.notify`); `nw.App.restart()` is absent on NW116. The resulting application reaches Angular and native-v1-ready without command-line fresh flags. The after-choice import sequence also passes, but nonempty destination identity must be verified before new Chromium opens it.

Independent macOS ARM64 packaging checks pass against the unmodified `DuckieTV.app` artifact launched from `/tmp`: runtime identity, Angular startup, synthetic insert, quit/reopen, rebuild and second-build reopen all pass with identical persisted data. The archive loads from NW's extracted temporary app root, excludes development/profile/test paths, and all five runtime symlinks remain relative. This proves a local unsigned artifact, not signing/notarization, installer upgrade, other platforms, or all native presentation/feature cases.

### Shutdown and crash durability review

Independent review reproduced two additional blocking defects before final acceptance: a connection write accepted immediately before `close()` was rejected by the deferred request's closing check, and abrupt termination immediately after the import journal reached `complete` could leave Chromium localStorage incomplete. In the latter case, all owned test-runtime processes were killed at the exact journal boundary; the next normal import failed with `Completed migration storage is incomplete`. Earlier interruption stages (`database-importing`, `database-validated`, `storage-restoring`, `storage-restored`) recovered with identical table values. Fix and re-run these boundaries without weakening assertions; normal completed/activated repeat imports must continue preserving subsequent user edits.

The revised staged activation protocol independently passes genuine SIGKILL tests at all six journal boundaries: `database-importing`, `database-validated`, `storage-restoring`, `activation-pending`, `activation-verifying`, and `complete`. Every test kills all owned browser/helper processes, resumes with the ordinary importer across runtime restarts, then independently compares all six tables/columns and exact localStorage strings from a separate runtime launch. `dist/reviewer-crash/results.json` records the result in the isolated worktree. This resolves the observed migration durability failure; graceful application shutdown and durable checked-in regression coverage remain under review.

### Reviewer round 1

Verdict: REVISE, while retaining verified core commits `48394d19`, `1de04a9e`, `3960f1c4`. Independent `verify:nw` passes 94 tests, 25 locale descriptors and all six scoped runtime suites. Actual packaged window-close handling drains 100 queued writes, exits normally and preserves their exact count/sum. The strict release evidence gate correctly exits 1. Remaining locally feasible deterministic fixtures must cover application journeys (library/calendar, backups/settings, scheduling, metadata/provider/client contracts and native controls); they are not interchangeable with unavailable hosts, presentation checks or signing credentials. Do not weaken feature criteria or claim runtime-infrastructure tests establish full parity. HTTPS fixtures must not alter user trust stores or use certificate/security bypasses.

### Extended round-1 protocol and HTTPS verification

Independent NW116 fixtures now exercise all 12 cross-platform registered client APIs over real loopback XHR: Transmission, BiglyBT, Vuze, Deluge, Aria2, qBittorrent 4.1+, qBittorrent 5.2+, uTorrent Web UI, tTorrent, Ktorrent, Tixati and rTorrent. Authentication/session handling where applicable, list parsing, magnet submission with supported paths, and start/pause/remove commands pass. This is deterministic protocol evidence, not real-daemon or Windows-only uTorrent validation.

Trusted loopback HTTPS also passes through the actual Angular backend using NW's documented `additional_trust_anchors` in a **test-only manifest** and a synthetic CA-signed server certificate with localhost/127.0.0.1 SANs. This leaves the host trust store and production application manifest unchanged and retains certificate validation. The executor may add this isolated positive-trust fixture beside the default-untrusted rejection fixture; do not add trust anchors or security exceptions to production. Official reference: https://docs.nwjs.io/References/Manifest%20Format/#additional_trust_anchors.

Final production review identified two additional fixable lifecycle defects in round 1. The first-run/storage-error path shows the frameless window before Angular runs, leaving the custom window controls hidden and unbound; provide working controls in this failure path. A rejected shutdown permanently closes the foreground adapter, so the current instruction to retry Exit is impossible; preserve the app on failure and provide an explicit user-controlled terminal exit instead of promising recovery that does not exist. Verify these error paths as well as the passing accepted-write drain before acceptance.

### Final independent review (2026-09-22)

Verdict: **BLOCK for full-plan/release completion; local implementation verified.** The executor completed the source changes and addressed the actionable round-1 review findings. Original-checkout source and unrelated audit work remain untouched. The implementation stays on `codex/upgrade-nwjs` in `/Users/js/.codex/worktrees/upgrade-nwjs/DuckieTV`; no merge or push was performed.

The reviewer independently reran `NW_LEGACY_BINARY=/Users/js/Documents/Code/DuckieTV/_nwjs/nwjs-sdk-v0.87.0-osx-arm64/nwjs.app/Contents/MacOS/nwjs npm run verify:nw` after the final source changes. Exit 0: 94 unit tests, 25 locale descriptors, bootstrap, storage, features, protocols, network, shell, migration and packaged suites. The checked-in macOS crash fixture passed all six interruption boundaries with exact all-table/all-column and localStorage comparisons. Packaged create, reopen and rebuilt launch passed. Source diff scope and whitespace checks pass. Detailed command output is `dist/reviewer-final-verify.log` in the implementation worktree.

First-run and corrupt-library controls are now usable without Angular. The failed-shutdown test proves one rejected storage shutdown, no new writes, Cancel keeping the app open, and a later explicit force-quit choice. Feature fixtures cover exact backup restore/reopen, protected token retention, scheduling selection, calendar state, provider normalization, torrent-byte/URL/magnet handoff, persisted automatic downloads, and Trakt metadata/history/OAuth/failure/cancellation. Twelve cross-platform client protocol fixtures and default-rejection/fixture-trusted HTTPS pass. These are scoped deterministic checks, not a claim that live services or native UI presentation have been validated.

`npm run nw:verify-evidence` exits 1 as required. Remaining acceptance work includes actual macOS 13 and macOS x64/Linux x64/Windows x64 host validation, native tray/menu/picker/dialog/notification/external-shell presentation, LAN and real daemons, Windows-only uTorrent, live metadata services, actual timed favorites refresh, and installer upgrade identity/signing/notarization. Keep the unchecked full-matrix criteria pending. CI definitions and local fixtures are present; CI runs were not dispatched or claimed successful.

The final local artifact is `dist/nwjs-packages/DuckieTV-0.116.0-osx-arm64/DuckieTV.app`. Its `Contents/Resources/app.nw` SHA-256 after reviewer verification is `e88c3c12215c09665bc73c47c7514d4df1ba6bf98a923ca75736dc757f55d503`. ZIP timestamps vary between builds; this digest identifies the reviewed local artifact, not a guarantee of byte-identical archives across rebuilds.

Implementation commits: `48394d19` (runtime/storage bootstrap), `1de04a9e` (migration and compatibility), `3960f1c4` (package/test/CI tooling), and `c876e819` (acceptance coverage and lifecycle corrections). The last amendment changed evidence only after the independent final test run.

### User-requested desktop follow-up

The user reported that real mouse clicks could not activate either first-run button. Independent packaged-app pointer hit testing confirmed an uninitialized `<clicktrap>` overlay above the prompt; programmatic `.click()` checks had missed the defect. Isolate startup/error content from unbooted application overlays and verify actual mouse interactions.

The user explicitly requests native title bars on **all platforms**, removal of the custom window controls, and a proper macOS application icon. This expands scope to `css/main.css`, native window presentation, `tab.html`, and a bundled `.icns` generated from the existing DuckieTV logo. Keep close/drain behavior and window-state persistence intact.

The user also requests that Import/Start Fresh appear only when a legacy installation/profile is detected. This supersedes the earlier mandatory-choice rule for every empty profile: a genuinely new dedicated profile with no detected legacy profile should initialize automatically. Keep nonempty/corrupt destination guards, preserve the separate namespace, and detect legacy data through filesystem presence only without opening it in the new runtime. Use isolated synthetic legacy directories in regression tests.

Desktop follow-up completed in `5b7a9dd4`. Native window frames are enabled for every platform and custom window controls/drag styles are removed. Startup/error UI is isolated from the uninitialized clicktrap. Clean new profiles initialize automatically; a standard sibling legacy profile triggers the import choice, and ready/nonempty profile safeguards remain. macOS packaging embeds `DuckieTV.icns` and sets `CFBundleIconFile`.

Focused verification passes: 94 unit tests, bootstrap, storage, shell, and packaged create/reopen/rebuild. The reviewer independently reran bootstrap and used native computer interaction on isolated profiles: a clean standard profile opened directly at `#!/add`, a synthetic sibling legacy profile showed the choice, real mouse Start Fresh entered the app, Import displayed migration details, and native close exited. The title bar exposes native close/minimize/fullscreen controls. Icon resource format and bundle metadata were independently verified; no real user profile was changed. Final reviewed artifact SHA-256 is `f1f79357171a6882bc46e3135301abcf0c3c3b09b3d084b4ef2d5983791f1e3d`. The broader release gates remain pending.
