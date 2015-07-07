#Want to help on DuckieTV ? 
###Feel free to send pull requests!

DuckieTV is built with Angular.js and Bootstrap.css
On top of that, the following libraries (and their dependencies) are used (these are placed in the js/vendor folder):

- CreateReadUpdateDelete.js (Javascript Sqlite ORM) https://github.com/SchizoDuckie/CreateReadUpdateDelete.js/
- Dialogs.js (Modal dialogs for Angular.js) https://github.com/m-e-conroy/angular-dialog-service
- UI-Bootstrap.js (Bootstrap enhancements for angular.js) http://angular-ui.github.io/bootstrap/
- Datepicker.js (Somewhat modified, the basis for the calendar) https://github.com/g00fy-/angular-datepicker

If you want to get a quick overview of how events work within DuckieTV check out events.md:
https://github.com/SchizoDuckie/DuckieTV/blob/angular/EVENTS.md

## Building DuckieTV-Standalone
If you want to run and hack on DuckieTV standalone yourself, the process is really simple:

- Clone the repo
- DuckieTV Standalone builds are currently built with [web2executable](https://github.com/jyapayne/Web2Executable)
- Download [nw.js](http://nwjs.io/) for your platform
- Extract all files to the DuckieTV repository
- run nw.exe or ./nw
- Now you can just work in the directory and pull repo updates with git if you want to run the latest version always


sudo add-apt-repository ppa:ubuntu-wine/ppa
sudo apt-get update
sudo apt-get install wine1.7 
git clone https://github.com/hogliux/bomutils && cd bomutils && make && sudo make install
sudo apt-get install libxml2-dev libssl-dev

./nwjs-build.sh --src=../deploy/browseraction --output-dir=../deploy/binaries --name=DuckieTV --win-icon=img/favicon.ico --osx-icon=img/duckietv.icns --CFBundleIdentifier=tv.duckie --target="0 1 2 3 4 5" --version="1.1.2" --libudev --nw=0.12.1 --build


./nwjs-build.sh --src=../deploy/browseraction --output-dir=../deploy/binaries --name=DuckieTV --win-icon=img/favicon.ico --osx-icon=img/duckietv.icns --CFBundleIdentifier=tv.duckie --target="4" --version="1.1.2" --libudev --nw=0.12.1 --build