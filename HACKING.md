#Want to help on DuckieTV ? 
###Feel free to send pull requests!

DuckieTV is built with Angular.js and Bootstrap.css
On top of that, the following libraries (and their dependencies) are used (these are placed in the js/vendor folder):

- CreateReadUpdateDelete.js (Javascript Sqlite ORM) https://github.com/SchizoDuckie/CreateReadUpdateDelete.js/
- Dialogs.js (Modal dialogs for Angular.js) https://github.com/m-e-conroy/angular-dialog-service
- UI-Bootstrap.js (Bootstrap enhancements for angular.js) https://angular-ui.github.io/bootstrap/
- Datepicker.js (Somewhat modified, the basis for the calendar) https://github.com/g00fy-/angular-datepicker
- angular-translate (i18n translations) https://angular-translate.github.io
- angular-translate-once (translation one time bindings) https://github.com/ajwhite/angular-translate-once
- angular-formly (form presentation) https://github.com/formly-js/angular-formly
- tmhDynamicLocale (locale management) https://github.com/lgalfaso/angular-dynamic-locale
- moment (Parse, validate, manipulate, and display dates) https://momentjs.com
- moment-timezone (timezone support) https://github.com/moment/moment-timezone
- UI-router Extras (enhancements for UI-Router) https://christopherthielen.github.io/ui-router-extras
- angular-dialgauge (dial gauge directive) https://cdjackson.github.io/angular-dialgauge/

For an overview of events, see [EVENTS.md](EVENTS.md).

## Historical browser extension workflow

The Chrome new-tab and browser-action extensions are no longer supported. The load-unpacked steps below are retained only as historical project context and are not a supported development or release-validation path.

### New-tab extension

- Clone the repository or download and extract the latest HEAD as a [.zip](https://github.com/SchizoDuckie/DuckieTV/archive/angular.zip) file
- Fire up chrome
- go to chrome://extensions
- Enable 'developer mode' by checking the checkbox if not already enabled
- click the 'Load unpacked extension' button, and point it to the DuckieTV directory
- Click OK and fire up a new tab. DuckieTV should be running.

### Browser-action extension

- Execute all the steps above for the 'new tab' version
- rename manifest-app.json to manifest.json (delete the original manifest.json)
- optionally add manifest.json and manifest-app.json to .gitignore

## Running DuckieTV-Standalone in dev mode

- Clone the repository and run `npm ci`.
- Run `npm test` and `npm run locales:check`.
- Run `npm run scripts:typecheck` to check the TypeScript packaging script.
- Download and verify the pinned NW.js SDK with `npm run nw:fetch -- --version=0.116.0 --flavor=sdk`.
- Run the isolated capability probe with `npm run nw:probe -- --version=0.116.0`.

The probe and app must use a disposable `--user-data-dir`. NW.js 0.116 must never be launched against an existing NW.js 0.87 DuckieTV profile because Chromium can change profile data before application scripts run.

On macOS arm64, launch the checked-out application with the exact SDK and a disposable profile from the repository root:

```sh
DUCKIETV_TEST_PROFILE="$(mktemp -d "${TMPDIR:-/tmp}/duckietv-nw116.XXXXXX")"
"$PWD/_nwjs/nwjs-sdk-v0.116.0-osx-arm64/nwjs.app/Contents/MacOS/nwjs" \
  --user-data-dir="$DUCKIETV_TEST_PROFILE" \
  --nwapp="$PWD"
```

Quit DuckieTV before removing the disposable directory.

The JavaScript unit suite uses Karma and Chrome. See [tests/readme.md](tests/readme.md) for the test inventory and commands. The Node startup tests run separately with `npm run test:startup`. The NW.js integration runner takes a suite name, for example `npm run test:nw -- --suite=bootstrap`.

A truly empty new standalone profile creates its native SQLite library automatically. When the standard `DuckieTV-Standalone-SQLite` profile has a sibling `DuckieTV-Standalone` legacy profile, startup instead offers **Start Fresh** and **Import Existing Library**. Detection only checks for that sibling path and never opens it with NW.js 0.116. **Import Existing Library** displays the destination path to use with the migration command below. Legacy profiles stored in custom locations are migrated with explicit paths using the command below.

## Migrate an NW.js 0.87 profile

Close every DuckieTV window before migrating. The migration command checks Chromium lock files, copies the complete source profile, exports Web SQL with NW.js 0.87 from that copy, and imports the result into the separate native SQLite profile. The target runtime never opens the source profile or its copy as its user-data directory, and the command verifies that the source tree is unchanged even when migration fails.

Use explicit absolute paths for the old profile and the destination shown by **Import Existing Library**:

```sh
npm run nw:migrate -- \
  --source-profile=/absolute/path/to/old/DuckieTV-Standalone \
  --destination-profile=/absolute/path/to/new/DuckieTV-Standalone-SQLite \
  --legacy-binary=/absolute/path/to/nwjs-sdk-v0.87.0/nw
```

The destination may be the untouched profile created by viewing the detected-legacy choice screen. It must not contain a native database or application settings. A completed import is journaled and can be invoked again safely; it will not overwrite changes made after activation. Keep the old profile as rollback data until the migrated library has been checked in the new app.


## Building DuckieTV-Standalone

Fetch the exact SDK for the target, then build an allowlisted local package:

```sh
npm run nw:fetch -- --version=0.116.0 --flavor=sdk --platform=osx --arch=arm64
npm run nw:package -- --platform=osx --arch=arm64
```

Packages are written under `dist/nwjs-packages`. These are unsigned local test artifacts and are not release installers. Signing, notarization, installer identity, and native Windows/Linux/macOS x64 validation remain release gates.

The standalone Window settings offer **Start DuckieTV when I log in** for packaged macOS and Windows apps. On macOS, enabling it registers a bundled per-user LaunchAgent with Service Management; macOS then lists it in Login Items. Move the app to its permanent location before enabling the option. On Windows, it writes a per-user `Run` entry for the packaged executable. Login launches start in the tray without opening the window, regardless of the normal startup window setting. Disabling the setting removes the corresponding entry. Closing or minimizing to the tray hides the macOS Dock or Windows taskbar icon; use the tray menu to show the window again. Dock **Quit** exits the app even when close-to-tray is enabled.

The package step reads `git rev-parse HEAD` and stamps the full commit hash as `build_commit` in the packaged `package.json`. The About statistics show that hash for standalone builds. A Git checkout is required to build a package; the hash identifies the checked-out commit, so commit source changes before making a release artifact.

The former Gulp, Wine, NSIS, Cordova, and PhoneGap release instructions referred to build scripts and hosted services that are no longer present in this repository. They are historical and must not be used to produce or validate an NW.js 0.116 release.
