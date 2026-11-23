Unit testing with Karma and Jasmine
====================================

The supported test lane runs every file matching `tests/**/*.test.js` exactly once.
Browser fixtures under `tests/fixtures` are served by Karma and are not test files.

Usage
=====

Install the locked dependencies with `npm ci`.

- Run the suite once in headless Chrome with `npm test`.
- Watch the suite in headless Chrome with `npm run test-watch`.
- Debug the suite in a visible Chrome window with `npm run test-debug`.
- Run the Node login startup tests with `npm run test:startup`.
- Run an NW.js integration suite with `npm run test:nw -- --suite=bootstrap` after fetching the required runtime. The available suites are `bootstrap`, `storage`, `features`, `protocols`, `migration`, `network`, `shell`, and `packaged`. Some suites also need a legacy binary or a packaged artifact. See [HACKING.md](../HACKING.md) for runtime and profile guidance.

The retired Protractor files were removed because the repository had no Protractor
dependency or executable package script. New browser journeys should use a deliberately
configured end-to-end lane instead of adding `.spec.js` files to the unit directory.
