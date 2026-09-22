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

If you want to get a quick overview of how events work within DuckieTV check out events.md:
https://github.com/SchizoDuckie/DuckieTV/blob/angular/EVENTS.md
On top of that, you can check out the dependency graph on [http://duckietv.github.io/DuckieTV/](The DuckieTV live Demo) using [the awesome angularjs-dependency-graph](https://chrome.google.com/webstore/detail/angularjs-dependency-grap/gghbihjmlhobaiedlbhcaellinkmlogj)

## Hacking on DuckieTV

If you want to run and hack on DuckieTV standalone yourself, the process is really simple:

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

On its first launch, the new standalone profile requires an explicit choice. **Start Fresh** creates an empty native SQLite library. **Import Existing Library** displays the destination path to use with the migration command below.

## Migrate an NW.js 0.87 profile

Close every DuckieTV window before migrating. The migration command checks Chromium lock files, copies the complete source profile, exports Web SQL with NW.js 0.87 from that copy, and imports the result into the separate native SQLite profile. The target runtime never opens the source profile or its copy as its user-data directory, and the command verifies that the source tree is unchanged even when migration fails.

Use explicit absolute paths for the old profile and the destination shown by **Import Existing Library**:

```sh
npm run nw:migrate -- \
  --source-profile=/absolute/path/to/old/DuckieTV-Standalone \
  --destination-profile=/absolute/path/to/new/DuckieTV-Standalone-SQLite \
  --legacy-binary=/absolute/path/to/nwjs-sdk-v0.87.0/nw
```

The destination may be the untouched profile created by viewing the first-run choice screen. It must not contain a native database or application settings. A completed import is journaled and can be invoked again safely; it will not overwrite changes made after activation. Keep the old profile as rollback data until the migrated library has been checked in the new app.


## Building DuckieTV-Standalone

Fetch the exact SDK for the target, then build an allowlisted local package:

```sh
npm run nw:fetch -- --version=0.116.0 --flavor=sdk --platform=osx --arch=arm64
npm run nw:package -- --platform=osx --arch=arm64
```

Packages are written under `dist/nwjs-packages`. These are unsigned local test artifacts and are not release installers. Signing, notarization, installer identity, and native Windows/Linux/macOS x64 validation remain release gates.

The former Gulp, Wine, NSIS, Cordova, and PhoneGap release instructions referred to build scripts and hosted services that are no longer present in this repository. They are historical and must not be used to produce or validate an NW.js 0.116 release.
