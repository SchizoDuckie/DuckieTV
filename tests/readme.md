End2End and unit testing with Protractor and Karma
==================================================

Based loosely (to get started) on
https://github.com/angular/protractor/blob/master/docs/tutorial.md

Usage
=====

Install Karma, The Chrome Driver, Protraktor and all other testing dependencies by typing ``npm install``

To run Karma tests:
- on PhantomJS: type ``npm test``
- on Chrome (For debugging) type ``karma start``

To run Protractor tests:
- Make sure you run apache on localhost
- make sure that duckietv runs on http://localhost/duckietv/
- type ``protractor`` in the duckietv root directory
- behold the magic

Current build status: [![Build Status](https://travis-ci.org/SchizoDuckie/DuckieTV.svg?branch=trakt-api-v2)](https://travis-ci.org/SchizoDuckie/DuckieTV)

Travis-CI Details: https://travis-ci.org/SchizoDuckie/DuckieTV
