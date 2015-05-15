#!/bin/sh
rm -rf ./input
mkdir input
rm -rf ./output
mkdir output

scp -r schizoduckie@192.168.178.14:/var/www/deploy/node-webkit/*mac* ./input
rm -f ./input/*/*.html
rm -f ./input/*/nwjc

chmod +x ./input/duckietv-x32-mac/duckietv.app
chmod +x ./input/duckietv-x32-mac/duckietv.app/Contents/MacOS/nwjs 
chmod +x ./input/duckietv-x32-mac/duckietv.app/Contents/Frameworks/nwjs\ Helper.app/Contents/MacOS/nwjs\ Helper 
chmod +x ./input/duckietv-x32-mac/duckietv.app/Contents/Frameworks/nwjs\ Helper\ NP.app/Contents/MacOS/nwjs\ Helper\ NP 
chmod +x ./input/duckietv-x32-mac/duckietv.app/Contents/Frameworks/nwjs\ Helper\ EH.app/Contents/MacOS/nwjs\ Helper\ EH 
chmod +x ./input/duckietv-x32-mac/duckietv.app/Contents/Frameworks/nwjs\ Framework.framework/nwjs\ Framework 

../create-dmg/create-dmg \
--volname "DuckieTV x32 Installer" \
--window-pos 200 120 \
--window-size 800 400 \
--icon-size 100 \
--icon duckietv.app 200 190 \
--hide-extension duckietv.app \
--app-drop-link 600 185 \
output/duckietv-mac-x32.dmg \
input/duckietv-mac-x32/

../create-dmg/create-dmg \
--volname "DuckieTV x64 Installer" \
--window-pos 200 120 \
--window-size 800 400 \
--icon-size 100 \
--hide-extension duckietv.app \
--icon duckietv.app 200 190 \
--app-drop-link 600 185 \
output/duckietv-mac-x64.dmg \
input/duckietv-mac-x64/

scp ./output/*.dmg schizoduckie@192.168.178.14:/var/www/deploy/node-webkit/
