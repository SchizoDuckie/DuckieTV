Unit testing with Karma and Jasmine
====================================

The supported test lane runs every file matching `tests/**/*.test.js` exactly once.
Browser fixtures under `tests/fixtures` are served by Karma and are not test files.

Usage
=====

Install the test dependencies with `npm install`.

- Run the suite once in headless Chrome with `npm test`.
- Watch the suite in headless Chrome with `npm run test-watch`.
- Debug the suite in a visible Chrome window with `npm run test-debug`.

The retired Protractor files were removed because the repository had no Protractor
dependency or executable package script. New browser journeys should use a deliberately
configured end-to-end lane instead of adding `.spec.js` files to the unit directory.
