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

## Running DuckieTV from Git as a new-tab Chrome extension
This is the easiest way to get going. DuckieTV will install itself as your new-tab page and run directly from git source.

- Clone the repository or download and extract the latest HEAD as a [.zip](https://github.com/SchizoDuckie/DuckieTV/archive/angular.zip) file
- Fire up chrome
- go to chrome://extensions
- Enable 'developer mode' by checking the checkbox if not already enabled
- click the 'Load unpacked extension' button, and point it to the DuckieTV directory
- Click OK and fire up a new tab. DuckieTV should be running.

## Running DuckieTV from Git as a browser-action Chrome extension

- Execute all the steps above for the 'new tab' version
- rename manifest-app.json to manifest.json (delete the original manifest.json)
- optionally add manifest.json and manifest-app.json to .gitignore

## Running DuckieTV-Standalone in dev mode

- Clone the repo
- Download [nw.js](http://nwjs.io/) for your platform
- Extract all files to the freshly cloned DuckieTV directory
- run nw.exe or ./nw
- Now you can just work in the directory and pull repo updates


## Building DuckieTV-Standalone

If you want to build the setups and files that are deployed on github yourself there are some dependencies:

- wine 1.7 (for embedding .ico file in the windows .exe)
- bomutils (to be able to build a mac compatible installer)
- libxml2-dev and libssl-dev
- nsis (for building installers for windows)

```
sudo add-apt-repository ppa:ubuntu-wine/ppa
sudo apt-get update
sudo apt-get install wine1.7 
git clone https://github.com/hogliux/bomutils && cd bomutils && make && sudo make install
sudo apt-get install libxml2-dev libssl-dev
sudo apt-get install nsis
```

##Building individual releases:

Gulp is used as the generic utility library. Make sure you have the local dependencies set up by running

``npm install``

Then, to prepare the release, concat the scripts and css, and put platform specific patches into place execute

``gulp deploy``

This does all the actual concatting and renaming work and puts files in place for all the platforms and flavours DuckieTV runs as:

- Chrome Browseraction
- Chrome New Tab
- Standalone (Via nw.js)
- Android (Via Cordova)

Once you have this, execute the individual build scripts to create setup installers

```
cd build/
./build_chrome_browseraction.sh
./build_chrome_newtab.sh
./build_windows.sh
./build_mac.sh
./build_linux.sh
```

The command ```push-cordova.sh``` is a shell script that force pushes the cordova output from ```gulp deploy``` in ```../deploy/cordova/``` to the repository that's connected to Adobe's Phonegap Build system.

You can see the latest builds here:
https://build.phonegap.com/apps/1473540/share

Rebuilding the APK is a matter of logging in with the permitted account on http://build.phonegap.com/, refreshing the repostory with a click of the button, unlocking the deploy key by entering the password for the keychain and hitting the rebuild button. You can do this with your own account to verify the process, just add https://github.com/SchizoDuckie/DuckieTV-Cordova as your git source.
